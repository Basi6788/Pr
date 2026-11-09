/**
 * ============================================================================
 * FF-OMNI-PROXY v6.0: Pakistan (`PK`) #1 Priority Server & CDN Router +
 * Single-Port Path-Based Routing (`/px/...`) for Vercel & Termux (Zero Extra Ports!)
 * ============================================================================
 * Key Features in v6.0:
 *  1. Zero Astutech Redirection (`astutech.online` & `mainecoonnodex` removed):
 *     - Connects directly to Garena's official Pakistan (`PK`) & Global servers:
 *       • Version Config : `https://version.ggwhitehawk.com/live/ver.php` (+ PK OB55 fallback)
 *       • PK Clothes CDN : `https://dl.gmc.freefiremobile.com/live/ABHotUpdates/`
 *       • PK Core CDN    : `https://core-gmc.freefiremobile.com/live/ABHotUpdates/`
 *       • PK Login API   : `https://loginbp.ppmainecoonghj.com/`
 *       • PK Lobby API   : `https://clientbp.ppmainecoonghj.com/`
 *       • PK Log Server  : `https://sgnetwork.ggblueshark.com/`
 *  2. Automatic Pakistan (`PK`) URL Enforcement (No Brazil `BR` URLs!):
 *     - Even if the client APK sends `region=BR&lang=pt` or Vercel/VPN IP is outside Pakistan,
 *       `--on` mode automatically enforces Pakistan (`PK`) URLs (`dl.gmc.freefiremobile.com`,
 *       `core-gmc.freefiremobile.com`, `pkennbgiuabA101..105.ff_extend`, `sgnetwork.ggblueshark.com`,
 *       `country_code: "PK"`, and synced `remote_version` + `remote_option_version_astc`).
 *  3. 100% Single-Port Path-Based Routing (`/px/<proto>/<host>/<path>` — Zero Multi-Ports!):
 *     - Compatible with both Vercel Serverless (`https://<app>.vercel.app/px/https/dl.gmc...`)
 *       and Termux (`http://<ip>:8080/px/https/dl.gmc...`).
 *     - Zero `socket.io` dependency and zero extra ports (`:8081..:8085` removed).
 */

const http = require('http');
const https = require('https');
const zlib = require('zlib');
const crypto = require('crypto');
const os = require('os');
const { URL } = require('url');
const KEYS = require('../config/keys');
const {
  aesCbcDecryptSmart,
  aesCbcEncrypt,
  verifyGarenaHmac,
  updateSessionFromHttpProto,
  sessionState
} = require('../crypto/cipherEngine');
const { decodeProtobuf, encodeProtobuf, resolveSchemaForUrl } = require('../proto/protoEngine');

const PRIMARY_UPSTREAM_ORIGIN = KEYS.ENDPOINTS?.PRIMARY_UPSTREAM || 'https://version.ggwhitehawk.com';

const keepAliveHttpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 128,
  keepAliveMsecs: 30000,
  rejectUnauthorized: false
});
const keepAliveHttpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 128,
  keepAliveMsecs: 30000
});

const mediaCache = new Map();
const urlPreviewCache = new Map();
const MAX_MEDIA_ITEMS = 400;

// Path Route & Redirect Registry (Single-Port `/px/...` system — 0 extra ports!)
const discoveredPathRoutes = new Map();
const discoveredPathPrefixMap = new Map();
const discoveredRedirects = [];
const discoveredBillboards = new Map();

// Keys in /live/ver.php that are rewritten to `/px/<proto>/<host>/<path>` in `--on` mode by default
const DEFAULT_PATH_ROUTED_VER_KEYS = new Set([
  'cdn_url',
  'backup_cdn_url',
  'img_cdn_url',
  'billboard_bg_url',
  'patchnote_url'
]);

// Keys that remain direct HTTPS unless `routeAllVerUrlsViaPaths` is enabled
const PROTECTED_AUTH_KEYS = new Set([
  'server_url',
  'network_log_server',
  'web_log_server',
  'appstore_url',
  'backup_appstore_url',
  'core_url',
  'ggp_url',
  'gop_url'
]);

const initialModifierOn = !process.argv.includes('--off');
const initialAllPaths = process.argv.includes('--all-paths');

const responseModConfig = {
  // Master switch: true when `--on` (default), false when `--off`
  modifierEnabled: initialModifierOn,
  // Priority region: Pakistan (`PK`) #1 Priority
  priorityRegion: 'PK',
  // Primary version upstream (Official Garena PK/Global Version Server — Zero Astutech!)
  primaryUpstreamOrigin: PRIMARY_UPSTREAM_ORIGIN,
  // Rewrite CDN URLs in /live/ver.php to `<scheme>://<host>/px/<proto>/<host>/<path>` (Single-Port Paths!)
  redirectCdnUrlsToPorts: initialModifierOn,
  // Optional: Route ALL URLs in /live/ver.php via `/px/...` paths
  routeAllVerUrlsViaPaths: initialAllPaths,
  // Follow HTTP 301/302/307/308 redirects in the middle so client never leaves proxy
  followRedirectsInMiddle: true,
  rewriteRedirectLocationToPath: false,
  // Force Pakistan (`PK`) URLs (`dl.gmc`, `core-gmc`, `pkennbgiuab`, `sgnetwork`, `country_code: "PK"`) instead of Brazil (`BR`)
  forcePakistanCountryCode: true,
  // Sync `remote_version` to client's `?version=` parameter to prevent Error 400 Store Update popup
  syncRemoteVersionToClient: true,
  disableHotupdateTracking: false,
  bypassLoginServerUrl: true,
  routeCdnOnSameHost: true,
  verJsonOverrides: {},
  customRules: []
};

function setModifierMode(enabled) {
  const isOn = Boolean(enabled);
  responseModConfig.modifierEnabled = isOn;
  responseModConfig.redirectCdnUrlsToPorts = isOn;
  return responseModConfig;
}

function sha256Short(buf) {
  if (!buf || buf.length === 0) return 'EMPTY';
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

function getPrimaryDeviceIp() {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const netInfo of nets[name] || []) {
        if (netInfo.family === 'IPv4' && !netInfo.internal && netInfo.address) {
          return netInfo.address;
        }
      }
    }
  } catch (_) {}
  return '0.0.0.0';
}

function isProxySelfHost(hostHeader = '') {
  const h = String(hostHeader).split(':')[0].trim().toLowerCase();
  if (!h) return true;
  if (h === '0.0.0.0' || h === 'localhost' || h === '127.0.0.1' || h === getPrimaryDeviceIp().toLowerCase()) return true;
  if (h.endsWith('.vercel.app')) return true;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(h)) return true;
  return false;
}

/**
 * Converts any external URL (`https://dl.gmc.freefiremobile.com/live/ABHotUpdates/`) into a
 * Single-Port Path URL on our proxy (works identically on Vercel HTTPS and Termux HTTP):
 *   - Vercel: `https://<your-app>.vercel.app/px/https/dl.gmc.freefiremobile.com/live/ABHotUpdates/`
 *   - Termux: `http://<your-lan-ip>:8080/px/https/dl.gmc.freefiremobile.com/live/ABHotUpdates/`
 */
function buildProxyPathUrl(targetUrlStr, clientHostHeader = '', clientProto = 'http') {
  try {
    const u = new URL(targetUrlStr);
    const rawHost = String(clientHostHeader || `${getPrimaryDeviceIp()}:8080`).split(',')[0].trim();
    const proxyHost = isProxySelfHost(rawHost) ? rawHost : `${getPrimaryDeviceIp()}:8080`;
    const isVercelHost = proxyHost.endsWith('.vercel.app') || Boolean(process.env.VERCEL || process.env.NOW_REGION);
    const cleanProto = String(clientProto || 'http').split(',')[0].trim().toLowerCase();
    const scheme = isVercelHost || cleanProto === 'https' ? 'https' : 'http';
    const protoSlug = u.protocol.replace(':', '').toLowerCase();
    const cleanPath = u.pathname.startsWith('/') ? u.pathname : '/' + u.pathname;
    return `${scheme}://${proxyHost}/px/${protoSlug}/${u.host}${cleanPath}${u.search}`;
  } catch (_) {
    return targetUrlStr;
  }
}

/**
 * Registers a discovered upstream URL and its `/px/...` proxy path in the Path Registry
 * (Single-port path routing — ZERO extra ports opened!).
 */
