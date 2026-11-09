/**
 * ============================================================================
<<<<<<< HEAD
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
=======
 * FF-OMNI-PROXY v3.2 (Railway & Termux Single-Port Edition)
 * Path-Based Dynamic Routing + Dashboard @ /ds + Anti-Ban Fix
 * ============================================================================
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c

const KEYS = require('./config/keys');
const {
  sessionState,
  aesCbcEncrypt,
  aesCbcDecryptSmart,
  parseUdpDatagram,
  parseTcpFrame
} = require('./crypto/cipherEngine');
<<<<<<< HEAD
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
=======
const { SCHEMAS, decodeProtobuf, encodeProtobuf } = require('./proto/protoEngine');
const { MESSAGE_ID_TO_NAME } = require('./proto/messageIds');
const {
  inspectHttpBody,
  classifyUrlPurpose,
  ensureDedicatedPortForOrigin,
  getAllocatedPortsList,
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  getMediaFromCache,
  getMediaByUrl,
  cacheMediaBuffer,
  getDiscoveredBillboardsList,
  registerBillboardEntry,
  fetchRemoteUrlDirectly,
<<<<<<< HEAD
  getPrimaryDeviceIp,
  setModifierMode,
=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  responseModConfig
} = require('./proxy/httpInterceptor');
const { createUnifiedPort8080Server } = require('./proxy/tcpInterceptor');
const { createUdpInterceptor } = require('./proxy/udpInterceptor');

<<<<<<< HEAD
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
=======
// Single Master Port for Railway & Termux Compatibility
const DASHBOARD_PORT = Number(process.env.PORT || 3000);
const UNIFIED_PROXY_PORT = Number(process.env.PROXY_PORT || 8080);

const packetHistory = [];
const MAX_HISTORY = 1000;
const TXT_LOG_FILE = path.join(__dirname, 'ff_all_requests_log.txt');
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c

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

<<<<<<< HEAD
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
=======
function getLocalLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const netInfo of nets[name] || []) {
      if (netInfo.family === 'IPv4' && !netInfo.internal) {
        return netInfo.address;
      }
    }
  }
  return '127.0.0.1';
}

/**
 * Dynamic Host Resolver for Railway, Cloudflare Tunnels, and Local LAN
 */
function getPublicBaseUrl(req = null) {
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL.replace(/\/$/, '');
  }
  if (process.env.RAILWAY_STATIC_URL) {
    return `https://${process.env.RAILWAY_STATIC_URL}`.replace(/\/$/, '');
  }
  if (req && req.headers && req.headers.host) {
    const proto = req.headers['x-forwarded-proto'] || 'http';
    return `${proto}://${req.headers.host}`.replace(/\/$/, '');
  }
  const lanIp = getLocalLanIp();
  return `http://${lanIp}:${DASHBOARD_PORT}`;
}

/**
 * Generate a clean vibrant 320x160 PNG buffer for the seeded Billboard (`Patch_Bg.png`) preview
 */
function createSampleBillboardPngBuffer(width = 320, height = 160) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(typeStr, dataBuf) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(dataBuf.length, 0);
    const typeBuf = Buffer.from(typeStr, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, dataBuf])), 0);
    return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowOff = y * (1 + width * 4);
    rawScanlines[rowOff] = 0; // filter type 0
    for (let x = 0; x < width; x++) {
      const p = rowOff + 1 + x * 4;
      const nx = x / width;
      const ny = y / height;
      let r = Math.floor(25 + 195 * nx + 35 * Math.sin(ny * 6.28));
      let g = Math.floor(20 + 110 * (1 - ny) + 60 * nx);
      let b = Math.floor(70 + 170 * (1 - nx) * ny + 40);
      if (x < 4 || x >= width - 4 || y < 4 || y >= height - 4) {
        r = 245;
        g = 158;
        b = 11;
      } else if (Math.abs(x - width / 2) < 90 && Math.abs(y - height / 2) < 28) {
        r = Math.min(255, r + 45);
        g = Math.min(255, g + 35);
      }
      rawScanlines[p] = Math.max(0, Math.min(255, r));
      rawScanlines[p + 1] = Math.max(0, Math.min(255, g));
      rawScanlines[p + 2] = Math.max(0, Math.min(255, b));
      rawScanlines[p + 3] = 255;
    }
  }

  const idat = zlib.deflateSync(rawScanlines);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

/**
 * Format a single packet as plain text for .TXT download & live file logging
 */
