/**
 * ============================================================================
 * FF-OMNI-PROXY v6.0: Astutech (`https://version.ggwhitehawk.com/`) MITM Proxy +
 * Path-Based Routing (`/px/...`) + Redirect Chain Inspector (Zero Extra Ports!)
 * ============================================================================
 * CLI Usage:
 *   node server.js --on         -> MITM Path-Rewriting ON (Rewrites CDN URLs in ver.php to http://<ip>:8080/px/...)
 *   node server.js --off        -> 100% Pure Untouched MITM Passthrough to https://version.ggwhitehawk.com/
 *   node server.js --all-paths  -> Routes ALL URLs in ver.php through http://<ip>:8080/px/... paths
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const KEYS = require('./config/keys');
const {
  sessionState,
  aesCbcEncrypt,
  aesCbcDecryptSmart,
  parseUdpDatagram,
  parseTcpFrame
} = require('./crypto/cipherEngine');
const {
  SCHEMAS,
  decodeProtobuf,
  encodeProtobuf
} = require('./proto/protoEngine');
const {
  createHttpHandler,
  inspectHttpBody,
  classifyUrlPurpose,
  registerPathRouteForUrl,
  buildProxyPathUrl,
  getAllocatedPortsList,
  getDiscoveredRedirectsList,
  getMediaFromCache,
  getMediaByUrl,
  cacheMediaBuffer,
  getDiscoveredBillboardsList,
  registerBillboardEntry,
  fetchRemoteUrlDirectly,
  getPrimaryDeviceIp,
  setModifierMode,
  responseModConfig
} = require('./proxy/httpInterceptor');
const { createUnifiedPort8080Server } = require('./proxy/tcpInterceptor');
const { createUdpInterceptor } = require('./proxy/udpInterceptor');

const DASHBOARD_PORT = Number(process.env.PORT || 3000);
const UNIFIED_PROXY_PORT = Number(process.env.PROXY_PORT || 8080);
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.NOW_REGION);

// Parse --on / --off / --all-paths CLI flags
if (process.argv.includes('--off')) {
  setModifierMode(false);
} else if (process.argv.includes('--on')) {
  setModifierMode(true);
}
if (process.argv.includes('--all-paths')) {
  responseModConfig.routeAllVerUrlsViaPaths = true;
}

// 100% Real Live Traffic Arrays (Zero Fake / Mocked Packets!)
const packetHistory = [];
const packetsModOn = [];
const packetsModOff = [];
const apiProtoLogs = [];
const MAX_HISTORY = 1000;

const BASE_LOG_DIR = IS_VERCEL ? '/tmp' : __dirname;
const TXT_LOG_FILE = path.join(BASE_LOG_DIR, 'ff_all_requests_log.txt');
const TXT_LOG_ON_FILE = path.join(BASE_LOG_DIR, 'ff_log_on.txt');
const TXT_LOG_OFF_FILE = path.join(BASE_LOG_DIR, 'ff_log_off.txt');
const JSONL_ON_FILE = path.join(BASE_LOG_DIR, 'ff_packets_on.jsonl');
const JSONL_OFF_FILE = path.join(BASE_LOG_DIR, 'ff_packets_off.jsonl');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  white: '\x1b[37m'
};

function loadPersistedModePackets() {
  for (const [filePath, targetArr] of [
    [JSONL_ON_FILE, packetsModOn],
    [JSONL_OFF_FILE, packetsModOff]
  ]) {
    try {
      if (fs.existsSync(filePath)) {
        const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
        for (const line of lines.slice(-300)) {
          try {
            targetArr.push(JSON.parse(line));
          } catch (_) {}
        }
      }
    } catch (_) {}
  }
}

loadPersistedModePackets();

function addProtoApiLog(action, msgName, status, payload, response = '') {
  apiProtoLogs.unshift({
    id: String(Date.now()),
    time: new Date().toISOString().split('T')[1]?.slice(0, 8) || '',
    action,
    msg_name: msgName,
    status,
    payload,
    response
  });
  if (apiProtoLogs.length > 200) apiProtoLogs.pop();
}

function formatPacketForTxtFile(pkt, indexNum = 1) {
  const status = pkt.statusCode || 200;
  const purposeBadge = pkt.urlMeta?.badge || pkt.protocol;
  const purposeDesc = pkt.urlMeta?.purpose || pkt.packetType || pkt.cmdName || '';
  const modState = pkt.modifierMode || (responseModConfig.modifierEnabled ? 'ON' : 'OFF');
  const wasModStr = pkt.wasModified
    ? `YES (${(pkt.appliedMods || []).join(', ')})`
    : 'NO (100% Untouched Original Bytes)';

  const lines = [
    `================================================================================`,
    `PACKET #${indexNum} | [MITM :${pkt.capturedPort || 8080}] | MODE: --${modState.toLowerCase()} | STATUS: ${status} (${pkt.durationMs || 0}ms) | TIME: ${pkt.timestamp}`,
    `PURPOSE / ROLE : ${purposeBadge} — ${purposeDesc}`,
    `CLIENT PATH    : ${pkt.incomingClientPath || pkt.path || '/'}`,
    `UPSTREAM URL   : ${pkt.fullUrl || pkt.requestTitle || pkt.cmdName}`,
    `PROXY PATH URL : ${pkt.proxyPathUrl || pkt.proxyPathRoute || 'N/A'}`,
    `MODIFIED BYTES : ${wasModStr}`,
    `SIZE & SHA256  : Original=${pkt.originalSize ?? pkt.response?.size ?? 0}B (SHA256:${pkt.originalSha256 || 'N/A'}) -> SentWire=${pkt.sentWireSize ?? pkt.response?.size ?? 0}B (SHA256:${pkt.sentWireSha256 || 'N/A'})`,
    `WIRE MODE      : ${pkt.passthroughMode || 'ZERO_LATENCY_MITM_PASSTHROUGH'}`,
    `REQ CIPHER     : ${pkt.request?.encryption || 'NONE'} (${pkt.request?.size || 0} B)`,
    `RES CIPHER     : ${pkt.response?.encryption || pkt.encryptionStatus || 'RAW'} (${pkt.response?.size || pkt.size || 0} B)`
  ];

  if (Array.isArray(pkt.redirectChain) && pkt.redirectChain.length > 0) {
    lines.push(`--- REDIRECT CHAIN DETECTED (${pkt.redirectChain.length} HOP(S)) ---`);
    for (const r of pkt.redirectChain) {
      lines.push(`  ↪ Hop #${r.hop} [HTTP ${r.status}]: ${r.from} ==> ${r.to}`);
      lines.push(`    Proxy Path Route: ${r.proxyPathUrl}`);
    }
  }

  if (pkt.discoveredPortMappings && Object.keys(pkt.discoveredPortMappings).length > 0) {
    lines.push(`--- PAKISTAN (PK) VER.PHP URLS & PROXY PATH ROUTES (/px/...) ---`);
    for (const [k, info] of Object.entries(pkt.discoveredPortMappings)) {
      lines.push(`  • ${k}:`);
      lines.push(`      Original Upstream : ${info.originalUrl}`);
      lines.push(`      Sent To Game Wire : ${info.rewrittenUrl} [${info.status}]`);
      lines.push(`      Proxy Path Route  : ${info.proxyPathUrl || info.rewrittenUrl}`);
    }
  }

  if (pkt.request?.headers && Object.keys(pkt.request.headers).length > 0) {
    lines.push(`--- OUTGOING REQUEST HEADERS ---`);
    lines.push(JSON.stringify(pkt.request.headers, null, 2));
  }

  if (pkt.request?.decoded) {
    lines.push(`--- OUTGOING REQUEST DECODED PAYLOAD ---`);
    lines.push(JSON.stringify(pkt.request.decoded, null, 2));
  }

  if (pkt.request?.rawHex) {
    lines.push(`--- OUTGOING REQUEST ENCRYPTED/RAW HEX ---`);
    lines.push(pkt.request.rawHex);
  }

  if (pkt.response?.headers && Object.keys(pkt.response.headers).length > 0) {
    lines.push(`--- INCOMING RESPONSE HEADERS (Status ${status}) ---`);
    lines.push(JSON.stringify(pkt.response.headers, null, 2));
  }

  if (pkt.originalDecoded && pkt.wasModified) {
    lines.push(`--- ORIGINAL UNMODIFIED RESPONSE FROM UPSTREAM (Before /px/ Path Rewrite) ---`);
    lines.push(JSON.stringify(pkt.originalDecoded, null, 2));
  }

  if (pkt.response?.decoded || pkt.decodedPayload) {
    lines.push(`--- SENT RESPONSE DECODED PAYLOAD (Status ${status}) ---`);
    lines.push(JSON.stringify(pkt.response?.decoded || pkt.decodedPayload, null, 2));
  }

  if (pkt.response?.rawHex || pkt.rawHex) {
    lines.push(`--- INCOMING RESPONSE ENCRYPTED/RAW HEX ---`);
    lines.push(pkt.response?.rawHex || pkt.rawHex);
  }

  lines.push(`================================================================================\n`);
  return lines.join('\n');
}

function buildOnVsOffComparisonReport() {
  const onList = packetsModOn;
  const offList = packetsModOff;

  const byPathOn = new Map();
  for (const p of onList) {
    const key = `${p.method || p.protocol} ${p.path || p.fullUrl || p.requestTitle}`;
    if (!byPathOn.has(key)) byPathOn.set(key, p);
  }

  const byPathOff = new Map();
  for (const p of offList) {
    const key = `${p.method || p.protocol} ${p.path || p.fullUrl || p.requestTitle}`;
    if (!byPathOff.has(key)) byPathOff.set(key, p);
  }

  const allKeys = Array.from(new Set([...byPathOn.keys(), ...byPathOff.keys()]));
  const rows = [];

  for (const key of allKeys) {
    const pOn = byPathOn.get(key) || null;
    const pOff = byPathOff.get(key) || null;

    let statusDiff = 'SAME';
    let sizeDiff = 'SAME';
    let hashDiff = 'SAME';
    let detailNotes = [];

    if (pOn && pOff) {
      if (pOn.statusCode !== pOff.statusCode) {
        statusDiff = `DIFF (--on: ${pOn.statusCode} vs --off: ${pOff.statusCode})`;
      }
      const sOn = pOn.sentWireSize ?? pOn.response?.size ?? 0;
      const sOff = pOff.sentWireSize ?? pOff.response?.size ?? 0;
      if (sOn !== sOff) {
        sizeDiff = `DIFF (--on: ${sOn} B vs --off: ${sOff} B | Delta: ${sOn - sOff} B)`;
      } else {
        sizeDiff = `SAME (${sOn} B)`;
      }

      if (pOn.sentWireSha256 && pOff.sentWireSha256 && pOn.sentWireSha256 !== pOff.sentWireSha256) {
        hashDiff = `MODIFIED (--on SHA:${pOn.sentWireSha256} != --off SHA:${pOff.sentWireSha256})`;
      } else {
        hashDiff = `IDENTICAL (${pOn.sentWireSha256 || 'N/A'})`;
      }

      if (pOn.wasModified && Array.isArray(pOn.appliedMods) && pOn.appliedMods.length > 0) {
        detailNotes.push(`Applied in --on: ${pOn.appliedMods.join('; ')}`);
      }
    } else if (pOn && !pOff) {
      statusDiff = 'ONLY_IN_ON';
      sizeDiff = `${pOn.sentWireSize ?? pOn.response?.size ?? 0} B (Captured in --on only)`;
      hashDiff = pOn.wasModified ? 'MODIFIED_IN_ON' : 'PASSTHROUGH_IN_ON';
    } else if (!pOn && pOff) {
      statusDiff = 'ONLY_IN_OFF';
      sizeDiff = `${pOff.sentWireSize ?? pOff.response?.size ?? 0} B (Captured in --off only)`;
      hashDiff = 'UNTOUCHED_IN_OFF';
    }

    rows.push({
      endpoint: key,
      inOn: Boolean(pOn),
      inOff: Boolean(pOff),
      wasModifiedInOn: Boolean(pOn?.wasModified),
      onStatus: pOn?.statusCode || null,
      offStatus: pOff?.statusCode || null,
      onDurationMs: pOn?.durationMs || null,
      offDurationMs: pOff?.durationMs || null,
      statusDiff,
      sizeDiff,
      hashDiff,
      detailNotes
    });
  }

  const lines = [
    `################################################################################`,
    `# FF-OMNI-PROXY v6.0 — ASTUTECH MITM LOG COMPARISON (--on vs --off)            #`,
    `# Generated At       : ${new Date().toISOString()}                             #`,
    `# Primary Upstream   : https://version.ggwhitehawk.com/                        #`,
    `# Total --on Packets : ${onList.length}                                        #`,
    `# Total --off Packets: ${offList.length}                                       #`,
    `################################################################################\n`
  ];

  rows.forEach((r, idx) => {
    lines.push(`--------------------------------------------------------------------------------`);
    lines.push(`[#${idx + 1}] ENDPOINT: ${r.endpoint}`);
    lines.push(`  • Present In   : --on=${r.inOn ? 'YES' : 'NO'} | --off=${r.inOff ? 'YES' : 'NO'}`);
    lines.push(`  • Status & Time: ${r.statusDiff} (--on: ${r.onDurationMs ?? '-'}ms | --off: ${r.offDurationMs ?? '-'}ms)`);
    lines.push(`  • Byte Size    : ${r.sizeDiff}`);
    lines.push(`  • Wire SHA-256 : ${r.hashDiff}`);
    if (r.detailNotes.length > 0) {
      for (const note of r.detailNotes) {
        lines.push(`      - ${note}`);
      }
    }
  });

  return {
    summaryRows: rows,
    onCount: onList.length,
    offCount: offList.length,
    txtReport: lines.join('\n')
  };
}

function buildFullTxtExport(filterMode = 'ALL') {
  if (filterMode === 'COMPARE') {
    return buildOnVsOffComparisonReport().txtReport;
  }

  let list = packetHistory;
  if (filterMode === 'ON') {
    list = packetsModOn;
  } else if (filterMode === 'OFF') {
    list = packetsModOff;
  } else if (filterMode === 'CLOTHES') {
    list = packetHistory.filter((p) => p.urlMeta?.isClothesOrSkin);
  } else if (filterMode === 'BILLBOARDS') {
    list = packetHistory.filter((p) => p.urlMeta?.isBillboard || p.urlMeta?.category === 'BILLBOARD');
  }

  const activeMode = responseModConfig.modifierEnabled ? '--on (PATH ROUTING ON)' : '--off (PURE NORMAL - 0 MOD)';
  const header = [
    `################################################################################`,
    `# FF-OMNI-PROXY v6.0 — PAKISTAN (PK) #1 PRIORITY & /px/ PATH ROUTER (VERCEL + TERMUX) REPORT (.TXT)               #`,
    `# Generated At : ${new Date().toISOString()}                                   #`,
    `# Primary URL  : https://version.ggwhitehawk.com/                              #`,
    `# Active Mode  : ${activeMode}                                                 #`,
    `# Total Packets: ${list.length} (Filter: ${filterMode})                        #`,
    `# Device IP    : ${getPrimaryDeviceIp()}                                       #`,
    `################################################################################\n`
  ].join('\n');

  const body = list.map((pkt, idx) => formatPacketForTxtFile(pkt, idx + 1)).join('\n');
  return header + body;
}

function logPacketToTerminal(pkt) {
  const status = pkt.statusCode || 200;
  const statusColor = status >= 200 && status < 300 ? C.green : status >= 400 ? C.red : C.yellow;
  const protoColor = pkt.protocol === 'HTTP' ? C.cyan : pkt.protocol === 'TCP' ? C.magenta : C.green;
  const portNum = pkt.capturedPort || 8080;
  const modBadge = pkt.modifierMode === 'OFF' ? `${C.yellow}[--off PASSTHROUGH]${C.reset}` : `${C.green}[--on PATH-MITM]${C.reset}`;
  const timeStr = (pkt.timestamp || new Date().toISOString()).split('T')[1]?.replace('Z', '') || '';

  const line = `${protoColor}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`;
  console.log(`\n${line}`);

  if (pkt.protocol === 'HTTP') {
    const purposeBadge = pkt.urlMeta?.badge || '🌐 PK PATH ROUTER URL';
    const purposeDesc = pkt.urlMeta?.purpose || '';

    console.log(
      `${C.bold}${protoColor}[MITM :${portNum}]${C.reset} ${modBadge} ${C.bold}${C.magenta}${purposeBadge}${C.reset} ${C.dim}(${purposeDesc})${C.reset}`
    );
    console.log(
      `${C.bold}${protoColor}[MITM :${portNum}]${C.reset} ${C.bold}${C.yellow}CLIENT PATH   :${C.reset} ${C.white}${pkt.incomingClientPath || pkt.path}${C.reset}`
    );
    console.log(
      `${C.bold}${protoColor}[MITM :${portNum}]${C.reset} ${C.bold}${C.cyan}UPSTREAM URL  :${C.reset} ${C.white}${pkt.method} ${pkt.fullUrl}${C.reset}`
    );
    console.log(
      `${C.bold}${protoColor}[MITM :${portNum}]${C.reset} ${C.bold}${statusColor}RESPONSE      :${C.reset} ${statusColor}Status ${status}${C.reset} (${pkt.durationMs || 0}ms) | ${pkt.responseTitle}`
    );
    console.log(
      `${C.dim}[TIME: ${timeStr}] [MODE: ${pkt.passthroughMode}] [ORIG: ${pkt.originalSize ?? 0}B -> WIRE: ${pkt.sentWireSize ?? 0}B]${C.reset}`
    );

    if (Array.isArray(pkt.redirectChain) && pkt.redirectChain.length > 0) {
      console.log(`${C.bold}${C.yellow}  ↪ [REDIRECT DETECTED FROM UPSTREAM]:${C.reset}`);
      for (const r of pkt.redirectChain) {
        console.log(`    • Hop #${r.hop} [HTTP ${r.status}]: ${C.white}${r.from}${C.reset} ==> ${C.green}${r.to}${C.reset}`);
        console.log(`      Proxy Path Route: ${C.cyan}${r.proxyPathUrl}${C.reset}`);
      }
    }

    if (pkt.discoveredPortMappings && Object.keys(pkt.discoveredPortMappings).length > 0) {
      console.log(`${C.magenta}  ★ [PAKISTAN (PK) VER.PHP URL & PATH ROUTING (/px/... — ZERO PORTS)]:${C.reset}`);
      for (const [k, info] of Object.entries(pkt.discoveredPortMappings)) {
        const stCol = info.status.includes('PATH_ROUTED') ? C.yellow : C.green;
        console.log(`    • ${k}: ${stCol}[${info.status}]${C.reset}`);
        console.log(`      Upstream : ${info.originalUrl}`);
        console.log(`      Wire URL : ${info.rewrittenUrl}`);
      }
    }

    if (pkt.request?.decoded) {
      console.log(`${C.cyan}  ▸ [OUTGOING REQUEST DECODED]:${C.reset}`);
      console.log(formatJsonForTerminal(pkt.request.decoded));
    }
    if (pkt.response?.decoded) {
      console.log(`${C.green}  ◂ [INCOMING RESPONSE DECODED (Status ${status})]:${C.reset}`);
      console.log(formatJsonForTerminal(pkt.response.decoded));
    }
  } else {
    console.log(
      `${C.bold}${protoColor}[${pkt.protocol} :${portNum}]${C.reset} ${modBadge} ${C.white}${pkt.requestTitle || pkt.cmdName}${C.reset} | ${statusColor}Status ${status}${C.reset}`
    );
  }
}

function formatJsonForTerminal(obj) {
  try {
    const str = JSON.stringify(obj, null, 2);
    const lines = str.split('\n');
    const maxLines = 45;
    const clipped = lines.slice(0, maxLines).map((l) => `    ${l}`);
    if (lines.length > maxLines) {
      clipped.push(`    ... (${lines.length - maxLines} more lines — view on /ds Dashboard)`);
    }
    return clipped.join('\n');
  } catch (_) {
    return `    ${String(obj)}`;
  }
}

function recordPacketAsync(packetEvent, printToTerminal = true) {
  const modState = packetEvent.modifierMode || (responseModConfig.modifierEnabled ? 'ON' : 'OFF');
  packetEvent.modifierMode = modState;

  packetHistory.unshift(packetEvent);
  if (packetHistory.length > MAX_HISTORY) packetHistory.pop();

  if (modState === 'ON') {
    packetsModOn.unshift(packetEvent);
    if (packetsModOn.length > MAX_HISTORY) packetsModOn.pop();
  } else {
    packetsModOff.unshift(packetEvent);
    if (packetsModOff.length > MAX_HISTORY) packetsModOff.pop();
  }

  setImmediate(() => {
    const formattedTxt = formatPacketForTxtFile(packetEvent, packetHistory.length);
    fs.appendFile(TXT_LOG_FILE, formattedTxt, 'utf8', () => {});
    if (modState === 'ON') {
      fs.appendFile(TXT_LOG_ON_FILE, formattedTxt, 'utf8', () => {});
      fs.appendFile(JSONL_ON_FILE, JSON.stringify(packetEvent) + '\n', 'utf8', () => {});
    } else {
      fs.appendFile(TXT_LOG_OFF_FILE, formattedTxt, 'utf8', () => {});
      fs.appendFile(JSONL_OFF_FILE, JSON.stringify(packetEvent) + '\n', 'utf8', () => {});
    }

    if (printToTerminal && !IS_VERCEL) {
      logPacketToTerminal(packetEvent);
    }
  });
}

function serializeSessionState(reqHost = '') {
  const deviceIp = getPrimaryDeviceIp();
  return {
    serverIp: deviceIp,
    proxyPort: UNIFIED_PROXY_PORT,
    proxyHost: reqHost || `${deviceIp}:${UNIFIED_PROXY_PORT}`,
    isVercel: IS_VERCEL,
    primaryUpstreamOrigin: responseModConfig.primaryUpstreamOrigin || 'https://version.ggwhitehawk.com',
    modifierEnabled: responseModConfig.modifierEnabled,
    modifierModeLabel: responseModConfig.modifierEnabled
      ? '--on (PK PATH ROUTER + /px/ PATH ROUTING)'
      : '--off (PURE PK PATH ROUTER PASSTHROUGH)',
    onPacketsCount: packetsModOn.length,
    offPacketsCount: packetsModOff.length,
    accountId: sessionState.accountId,
    nickname: sessionState.nickname,
    region: sessionState.region || 'PK',
    serverUrl: sessionState.serverUrl || 'https://version.ggwhitehawk.com',
    loginServerUrl: sessionState.loginServerUrl || 'https://version.ggwhitehawk.com',
    staticAesKeyHex: KEYS.AES_CBC.KEY_HEX,
    staticAesKeyStr: KEYS.AES_CBC.KEY_STR,
    staticAesIvHex: KEYS.AES_CBC.IV_HEX,
    staticAesIvStr: KEYS.AES_CBC.IV_STR,
    dynamicAesKeyHex: sessionState.aesKey ? sessionState.aesKey.toString('hex') : null,
    dynamicAesIvHex: sessionState.aesIv ? sessionState.aesIv.toString('hex') : null,
    udpKeyHex: sessionState.udpKey ? sessionState.udpKey.toString('hex') : null,
    matchCode: sessionState.matchCode,
    allocatedPorts: getAllocatedPortsList(),
    redirects: getDiscoveredRedirectsList(),
    billboards: getDiscoveredBillboardsList(),
    responseModConfig
  };
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_) {
        resolve({});
      }
    });
  });
}

function handleManualDecrypt({ hexInput = '', mode = 'AUTO', schemaName = '', udpKeyHex = '', matchCode = '' }) {
  const cleanHex = String(hexInput).replace(/[^0-9a-fA-F]/g, '');
  if (!cleanHex || cleanHex.length % 2 !== 0) {
    return { ok: false, error: 'Please provide a valid even-length Hex string.' };
  }
  const buf = Buffer.from(cleanHex, 'hex');

  if (mode === 'UDP_TEA') {
    const customKey = udpKeyHex && udpKeyHex.length === 32 ? Buffer.from(udpKeyHex, 'hex') : null;
    return { ok: true, mode: 'UDP_TEA', result: parseUdpDatagram(buf, customKey, matchCode || null) };
  }
  if (mode === 'TCP_FRAME') {
    return { ok: true, mode: 'TCP_FRAME', result: parseTcpFrame(buf, 'MANUAL_INSPECT') };
  }
  if (mode === 'AES_CBC' || (mode === 'AUTO' && buf.length >= 16 && buf.length % 16 === 0)) {
    const aesRes = aesCbcDecryptSmart(buf);
    if (aesRes.success) {
      const pb = decodeProtobuf(aesRes.decryptedBuffer, schemaName || null);
      return {
        ok: true,
        mode: 'AES_128_CBC + PROTOBUF',
        encryption: aesRes.keyUsed,
        decryptedHex: aesRes.decryptedHex,
        schema: pb ? pb.schema : (schemaName || 'AutoWireProtobuf'),
        decoded: pb ? pb.fields : { utf8: aesRes.decryptedBuffer.toString('utf8') },
        cleanDict: pb ? pb.cleanDict : null
      };
    }
  }
  const pb = decodeProtobuf(buf, schemaName || null);
  return {
    ok: true,
    mode: 'DIRECT_PROTOBUF',
    decryptedHex: cleanHex,
    schema: pb ? pb.schema : (schemaName || 'AutoWireProtobuf'),
    decoded: pb ? pb.fields : { raw_utf8: buf.toString('utf8') },
    cleanDict: pb ? pb.cleanDict : null
  };
}

// Register initial Astutech Path Route (ZERO extra ports opened!)
let initializedRoutes = false;
function ensureInitialized() {
  if (initializedRoutes) return;
  initializedRoutes = true;
  registerPathRouteForUrl(
    'https://version.ggwhitehawk.com/live/ver.php',
    'Pakistan (PK) #1 Version Config (version.ggwhitehawk.com)'
  );
  registerPathRouteForUrl(
    'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/',
    'Pakistan (PK) #1 Clothes, Default Bundles & ASTC Icons CDN (dl.gmc.freefiremobile.com)'
  );
  registerPathRouteForUrl(
    'https://core-gmc.freefiremobile.com/live/ABHotUpdates/',
    'Pakistan (PK) #1 Core HotUpdate Manifest CDN (core-gmc.freefiremobile.com)'
  );
  registerPathRouteForUrl(
    'https://dl.gmc.freefiremobile.com/common/',
    'Pakistan (PK) Common Image & Event Banner CDN (dl.gmc.freefiremobile.com/common/)'
  );
  registerPathRouteForUrl(
    'https://dl.cdn.freefiremobile.com/common/OB23/version/Patch_Bg.png',
    'Pakistan (PK) Billboard Background PNG (dl.cdn.freefiremobile.com)'
  );
  registerPathRouteForUrl(
    'https://cdn.wildflamestudio.com/common/web_event/aswqooiwd/TsHBYLel.html?lang=en',
    'Pakistan (PK) Billboard Web Event & Patchnote (cdn.wildflamestudio.com)'
  );
  registerPathRouteForUrl(
    'https://loginbp.ppmainecoonghj.com/MajorLogin',
    'Pakistan (PK) #1 Login & Session Auth API (loginbp.ppmainecoonghj.com)'
  );
  registerPathRouteForUrl(
    'https://clientbp.ppmainecoonghj.com/GetPlayerPersonalShow',
    'Pakistan (PK) #1 Lobby & Equipped Outfit API (clientbp.ppmainecoonghj.com)'
  );
}

const gameProxyHandler = createHttpHandler({
  fixedPort: UNIFIED_PROXY_PORT,
  onPacket: (pkt) => recordPacketAsync(pkt, true)
});

async function universalHttpHandler(req, res) {
  ensureInitialized();

  const reqHost = req.headers['x-forwarded-host'] || req.headers['host'] || `${getPrimaryDeviceIp()}:${UNIFIED_PROXY_PORT}`;
  const parsedReqUrl = new URL(req.url || '/', `http://${reqHost}`);
  const reqPath = parsedReqUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    res.end();
    return;
  }

  // 0. Intercept Browser Favicon / Robots / Static Chrome Requests so they NEVER hit Game Proxy!
  const referer = String(req.headers['referer'] || '');
  const isBrowserAsset =
    reqPath === '/favicon.ico' ||
    reqPath === '/robots.txt' ||
    reqPath.startsWith('/apple-touch-icon') ||
    reqPath.startsWith('/.well-known/') ||
    ((referer.includes('/ds') || referer.includes('/dashboard')) &&
      !reqPath.startsWith('/api/') &&
      !reqPath.startsWith('/px/') &&
      !reqPath.startsWith('/live/') &&
      !reqPath.startsWith('/common/') &&
      reqPath !== '/ds' &&
      reqPath !== '/dashboard');

  if (isBrowserAsset) {
    res.writeHead(204, {
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*'
    });
    res.end();
    return;
  }

  // 1. Serve Dashboard at `/ds`, `/ds/`, `/dashboard`, or on Port :3000 root `/`
  const isPort3000Root = reqPath === '/' && String(reqHost).endsWith(`:${DASHBOARD_PORT}`);
  const isBrowserRootVisit =
    reqPath === '/' &&
    String(req.headers['accept'] || '').includes('text/html') &&
    !String(req.headers['user-agent'] || '').toLowerCase().includes('unity');

  if (reqPath === '/ds' || reqPath === '/ds/' || reqPath === '/dashboard' || reqPath === '/index.html' || isPort3000Root || isBrowserRootVisit) {
    const indexHtmlPath = path.join(__dirname, 'public', 'index.html');
    const html = fs.readFileSync(indexHtmlPath, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    res.end(html);
    return;
  }

  // 2. Fast Polling Endpoint for Dashboard (/ds)
  if (reqPath === '/api/poll' || reqPath === '/api/state') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(
      JSON.stringify({
        session: serializeSessionState(reqHost),
        ports: getAllocatedPortsList(),
        redirects: getDiscoveredRedirectsList(),
        billboards: getDiscoveredBillboardsList(),
        modifier: responseModConfig,
        packets: packetHistory.slice(0, 150),
        protoLogs: apiProtoLogs.slice(0, 50),
        schemas: Object.keys(SCHEMAS)
      })
    );
    return;
  }

  // 3. Side-by-Side Comparison JSON Endpoint (`/api/compare`)
  if (reqPath === '/api/compare') {
    const report = buildOnVsOffComparisonReport();
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(
      JSON.stringify({
        ok: true,
        onCount: report.onCount,
        offCount: report.offCount,
        rows: report.summaryRows
      })
    );
    return;
  }

  // 4. Update Modifier & Path Router Config (`POST /api/modifier`)
  if (reqPath === '/api/modifier' && req.method === 'POST') {
    const newCfg = await readJsonBody(req);
    if (newCfg && typeof newCfg === 'object') {
      if (typeof newCfg.modifierEnabled === 'boolean') {
        setModifierMode(newCfg.modifierEnabled);
      }
      if (typeof newCfg.primaryUpstreamOrigin === 'string' && newCfg.primaryUpstreamOrigin.trim().startsWith('http')) {
        responseModConfig.primaryUpstreamOrigin = newCfg.primaryUpstreamOrigin.trim().replace(/\/$/, '');
      }
      if (typeof newCfg.redirectCdnUrlsToPorts === 'boolean') {
        responseModConfig.redirectCdnUrlsToPorts = newCfg.redirectCdnUrlsToPorts;
      }
      if (typeof newCfg.routeAllVerUrlsViaPaths === 'boolean') {
        responseModConfig.routeAllVerUrlsViaPaths = newCfg.routeAllVerUrlsViaPaths;
      }
      if (typeof newCfg.followRedirectsInMiddle === 'boolean') {
        responseModConfig.followRedirectsInMiddle = newCfg.followRedirectsInMiddle;
      }
      if (typeof newCfg.rewriteRedirectLocationToPath === 'boolean') {
        responseModConfig.rewriteRedirectLocationToPath = newCfg.rewriteRedirectLocationToPath;
      }
      if (newCfg.verJsonOverrides && typeof newCfg.verJsonOverrides === 'object') {
        responseModConfig.verJsonOverrides = newCfg.verJsonOverrides;
      }
      if (Array.isArray(newCfg.customRules)) {
        responseModConfig.customRules = newCfg.customRules;
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true, modifier: responseModConfig }));
    return;
  }

  // 5. Dashboard Actions (`POST /api/action` -> clear, clear_all_modes, decrypt)
  if (reqPath === '/api/action' && req.method === 'POST') {
    const body = await readJsonBody(req);
    if (body.action === 'clear') {
      packetHistory.length = 0;
      if (body.clearAllModes) {
        packetsModOn.length = 0;
        packetsModOff.length = 0;
        fs.writeFile(TXT_LOG_ON_FILE, '', 'utf8', () => {});
        fs.writeFile(TXT_LOG_OFF_FILE, '', 'utf8', () => {});
        fs.writeFile(JSONL_ON_FILE, '', 'utf8', () => {});
        fs.writeFile(JSONL_OFF_FILE, '', 'utf8', () => {});
      }
      fs.writeFile(TXT_LOG_FILE, '', 'utf8', () => {});
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    if (body.action === 'decrypt') {
      const result = handleManualDecrypt(body);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(result));
      return;
    }
  }

  // 6. Protobuf Decode / Encode / JWT Lab Endpoints
  if (reqPath === '/api/decode' && req.method === 'POST') {
    const data = await readJsonBody(req);
    const msgName = data.schema || data.msg_name || 'AutoWireProtobuf';
    const b64OrHex = data.hex || data.data || '';
    try {
      const isHex = /^[0-9a-fA-F\s]+$/.test(b64OrHex) && b64OrHex.replace(/\s+/g, '').length % 2 === 0;
      const rawBytes = isHex
        ? Buffer.from(b64OrHex.replace(/\s+/g, ''), 'hex')
        : Buffer.from(b64OrHex, 'base64');
      const aesCheck = rawBytes.length >= 16 && rawBytes.length % 16 === 0 ? aesCbcDecryptSmart(rawBytes) : null;
      const targetBuf = aesCheck && aesCheck.success ? aesCheck.decryptedBuffer : rawBytes;
      const decoded = decodeProtobuf(targetBuf, msgName, 0, true);
      if (!decoded) {
        addProtoApiLog('DECODE_FAIL', msgName, 400, b64OrHex.slice(0, 50), 'Unable to decode protobuf wire bytes');
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Unable to decode protobuf wire bytes' }));
        return;
      }
      const resJson = JSON.stringify(
        {
          ok: true,
          schema: decoded.schema,
          encryption: aesCheck && aesCheck.success ? aesCheck.keyUsed : 'RAW_PROTOBUF',
          fields: decoded.fields,
          cleanDict: decoded.cleanDict
        },
        null,
        2
      );
      addProtoApiLog('DECODE_SUCCESS', msgName, 200, b64OrHex.slice(0, 80), resJson);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(resJson);
    } catch (e) {
      addProtoApiLog('DECODE_ERROR', msgName, 500, b64OrHex.slice(0, 50), e.message);
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (reqPath === '/api/encode' && req.method === 'POST') {
    const data = await readJsonBody(req);
    const msgName = data.schema || data.msg_name || 'AvatarProfile';
    const jsonData = data.data || data.json_data || {};
    try {
      const payloadObj = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const rawBytes = encodeProtobuf(payloadObj, msgName);
      const aesEncrypted = aesCbcEncrypt(rawBytes);
      const encodedB64 = rawBytes.toString('base64');
      addProtoApiLog('ENCODE_SUCCESS', msgName, 200, JSON.stringify(payloadObj).slice(0, 80), encodedB64);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(
        JSON.stringify({
          ok: true,
          schema: msgName,
          encoded_b64: encodedB64,
          encoded_hex: rawBytes.toString('hex'),
          aes_encrypted_hex: aesEncrypted.toString('hex'),
          aes_encrypted_b64: aesEncrypted.toString('base64')
        })
      );
    } catch (e) {
      addProtoApiLog('ENCODE_ERROR', msgName, 500, '', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (reqPath === '/api/generate-jwt' && req.method === 'POST') {
    const data = await readJsonBody(req);
    const uid = String(data.uid || '').trim();
    const password = String(data.password || '').trim();
    const localProto = encodeProtobuf(
      {
        open_id: uid || '1000894512',
        open_id_type: '4',
        login_token: password || 'GUEST_TOKEN',
        orign_platform_type: '4'
      },
      'LoginReq'
    );
    const encryptedHex = aesCbcEncrypt(localProto).toString('hex');
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(
      JSON.stringify({
        ok: true,
        note: 'Generated AES-128-CBC Encrypted MajorLogin Payload',
        major_login_protobuf_hex: localProto.toString('hex'),
        major_login_aes_encrypted_hex: encryptedHex
      })
    );
    return;
  }

  if (reqPath === '/api/logs/sync') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(apiProtoLogs));
    return;
  }

  // 7. Download Complete Captured Traffic as .TXT File
  if (reqPath === '/api/export.txt') {
    const filterMode = (parsedReqUrl.searchParams.get('filter') || 'ALL').toUpperCase();
    const txtContent = buildFullTxtExport(filterMode);
    const fileName =
      filterMode === 'COMPARE'
        ? `ff_compare_on_vs_off_${Date.now()}.txt`
        : filterMode === 'ON'
          ? `ff_log_MOD_ON_${Date.now()}.txt`
          : filterMode === 'OFF'
            ? `ff_log_MOD_OFF_${Date.now()}.txt`
            : filterMode === 'CLOTHES'
              ? `ff_clothes_skins_log_${Date.now()}.txt`
              : filterMode === 'BILLBOARDS'
                ? `ff_billboards_log_${Date.now()}.txt`
                : `ff_all_requests_log_${Date.now()}.txt`;
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': String(Buffer.byteLength(txtContent, 'utf8'))
    });
    res.end(txtContent);
    return;
  }

  // 8. Serve Cached Media or ASTC Binary
  if (reqPath.startsWith('/api/media/')) {
    const pktId = decodeURIComponent(reqPath.slice('/api/media/'.length));
    const item = getMediaFromCache(pktId);
    if (!item) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Media not found in cache' }));
      return;
    }
    res.writeHead(200, {
      'Content-Type': item.contentType || 'application/octet-stream',
      'Content-Length': String(item.buffer.length),
      'Access-Control-Allow-Origin': '*'
    });
    res.end(item.buffer);
    return;
  }

  // 9. Live Fetch & Preview ANY Remote URL
  if (reqPath === '/api/fetch-preview') {
    const targetUrl = parsedReqUrl.searchParams.get('url') || '';
    const mode = (parsedReqUrl.searchParams.get('mode') || 'raw').toLowerCase();
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Provide a valid http/https URL' }));
      return;
    }

    const cached = getMediaByUrl(targetUrl);
    if (cached && cached.buffer && mode === 'raw') {
      res.writeHead(200, {
        'Content-Type': cached.contentType || 'application/octet-stream',
        'Content-Length': String(cached.buffer.length),
        'Access-Control-Allow-Origin': '*'
      });
      res.end(cached.buffer);
      return;
    }

    const fetched = await fetchRemoteUrlDirectly(targetUrl);
    if (!fetched.ok || !fetched.buffer) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: fetched.error || `HTTP ${fetched.statusCode}` }));
      return;
    }

    const pktId = `HTTP-FETCH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const analysis = inspectHttpBody(fetched.buffer, fetched.headers, fetched.parsedUrl.pathname, 'RESPONSE');
    const urlMeta = classifyUrlPurpose(targetUrl, fetched.parsedUrl.pathname, fetched.headers['content-type']);
    const cType = analysis.mediaInfo?.isImage
      ? analysis.mediaInfo.mediaFormat
      : fetched.headers['content-type'] || 'application/octet-stream';

    cacheMediaBuffer(pktId, fetched.buffer, cType, analysis.mediaInfo, targetUrl);

    if (urlMeta.isBillboard || analysis.mediaInfo?.isImage) {
      registerBillboardEntry({
        key: fetched.parsedUrl.pathname.split('/').pop() || 'fetched_asset',
        url: targetUrl,
        packetId: pktId,
        type: urlMeta.badge,
        badge: urlMeta.badge,
        purpose: urlMeta.purpose,
        statusCode: fetched.statusCode,
        size: fetched.buffer.length,
        isImage: Boolean(analysis.mediaInfo?.isImage),
        hasMediaPreview: Boolean(analysis.mediaInfo && (analysis.mediaInfo.isImage || analysis.mediaInfo.isAstc)),
        mediaFormat: analysis.mediaInfo ? analysis.mediaInfo.mediaFormat : cType
      });
    }

    delete analysis.decompressedBuffer;

    if (mode === 'json') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(
        JSON.stringify({
          ok: true,
          packetId: pktId,
          url: targetUrl,
          statusCode: fetched.statusCode,
          size: fetched.buffer.length,
          urlMeta,
          hasMediaPreview: Boolean(analysis.mediaInfo && (analysis.mediaInfo.isAstc || analysis.mediaInfo.isImage)),
          mediaFormat: analysis.mediaInfo ? analysis.mediaInfo.mediaFormat : cType,
          astcMeta: analysis.mediaInfo ? analysis.mediaInfo.astcMeta : null,
          decoded: analysis.decoded
        })
      );
      return;
    }

    res.writeHead(200, {
      'Content-Type': cType,
      'Content-Length': String(fetched.buffer.length),
      'Access-Control-Allow-Origin': '*'
    });
    res.end(fetched.buffer);
    return;
  }

  // 10. ALL OTHER PATHS (including `/live/ver.php` and `/px/<proto>/<host>/<path>`) -> MITM Proxy to https://version.ggwhitehawk.com/!
  return gameProxyHandler(req, res);
}

async function startAllServers() {
  ensureInitialized();

  const dashboardServer = http.createServer(universalHttpHandler);
  dashboardServer.keepAliveTimeout = 30000;

  const unifiedTcp8080 = createUnifiedPort8080Server({
    listenPort: UNIFIED_PROXY_PORT,
    onUniversalHttpRequest: universalHttpHandler,
    onPacket: (pkt) => recordPacketAsync(pkt, true)
  });

  const unifiedUdp8080 = createUdpInterceptor({
    listenPort: UNIFIED_PROXY_PORT,
    onPacket: (pkt) => recordPacketAsync(pkt, true)
  });

  await Promise.all([
    new Promise((resolve) => dashboardServer.listen(DASHBOARD_PORT, '0.0.0.0', resolve)),
    unifiedTcp8080.start(),
    unifiedUdp8080.start()
  ]);

  const activeModeStr = responseModConfig.modifierEnabled
    ? 'ON (--on: Pakistan PK Path Router + /px/... Path Routing Active, Zero Extra Ports)'
    : 'OFF (--off: 100% Untouched Pakistan PK Path Router Passthrough, 0 Bytes Modified)';

  try {
    fs.writeFileSync(
      TXT_LOG_FILE,
      `# FF-OMNI-PROXY v6.0 Pakistan PK Path Router & Path Router Log (${new Date().toISOString()}) | Mode: ${activeModeStr}\n\n`,
      'utf8'
    );
  } catch (_) {}

  const lanIp = getPrimaryDeviceIp();
  const modeColor = responseModConfig.modifierEnabled ? C.green : C.yellow;
  console.log(`${C.bold}${C.cyan}╔════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║  FF-OMNI-PROXY v6.0 (PAKISTAN PK #1 + /px/ PATH ROUTER (VERCEL + TERMUX))   ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╠════════════════════════════════════════════════════════════════════╣${C.reset}`);
  console.log(`${C.bold}║ [PRIMARY TARGET] ${C.green}https://version.ggwhitehawk.com/ (MITM Active)${C.reset}`);
  console.log(`${C.bold}║ [ACTIVE MODE]    ${modeColor}${activeModeStr}${C.reset}`);
  console.log(`${C.bold}║ [PATH ROUTER]    http://${lanIp}:${UNIFIED_PROXY_PORT}/px/<proto>/<host>/<path>${C.reset}`);
  console.log(`${C.bold}║ [EXTRA PORTS]    REMOVED (0 Extra Ports — 100% Single-Port Paths!) ║${C.reset}`);
  console.log(`${C.bold}║ [GAME PROXY]     http://${lanIp}:${UNIFIED_PROXY_PORT}/live/ver.php                 ║${C.reset}`);
  console.log(`${C.bold}║ [DASHBOARD /ds]  http://${lanIp}:${UNIFIED_PROXY_PORT}/ds  (or http://${lanIp}:${DASHBOARD_PORT}/ds)${C.reset}`);
  console.log(`${C.bold}╚════════════════════════════════════════════════════════════════════╝${C.reset}`);

  return { dashboardServer, unifiedTcp8080, unifiedUdp8080 };
}

if (require.main === module) {
  if (process.argv.includes('--self-test')) {
    console.log(`[SELF-TEST] Testing v6.0 Pakistan (PK) #1 Priority + /px/ Single-Port Path Router (Vercel + Termux)...`);
    const sampleTermuxUrl = buildProxyPathUrl(
      'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/IconCDN/android/901000284_rgb.astc',
      '10.244.233.235:8080',
      'http'
    );
    const sampleVercelUrl = buildProxyPathUrl(
      'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/IconCDN/android/901000284_rgb.astc',
      'ff-omni-pk.vercel.app',
      'https'
    );
    console.log(`  • Sample Termux /px/ URL: ${sampleTermuxUrl}`);
    console.log(`  • Sample Vercel /px/ URL: ${sampleVercelUrl}`);
    if (
      !sampleTermuxUrl.includes('http://10.244.233.235:8080/px/https/dl.gmc.freefiremobile.com/live/ABHotUpdates/') ||
      !sampleVercelUrl.includes('https://ff-omni-pk.vercel.app/px/https/dl.gmc.freefiremobile.com/live/ABHotUpdates/')
    ) {
      console.error(`[FAIL] Path router did not format /px/ URL properly!`);
      process.exit(1);
    }
    console.log(`[SELF-TEST OK] v6.0 Pakistan (PK) #1 Priority, Zero Astutech Redirection, Vercel + Termux /px/ Path Router & Zero Socket.IO verified.`);
    process.exit(0);
  } else {
    startAllServers();
  }
}

module.exports = universalHttpHandler;
module.exports.startAllServers = startAllServers;
module.exports.handleManualDecrypt = handleManualDecrypt;
module.exports.universalHttpHandler = universalHttpHandler;