function registerPathRouteForUrl(targetUrlStr, label = 'Pakistan PK Path Route', clientHostHeader = '', clientProto = 'http') {
  try {
    const u = new URL(targetUrlStr);
    const protoSlug = u.protocol.replace(':', '').toLowerCase();
    const cleanPath = u.pathname.startsWith('/') ? u.pathname : '/' + u.pathname;
    const pathRoute = `/px/${protoSlug}/${u.host}${cleanPath}`;
    const fullProxyUrl = buildProxyPathUrl(targetUrlStr, clientHostHeader, clientProto);

    if (cleanPath && cleanPath !== '/' && cleanPath !== '/live/ver.php') {
      const prefixParts = cleanPath.split('/').filter(Boolean);
      if (prefixParts.length >= 1) {
        const prefixKey = '/' + prefixParts.slice(0, Math.min(2, prefixParts.length)).join('/');
        if (!discoveredPathPrefixMap.has(prefixKey.toLowerCase())) {
          discoveredPathPrefixMap.set(prefixKey.toLowerCase(), u.origin);
        }
      }
    }

    const existing = discoveredPathRoutes.get(pathRoute);
    if (existing) {
      existing.packetCount = (existing.packetCount || 0) + 1;
      existing.proxyUrl = fullProxyUrl;
      existing.lastSeen = new Date().toISOString();
      return existing;
    }

    const entry = {
      port: `PATH ${pathRoute}`,
      pathRoute,
      proxyUrl: fullProxyUrl,
      origin: u.origin,
      host: u.host,
      targetUrl: targetUrlStr,
      label,
      serverIp: getPrimaryDeviceIp(),
      packetCount: 1,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    discoveredPathRoutes.set(pathRoute, entry);
    return entry;
  } catch (_) {
    return null;
  }
}

function ensureDedicatedPortForOrigin(originUrl, label = 'Pakistan PK Upstream Route') {
  return registerPathRouteForUrl(originUrl, label);
}

function getAllocatedPortsList() {
  return Array.from(discoveredPathRoutes.values());
}

function getDiscoveredRedirectsList() {
  return discoveredRedirects.slice(0, 200);
}

function cacheMediaBuffer(packetId, buf, contentType, meta, sourceUrl = '') {
  if (!buf || buf.length === 0 || buf.length > 8 * 1024 * 1024) return;
  const entry = {
    buffer: Buffer.from(buf),
    contentType: contentType || 'application/octet-stream',
    meta,
    sourceUrl,
    timestamp: Date.now()
  };
  mediaCache.set(packetId, entry);
  if (sourceUrl) {
    urlPreviewCache.set(sourceUrl, { packetId, ...entry });
  }
  if (mediaCache.size > MAX_MEDIA_ITEMS) {
    const oldestKey = mediaCache.keys().next().value;
    mediaCache.delete(oldestKey);
  }
}

function getMediaFromCache(packetId) {
  return mediaCache.get(packetId) || null;
}

function getMediaByUrl(urlStr) {
  return urlPreviewCache.get(urlStr) || null;
}

function getDiscoveredBillboardsList() {
  return Array.from(discoveredBillboards.values());
}

function registerBillboardEntry(entry) {
  if (!entry || !entry.url) return;
  discoveredBillboards.set(entry.url, {
    ...(discoveredBillboards.get(entry.url) || {}),
    ...entry,
    updatedAt: new Date().toISOString()
  });
}

function decompressBuffer(buf, encoding = '') {
  if (!buf || buf.length === 0) return buf;
  const enc = String(encoding).toLowerCase();
  try {
    if (enc.includes('gzip') || (buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b)) {
      return zlib.gunzipSync(buf);
    }
    if (enc.includes('deflate')) {
      try {
        return zlib.inflateSync(buf);
      } catch (_) {
        return zlib.inflateRawSync(buf);
      }
    }
  } catch (_) {}
  return buf;
}

function classifyUrlPurpose(fullUrlStr = '', pathname = '', contentType = '') {
  const uLower = String(fullUrlStr).toLowerCase();
  const pLower = String(pathname).toLowerCase();
  const cLower = String(contentType).toLowerCase();

  const itemMatch = pathname.match(/(\d{8,10})/);
  const itemId = itemMatch ? itemMatch[1] : null;
  const isImgExt =
    pLower.endsWith('.png') ||
    pLower.endsWith('.jpg') ||
    pLower.endsWith('.jpeg') ||
    pLower.endsWith('.webp') ||
    pLower.endsWith('.gif') ||
    cLower.startsWith('image/');

  if (pLower.endsWith('ver.php')) {
    return {
      category: 'VERSION_CONFIG',
      badge: '⚙️ PK VERSION & SERVER CONFIG',
      purpose: `Pakistan (PK) Startup Version, CDN & Single-Port /px/ Path Config (${fullUrlStr})`,
      isClothesOrSkin: false,
      isBillboard: false,
      isMedia: false,
      itemId: null
    };
  }

  if (
    uLower.includes('billboard') ||
    uLower.includes('wildflamestudio.com') ||
    uLower.includes('dl.cdn.freefiremobile.com') ||
    uLower.includes('dl.dir.freefiremobile.com') ||
    pLower.includes('patch_bg') ||
    pLower.includes('web_event') ||
    pLower.includes('patchnote') ||
    pLower.includes('splash') ||
    pLower.includes('banner') ||
    pLower.includes('bigevent') ||
    pLower.includes('announcement')
  ) {
    return {
      category: 'BILLBOARD',
      badge: isImgExt ? '🪧 PK BILLBOARD IMAGE' : '🪧 PK BILLBOARD / EVENT URL',
      purpose: isImgExt
        ? `Billboard / Splash Banner Image (${pathname.split('/').pop()})`
        : `Pakistan Billboard / Web Event / Patchnote Config (${pathname.split('/').pop() || pathname})`,
      isClothesOrSkin: false,
      isBillboard: true,
      isMedia: isImgExt,
      itemId
    };
  }

  if (pLower.includes('optionalavatarres') && pLower.endsWith('fileinfo')) {
    return {
      category: 'DEFAULT_CLOTHES_MANIFEST',
      badge: '👕 PK DEFAULT & OPTIONAL CLOTHES MANIFEST',
      purpose: 'Pakistan Master Avatar & Default Guest Clothes Bundle List (optionalab_avatar_*)',
      isClothesOrSkin: true,
      isBillboard: false,
      isMedia: false,
      itemId: null
    };
  }

  if (pLower.includes('optionalclothres') || pLower.includes('optionalab_avatar')) {
    return {
      category: 'CLOTHES_BUNDLE',
      badge: '👕 PK 3D CLOTHES / AVATAR BUNDLE',
      purpose: `In-Game 3D Outfit / Default & Custom Avatar Mesh Bundle (${pathname.split('/').pop()})`,
      isClothesOrSkin: true,
      isBillboard: false,
      isMedia: true,
      itemId
    };
  }

  if (pLower.includes('iconcdn') || pLower.endsWith('.astc')) {
    let subType = '🧥 PK CLOTHES / SKIN ICON';
    let desc = 'Pakistan (dl.gmc) Vault Clothes / Outfit / Bundle ASTC Texture Icon';
    if (itemId) {
      if (itemId.startsWith('901')) {
        subType = `👕 PK DEFAULT / BASE BUNDLE ICON (#${itemId})`;
        desc = `Default Guest / Classic Bundle & Welcome Reward Icon (ID: ${itemId})`;
      } else if (itemId.startsWith('902000')) {
        subType = `👕 PK CLASSIC / DEFAULT OUTFIT ICON (#${itemId})`;
        desc = `Base / Classic Tier Outfit & Default Wardrobe Icon (ID: ${itemId})`;
      } else if (itemId.startsWith('902')) {
        subType = `🧥 PK OUTFIT / BUNDLE SKIN ICON (#${itemId})`;
        desc = `Character Outfit / Costume Bundle ASTC Texture Icon (ID: ${itemId})`;
      } else if (itemId.startsWith('907') || itemId.startsWith('908')) {
        subType = `🔫 PK WEAPON SKIN ICON (#${itemId})`;
        desc = `Weapon / Gun Skin ASTC Texture Icon (ID: ${itemId})`;
      } else if (itemId.startsWith('909')) {
        subType = `🕺 PK EMOTE / ANIMATION ICON (#${itemId})`;
        desc = `Emote / Arrival Animation ASTC Icon (ID: ${itemId})`;
      }
    }
    return {
      category: 'CLOTHES_SKIN_ICON',
      badge: subType,
      purpose: desc,
      isClothesOrSkin: true,
      isBillboard: false,
      isMedia: true,
      itemId
    };
  }

  if (isImgExt) {
    return {
      category: 'IMAGE_MEDIA',
      badge: '🖼️ PK GAME IMAGE / BANNER',
      purpose: `Game UI / Event Image Asset (${pathname.split('/').pop()})`,
      isClothesOrSkin: false,
      isBillboard: true,
      isMedia: true,
      itemId
    };
  }

  if (pLower.includes('getplayerpersonalshow') || pLower.includes('getlogindata')) {
    return {
      category: 'PLAYER_OUTFIT_API',
      badge: '👤 PK EQUIPPED OUTFIT & PROFILE API',
      purpose: 'Equipped Clothes IDs, Avatar ID, Skin Color & Weapon Skins (Protobuf)',
      isClothesOrSkin: true,
      isBillboard: false,
      isMedia: false,
      itemId: null
    };
  }

  if (pLower.includes('majorlogin') || pLower.includes('majorregister') || pLower.includes('oauth') || pLower.includes('token')) {
    return {
      category: 'LOGIN_AUTH',
      badge: '🔐 PK AUTH & SESSION LOGIN',
      purpose: 'Pakistan Account Login, OpenID Token & Session Key Exchange',
      isClothesOrSkin: false,
      isBillboard: false,
      isMedia: false,
      itemId: null
    };
  }

  if (pLower.endsWith('fileinfo') || pLower.includes('abhotupdates')) {
    return {
      category: 'HOTUPDATE_BUNDLE',
      badge: '📦 PK ASSET BUNDLE / MANIFEST',
      purpose: `Pakistan HotUpdate Asset Bundle / Manifest (${pathname.split('/').slice(-2).join('/')})`,
      isClothesOrSkin: false,
      isBillboard: false,
      isMedia: false,
      itemId
    };
  }

  return {
    category: 'GAME_API',
    badge: '🌐 PK GAME API / PATH ROUTE',
    purpose: `Pakistan Server Request (${pathname})`,
    isClothesOrSkin: false,
    isBillboard: false,
    isMedia: false,
    itemId
  };
}

function inspectBinaryMediaOrAstc(buf, pathname = '', contentType = '') {
  if (!buf || buf.length < 4) return null;

  if (buf.length >= 16 && buf[0] === 0x13 && buf[1] === 0xab && buf[2] === 0xa1 && buf[3] === 0x5c) {
    const blockX = buf[4] || 8;
    const blockY = buf[5] || 8;
    const blockZ = buf[6] || 1;
    const dimX = buf[7] + (buf[8] << 8) + (buf[9] << 16);
    const dimY = buf[10] + (buf[11] << 8) + (buf[12] << 16);
    const dimZ = buf[13] + (buf[14] << 8) + (buf[15] << 16);
    const fileName = pathname.split('/').pop() || 'texture.astc';
    const itemMatch = fileName.match(/(\d{6,12})/);

    return {
      isAstc: true,
      isImage: false,
      mediaFormat: 'ASTC_GPU_TEXTURE',
      astcMeta: {
        magic: '0x5CA1AB13',
        fileName,
        itemId: itemMatch ? itemMatch[1] : 'Unknown',
        blockSize: `${blockX}x${blockY}x${blockZ}`,
        blockX,
        blockY,
        blockZ,
        width: dimX,
        height: dimY,
        depth: dimZ,
        compressedBytes: buf.length - 16,
        totalBytes: buf.length
      }
    };
  }

  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { isAstc: false, isImage: true, mediaFormat: 'image/png' };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { isAstc: false, isImage: true, mediaFormat: 'image/jpeg' };
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { isAstc: false, isImage: true, mediaFormat: 'image/webp' };
  }
  if (buf.subarray(0, 3).toString('ascii') === 'GIF') {
    return { isAstc: false, isImage: true, mediaFormat: 'image/gif' };
  }
  if (buf.length >= 7 && buf.subarray(0, 7).toString('ascii') === 'UnityFS') {
    return { isAstc: false, isImage: false, isUnityBundle: true, mediaFormat: 'UNITY_FS_BUNDLE' };
  }
  if (String(contentType).toLowerCase().startsWith('image/')) {
    return { isAstc: false, isImage: true, mediaFormat: contentType.split(';')[0].trim() };
  }
  return null;
}