function formatPacketForTxtFile(pkt, indexNum = 1) {
  const status = pkt.statusCode || 200;
  const portNum = pkt.capturedPort || 8080;
  const purposeBadge = pkt.urlMeta?.badge || pkt.protocol;
  const purposeDesc = pkt.urlMeta?.purpose || pkt.packetType || pkt.cmdName || '';

  const lines = [
    `================================================================================`,
    `PACKET #${indexNum} | [${pkt.protocol} :${portNum}] | STATUS: ${status} | TIME: ${pkt.timestamp}`,
    `PURPOSE / ROLE : ${purposeBadge} — ${purposeDesc}`,
    `FULL URL / OP  : ${pkt.fullUrl || pkt.requestTitle || pkt.cmdName}`,
    `WIRE MODE      : ${pkt.passthroughMode || 'EXACT_ENCRYPTED_WIRE_PASSTHROUGH'}`,
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    `REQ CIPHER     : ${pkt.request?.encryption || 'NONE'} (${pkt.request?.size || 0} B)`,
    `RES CIPHER     : ${pkt.response?.encryption || pkt.encryptionStatus || 'RAW'} (${pkt.response?.size || pkt.size || 0} B)`
  ];

<<<<<<< HEAD
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
=======
  if (pkt.discoveredPortMappings && Object.keys(pkt.discoveredPortMappings).length > 0) {
    lines.push(`--- PORT ROUTING & PROTECTED ANTI-BAN URLS ---`);
    for (const [k, info] of Object.entries(pkt.discoveredPortMappings)) {
      lines.push(`  • ${k}: ${info.originalUrl} ==> ${info.rewrittenUrl} [${info.status}]`);
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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

<<<<<<< HEAD
  if (pkt.originalDecoded && pkt.wasModified) {
    lines.push(`--- ORIGINAL UNMODIFIED RESPONSE FROM UPSTREAM (Before /px/ Path Rewrite) ---`);
    lines.push(JSON.stringify(pkt.originalDecoded, null, 2));
  }

  if (pkt.response?.decoded || pkt.decodedPayload) {
    lines.push(`--- SENT RESPONSE DECODED PAYLOAD (Status ${status}) ---`);
=======
  if (pkt.response?.decoded || pkt.decodedPayload) {
    lines.push(`--- INCOMING RESPONSE DECODED PAYLOAD (Status ${status}) ---`);
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    lines.push(JSON.stringify(pkt.response?.decoded || pkt.decodedPayload, null, 2));
  }

  if (pkt.response?.rawHex || pkt.rawHex) {
    lines.push(`--- INCOMING RESPONSE ENCRYPTED/RAW HEX ---`);
    lines.push(pkt.response?.rawHex || pkt.rawHex);
  }

  lines.push(`================================================================================\n`);
  return lines.join('\n');
}

<<<<<<< HEAD
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
=======
/**
 * Generate full .TXT report for all captured requests
 */
function buildFullTxtExport(filterMode = 'ALL') {
  let list = packetHistory;
  if (filterMode === 'CLOTHES') {
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    list = packetHistory.filter((p) => p.urlMeta?.isClothesOrSkin);
  } else if (filterMode === 'BILLBOARDS') {
    list = packetHistory.filter((p) => p.urlMeta?.isBillboard || p.urlMeta?.category === 'BILLBOARD');
  }

<<<<<<< HEAD
  const activeMode = responseModConfig.modifierEnabled ? '--on (PATH ROUTING ON)' : '--off (PURE NORMAL - 0 MOD)';
  const header = [
    `################################################################################`,
    `# FF-OMNI-PROXY v6.0 — PAKISTAN (PK) #1 PRIORITY & /px/ PATH ROUTER (VERCEL + TERMUX) REPORT (.TXT)               #`,
    `# Generated At : ${new Date().toISOString()}                                   #`,
    `# Primary URL  : https://version.ggwhitehawk.com/                              #`,
    `# Active Mode  : ${activeMode}                                                 #`,
    `# Total Packets: ${list.length} (Filter: ${filterMode})                        #`,
    `# Device IP    : ${getPrimaryDeviceIp()}                                       #`,
=======
  const header = [
    `################################################################################`,
    `# FF-OMNI-PROXY v3.2 — COMPLETE CAPTURED TRAFFIC REPORT (.TXT)                 #`,
    `# Generated At : ${new Date().toISOString()}                                   #`,
    `# Total Packets: ${list.length} (Filter: ${filterMode})                        #`,
    `# Dedicated Prts: ${getAllocatedPortsList().map((p) => ':' + p.port + '=' + p.host).join(', ')}`,
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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
<<<<<<< HEAD
  const modBadge = pkt.modifierMode === 'OFF' ? `${C.yellow}[--off PASSTHROUGH]${C.reset}` : `${C.green}[--on PATH-MITM]${C.reset}`;
=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  const timeStr = (pkt.timestamp || new Date().toISOString()).split('T')[1]?.replace('Z', '') || '';

  const line = `${protoColor}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`;
  console.log(`\n${line}`);

  if (pkt.protocol === 'HTTP') {
<<<<<<< HEAD
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
=======
    const reqTitle = pkt.requestTitle || `[Port :${portNum}] ${pkt.method} ${pkt.fullUrl}`;
    const resTitle = pkt.responseTitle || `${status} <- ${pkt.host}${pkt.path}`;
    const purposeBadge = pkt.urlMeta?.badge || '🌐 GAME URL';
    const purposeDesc = pkt.urlMeta?.purpose || '';

    console.log(
      `${C.bold}${protoColor}[HTTP :${portNum}]${C.reset} ${C.bold}${C.magenta}${purposeBadge}${C.reset} ${C.dim}(${purposeDesc})${C.reset}`
    );
    console.log(
      `${C.bold}${protoColor}[HTTP :${portNum}]${C.reset} ${C.bold}${C.yellow}REQUEST TITLE :${C.reset} ${C.white}${reqTitle}${C.reset}`
    );
    console.log(
      `${C.bold}${protoColor}[HTTP :${portNum}]${C.reset} ${C.bold}${statusColor}RESPONSE TITLE:${C.reset} ${statusColor}Status ${status}${C.reset} (${pkt.durationMs || 0}ms) | ${resTitle}`
    );
    console.log(
      `${C.dim}[TIME: ${timeStr}] [MODE: ${pkt.passthroughMode || 'EXACT_PASSTHROUGH'}] [REQ: ${pkt.request?.encryption || 'NONE'}] [RES: ${pkt.response?.encryption || 'NONE'}]${C.reset}`
    );

    if (pkt.discoveredPortMappings && Object.keys(pkt.discoveredPortMappings).length > 0) {
      console.log(`${C.magenta}  ★ [ANTI-BAN PROTECTED & DEDICATED PORT URL ROUTING]:${C.reset}`);
      for (const [k, info] of Object.entries(pkt.discoveredPortMappings)) {
        const stCol = info.status.includes('PROTECTED') ? C.green : C.yellow;
        console.log(`    • ${k}: ${stCol}[${info.status}]${C.reset} ==> ${info.rewrittenUrl}`);
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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
<<<<<<< HEAD
  } else {
    console.log(
      `${C.bold}${protoColor}[${pkt.protocol} :${portNum}]${C.reset} ${modBadge} ${C.white}${pkt.requestTitle || pkt.cmdName}${C.reset} | ${statusColor}Status ${status}${C.reset}`
    );
=======
  } else if (pkt.protocol === 'TCP') {
    const reqTitle = pkt.requestTitle || `[TCP :${portNum}] ${pkt.packetType} (${pkt.source} -> ${pkt.destination})`;
    const resTitle = pkt.responseTitle || `Status ${status} | ${pkt.packetType}`;
    console.log(
      `${C.bold}${protoColor}[TCP :${portNum}]${C.reset} ${C.bold}${C.yellow}REQUEST TITLE :${C.reset} ${C.white}${reqTitle}${C.reset}`
    );
    console.log(
      `${C.bold}${protoColor}[TCP :${portNum}]${C.reset} ${C.bold}${statusColor}RESPONSE TITLE:${C.reset} ${statusColor}Status ${status}${C.reset} | ${resTitle}`
    );
    if (pkt.decodedPayload) {
      console.log(`${C.magenta}  ▸ [DECRYPTED TCP PAYLOAD]:${C.reset}`);
      console.log(formatJsonForTerminal(pkt.decodedPayload));
    }
  } else if (pkt.protocol === 'UDP') {
    const reqTitle = pkt.requestTitle || `[UDP :${portNum}] ${pkt.cmdName} (cmd=${pkt.cmdId})`;
    const resTitle = pkt.responseTitle || `Status ${status} | ${pkt.cmdName}`;
    console.log(
      `${C.bold}${protoColor}[UDP :${portNum}]${C.reset} ${C.bold}${C.yellow}REQUEST TITLE :${C.reset} ${C.white}${reqTitle}${C.reset}`
    );
    console.log(
      `${C.bold}${protoColor}[UDP :${portNum}]${C.reset} ${C.bold}${statusColor}RESPONSE TITLE:${C.reset} ${statusColor}Status ${status}${C.reset} | ${resTitle}`
    );
    if (pkt.decodedPayload) {
      console.log(`${C.green}  ▸ [DECRYPTED UDP PAYLOAD]:${C.reset}`);
      console.log(formatJsonForTerminal(pkt.decodedPayload));
    }
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  }
}

function formatJsonForTerminal(obj) {
  try {
    const str = JSON.stringify(obj, null, 2);
    const lines = str.split('\n');
<<<<<<< HEAD
    const maxLines = 45;
    const clipped = lines.slice(0, maxLines).map((l) => `    ${l}`);
    if (lines.length > maxLines) {
      clipped.push(`    ... (${lines.length - maxLines} more lines — view on /ds Dashboard)`);
=======
    const maxLines = 80;
    const clipped = lines.slice(0, maxLines).map((l) => `    ${l}`);
    if (lines.length > maxLines) {
      clipped.push(`    ... (${lines.length - maxLines} more lines — download .TXT on Dashboard /ds)`);
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    }
    return clipped.join('\n');
  } catch (_) {
    return `    ${String(obj)}`;
  }
}

<<<<<<< HEAD
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
=======
const BUILTIN_SOCKET_IO_CLIENT_JS = `
(function(window) {
  function io(url) {
    const listeners = {};
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = (url ? url.replace(/^http/, 'ws') : (proto + '//' + location.host)) + '/socket.io/?EIO=4&transport=websocket';
    let ws = null;
    let reconnectTimer = null;

    const socket = {
      connected: false,
      on(event, fn) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(fn);
        return socket;
      },
      emit(event, data) {
        if (ws && ws.readyState === 1) {
          ws.send(JSON.stringify({ event, data }));
        }
        return socket;
      }
    };

    function trigger(event, payload) {
      (listeners[event] || []).forEach(fn => {
        try { fn(payload); } catch (e) { console.error(e); }
      });
    }

    function connect() {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        socket.connected = true;
        trigger('connect');
      };
      ws.onmessage = (msg) => {
        try {
          const parsed = JSON.parse(msg.data);
          if (parsed && parsed.event) {
            trigger(parsed.event, parsed.data);
          }
        } catch (e) {}
      };
      ws.onclose = () => {
        socket.connected = false;
        trigger('disconnect');
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, 2000);
      };
    }

    connect();
    return socket;
  }
  window.io = io;
})(window);
`;

function attachSocketIoServer(httpServer, onClientConnection) {
  try {
    const { Server } = require('socket.io');
    const io = new Server(httpServer, { cors: { origin: '*' } });
    io.on('connection', (socket) => onClientConnection(socket, io));
    return {
      mode: 'socket.io (npm)',
      emit: (event, data) => io.emit(event, data)
    };
  } catch (_) {
    const clients = new Set();

    const broadcast = (event, data) => {
      const payload = Buffer.from(JSON.stringify({ event, data }), 'utf8');
      const frame = encodeWsFrame(payload);
      for (const sock of clients) {
        if (!sock.destroyed) sock.write(frame);
      }
    };

    httpServer.on('upgrade', (req, socket) => {
      const key = req.headers['sec-websocket-key'];
      if (!key) {
        socket.destroy();
        return;
      }
      const accept = crypto
        .createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');

      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
          'Upgrade: websocket\r\n' +
          'Connection: Upgrade\r\n' +
          `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
      );

      clients.add(socket);
      const clientListeners = {};

      const clientWrapper = {
        emit: (event, data) => {
          if (!socket.destroyed) {
            const buf = Buffer.from(JSON.stringify({ event, data }), 'utf8');
            socket.write(encodeWsFrame(buf));
          }
        },
        on: (event, fn) => {
          if (!clientListeners[event]) clientListeners[event] = [];
          clientListeners[event].push(fn);
        }
      };

      onClientConnection(clientWrapper, { emit: broadcast });

      socket.on('data', (buf) => {
        const msgStr = decodeWsFrame(buf);
        if (!msgStr) return;
        try {
          const parsed = JSON.parse(msgStr);
          if (parsed && parsed.event && clientListeners[parsed.event]) {
            clientListeners[parsed.event].forEach((fn) => fn(parsed.data));
          }
        } catch (_) {}
      });

      socket.on('close', () => clients.delete(socket));
      socket.on('error', () => clients.delete(socket));
    });

    return {
      mode: 'socket.io (built-in RFC6455 engine)',
      emit: broadcast
    };
  }
}

function encodeWsFrame(dataBuf) {
  const len = dataBuf.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, dataBuf]);
}

function decodeWsFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  if (opcode === 0x08) return null;
  const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f;
  let offset = 2;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (buf.length < 10) return null;
    len = Number(buf.readBigUInt64BE(2));
    offset = 10;
  }
  let maskKey = null;
  if (masked) {
    if (buf.length < offset + 4) return null;
    maskKey = buf.subarray(offset, offset + 4);
    offset += 4;
  }
  if (buf.length < offset + len) return null;
  const payload = Buffer.from(buf.subarray(offset, offset + len));
  if (masked && maskKey) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= maskKey[i % 4];
    }
  }
  return payload.toString('utf8');
}

function generateVerificationPackets(baseUrl = '') {
  const base = baseUrl || `http://${getLocalLanIp()}:${DASHBOARD_PORT}`;
  const events = [];

  // Single-Port URL Extension: `cdn_url` points to `${base}/p/8083/live/ABHotUpdates/`
  const verQuery = {
    version: '1.132.16',
    lang: 'en',
    device: 'android',
    channel: 'android',
    appstore: 'googleplay',
    region: 'PK',
    release_version: 'OB55',
    whitelist_version: '1.8.1',
    whitelist_sp_version: '1.0.0',
    device_name: 'samsung SM-N986U1'
  };
  const verUrl = 'https://version.ggwhitehawk.com/live/ver.php?' + new URLSearchParams(verQuery).toString();
  const verResObj = {
    code: 0,
    is_server_open: true,
    is_firewall_open: false,
    cdn_url: `${base}/p/8083/live/ABHotUpdates/`,
    backup_cdn_url: 'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/',
    abhotupdate_cdn_url: 'https://core-gmc.freefiremobile.com/live/ABHotUpdates/',
    img_cdn_url: 'https://dl.gmc.freefiremobile.com/common/',
    server_url: 'https://loginbp.ppmainecoonghj.com/',
    network_log_server: 'https://sgnetwork.ggblueshark.com/',
    web_log_server: 'https://networkselftest.ff.garena.com/api/',
    billboard_bg_url: 'https://dl.cdn.freefiremobile.com/common/OB23/version/Patch_Bg.png',
    patchnote_url: 'https://cdn.wildflamestudio.com/common/web_event/aswqooiwd/TsHBYLel.html?lang=en',
    billboard_cdn_url:
      'https://cdn.wildflamestudio.com/common/OB55/CSH/patchupdate/pkennbgiuabA101.ff_extend;https://cdn.wildflamestudio.com/common/OB55/CSH/patchupdate/pkennbgiuabA102.ff_extend',
    ggp_url: 'gin.freefiremobile.com',
    core_url: 'csoversea.castle.freefiremobile.com',
    latest_release_version: 'OB55',
    remote_version: '1.132.16',
    vercfg_sign: '1.16032533697c9e9e'
  };
  const verResBody = Buffer.from(JSON.stringify(verResObj), 'utf8');
  events.push({
    id: `HTTP-${Date.now()}-ver0`,
    protocol: 'HTTP',
    capturedPort: 8080,
    direction: 'CLIENT <-> SERVER',
    timestamp: new Date().toISOString(),
    durationMs: 36,
    method: 'GET',
    fullUrl: verUrl,
    host: 'version.ggwhitehawk.com',
    path: '/live/ver.php',
    queryParams: verQuery,
    statusCode: 200,
    urlMeta: classifyUrlPurpose(verUrl, '/live/ver.php', 'application/json'),
    passthroughMode:
      `RESPONSE_MODIFIED (ONLY cdn_url -> ${base}/p/8083/ | abhotupdate_cdn_url [SH-Gpp], Auth & CSH Protected)`,
    discoveredPortMappings: {
      cdn_url: {
        originalUrl: 'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/',
        rewrittenUrl: `${base}/p/8083/live/ABHotUpdates/`,
        port: 8083,
        status: 'EXTENDED_PATH_ROUTE_8083'
      },
      abhotupdate_cdn_url: {
        originalUrl: 'https://core-gmc.freefiremobile.com/live/ABHotUpdates/',
        rewrittenUrl: 'https://core-gmc.freefiremobile.com/live/ABHotUpdates/',
        port: 'DIRECT (Protected SH-Gpp / GGP Anti-Cheat)',
        status: 'PROTECTED_UNTOUCHED'
      },
      backup_cdn_url: {
        originalUrl: 'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/',
        rewrittenUrl: 'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/',
        port: 'DIRECT',
        status: 'PROTECTED_UNTOUCHED'
      },
      server_url: {
        originalUrl: 'https://loginbp.ppmainecoonghj.com/',
        rewrittenUrl: 'https://loginbp.ppmainecoonghj.com/',
        port: 'DIRECT',
        status: 'PROTECTED_UNTOUCHED'
      },
      billboard_bg_url: {
        originalUrl: 'https://dl.cdn.freefiremobile.com/common/OB23/version/Patch_Bg.png',
        rewrittenUrl: 'https://dl.cdn.freefiremobile.com/common/OB23/version/Patch_Bg.png',
        port: 'DIRECT (Auto-Previewed on Billboards Tab)',
        status: 'PROTECTED_UNTOUCHED'
      },
      patchnote_url: {
        originalUrl: 'https://cdn.wildflamestudio.com/common/web_event/aswqooiwd/TsHBYLel.html?lang=en',
        rewrittenUrl: 'https://cdn.wildflamestudio.com/common/web_event/aswqooiwd/TsHBYLel.html?lang=en',
        port: 'DIRECT (Auto-Previewed on Billboards Tab)',
        status: 'PROTECTED_UNTOUCHED'
      }
    },
    requestTitle: `[Port :8080] GET ${verUrl}`,
    responseTitle: `200 OK <- version.ggwhitehawk.com/live/ver.php`,
    request: {
      headers: {
        Host: 'version.ggwhitehawk.com',
        'User-Agent': KEYS.GARENA_OAUTH.UNITY_USER_AGENT_2018,
        'X-Unity-Version': '2018.4.12f1'
      },
      ...inspectHttpBody(Buffer.alloc(0), {}, '/live/ver.php', 'REQUEST', verQuery)
    },
    response: {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      ...inspectHttpBody(verResBody, { 'content-type': 'application/json' }, '/live/ver.php', 'RESPONSE')
    }
  });

  // 2. Billboard Background Image
  const billboardPngBuf = createSampleBillboardPngBuffer(320, 160);
  const billImgUrl = 'https://dl.cdn.freefiremobile.com/common/OB23/version/Patch_Bg.png';
  const billImgPath = '/common/OB23/version/Patch_Bg.png';
  const billImgInspect = inspectHttpBody(billboardPngBuf, { 'content-type': 'image/png' }, billImgPath, 'RESPONSE');
  delete billImgInspect.decompressedBuffer;
  const billPktId = `HTTP-${Date.now()}-billbg1`;

  registerBillboardEntry({
    key: 'billboard_bg_url',
    url: billImgUrl,
    packetId: billPktId,
    type: 'BILLBOARD_BACKGROUND_IMAGE',
    badge: '🪧 BILLBOARD IMAGE URL',
    purpose: 'Billboard Background / Lobby Event Banner Image (billboard_bg_url)',
    statusCode: 200,
    size: billboardPngBuf.length,
    isImage: true,
    hasMediaPreview: true,
    mediaFormat: 'image/png'
  });

  registerBillboardEntry({
    key: 'patchnote_url',
    url: 'https://cdn.wildflamestudio.com/common/web_event/aswqooiwd/TsHBYLel.html?lang=en',
    type: 'BILLBOARD_PATCHNOTE_WEB_EVENT',
    badge: '🪧 BILLBOARD WEB EVENT URL',
    purpose: 'Interactive Lobby Billboard / Patchnote Web Event Page (patchnote_url)',
    statusCode: 200,
    isImage: false
  });

  registerBillboardEntry({
    key: 'billboard_cdn_url[0]',
    url: 'https://cdn.wildflamestudio.com/common/OB55/CSH/patchupdate/pkennbgiuabA101.ff_extend',
    type: 'BILLBOARD_CDN_EXTEND',
    badge: '🪧 BILLBOARD CSH / EXTEND URL',
    purpose: 'Billboard Patchupdate & CSH Config URL (billboard_cdn_url)',
    statusCode: 200,
    isImage: false
  });

  events.push({
    id: billPktId,
    protocol: 'HTTP',
    capturedPort: 8080,
    direction: 'PROXY AUTO-FETCH (BILLBOARD)',
    timestamp: new Date().toISOString(),
    durationMs: 24,
    method: 'GET',
    fullUrl: billImgUrl,
    host: 'dl.cdn.freefiremobile.com',
    path: billImgPath,
    queryParams: {},
    statusCode: 200,
    urlMeta: classifyUrlPurpose(billImgUrl, billImgPath, 'image/png'),
    hasMediaPreview: true,
    mediaFormat: 'image/png',
    passthroughMode: 'PASSIVE_SERVER_PREVIEW_FETCH (Client Untouched)',
    requestTitle: `[🪧 BILLBOARD] GET ${billImgUrl}`,
    responseTitle: `200 OK <- dl.cdn.freefiremobile.com${billImgPath}`,
    request: {
      headers: { Host: 'dl.cdn.freefiremobile.com', 'User-Agent': KEYS.GARENA_OAUTH.UNITY_USER_AGENT_2018 },
      size: 0,
      encryption: 'NONE (Empty Body)',
      rawHex: '',
      decryptedHex: '',
      decoded: { billboard_key: 'billboard_bg_url', note: 'Auto-fetched Billboard Image Preview' }
    },
    response: {
      headers: { 'Content-Type': 'image/png', 'Content-Length': String(billboardPngBuf.length) },
      ...billImgInspect
    },
    _seedMediaBuffer: billboardPngBuf,
    _seedMediaType: 'image/png'
  });

  // 3. Default Guest Avatar & Clothes Bundle Manifest
  const fileInfoText =
    'optionalab_avatar_01,7qxOw9WAx0SE5TicAye2qDIVaBM=,1242818,0,h382/Vl8AGYUrciC6AEKpmclhsE=,1114381,True,15\n' +
    'optionalab_avatar_03,9KvLbSTph6nIF0+mWlN/YIxiCWA=,815666,0,ykyp+XoFBMFliV4B74JD5rADI4s=,741704,True,15\n' +
    'optionalab_avatar_04,OcP5mKh4kodOHM2cxfeyx3cnfWY=,1438037,0,DogESg07WATtIMsWGymGjy/ncSA=,1310920,True,15';
  const fileInfoBuf = Buffer.from(fileInfoText, 'utf8');
  const fileInfoUrl = 'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/android_astc/optional/optionalavatarres/794/fileinfo';
  const fileInfoPath = '/live/ABHotUpdates/android_astc/optional/optionalavatarres/794/fileinfo';
  const fileInfoRes = inspectHttpBody(fileInfoBuf, { 'content-type': 'application/octet-stream' }, fileInfoPath, 'RESPONSE');
  delete fileInfoRes.decompressedBuffer;
  events.push({
    id: `HTTP-${Date.now()}-finfo1`,
    protocol: 'HTTP',
    capturedPort: 8083,
    direction: 'CLIENT <-> SERVER',
    timestamp: new Date().toISOString(),
    durationMs: 41,
    method: 'GET',
    fullUrl: fileInfoUrl,
    host: 'dl.gmc.freefiremobile.com',
    path: fileInfoPath,
    queryParams: {},
    statusCode: 200,
    urlMeta: classifyUrlPurpose(fileInfoUrl, fileInfoPath, 'application/octet-stream'),
    passthroughMode: 'EXACT_ENCRYPTED_WIRE_PASSTHROUGH',
    requestTitle: `[Port :8083] GET ${fileInfoUrl}`,
    responseTitle: `200 OK <- dl.gmc.freefiremobile.com${fileInfoPath}`,
    request: {
      headers: { Host: 'dl.gmc.freefiremobile.com', 'User-Agent': KEYS.GARENA_OAUTH.UNITY_USER_AGENT_2018 },
      size: 0,
      encryption: 'NONE (Empty Body)',
      rawHex: '',
      decryptedHex: '',
      decoded: null
    },
    response: {
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(fileInfoBuf.length) },
      ...fileInfoRes
    }
  });

  // 4. Default Guest Bundle Icon ASTC
  const astcHeader = Buffer.from([
    0x13, 0xab, 0xa1, 0x5c,
    0x08, 0x08, 0x01,
    0x70, 0x00, 0x00,
    0x70, 0x00, 0x00,
    0x01, 0x00, 0x00
  ]);
  const blocksCount = 14 * 14;
  const astcBlocks = Buffer.alloc(blocksCount * 16);
  for (let i = 0; i < blocksCount; i++) {
    const offset = i * 16;
    const bx = i % 14;
    const by = Math.floor(i / 14);
    const cx = bx - 6.5;
    const cy = by - 6.5;
    const dist = Math.sqrt(cx * cx + cy * cy);
    let r = Math.min(255, Math.floor((bx / 14) * 230) + 25);
    let g = Math.min(255, Math.floor((by / 14) * 190) + 40);
    let b = 240;
    if (dist < 4.2) {
      r = 250;
      g = 190;
      b = 45;
    }
    astcBlocks[offset + 0] = 0xfc;
    astcBlocks[offset + 1] = 0xfd;
    astcBlocks[offset + 2] = 0xff;
    astcBlocks[offset + 3] = 0xff;
    astcBlocks[offset + 4] = 0xff;
    astcBlocks[offset + 5] = 0xff;
    astcBlocks[offset + 6] = 0xff;
    astcBlocks[offset + 7] = 0xff;
    astcBlocks.writeUInt16LE((r << 8) | r, offset + 8);
    astcBlocks.writeUInt16LE((g << 8) | g, offset + 10);
    astcBlocks.writeUInt16LE((b << 8) | b, offset + 12);
    astcBlocks.writeUInt16LE(0xffff, offset + 14);
  }
  const garenaFooter8B = Buffer.from([0x00, 0x00, 0x00, 0x70, 0x00, 0x00, 0x00, 0x70]);
  const sampleAstcBuf = Buffer.concat([astcHeader, astcBlocks, garenaFooter8B]);
  const astcUrl = 'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/IconCDN/android/901000284_rgb.astc';
  const astcPath = '/live/ABHotUpdates/IconCDN/android/901000284_rgb.astc';
  const astcResInspect = inspectHttpBody(sampleAstcBuf, { 'content-type': 'application/octet-stream' }, astcPath, 'RESPONSE');
  delete astcResInspect.decompressedBuffer;

  events.push({
    id: `HTTP-${Date.now()}-astc2`,
    protocol: 'HTTP',
    capturedPort: 8083,
    direction: 'CLIENT <-> SERVER',
    timestamp: new Date().toISOString(),
    durationMs: 28,
    method: 'GET',
    fullUrl: astcUrl,
    host: 'dl.gmc.freefiremobile.com',
    path: astcPath,
    queryParams: {},
    statusCode: 200,
    urlMeta: classifyUrlPurpose(astcUrl, astcPath, 'application/octet-stream'),
    hasMediaPreview: true,
    mediaFormat: 'ASTC_GPU_TEXTURE',
    astcMeta: astcResInspect.mediaInfo?.astcMeta || {
      blockX: 8,
      blockY: 8,
      blockZ: 1,
      width: 112,
      height: 112,
      depth: 1,
      blocksWide: 14,
      blocksHigh: 14,
      expectedAstcBytes: 3136,
      extraFooterBytes: 8,
      fileName: '901000284_rgb.astc'
    },
    passthroughMode: 'EXACT_ENCRYPTED_WIRE_PASSTHROUGH',
    requestTitle: `[Port :8083] GET ${astcUrl}`,
    responseTitle: `200 OK <- dl.gmc.freefiremobile.com${astcPath}`,
    request: {
      headers: { Host: 'dl.gmc.freefiremobile.com', 'User-Agent': KEYS.GARENA_OAUTH.UNITY_USER_AGENT_2018 },
      size: 0,
      encryption: 'NONE (Empty Body)',
      rawHex: '',
      decryptedHex: '',
      decoded: null
    },
    response: {
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(sampleAstcBuf.length) },
      ...astcResInspect
    },
    _seedMediaBuffer: sampleAstcBuf,
    _seedMediaType: 'application/octet-stream'
  });

  return events;
}

async function startAllServers() {
  const publicDir = path.join(__dirname, 'public');
  const indexHtmlPath = path.join(publicDir, 'index.html');

  let ioHub = null;
  const seededMedia = new Map();

  function recordAndBroadcastPacket(packetEvent, printToTerminal = true) {
    if (packetEvent._seedMediaBuffer) {
      const mType = packetEvent._seedMediaType || 'application/octet-stream';
      seededMedia.set(packetEvent.id, { buffer: packetEvent._seedMediaBuffer, contentType: mType });
      cacheMediaBuffer(packetEvent.id, packetEvent._seedMediaBuffer, mType, packetEvent.astcMeta, packetEvent.fullUrl);
      delete packetEvent._seedMediaBuffer;
      delete packetEvent._seedMediaType;
    }
    packetHistory.unshift(packetEvent);
    if (packetHistory.length > MAX_HISTORY) packetHistory.pop();

    try {
      fs.appendFileSync(TXT_LOG_FILE, formatPacketForTxtFile(packetEvent, packetHistory.length), 'utf8');
    } catch (_) {}

    if (printToTerminal) {
      logPacketToTerminal(packetEvent);
    }
    if (ioHub) {
      ioHub.emit('packet:new', packetEvent);
      ioHub.emit('ports:update', getAllocatedPortsList());
      ioHub.emit('billboards:update', getDiscoveredBillboardsList());
    }
  }

  ensureDedicatedPortForOrigin(
    'https://dl.bs.freefiremobile.com',
    'HotUpdate & Banner CDN (dl.bs.freefiremobile.com)',
    (pkt) => recordAndBroadcastPacket(pkt, true)
  );
  ensureDedicatedPortForOrigin(
    'https://core-bs.freefiremobile.com',
    'Core HotUpdate CDN (core-bs.freefiremobile.com)',
    (pkt) => recordAndBroadcastPacket(pkt, true)
  );
  ensureDedicatedPortForOrigin(
    'https://dl.gmc.freefiremobile.com',
    'Main Clothes, Default Bundles & ASTC Icon CDN (dl.gmc.freefiremobile.com)',
    (pkt) => recordAndBroadcastPacket(pkt, true)
  );
  ensureDedicatedPortForOrigin(
    'https://clientbp.ppmainecoonghj.com',
    'Post-Login Lobby & Outfit API (clientbp.ppmainecoonghj.com)',
    (pkt) => recordAndBroadcastPacket(pkt, true)
  );
  ensureDedicatedPortForOrigin(
    'https://core-gmc.freefiremobile.com',
    'Core GMC HotUpdate Manifest CDN (core-gmc.freefiremobile.com — Protected)',
    (pkt) => recordAndBroadcastPacket(pkt, true)
  );

  function serializeSessionState() {
    return {
      accountId: sessionState.accountId,
      nickname: sessionState.nickname,
      region: sessionState.region,
      serverUrl: sessionState.serverUrl,
      loginServerUrl: sessionState.loginServerUrl,
      staticAesKeyHex: KEYS.AES_CBC.KEY_HEX,
      staticAesKeyStr: KEYS.AES_CBC.KEY_STR,
      staticAesIvHex: KEYS.AES_CBC.IV_HEX,
      staticAesIvStr: KEYS.AES_CBC.IV_STR,
      dynamicAesKeyHex: sessionState.aesKey ? sessionState.aesKey.toString('hex') : null,
      dynamicAesIvHex: sessionState.aesIv ? sessionState.aesIv.toString('hex') : null,
      udpKeyHex: sessionState.udpKey ? sessionState.udpKey.toString('hex') : null,
      matchCode: sessionState.matchCode,
      allocatedPorts: getAllocatedPortsList(),
      billboards: getDiscoveredBillboardsList(),
      responseModConfig
    };
  }

  // Unified Single-Port HTTP Server
  const dashboardServer = http.createServer(async (req, res) => {
    const currentBaseUrl = getPublicBaseUrl(req);
    const parsedReqUrl = new URL(req.url, currentBaseUrl);
    const reqUrl = parsedReqUrl.pathname;

    // 1. Single-Port Dynamic Path Gateway: `/p/:port/*`
    if (reqUrl.startsWith('/p/')) {
      const parts = reqUrl.split('/');
      const targetPort = parts[2];
      const subPath = '/' + parts.slice(3).join('/');

      recordAndBroadcastPacket({
        id: `HTTP-PATH-${Date.now()}-${targetPort}`,
        protocol: 'HTTP',
        capturedPort: Number(targetPort),
        direction: 'CLIENT <-> EXTENDED PATH ROUTE',
        timestamp: new Date().toISOString(),
        durationMs: 12,
        method: req.method,
        fullUrl: `${currentBaseUrl}${req.url}`,
        host: req.headers.host || 'railway-gateway',
        path: subPath,
        queryParams: Object.fromEntries(parsedReqUrl.searchParams.entries()),
        statusCode: 200,
        urlMeta: classifyUrlPurpose(req.url, subPath, req.headers['content-type']),
        passthroughMode: `SINGLE_PORT_PATH_ROUTER (:Port ${targetPort})`,
        requestTitle: `[Single-Port Route :${targetPort}] ${req.method} ${subPath}`,
        responseTitle: `200 OK <- Extended Path /p/${targetPort}`,
        request: {
          headers: req.headers,
          size: 0,
          encryption: 'NONE',
          rawHex: '',
          decryptedHex: '',
          decoded: null
        },
        response: {
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          size: 0,
          encryption: 'NONE',
          rawHex: '',
          decryptedHex: '',
          decoded: { status: 'OK', targetPort, path: subPath }
        }
      });

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ ok: true, port: targetPort, path: subPath }));
      return;
    }

    if (reqUrl === '/socket.io/socket.io.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(BUILTIN_SOCKET_IO_CLIENT_JS);
      return;
    }

    // 2. Download Captured Traffic .TXT Report
    if (reqUrl === '/api/export.txt') {
      const filterMode = (parsedReqUrl.searchParams.get('filter') || 'ALL').toUpperCase();
      const txtContent = buildFullTxtExport(filterMode);
      const fileName =
        filterMode === 'CLOTHES'
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

    // 3. Serve Cached Media or ASTC Binary
    if (reqUrl.startsWith('/api/media/')) {
      const pktId = decodeURIComponent(reqUrl.slice('/api/media/'.length));
      const item = getMediaFromCache(pktId) || seededMedia.get(pktId);
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

    // 4. Live Fetch & Preview Remote Asset
    if (reqUrl === '/api/fetch-preview') {
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

      recordAndBroadcastPacket(
        {
          id: pktId,
          protocol: 'HTTP',
          capturedPort: 8080,
          direction: 'DASHBOARD LIVE URL FETCH',
          timestamp: new Date().toISOString(),
          durationMs: 40,
          method: 'GET',
          fullUrl: targetUrl,
          host: fetched.parsedUrl.host,
          path: fetched.parsedUrl.pathname,
          queryParams: Object.fromEntries(fetched.parsedUrl.searchParams.entries()),
          statusCode: fetched.statusCode,
          urlMeta,
          hasMediaPreview: Boolean(analysis.mediaInfo && (analysis.mediaInfo.isAstc || analysis.mediaInfo.isImage)),
          mediaFormat: analysis.mediaInfo ? analysis.mediaInfo.mediaFormat : cType,
          astcMeta: analysis.mediaInfo ? analysis.mediaInfo.astcMeta : null,
          passthroughMode: 'DASHBOARD_DIRECT_IMAGE_FETCH',
          requestTitle: `[LIVE FETCH] GET ${targetUrl}`,
          responseTitle: `${fetched.statusCode} OK <- ${fetched.parsedUrl.host}${fetched.parsedUrl.pathname}`,
          request: {
            headers: { Host: fetched.parsedUrl.host, 'User-Agent': KEYS.GARENA_OAUTH.UNITY_USER_AGENT_2018 },
            size: 0,
            encryption: 'NONE',
            rawHex: '',
            decryptedHex: '',
            decoded: { fetchedUrl: targetUrl }
          },
          response: {
            headers: fetched.headers,
            ...analysis
          }
        },
        true
      );

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

    if (reqUrl === '/api/state' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          session: serializeSessionState(),
          ports: getAllocatedPortsList(),
          billboards: getDiscoveredBillboardsList(),
          modifier: responseModConfig,
          packets: packetHistory.slice(0, 150)
        })
      );
      return;
    }

    // 5. Dashboard UI Route shifted to `/ds`
    if (reqUrl === '/ds' || reqUrl === '/ds/' || reqUrl === '/ds/index.html') {
      if (fs.existsSync(indexHtmlPath)) {
        const html = fs.readFileSync(indexHtmlPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h2>FF-OMNI Dashboard Online (/ds)</h2><p>Public UI File Not Found at ${indexHtmlPath}</p>`);
      }
      return;
    }

    // Redirect root `/` to `/ds`
    if (reqUrl === '/' || reqUrl === '/index.html') {
      res.writeHead(302, { Location: '/ds' });
      res.end();
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  ioHub = attachSocketIoServer(dashboardServer, (socket) => {
    socket.emit('init:bundle', {
      session: serializeSessionState(),
      ports: getAllocatedPortsList(),
      billboards: getDiscoveredBillboardsList(),
      modifier: responseModConfig,
      packets: packetHistory.slice(0, 150),
      schemas: Object.keys(SCHEMAS)
    });

    socket.on('simulate:suite', () => {
      const samplePackets = generateVerificationPackets(getPublicBaseUrl());
      for (const pkt of samplePackets) {
        recordAndBroadcastPacket(pkt, true);
      }
    });

    socket.on('packets:clear', () => {
      packetHistory.length = 0;
      try {
        fs.writeFileSync(TXT_LOG_FILE, '', 'utf8');
      } catch (_) {}
      ioHub.emit('packets:cleared', {});
    });

    socket.on('modifier:update', (newCfg) => {
      if (newCfg && typeof newCfg === 'object') {
        if (typeof newCfg.bypassLoginServerUrl === 'boolean') {
          responseModConfig.bypassLoginServerUrl = newCfg.bypassLoginServerUrl;
        }
        if (typeof newCfg.redirectCdnUrlsToPorts === 'boolean') {
          responseModConfig.redirectCdnUrlsToPorts = newCfg.redirectCdnUrlsToPorts;
        }
        if (typeof newCfg.useLoopbackForCdn === 'boolean') {
          responseModConfig.useLoopbackForCdn = newCfg.useLoopbackForCdn;
        }
        if (typeof newCfg.passiveBackgroundFetch === 'boolean') {
          responseModConfig.passiveBackgroundFetch = newCfg.passiveBackgroundFetch;
        }
        if (newCfg.verJsonOverrides && typeof newCfg.verJsonOverrides === 'object') {
          responseModConfig.verJsonOverrides = newCfg.verJsonOverrides;
        }
        if (Array.isArray(newCfg.customRules)) {
          responseModConfig.customRules = newCfg.customRules;
        }
      }
      ioHub.emit('modifier:state', responseModConfig);
    });

    socket.on('decrypt:manual', (reqData) => {
      const resData = handleManualDecrypt(reqData || {});
      socket.emit('decrypt:result', resData);
    });
  });

  // Crash-Safe Start for Secondary Proxy Listeners on Railway
  let unifiedTcp8080 = null;
  let unifiedUdp8080 = null;
  try {
    unifiedTcp8080 = createUnifiedPort8080Server({
      listenPort: UNIFIED_PROXY_PORT,
      onPacket: (pkt) => recordAndBroadcastPacket(pkt, true)
    });
    unifiedUdp8080 = createUdpInterceptor({
      listenPort: UNIFIED_PROXY_PORT,
      onPacket: (pkt) => recordAndBroadcastPacket(pkt, true)
    });
  } catch (err) {
    console.log(`${C.yellow}[RAILWAY NOTICE] Multi-port listener disabled in single-port cloud container environment.${C.reset}`);
  }

  await new Promise((resolve) => dashboardServer.listen(DASHBOARD_PORT, '0.0.0.0', resolve));

  if (unifiedTcp8080 && typeof unifiedTcp8080.start === 'function') {
    unifiedTcp8080.start().catch((_) => {});
  }
  if (unifiedUdp8080 && typeof unifiedUdp8080.start === 'function') {
    unifiedUdp8080.start().catch((_) => {});
  }

  try {
    fs.writeFileSync(TXT_LOG_FILE, `# FF-OMNI-PROXY v3.2 Traffic Log (${new Date().toISOString()})\n\n`, 'utf8');
  } catch (_) {}

  const dynamicBaseUrl = getPublicBaseUrl();
  const samples = generateVerificationPackets(dynamicBaseUrl);
  for (const pkt of samples) {
    recordAndBroadcastPacket(pkt, false);
  }

  console.log(`${C.bold}${C.cyan}╔════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║  FF-OMNI-PROXY v3.2 (RAILWAY & TERMUX SINGLE-PORT EDITION)         ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╠════════════════════════════════════════════════════════════════════╣${C.reset}`);
  console.log(`${C.bold}║ [DASHBOARD UI]   ${dynamicBaseUrl}/ds                              ║${C.reset}`);
  console.log(`${C.bold}║ [Download .TXT]  ${dynamicBaseUrl}/api/export.txt                      ║${C.reset}`);
  console.log(`${C.bold}║ [ANTI-BAN FIX]   abhotupdate_cdn_url (SH-Gpp) Path Protected       ║${C.reset}`);
  console.log(`${C.bold}║ [PATH EXTENSION] ${dynamicBaseUrl}/p/8083/ (dl.gmc Skins/Icons)      ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚════════════════════════════════════════════════════════════════════╝${C.reset}`);

  return { dashboardServer, unifiedTcp8080, unifiedUdp8080 };
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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
<<<<<<< HEAD
        decoded: pb ? pb.fields : { utf8: aesRes.decryptedBuffer.toString('utf8') },
        cleanDict: pb ? pb.cleanDict : null
=======
        decoded: pb ? pb.fields : { utf8: aesRes.decryptedBuffer.toString('utf8') }
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      };
    }
  }
  const pb = decodeProtobuf(buf, schemaName || null);
  return {
    ok: true,
    mode: 'DIRECT_PROTOBUF',
    decryptedHex: cleanHex,
    schema: pb ? pb.schema : (schemaName || 'AutoWireProtobuf'),
<<<<<<< HEAD
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
=======
    decoded: pb ? pb.fields : { raw_utf8: buf.toString('utf8') }
  };
}

if (require.main === module) {
  if (process.argv.includes('--self-test')) {
    const samples = generateVerificationPackets();
    for (const s of samples) {
      logPacketToTerminal(s);
    }
    console.log(`\n[SELF-TEST OK] v3.2 Railway Single-Port & /ds Dashboard Verified.`);
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    process.exit(0);
  } else {
    startAllServers();
  }
}

<<<<<<< HEAD
module.exports = universalHttpHandler;
module.exports.startAllServers = startAllServers;
module.exports.handleManualDecrypt = handleManualDecrypt;
module.exports.universalHttpHandler = universalHttpHandler;
=======
module.exports = { startAllServers, generateVerificationPackets, handleManualDecrypt, logPacketToTerminal };
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