function parseBundleFileInfoManifest(text, pathname = '') {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const entries = [];
  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length >= 6 && /^[a-zA-Z0-9_.\-/]+$/.test(parts[0])) {
      const bName = parts[0];
      const isClothes =
        bName.includes('avatar') ||
        bName.includes('cloth') ||
        bName.includes('skin') ||
        bName.includes('weapon') ||
        bName.includes('icon');
      const isBillboard =
        bName.includes('billboard') ||
        bName.includes('splash') ||
        bName.includes('banner') ||
        bName.includes('event');
      entries.push({
        bundle_name: bName,
        category: isClothes ? 'CLOTHES_OR_SKIN' : isBillboard ? 'BILLBOARD_BANNER' : 'GAME_RESOURCE',
        hash_uncompressed: parts[1],
        size_uncompressed: Number(parts[2]) || 0,
        flag: Number(parts[3]) || 0,
        hash_compressed: parts[4],
        size_compressed: Number(parts[5]) || 0,
        is_optional: parts[6] === 'True' || parts[6] === 'true',
        pack_id: parts[7] !== undefined ? Number(parts[7]) : null
      });
    }
  }
  if (entries.length === 0) return null;
  return {
    manifest_type: 'Free Fire Asset Bundle FileInfo Manifest (Pakistan dl.gmc CDN)',
    path: pathname,
    total_bundles_found: entries.length,
    clothes_and_skins_count: entries.filter((e) => e.category === 'CLOTHES_OR_SKIN').length,
    billboard_and_ui_count: entries.filter((e) => e.category === 'BILLBOARD_BANNER').length,
    total_bytes: text.length,
    bundles: entries
  };
}

function inspectHttpBody(rawBuf, headers = {}, urlPath = '', direction = 'REQUEST', queryParams = null) {
  const hasQuery = queryParams && Object.keys(queryParams).length > 0;

  if (!rawBuf || rawBuf.length === 0) {
    return {
      size: 0,
      encryption: 'NONE (Empty Body)',
      rawHex: '',
      rawBase64: '',
      decryptedHex: '',
      decoded: hasQuery ? { _query_params: queryParams } : null,
      mediaInfo: null
    };
  }

  const decompressed = decompressBuffer(rawBuf, headers['content-encoding']);
  const contentType = String(headers['content-type'] || '').toLowerCase();
  const rawHex = rawBuf.subarray(0, 4096).toString('hex') + (rawBuf.length > 4096 ? '... (truncated)' : '');
  const rawBase64 = rawBuf.subarray(0, 2048).toString('base64');

  const mediaInfo = inspectBinaryMediaOrAstc(decompressed, urlPath, contentType);
  if (mediaInfo && mediaInfo.isAstc) {
    return {
      size: rawBuf.length,
      encryption: 'ASTC_GPU_TEXTURE',
      rawHex,
      rawBase64,
      decryptedHex: decompressed.subarray(0, 64).toString('hex'),
      decoded: {
        media_type: 'ASTC Default Guest Bundle / Clothes / Skin Icon (PK dl.gmc)',
        file_name: mediaInfo.astcMeta.fileName,
        item_id: mediaInfo.astcMeta.itemId,
        dimensions: `${mediaInfo.astcMeta.width} x ${mediaInfo.astcMeta.height} px (depth=${mediaInfo.astcMeta.depth})`,
        block_footprint: mediaInfo.astcMeta.blockSize,
        payload_bytes: mediaInfo.astcMeta.compressedBytes,
        total_bytes: mediaInfo.astcMeta.totalBytes,
        preview_status: 'Live WebGL + Software ASTC Texture Preview Ready on /ds Dashboard'
      },
      mediaInfo,
      decompressedBuffer: decompressed
    };
  }

  if (mediaInfo && mediaInfo.isImage) {
    return {
      size: rawBuf.length,
      encryption: mediaInfo.mediaFormat.toUpperCase(),
      rawHex,
      rawBase64,
      decryptedHex: '',
      decoded: {
        media_type: 'Billboard / Event / Game Image Asset',
        format: mediaInfo.mediaFormat,
        file_name: urlPath.split('/').pop() || 'image',
        total_bytes: decompressed.length,
        preview_status: 'Live Image Preview Ready on /ds Dashboard'
      },
      mediaInfo,
      decompressedBuffer: decompressed
    };
  }

  if (mediaInfo && mediaInfo.isUnityBundle) {
    return {
      size: rawBuf.length,
      encryption: 'UNITY_FS_ASSET_BUNDLE',
      rawHex,
      rawBase64,
      decryptedHex: decompressed.subarray(0, 64).toString('hex'),
      decoded: {
        bundle_type: 'UnityFS 3D Clothes / Skin / Game Asset Bundle',
        signature: 'UnityFS',
        file_name: urlPath.split('/').pop() || 'bundle',
        total_bytes: decompressed.length
      },
      mediaInfo
    };
  }

  const textAttempt = decompressed.toString('utf8');

  if (
    contentType.includes('application/json') ||
    textAttempt.trim().startsWith('{') ||
    textAttempt.trim().startsWith('[')
  ) {
    try {
      const parsedJson = JSON.parse(textAttempt);
      return {
        size: rawBuf.length,
        encryption: 'PLAINTEXT_JSON',
        rawHex,
        rawBase64,
        decryptedHex: decompressed.toString('hex'),
        decoded: hasQuery ? { _query_params: queryParams, ...parsedJson } : parsedJson,
        mediaInfo: null
      };
    } catch (_) {}
  }

  if (urlPath.toLowerCase().includes('fileinfo') || textAttempt.includes('optionalab_')) {
    const manifest = parseBundleFileInfoManifest(textAttempt, urlPath);
    if (manifest) {
      return {
        size: rawBuf.length,
        encryption: 'BUNDLE_FILEINFO_MANIFEST',
        rawHex,
        rawBase64,
        decryptedHex: decompressed.subarray(0, 512).toString('hex'),
        decoded: manifest,
        mediaInfo: null
      };
    }
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    (textAttempt.includes('=') && textAttempt.includes('&') && /^[\x20-\x7e]+$/.test(textAttempt))
  ) {
    const params = Object.fromEntries(new URLSearchParams(textAttempt).entries());
    const authHeader = headers['authorization'] || headers['Authorization'] || '';
    const hmacCheck = verifyGarenaHmac(authHeader, textAttempt);

    return {
      size: rawBuf.length,
      encryption: hmacCheck ? `FORM_URLENCODED (${hmacCheck.algorithm})` : 'FORM_URLENCODED',
      rawHex,
      rawBase64,
      decryptedHex: decompressed.toString('hex'),
      decoded: { ...(hasQuery ? { _query_params: queryParams } : {}), ...params, _hmac: hmacCheck },
      mediaInfo: null
    };
  }

  const schemaName = resolveSchemaForUrl(urlPath, direction);

  if (decompressed.length >= 16 && decompressed.length % 16 === 0) {
    const aesResult = aesCbcDecryptSmart(decompressed);
    if (aesResult.success) {
      const pb = decodeProtobuf(aesResult.decryptedBuffer, schemaName, 0, true);
      if (pb && pb.cleanDict) {
        updateSessionFromHttpProto(urlPath, direction, pb.cleanDict);
      }
      return {
        size: rawBuf.length,
        encryption: `AES_128_CBC (${aesResult.keyUsed}) + PROTOBUF`,
        rawHex,
        rawBase64,
        decryptedHex: aesResult.decryptedHex,
        decoded: pb
          ? { _schema: pb.schema, _clean: pb.cleanDict, ...pb.fields }
          : { utf8: aesResult.decryptedBuffer.toString('utf8') },
        mediaInfo: null
      };
    }
  }

  const directPb = decodeProtobuf(decompressed, schemaName, 0, true);
  if (directPb && Object.keys(directPb.fields).length > 0) {
    if (directPb.cleanDict) {
      updateSessionFromHttpProto(urlPath, direction, directPb.cleanDict);
    }
    return {
      size: rawBuf.length,
      encryption: `RAW_PROTOBUF (${directPb.schema})`,
      rawHex,
      rawBase64,
      decryptedHex: decompressed.toString('hex'),
      decoded: { _schema: directPb.schema, _clean: directPb.cleanDict, ...directPb.fields },
      mediaInfo: null
    };
  }

  if (/^[\x09\x0a\x0d\x20-\x7e]{4,}$/.test(textAttempt.slice(0, 256))) {
    return {
      size: rawBuf.length,
      encryption: contentType.includes('html') ? 'TEXT_HTML' : 'PLAINTEXT_UTF8',
      rawHex,
      rawBase64,
      decryptedHex: decompressed.subarray(0, 512).toString('hex'),
      decoded: { text_preview: textAttempt.slice(0, 2000) },
      mediaInfo: null
    };
  }

  return {
    size: rawBuf.length,
    encryption: 'BINARY_STREAM',
    rawHex,
    rawBase64,
    decryptedHex: decompressed.subarray(0, 256).toString('hex'),
    decoded: {
      binary_size_bytes: decompressed.length,
      header_hex_64b: decompressed.subarray(0, 64).toString('hex'),
      ascii_preview: decompressed.subarray(0, 120).toString('utf8').replace(/[^\x20-\x7e]/g, '.')
    },
    mediaInfo: null
  };
}

function registerVerPhpBillboardsOnly(data) {
  if (!data || typeof data !== 'object') return;
  if (typeof data.billboard_bg_url === 'string' && data.billboard_bg_url.startsWith('http')) {
    registerBillboardEntry({
      key: 'billboard_bg_url',
      url: data.billboard_bg_url,
      type: '🪧 PK BILLBOARD BACKGROUND IMAGE',
      purpose: 'Startup Billboard / Patch Background PNG (billboard_bg_url)',
      isImage: true
    });
  }
  if (typeof data.patchnote_url === 'string' && data.patchnote_url.startsWith('http')) {
    registerBillboardEntry({
      key: 'patchnote_url',
      url: data.patchnote_url,
      type: '🪧 PK BILLBOARD PATCHNOTE WEB EVENT',
      purpose: 'Billboard Web Event HTML Page (patchnote_url)',
      isImage: false
    });
  }
  if (typeof data.billboard_cdn_url === 'string' && data.billboard_cdn_url.includes('http')) {
    const urls = data.billboard_cdn_url.split(';').map((s) => s.trim()).filter(Boolean);
    urls.forEach((u, idx) => {
      registerBillboardEntry({
        key: `billboard_cdn_url[${idx + 1}]`,
        url: u,
        type: '🪧 PK BILLBOARD CSH PATCH EXTEND',
        purpose: `Pakistan Billboard PatchUpdate Package #${idx + 1} (${u.split('/').pop()})`,
        isImage: false
      });
    });
  }
}

function buildReadOnlyVerPhpMappings(rawBuf, headers = {}, clientHostHeader = '', clientProto = 'http') {
  const discoveredPortMappings = {};
  try {
    const decompressed = decompressBuffer(rawBuf, headers['content-encoding']);
    const text = decompressed.toString('utf8');
    if (text.trim().startsWith('{')) {
      const data = JSON.parse(text);
      registerVerPhpBillboardsOnly(data);
      for (const [k, v] of Object.entries(data)) {
        if (typeof v !== 'string' || !/^https?:\/\//i.test(v)) continue;
        if (k === 'server_url') {
          try {
            sessionState.loginServerUrl = new URL(v).origin;
          } catch (_) {}
        }
        const pathEntry = registerPathRouteForUrl(v, `ver.php [${k}]`, clientHostHeader, clientProto);
        discoveredPortMappings[k] = {
          originalUrl: v,
          rewrittenUrl: v,
          proxyPathUrl: pathEntry ? pathEntry.proxyUrl : buildProxyPathUrl(v, clientHostHeader, clientProto),
          port: pathEntry ? pathEntry.pathRoute : 'DIRECT',
          status: 'MODIFIER_OFF_UNTOUCHED'
        };
      }
    }
  } catch (_) {}
  return discoveredPortMappings;
}

function doesResponseNeedModification(finalUrl) {
  if (!responseModConfig.modifierEnabled) return false;
  const pLower = finalUrl.pathname.toLowerCase();
  if (pLower.endsWith('ver.php')) {
    return true;
  }
  for (const rule of responseModConfig.customRules) {
    if (rule && rule.enabled && rule.urlPattern) {
      if (finalUrl.href.toLowerCase().includes(String(rule.urlPattern).toLowerCase())) {
        return true;
      }
    }
  }
  return false;
}

/**
 * In `--on` mode, processes `/live/ver.php`:
 *  1. Replaces any Brazil (`dl.aw`, `core-aw`, `brnetwork`, `brnbgiuab`) or Astutech (`mainecoonnodex`)
 *     URLs with Pakistan (`PK`) URLs (`dl.gmc`, `core-gmc`, `sgnetwork`, `pkennbgiuab`, `ppmainecoonghj`, `country_code: "PK"`).
 *  2. Syncs `remote_version` to the client's `?version=` parameter so the game never shows Error 400.
 *  3. Rewrites CDN URLs (`cdn_url`, `backup_cdn_url`, `img_cdn_url`, `billboard_bg_url`, `patchnote_url`)
 *     to Single-Port Path Routing (`<scheme>://<host>/px/<proto>/<host>/<path>`) — ZERO extra ports!
 */
function processResponseAndAssignPaths({
  resBuffer,
  resHeaders,
  finalUrl,
  queryParams = {},
  clientHostHeader,
  clientProto = 'http'
}) {
  if (!responseModConfig.modifierEnabled) {
    return {
      wireBuffer: resBuffer,
      discoveredPortMappings: {},
      appliedMods: [],
      modifiedDecoded: null
    };
  }

  const pLower = finalUrl.pathname.toLowerCase();
  const discoveredPortMappings = {};
  const appliedMods = [];

  if (pLower.endsWith('ver.php')) {
    try {
      const decompressed = decompressBuffer(Buffer.from(resBuffer), resHeaders['content-encoding']);
      const rawText = decompressed.toString('utf8');
      if (rawText.trim().startsWith('{')) {
        const data = JSON.parse(rawText);
        const pkTemplate = KEYS.PK_OB55_VER_TEMPLATE || {};
        const usesEscapedSlashes = rawText.includes('\\/');
        const modifiedData = { ...data };

        // 1. Enforce Pakistan (`PK`) URLs instead of Brazil (`BR`) or Astutech (`mainecoonnodex`)!
        if (responseModConfig.forcePakistanCountryCode) {
          const isBrazilOrForeignCdn =
            String(modifiedData.cdn_url || '').includes('dl.aw.') ||
            String(modifiedData.abhotupdate_cdn_url || '').includes('core-aw.') ||
            String(modifiedData.network_log_server || '').includes('brnetwork.') ||
            String(modifiedData.billboard_cdn_url || '').includes('brnbgiuab');

          if (isBrazilOrForeignCdn) {
            modifiedData.cdn_url = pkTemplate.cdn_url || 'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/';
            modifiedData.backup_cdn_url = pkTemplate.backup_cdn_url || 'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/';
            modifiedData.abhotupdate_cdn_url = pkTemplate.abhotupdate_cdn_url || 'https://core-gmc.freefiremobile.com/live/ABHotUpdates/';
            modifiedData.img_cdn_url = pkTemplate.img_cdn_url || 'https://dl.gmc.freefiremobile.com/common/';
            modifiedData.billboard_cdn_url = pkTemplate.billboard_cdn_url;
            modifiedData.network_log_server = pkTemplate.network_log_server || 'https://sgnetwork.ggblueshark.com/';
            modifiedData.appstore_url = pkTemplate.appstore_url || 'http://play.google.com/store/apps/details?id=com.dts.freefiremax';
            modifiedData.backup_appstore_url = pkTemplate.backup_appstore_url || 'http://play.google.com/store/apps/details?id=com.dts.freefireth';
            if (pkTemplate.remote_option_version) {
              modifiedData.remote_option_version = pkTemplate.remote_option_version;
            }
            if (pkTemplate.remote_option_version_astc) {
              modifiedData.remote_option_version_astc = pkTemplate.remote_option_version_astc;
            }
            appliedMods.push('Brazil (BR) URLs -> Pakistan (PK) dl.gmc / core-gmc / pkennbgiuab URLs');
          }

          if (
            String(modifiedData.server_url || '').includes('mainecoonnodex') ||
            String(modifiedData.server_url || '').includes('astute')
          ) {
            modifiedData.server_url = 'https://loginbp.ppmainecoonghj.com/';
            appliedMods.push('server_url: Removed Astutech -> Official PK loginbp.ppmainecoonghj.com');
          }

          if (modifiedData.country_code !== 'PK') {
            const oldCc = modifiedData.country_code || 'BR';
            modifiedData.country_code = 'PK';
            appliedMods.push(`country_code: "${oldCc}" -> "PK"`);
          }
        }

        // 2. Sync `remote_version` to client's `?version=` parameter (prevents Error 400 Store Update popup)
        const clientVer = queryParams.version || '';
        if (
          responseModConfig.syncRemoteVersionToClient &&
          clientVer &&
          modifiedData.remote_version &&
          modifiedData.remote_version !== clientVer
        ) {
          const oldVer = modifiedData.remote_version;
          modifiedData.remote_version = clientVer;
          appliedMods.push(`remote_version: "${oldVer}" -> "${clientVer}"`);
        }

        // 3. Optional hotupdate telemetry toggle
        if (responseModConfig.disableHotupdateTracking && modifiedData.need_track_hotupdate === true) {
          modifiedData.need_track_hotupdate = false;
          appliedMods.push('need_track_hotupdate -> false');
        }

        registerVerPhpBillboardsOnly(modifiedData);

        // 4. Rewrite CDN URLs to Single-Port Path Routes (`/px/https/<host>/<path>`) — Zero Multi-Ports!
        for (const [k, v] of Object.entries({ ...modifiedData })) {
          if (typeof v !== 'string' || !/^https?:\/\//i.test(v)) continue;

          if (k === 'server_url') {
            try {
              sessionState.loginServerUrl = new URL(v).origin;
            } catch (_) {}
          }

          if (v.includes(';')) {
            const parts = v.split(';').map((s) => s.trim()).filter(Boolean);
            const mappedParts = parts.map((singleUrl) => {
              registerPathRouteForUrl(singleUrl, `PK ver.php [${k}]`, clientHostHeader, clientProto);
              return buildProxyPathUrl(singleUrl, clientHostHeader, clientProto);
            });
            const joinedProxyUrls = mappedParts.join(';');

            if (responseModConfig.redirectCdnUrlsToPorts && responseModConfig.routeAllVerUrlsViaPaths) {
              modifiedData[k] = joinedProxyUrls;
              discoveredPortMappings[k] = {
                originalUrl: v,
                rewrittenUrl: joinedProxyUrls,
                proxyPathUrl: joinedProxyUrls,
                port: '/px/... (Multi-URL Path Route)',
                status: 'PATH_ROUTED_SINGLE_PORT'
              };
              appliedMods.push(`${k} -> /px/...`);
            } else {
              discoveredPortMappings[k] = {
                originalUrl: v,
                rewrittenUrl: v,
                proxyPathUrl: joinedProxyUrls,
                port: '/px/... (Available Path)',
                status: 'DIRECT_PK_HTTPS'
              };
            }
            continue;
          }

          const pathEntry = registerPathRouteForUrl(v, `PK ver.php [${k}]`, clientHostHeader, clientProto);
          const proxyPathUrl = pathEntry ? pathEntry.proxyUrl : buildProxyPathUrl(v, clientHostHeader, clientProto);
          const shouldRewriteToPath =
            responseModConfig.redirectCdnUrlsToPorts &&
            !PROTECTED_AUTH_KEYS.has(k) &&
            (DEFAULT_PATH_ROUTED_VER_KEYS.has(k) || responseModConfig.routeAllVerUrlsViaPaths);

          if (shouldRewriteToPath) {
            modifiedData[k] = proxyPathUrl;
            discoveredPortMappings[k] = {
              originalUrl: v,
              rewrittenUrl: proxyPathUrl,
              proxyPathUrl,
              port: pathEntry ? pathEntry.pathRoute : '/px/...',
              status: `PATH_ROUTED (${pathEntry ? pathEntry.pathRoute : '/px/...'})`
            };
            appliedMods.push(`${k} -> ${proxyPathUrl}`);
          } else {
            discoveredPortMappings[k] = {
              originalUrl: v,
              rewrittenUrl: v,
              proxyPathUrl,
              port: pathEntry ? pathEntry.pathRoute : 'DIRECT',
              status: 'DIRECT_PK_HTTPS'
            };
          }
        }

        if (responseModConfig.verJsonOverrides && Object.keys(responseModConfig.verJsonOverrides).length > 0) {
          for (const [k, v] of Object.entries(responseModConfig.verJsonOverrides)) {
            modifiedData[k] = v;
            appliedMods.push(`ver.php override: ${k}`);
          }
        }

        if (appliedMods.length === 0) {
          return {
            wireBuffer: resBuffer,
            discoveredPortMappings,
            appliedMods: [],
            modifiedDecoded: data
          };
        }

        let outText = JSON.stringify(modifiedData);
        if (usesEscapedSlashes) {
          outText = outText.replace(/\//g, '\\/');
        }
        const newJsonBuf = Buffer.from(outText, 'utf8');
        const newWireBuf = recompressLikeOriginal(newJsonBuf, resHeaders['content-encoding']);
        return {
          wireBuffer: newWireBuf,
          discoveredPortMappings,
          appliedMods,
          modifiedDecoded: modifiedData
        };
      }
    } catch (_) {}
  }

  let currentBuf = resBuffer;
  let wasModified = false;
  for (const rule of responseModConfig.customRules) {
    if (!rule || !rule.enabled || !rule.urlPattern) continue;
    if (!finalUrl.href.toLowerCase().includes(String(rule.urlPattern).toLowerCase())) continue;

    try {
      const decompressed = decompressBuffer(Buffer.from(currentBuf), resHeaders['content-encoding']);
      if (rule.type === 'JSON_MERGE') {
        const obj = JSON.parse(decompressed.toString('utf8'));
        const patch = typeof rule.replace === 'string' ? JSON.parse(rule.replace) : rule.replace;
        Object.assign(obj, patch);
        const outPlain = Buffer.from(JSON.stringify(obj), 'utf8');
        currentBuf = recompressLikeOriginal(outPlain, resHeaders['content-encoding']);
        wasModified = true;
        appliedMods.push(`Rule [${rule.description || rule.urlPattern}]: JSON_MERGE`);
      } else if (rule.type === 'TEXT_REPLACE' && rule.search) {
        const str = decompressed.toString('utf8');
        if (str.includes(rule.search)) {
          const outPlain = Buffer.from(str.split(rule.search).join(rule.replace || ''), 'utf8');
          currentBuf = recompressLikeOriginal(outPlain, resHeaders['content-encoding']);
          wasModified = true;
          appliedMods.push(`Rule [${rule.description || rule.urlPattern}]: TEXT_REPLACE`);
        }
      } else if (rule.type === 'HEX_REPLACE' && rule.search) {
        const hexStr = decompressed.toString('hex');
        const sHex = String(rule.search).replace(/\s+/g, '').toLowerCase();
        const rHex = String(rule.replace || '').replace(/\s+/g, '').toLowerCase();
        if (hexStr.includes(sHex) && sHex.length % 2 === 0 && rHex.length % 2 === 0) {
          const outPlain = Buffer.from(hexStr.split(sHex).join(rHex), 'hex');
          currentBuf = recompressLikeOriginal(outPlain, resHeaders['content-encoding']);
          wasModified = true;
          appliedMods.push(`Rule [${rule.description || rule.urlPattern}]: HEX_REPLACE`);
        }
      } else if (rule.type === 'PROTOBUF_OVERRIDE') {
        const schemaName = rule.schema || resolveSchemaForUrl(finalUrl.pathname, 'RESPONSE') || 'AccountPersonalShowInfo';
        const aesRes = aesCbcDecryptSmart(decompressed);
        const rawProto = aesRes.success ? aesRes.decryptedBuffer : decompressed;
        const decoded = decodeProtobuf(rawProto, schemaName, 0, true);
        if (decoded && decoded.cleanDict) {
          const patch = typeof rule.replace === 'string' ? JSON.parse(rule.replace) : rule.replace;
          const merged = { ...decoded.cleanDict, ...patch };
          const reencoded = encodeProtobuf(merged, schemaName);
          const outBuf = aesRes.success ? aesCbcEncrypt(reencoded) : reencoded;
          currentBuf = recompressLikeOriginal(outBuf, resHeaders['content-encoding']);
          wasModified = true;
          appliedMods.push(`Rule [${rule.description || rule.urlPattern}]: PROTOBUF_OVERRIDE (${schemaName})`);
        }
      }
    } catch (_) {}
  }

  return {
    wireBuffer: wasModified ? currentBuf : resBuffer,
    discoveredPortMappings,
    appliedMods,
    modifiedDecoded: null
  };
}

function recompressLikeOriginal(plainBuf, encoding = '') {
  const enc = String(encoding || '').toLowerCase();
  if (enc.includes('gzip')) return zlib.gzipSync(plainBuf);
  if (enc.includes('deflate')) return zlib.deflateSync(plainBuf);
  return plainBuf;
}

/**
 * Resolves upstream candidates (PAKISTAN `PK` #1 PRIORITY — ZERO ASTUTECH REDIRECTION!):
 *  1. If request path starts with `/px/<proto>/<host>/<path>` or `/__u__/<proto>/<host>/<path>`:
 *     Unpacks the exact target URL (`<proto>://<host>/<path>`) + adds Pakistan/Global CDN fallbacks!
 *  2. If an explicit external URL or `X-Target-Url` header was sent: uses that URL first.
 *  3. Otherwise: Routes to Pakistan (`PK`) #1 Priority Servers (`version.ggwhitehawk.com`,
 *     `dl.gmc.freefiremobile.com`, `core-gmc.freefiremobile.com`, `loginbp.ppmainecoonghj.com`,
 *     `clientbp.ppmainecoonghj.com`).
 */
function resolveUpstreamCandidates(reqUrlStr = '/', headers = {}) {
  // 1. Check `/px/<proto>/<host>/<path>` or `/__u__/<proto>/<host>/<path>`
  const pxMatch = reqUrlStr.match(/^\/(?:px|__u__|__p__)\/(https?)\/([^/]+)(\/.*)?$/i);
  if (pxMatch) {
    const proto = pxMatch[1].toLowerCase();
    const host = pxMatch[2];
    const restPath = pxMatch[3] || '/';
    const primary = `${proto}://${host}${restPath}`;
    const list = [primary];
    if (restPath.toLowerCase().startsWith('/live/abhotupdates/')) {
      for (const mirror of [
        'https://dl.gmc.freefiremobile.com',
        'https://core-gmc.freefiremobile.com',
        'https://dl.dir.freefiremobile.com',
        'https://dl.bs.freefiremobile.com',
        'https://dl.aw.freefiremobile.com'
      ]) {
        const cand = `${mirror}${restPath}`;
        if (!list.includes(cand)) list.push(cand);
      }
    }
    return list;
  }

  // Also support `/px/<host>/<path>` (defaults to https)
  const pxShortMatch = reqUrlStr.match(/^\/px\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?::\d+)?)(\/.*)?$/i);
  if (pxShortMatch) {
    const restPath = pxShortMatch[2] || '/';
    return [`https://${pxShortMatch[1]}${restPath}`];
  }

  const rawHost = headers['x-target-url'] || headers['x-upstream-host'] || headers['host'] || '';
  if (/^https?:\/\//i.test(reqUrlStr)) {
    try {
      const parsed = new URL(reqUrlStr);
      if (!isProxySelfHost(parsed.host)) {
        return [parsed.href];
      }
      return buildPakistanPriorityCandidates(parsed.pathname, parsed.search, null);
    } catch (_) {}
  }

  let pathname = reqUrlStr;
  let search = '';
  const qIdx = reqUrlStr.indexOf('?');
  if (qIdx !== -1) {
    pathname = reqUrlStr.slice(0, qIdx);
    search = reqUrlStr.slice(qIdx);
  }
  if (!pathname.startsWith('/')) pathname = '/' + pathname;

  const preferredOrigin = !isProxySelfHost(rawHost)
    ? (rawHost.startsWith('http') ? rawHost : `https://${rawHost}`)
    : null;

  return buildPakistanPriorityCandidates(pathname, search, preferredOrigin);
}

function buildPakistanPriorityCandidates(pathname, search, preferredOrigin = null) {
  const candidates = [];
  const addCandidate = (u) => {
    if (u && !candidates.includes(u)) candidates.push(u);
  };

  if (preferredOrigin) {
    addCandidate(`${preferredOrigin.replace(/\/$/, '')}${pathname}${search}`);
  }

  const pLower = pathname.toLowerCase();

  // 1. Version & Server Config (`/live/ver.php` or `/ver.php`) — Force Pakistan `region=PK&lang=en` query if enabled!
  if (pLower === '/ver.php' || pLower.endsWith('/ver.php')) {
    let effectiveSearch = search || '';
    if (responseModConfig.forcePakistanCountryCode && effectiveSearch) {
      try {
        const sp = new URLSearchParams(effectiveSearch.startsWith('?') ? effectiveSearch.slice(1) : effectiveSearch);
        if (sp.has('region') && sp.get('region') !== 'PK') sp.set('region', 'PK');
        if (sp.has('lang') && sp.get('lang') === 'pt') sp.set('lang', 'en');
        effectiveSearch = '?' + sp.toString();
      } catch (_) {}
    } else if (responseModConfig.forcePakistanCountryCode && !effectiveSearch) {
      effectiveSearch = '?region=PK&lang=en&device=android&release_version=OB55';
    }
    addCandidate(`https://version.ggwhitehawk.com/live/ver.php${effectiveSearch}`);
    addCandidate(`https://version.ggpolarbear.com/live/ver.php${effectiveSearch}`);
    addCandidate(`https://version.ggblueshark.com/live/ver.php${effectiveSearch}`);
    addCandidate(`https://version.common.freefiremobile.com/live/ver.php${effectiveSearch}`);
    return candidates;
  }

  // 2. Discovered path prefixes
  for (const [prefix, origin] of discoveredPathPrefixMap.entries()) {
    if (pLower.startsWith(prefix)) {
      addCandidate(`${origin.replace(/\/$/, '')}${pathname}${search}`);
    }
  }

  // 3. Clothes, Default Guest Bundles & ASTC Icons — Pakistan (`dl.gmc`) #1 Priority
  if (pLower.includes('iconcdn') || pLower.endsWith('.astc') || pLower.includes('/optional/')) {
    addCandidate(`https://dl.gmc.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://core-gmc.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.dir.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.bs.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.aw.freefiremobile.com${pathname}${search}`);
    return candidates;
  }

  // 4. Billboard Background Images
  if (pLower.includes('patch_bg') || pLower.includes('ob23/version')) {
    addCandidate(`https://dl.cdn.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.gmc.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.dir.freefiremobile.com${pathname}${search}`);
    return candidates;
  }

  // 5. Billboard Patchnotes & CSH Patchupdate Extensions
  if (pLower.includes('web_event') || pLower.includes('/csh/patchupdate') || pLower.includes('/csh/patchnote')) {
    addCandidate(`https://cdn.wildflamestudio.com${pathname}${search}`);
    addCandidate(`https://dl.dir.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.cdn.freefiremobile.com${pathname}${search}`);
    return candidates;
  }

  // 6. All HotUpdate & Common Assets — Pakistan (`dl.gmc` & `core-gmc`) #1 Priority
  if (pLower.startsWith('/live/abhotupdates') || pLower.startsWith('/common/')) {
    if (/\/\d+\.\d+\.\d+\//.test(pLower)) {
      addCandidate(`https://core-gmc.freefiremobile.com${pathname}${search}`);
      addCandidate(`https://dl.gmc.freefiremobile.com${pathname}${search}`);
    } else {
      addCandidate(`https://dl.gmc.freefiremobile.com${pathname}${search}`);
      addCandidate(`https://core-gmc.freefiremobile.com${pathname}${search}`);
    }
    addCandidate(`https://dl.dir.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.cdn.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://cdn.wildflamestudio.com${pathname}${search}`);
    addCandidate(`https://dl-sg-production.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.bs.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://core-bs.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.aw.freefiremobile.com${pathname}${search}`);
    return candidates;
  }

  // 7. Garena OAuth / Guest Token Grant
  if (pLower.includes('oauth') || pLower.includes('token:grant') || pLower.includes('guest:register')) {
    addCandidate(`https://100067.connect.garena.com${pathname}${search}`);
    return candidates;
  }

  // 8. Login & Auth (`MajorLogin`, `MajorRegister`, `ChooseNewbieChoice`) — Pakistan (`ppmainecoonghj`) #1 Priority
  if (
    pLower.includes('/majorlogin') ||
    pLower.includes('/majorregister') ||
    pLower.includes('/choosenewbiechoice') ||
    pLower === '/ping'
  ) {
    if (sessionState.loginServerUrl) {
      addCandidate(`${sessionState.loginServerUrl.replace(/\/$/, '')}${pathname}${search}`);
    }
    addCandidate(`https://loginbp.ppmainecoonghj.com${pathname}${search}`); // #1 Pakistan (PK)
    addCandidate(`https://loginbp.ggpolarbear.com${pathname}${search}`);    // #2 PK / Global MAX
    addCandidate(`https://loginbp.ggblueshark.com${pathname}${search}`);    // #3 SG / BD / ME
    return candidates;
  }

  // 9. Lobby, Outfit, Profile & Game API — Pakistan (`clientbp.ppmainecoonghj.com`) #1 Priority
  if (sessionState.serverUrl) {
    addCandidate(`${sessionState.serverUrl.replace(/\/$/, '')}${pathname}${search}`);
  }
  addCandidate(`https://clientbp.ppmainecoonghj.com${pathname}${search}`); // #1 Pakistan (PK) Primary
  addCandidate(`https://clientbp.ggpolarbear.com${pathname}${search}`);    // #2 Pakistan / SG / BD / ME / Global MAX
  addCandidate(`https://clientbp.ggblueshark.com${pathname}${search}`);    // #3 SG / SEA / Global
  addCandidate(`https://client.us.freefiremobile.com${pathname}${search}`); // #4 Brazil (BR) / US / SAC / NA
  addCandidate(`https://client.ru.freefiremobile.com${pathname}${search}`); // #5 Europe (EU) / CIS / ME
  return candidates;
}

function buildStealthRequestHeaders(clientReq, targetHost, isVerPhp = false) {
  const out = {};
  const raw = clientReq.rawHeaders || [];
  const skip = new Set([
    'host',
    'proxy-connection',
    'proxy-authorization',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-vercel-id',
    'x-vercel-deployment-url',
    'x-vercel-forwarded-for',
    'x-matched-path',
    'x-now-route-matches',
    'via',
    'x-target-url',
    'x-upstream-host',
    'x-omni-mock',
    'expect'
  ]);

  out['Host'] = targetHost;
  for (let i = 0; i + 1 < raw.length; i += 2) {
    const k = raw[i];
    const v = raw[i + 1];
    if (skip.has(k.toLowerCase())) continue;
    out[k] = v;
  }
  if (Object.keys(out).length <= 1 && clientReq.headers) {
    for (const [k, v] of Object.entries(clientReq.headers)) {
      if (skip.has(k.toLowerCase())) continue;
      out[k] = v;
    }
  }

  if (isVerPhp && responseModConfig.forcePakistanCountryCode) {
    out['X-Forwarded-For'] = KEYS.GARENA_OAUTH?.PAKISTAN_GEO_IP || '39.42.100.10';
    out['CF-IPCountry'] = responseModConfig.priorityRegion || 'PK';
  }
  return out;
}

function buildCleanResponseHeaders(proxyResHeaders, newByteLength = null) {
  const clean = {};
  const skip = new Set([
    'proxy-authenticate',
    'proxy-authorization',
    'upgrade'
  ]);

  const isModifiedLength = newByteLength !== null && newByteLength !== undefined;

  for (const [k, v] of Object.entries(proxyResHeaders || {})) {
    const kLower = k.toLowerCase();
    if (skip.has(kLower)) continue;
    if (kLower === 'content-length') {
      if (!isModifiedLength) {
        clean['Content-Length'] = String(v);
      }
      continue;
    }
    if (kLower === 'transfer-encoding' && isModifiedLength) {
      continue;
    }
    clean[k] = v;
  }

  if (isModifiedLength) {
    clean['Content-Length'] = String(newByteLength);
  }
  return clean;
}

function createHttpHandler({ fixedPort = 8080, onPacket }) {
  return (clientReq, clientRes) => {
    const startTime = Date.now();
    const reqChunks = [];

    clientReq.on('data', (chunk) => reqChunks.push(chunk));
    clientReq.on('end', () => {
      const reqBuffer = Buffer.concat(reqChunks);
      const clientHostHeader =
        clientReq.headers['x-forwarded-host'] ||
        clientReq.headers['host'] ||
        `${getPrimaryDeviceIp()}:${fixedPort}`;
      const clientProto = clientReq.headers['x-forwarded-proto'] || 'http';
      const incomingClientPath = clientReq.url || '/';

      const candidates = resolveUpstreamCandidates(incomingClientPath, clientReq.headers);
      const primaryUrl = new URL(candidates[0]);
      const queryParams = Object.fromEntries(primaryUrl.searchParams.entries());
      const activeMode = responseModConfig.modifierEnabled ? 'ON' : 'OFF';

      let candIdx = 1;
      const redirectChain = [];

      function serveBuiltInPkVerFallback() {
        const pkData = { ...(KEYS.PK_OB55_VER_TEMPLATE || {}) };
        if (queryParams.version && responseModConfig.syncRemoteVersionToClient) {
          pkData.remote_version = queryParams.version;
        }
        const rawJsonBuf = Buffer.from(JSON.stringify(pkData).replace(/\//g, '\\/'), 'utf8');
        const fakeHeaders = { 'content-type': 'application/octet-stream' };
        const {
          wireBuffer,
          discoveredPortMappings,
          appliedMods,
          modifiedDecoded
        } = processResponseAndAssignPaths({
          resBuffer: rawJsonBuf,
          resHeaders: fakeHeaders,
          finalUrl: primaryUrl,
          queryParams,
          clientHostHeader,
          clientProto
        });
        const outBuf = responseModConfig.modifierEnabled ? wireBuffer : rawJsonBuf;
        clientRes.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(outBuf.length),
          'Access-Control-Allow-Origin': '*'
        });
        clientRes.end(outBuf);

        if (typeof onPacket === 'function') {
          onPacket({
            id: `HTTP-${Date.now()}-PKFALLBACK`,
            timestamp: new Date().toISOString(),
            protocol: 'HTTP',
            modifierMode: activeMode,
            wasModified: appliedMods.length > 0,
            appliedMods,
            originalSize: rawJsonBuf.length,
            sentWireSize: outBuf.length,
            originalSha256: sha256Short(rawJsonBuf),
            sentWireSha256: sha256Short(outBuf),
            capturedPort: fixedPort,
            proxyPathRoute: '/live/ver.php',
            proxyPathUrl: buildProxyPathUrl(primaryUrl.href, clientHostHeader, clientProto),
            incomingClientPath,
            direction: 'CLIENT <-> PK_PROXY <-> PK_VER_TEMPLATE',
            method: clientReq.method,
            host: primaryUrl.host,
            path: primaryUrl.pathname + primaryUrl.search,
            fullUrl: primaryUrl.href,
            statusCode: 200,
            durationMs: Date.now() - startTime,
            passthroughMode: 'PK_OB55_DIRECT_TEMPLATE',
            urlMeta: classifyUrlPurpose(primaryUrl.href, primaryUrl.pathname, 'application/json'),
            discoveredPortMappings,
            requestTitle: `[PK-PATH :${fixedPort}] [MOD:${activeMode}] ${clientReq.method} ${primaryUrl.href}`,
            responseTitle: `200 <- PK_OB55_VER_TEMPLATE`,
            request: { headers: clientReq.headers, size: 0, encryption: 'NONE', decoded: { _query_params: queryParams } },
            response: { headers: fakeHeaders, size: outBuf.length, encryption: 'PLAINTEXT_JSON', decoded: modifiedDecoded || pkData }
          });
        }
      }

      function attemptUpstream(targetUrlStr, redirectsLeft) {
        let parsedUrl;
        try {
          parsedUrl = new URL(targetUrlStr);
        } catch (e) {
          if (candIdx < candidates.length) return attemptUpstream(candidates[candIdx++], 6);
          if (primaryUrl.pathname.toLowerCase().endsWith('ver.php')) return serveBuiltInPkVerFallback();
          clientRes.writeHead(502, { 'Content-Type': 'application/json' });
          clientRes.end(JSON.stringify({ error: e.message }));
          return;
        }

        const isHttps = parsedUrl.protocol === 'https:';
        const transport = isHttps ? https : http;
        const isVerPhp = parsedUrl.pathname.toLowerCase().endsWith('ver.php');
        const forwardHeaders = buildStealthRequestHeaders(clientReq, parsedUrl.host, isVerPhp);
        if (reqBuffer && reqBuffer.length > 0) {
          forwardHeaders['Content-Length'] = String(reqBuffer.length);
        }

        const reqOpts = {
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: clientReq.method,
          headers: forwardHeaders,
          agent: isHttps ? keepAliveHttpsAgent : keepAliveHttpAgent,
          servername: parsedUrl.hostname,
          rejectUnauthorized: false,
          timeout: 20000
        };

        const proxyReq = transport.request(reqOpts, (proxyRes) => {
          const status = proxyRes.statusCode || 200;

          if ([301, 302, 303, 307, 308].includes(status) && proxyRes.headers.location) {
            const nextUrl = new URL(proxyRes.headers.location, parsedUrl.href).href;
            const proxyPathUrl = buildProxyPathUrl(nextUrl, clientHostHeader, clientProto);
            const pathEntry = registerPathRouteForUrl(
              nextUrl,
              `Redirect Target from ${parsedUrl.host}${parsedUrl.pathname}`,
              clientHostHeader,
              clientProto
            );

            const redirectRecord = {
              hop: redirectChain.length + 1,
              from: parsedUrl.href,
              to: nextUrl,
              proxyPathUrl,
              pathRoute: pathEntry ? pathEntry.pathRoute : '/px/...',
              status,
              timestamp: new Date().toISOString()
            };
            redirectChain.push(redirectRecord);
            discoveredRedirects.unshift(redirectRecord);
            if (discoveredRedirects.length > 200) discoveredRedirects.pop();

            if (responseModConfig.rewriteRedirectLocationToPath || redirectsLeft <= 0) {
              proxyRes.resume();
              const redirHeaders = buildCleanResponseHeaders(proxyRes.headers, 0);
              redirHeaders['Location'] = proxyPathUrl;
              clientRes.writeHead(status, redirHeaders);
              clientRes.end();
              return;
            }

            proxyRes.resume();
            return attemptUpstream(nextUrl, redirectsLeft - 1);
          }

          if ([403, 404, 502, 503, 504].includes(status) && candIdx < candidates.length) {
            proxyRes.resume();
            return attemptUpstream(candidates[candIdx++], 6);
          }

          const routeEntry = registerPathRouteForUrl(
            parsedUrl.href,
            `PK Route (${parsedUrl.host})`,
            clientHostHeader,
            clientProto
          );
          const needsMod = doesResponseNeedModification(parsedUrl);

          // FAST STREAMING PATH (All normal responses & `--off` mode):
          if (!needsMod) {
            const streamHeaders = buildCleanResponseHeaders(proxyRes.headers, null);
            clientRes.writeHead(status, streamHeaders);

            const capturedChunks = [];
            let totalBytes = 0;

            proxyRes.on('data', (chunk) => {
              clientRes.write(chunk);
              totalBytes += chunk.length;
              if (totalBytes <= 512 * 1024) {
                capturedChunks.push(chunk);
              }
            });

            proxyRes.on('end', () => {
              clientRes.end();
              const durationMs = Date.now() - startTime;

              setImmediate(() => {
                try {
                  const packetId = `HTTP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                  const capturedBuf = Buffer.concat(capturedChunks);
                  const wireHash = sha256Short(capturedBuf);

                  let discoveredPortMappings = {};
                  if (parsedUrl.pathname.toLowerCase().endsWith('ver.php')) {
                    discoveredPortMappings = buildReadOnlyVerPhpMappings(
                      capturedBuf,
                      proxyRes.headers,
                      clientHostHeader,
                      clientProto
                    );
                  }

                  const reqAnalysis = inspectHttpBody(reqBuffer, clientReq.headers, parsedUrl.pathname, 'REQUEST', queryParams);
                  const resAnalysis =
                    totalBytes <= 512 * 1024
                      ? inspectHttpBody(capturedBuf, proxyRes.headers, parsedUrl.pathname, 'RESPONSE')
                      : {
                          size: totalBytes,
                          encryption: 'STREAMED_LARGE_ASSET_BUNDLE',
                          rawHex: capturedBuf.subarray(0, 256).toString('hex') + `... (${totalBytes} bytes streamed)`,
                          rawBase64: '',
                          decryptedHex: '',
                          decoded: {
                            streamed_bytes: totalBytes,
                            note: 'Streamed directly through Single-Port Path Router with zero buffering'
                          },
                          mediaInfo: inspectBinaryMediaOrAstc(capturedBuf.subarray(0, 256), parsedUrl.pathname, proxyRes.headers['content-type'])
                        };

                  const urlMeta = classifyUrlPurpose(parsedUrl.href, parsedUrl.pathname, proxyRes.headers['content-type']);

                  if (resAnalysis.mediaInfo && resAnalysis.decompressedBuffer) {
                    cacheMediaBuffer(
                      packetId,
                      resAnalysis.decompressedBuffer,
                      resAnalysis.mediaInfo.mediaFormat,
                      resAnalysis.mediaInfo,
                      parsedUrl.href
                    );
                  }

                  if (urlMeta.isBillboard) {
                    registerBillboardEntry({
                      key: parsedUrl.pathname.split('/').pop() || 'billboard',
                      url: parsedUrl.href,
                      packetId,
                      type: urlMeta.badge,
                      badge: urlMeta.badge,
                      purpose: urlMeta.purpose,
                      statusCode: status,
                      size: totalBytes,
                      hasMediaPreview: Boolean(resAnalysis.mediaInfo && (resAnalysis.mediaInfo.isAstc || resAnalysis.mediaInfo.isImage)),
                      mediaFormat: resAnalysis.mediaInfo ? resAnalysis.mediaInfo.mediaFormat : null
                    });
                  }

                  delete resAnalysis.decompressedBuffer;

                  const packetEvent = {
                    id: packetId,
                    timestamp: new Date().toISOString(),
                    protocol: 'HTTP',
                    modifierMode: activeMode,
                    wasModified: false,
                    appliedMods: [],
                    originalSize: totalBytes,
                    sentWireSize: totalBytes,
                    originalSha256: wireHash,
                    sentWireSha256: wireHash,
                    capturedPort: fixedPort,
                    proxyPathRoute: routeEntry ? routeEntry.pathRoute : incomingClientPath,
                    proxyPathUrl: routeEntry ? routeEntry.proxyUrl : buildProxyPathUrl(parsedUrl.href, clientHostHeader, clientProto),
                    incomingClientPath,
                    direction: 'CLIENT <-> PK_PATH_ROUTER <-> UPSTREAM',
                    method: clientReq.method,
                    host: parsedUrl.host,
                    path: parsedUrl.pathname + parsedUrl.search,
                    fullUrl: parsedUrl.href,
                    initialUrl: primaryUrl.href,
                    statusCode: status,
                    durationMs,
                    passthroughMode:
                      redirectChain.length > 0
                        ? `PK_FOLLOWED_REDIRECT (${redirectChain.length} Hop(s) -> ${parsedUrl.host})`
                        : activeMode === 'OFF'
                          ? 'MODIFIER_OFF_100%_NORMAL_PASSTHROUGH'
                          : 'ZERO_LATENCY_PK_PATH_STREAM',
                    urlMeta,
                    hasMediaPreview: Boolean(resAnalysis.mediaInfo && (resAnalysis.mediaInfo.isAstc || resAnalysis.mediaInfo.isImage)),
                    mediaFormat: resAnalysis.mediaInfo ? resAnalysis.mediaInfo.mediaFormat : null,
                    astcMeta: resAnalysis.mediaInfo ? resAnalysis.mediaInfo.astcMeta : null,
                    redirectChain,
                    discoveredPortMappings,
                    requestTitle: `[PK-PATH :${fixedPort}] [MOD:${activeMode}] ${clientReq.method} ${parsedUrl.href}`,
                    responseTitle: `${status} <- ${parsedUrl.host}${parsedUrl.pathname}`,
                    request: {
                      headers: forwardHeaders,
                      ...reqAnalysis
                    },
                    response: {
                      headers: streamHeaders,
                      ...resAnalysis
                    }
                  };

                  if (typeof onPacket === 'function') {
                    onPacket(packetEvent);
                  }
                } catch (_) {}
              });
            });
            return;
          }

          // PATH-REWRITING / MODIFICATION PATH (`/live/ver.php` or matching custom rule when `--on` is active):
          const resChunks = [];
          proxyRes.on('data', (chunk) => resChunks.push(chunk));
          proxyRes.on('end', () => {
            const origResBuffer = Buffer.concat(resChunks);
            const durationMs = Date.now() - startTime;

            const {
              wireBuffer,
              discoveredPortMappings,
              appliedMods,
              modifiedDecoded
            } = processResponseAndAssignPaths({
              resBuffer: origResBuffer,
              resHeaders: proxyRes.headers,
              finalUrl: parsedUrl,
              queryParams,
              clientHostHeader,
              clientProto
            });

            const wasModified = appliedMods.length > 0;
            const cleanHeaders = buildCleanResponseHeaders(
              proxyRes.headers,
              wasModified ? wireBuffer.length : null
            );

            clientRes.writeHead(status, cleanHeaders);
            clientRes.end(wireBuffer);

            setImmediate(() => {
              try {
                const packetId = `HTTP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                const reqAnalysis = inspectHttpBody(reqBuffer, clientReq.headers, parsedUrl.pathname, 'REQUEST', queryParams);
                const origAnalysis = inspectHttpBody(origResBuffer, proxyRes.headers, parsedUrl.pathname, 'RESPONSE');
                const sentAnalysis = wasModified
                  ? inspectHttpBody(wireBuffer, proxyRes.headers, parsedUrl.pathname, 'RESPONSE')
                  : origAnalysis;

                if (modifiedDecoded && sentAnalysis) {
                  sentAnalysis.decoded = modifiedDecoded;
                }

                const urlMeta = classifyUrlPurpose(parsedUrl.href, parsedUrl.pathname, proxyRes.headers['content-type']);

                if (sentAnalysis.mediaInfo && sentAnalysis.decompressedBuffer) {
                  cacheMediaBuffer(
                    packetId,
                    sentAnalysis.decompressedBuffer,
                    sentAnalysis.mediaInfo.mediaFormat,
                    sentAnalysis.mediaInfo,
                    parsedUrl.href
                  );
                }

                delete origAnalysis.decompressedBuffer;
                delete sentAnalysis.decompressedBuffer;

                const packetEvent = {
                  id: packetId,
                  timestamp: new Date().toISOString(),
                  protocol: 'HTTP',
                  modifierMode: activeMode,
                  wasModified,
                  appliedMods,
                  originalSize: origResBuffer.length,
                  sentWireSize: wireBuffer.length,
                  originalSha256: sha256Short(origResBuffer),
                  sentWireSha256: sha256Short(wireBuffer),
                  originalDecoded: origAnalysis.decoded,
                  capturedPort: fixedPort,
                  proxyPathRoute: routeEntry ? routeEntry.pathRoute : incomingClientPath,
                  proxyPathUrl: routeEntry ? routeEntry.proxyUrl : buildProxyPathUrl(parsedUrl.href, clientHostHeader, clientProto),
                  incomingClientPath,
                  direction: 'CLIENT <-> PK_PATH_ROUTER <-> UPSTREAM',
                  method: clientReq.method,
                  host: parsedUrl.host,
                  path: parsedUrl.pathname + parsedUrl.search,
                  fullUrl: parsedUrl.href,
                  initialUrl: primaryUrl.href,
                  statusCode: status,
                  durationMs,
                  passthroughMode: wasModified
                    ? `PK_PATH_ROUTED (${appliedMods.join(', ')})`
                    : 'ZERO_LATENCY_PK_PASSTHROUGH (0 Bytes Modified)',
                  urlMeta,
                  hasMediaPreview: Boolean(sentAnalysis.mediaInfo && (sentAnalysis.mediaInfo.isAstc || sentAnalysis.mediaInfo.isImage)),
                  mediaFormat: sentAnalysis.mediaInfo ? sentAnalysis.mediaInfo.mediaFormat : null,
                  astcMeta: sentAnalysis.mediaInfo ? sentAnalysis.mediaInfo.astcMeta : null,
                  redirectChain,
                  discoveredPortMappings,
                  requestTitle: `[PK-PATH :${fixedPort}] [MOD:${activeMode}] ${clientReq.method} ${parsedUrl.href}`,
                  responseTitle: `${status} <- ${parsedUrl.host}${parsedUrl.pathname}`,
                  request: {
                    headers: forwardHeaders,
                    ...reqAnalysis
                  },
                  response: {
                    headers: cleanHeaders,
                    ...sentAnalysis
                  }
                };

                if (typeof onPacket === 'function') {
                  onPacket(packetEvent);
                }
              } catch (_) {}
            });
          });
        });

        proxyReq.on('timeout', () => {
          proxyReq.destroy(new Error('Upstream Timeout'));
        });

        proxyReq.on('error', (err) => {
          if (candIdx < candidates.length) {
            return attemptUpstream(candidates[candIdx++], 6);
          }
          if (primaryUrl.pathname.toLowerCase().endsWith('ver.php')) {
            return serveBuiltInPkVerFallback();
          }
          if (!clientRes.headersSent) {
            clientRes.writeHead(502, { 'Content-Type': 'application/json' });
            clientRes.end(JSON.stringify({ error: 'Upstream Proxy Error', message: err.message, target: parsedUrl.href }));
          }
        });

        if (reqBuffer && reqBuffer.length > 0) {
          proxyReq.write(reqBuffer);
        }
        proxyReq.end();
      }

      attemptUpstream(candidates[0], 6);
    });
  };
}

function fetchRemoteUrlDirectly(targetUrlStr, redirectsLeft = 5) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(targetUrlStr);
      const isHttps = parsed.protocol === 'https:';
      const transport = isHttps ? https : http;
      const req = transport.request(
        {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port || (isHttps ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: 'GET',
          headers: {
            Host: parsed.host,
            'User-Agent': KEYS.GARENA_OAUTH.UNITY_USER_AGENT_2018,
            Accept: '*/*',
            'Accept-Encoding': 'gzip, deflate'
          },
          agent: isHttps ? keepAliveHttpsAgent : keepAliveHttpAgent,
          rejectUnauthorized: false,
          timeout: 15000
        },
        (res) => {
          const status = res.statusCode || 200;
          if ([301, 302, 303, 307, 308].includes(status) && res.headers.location && redirectsLeft > 0) {
            res.resume();
            const nextUrl = new URL(res.headers.location, parsed.href).href;
            return resolve(fetchRemoteUrlDirectly(nextUrl, redirectsLeft - 1));
          }
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const raw = Buffer.concat(chunks);
            const decompressed = decompressBuffer(raw, res.headers['content-encoding']);
            resolve({
              ok: status >= 200 && status < 400,
              statusCode: status,
              headers: res.headers,
              buffer: decompressed,
              parsedUrl: parsed
            });
          });
        }
      );
      req.on('error', (err) => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Fetch timeout' });
      });
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

module.exports = {
  createHttpHandler,
  inspectHttpBody,
  classifyUrlPurpose,
  ensureDedicatedPortForOrigin,
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
};
