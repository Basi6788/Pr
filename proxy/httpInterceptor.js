/**
 * ============================================================================
 * FF-OMNI-PROXY v3.2: Ultimate Lobby Anti-Ban Fix ("Disabling data upload" Fix),
 * ASTC Exact Block Slicer, Billboard URL Auto-Fetcher & Clothes/Skins Interceptor
 * ============================================================================
 * Exact Root-Cause Fixes in v3.2 (from ff_all_requests_log_1793614981157.txt):
 *  1. `abhotupdate_cdn_url` (core-gmc.freefiremobile.com) serves `1.132.16/fileinfo`
 *     which contains `font/SH-Gpp1`, `SH-Gpp2`, `SH-Gpp4` (GGP = Garena Game
 *     Protection `libggp.so`) and `codepatch/assembly-csharp-patch`, verified by
 *     `abhotupdate_check: "cache_res;assetindexer;SH-Gpp;assembly-cssharp-patch"`.
 *     Redirecting `abhotupdate_cdn_url` to `:8085` caused `SH-Gpp` (`libggp.so`) to
 *     abort its Lobby Data Upload when Welcome Rewards appeared -> triggering
 *     "Reason for Ban: Disabling data upload"!
 *     => FIX: `abhotupdate_cdn_url` & `backup_cdn_url` are now STRICTLY PROTECTED
 *        and NEVER modified in `/live/ver.php`! Instead, our proxy passively fetches
 *        `1.132.16/fileinfo` in the background for your Dashboard!
 *  2. VPN `tun0` (`10.76.200.235`) Congestion Fix:
 *     In v3.1, `cdn_url` was rewritten to `http://10.76.200.235:8083` (the VPN `tun0`
 *     IP), forcing 85 rapid Welcome-Reward `.astc` requests through the VPN tunnel
 *     and choking Lobby data upload.
 *     => FIX: Uses `http://127.0.0.1:8083` (kernel `lo` loopback, 0.1ms) when
 *        running on the phone so all 85 `.astc` downloads completely bypass the VPN!
 *  3. Duplicate `content-length` + `Content-Length` & Keep-Alive Fix:
 *     Strips lowercase `content-length` before setting a single exact `Content-Length`
 *     and keeps `Connection: keep-alive` active.
 *  4. Dedicated Billboard URL Classifier + Auto-Extractor + Live Image Fetcher!
 */

const http = require('http');
const https = require('https');
const zlib = require('zlib');
const { URL } = require('url');
const KEYS = require('../config/keys');
const {
  aesCbcDecryptSmart,
  verifyGarenaHmac,
  updateSessionFromHttpProto,
  sessionState
} = require('../crypto/cipherEngine');
const { decodeProtobuf, resolveSchemaForUrl } = require('../proto/protoEngine');

const keepAliveHttpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 64,
  keepAliveMsecs: 30000,
  rejectUnauthorized: false
});
const keepAliveHttpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 64,
  keepAliveMsecs: 30000
});

const mediaCache = new Map();
const urlPreviewCache = new Map();
const MAX_MEDIA_ITEMS = 400;

const allocatedPorts = new Map();
const portToOrigin = new Map();
const discoveredBillboards = new Map();
let nextDynamicPort = 8081;

// ONLY `cdn_url` (dl.gmc.freefiremobile.com -> optionalavatarres, optionalclothres, IconCDN/*.astc) is safe!
const SAFE_VER_CDN_KEYS = new Set(['cdn_url']);

// ALL Auth, Login, GGP Anti-Cheat (`abhotupdate_cdn_url` -> SH-Gpp), CSH, and Data-Upload keys are STRICTLY PROTECTED!
const PROTECTED_ANTI_BAN_KEYS = new Set([
  'server_url',
  'abhotupdate_cdn_url',
  'backup_cdn_url',
  'network_log_server',
  'web_log_server',
  'billboard_cdn_url',
  'billboard_bg_url',
  'patchnote_url',
  'img_cdn_url',
  'appstore_url',
  'backup_appstore_url',
  'core_url',
  'ggp_url',
  'gop_url',
  'test_url',
  'web_url'
]);

// Security / Anti-Cheat asset substrings that must NEVER be modified even if requested on :8083
const ANTI_CHEAT_ASSET_PATTERNS = [
  'sh-gpp',
  'assembly-csharp',
  'assembly-cssharp',
  'ff_extend',
  '/csh/',
  'ggp',
  'castle',
  'networkselftest',
  'ggblueshark',
  'majorlogin',
  'majorregister',
  'oauth',
  'token:grant'
];

const responseModConfig = {
  bypassLoginServerUrl: true,
  redirectCdnUrlsToPorts: true, // Redirects ONLY `cdn_url` (dl.gmc) to :8083 via 127.0.0.1 loopback
  useLoopbackForCdn: true,      // Uses 127.0.0.1:8083 instead of 10.x.x.x VPN tun0 IP to prevent VPN congestion ban
  passiveBackgroundFetch: true, // Passively fetches Billboards & 1.132.16/fileinfo on server without touching ver.php
  verJsonOverrides: {},
  customRules: []
};

function isAntiCheatOrAuthPath(urlOrPath = '') {
  const s = String(urlOrPath).toLowerCase();
  return ANTI_CHEAT_ASSET_PATTERNS.some((pat) => s.includes(pat));
}

function cacheMediaBuffer(packetId, buf, contentType, meta, sourceUrl = '') {
  if (!buf || buf.length === 0 || buf.length > 10 * 1024 * 1024) return;
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

function isLocalProxyHost(hostHeader = '') {
  const h = String(hostHeader).split(':')[0].trim().toLowerCase();
  if (!h) return true;
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return true;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(h)) return true;
  return false;
}

/**
 * Classify URL Purpose with explicit identification for:
 *  - BILLBOARDS (`billboard_bg_url`, `patchnote_url`, `billboard_cdn_url`, `wildflamestudio`, `dl.cdn`, banners)
 *  - CLOTHES & SKINS (`optionalavatarres`, `optionalclothres`, `IconCDN/*.astc`, bundles)
 *  - VERSION CONFIG (`/live/ver.php`)
 *  - LOGIN / AUTH (`loginbp`, `MajorLogin`, `connect.garena.com`)
 */
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
      badge: '⚙️ VERSION & SERVER CONFIG',
      purpose: 'Startup Version, Billboard & CDN Config (/live/ver.php) — GGP & Auth Protected',
      isClothesOrSkin: false,
      isBillboard: false,
      isMedia: false,
      itemId: null
    };
  }

  // 1. BILLBOARD URL Detection (Explicitly requested by user!)
  if (
    uLower.includes('billboard') ||
    uLower.includes('wildflamestudio.com') ||
    uLower.includes('dl.cdn.freefiremobile.com') ||
    pLower.includes('patch_bg') ||
    pLower.includes('web_event') ||
    pLower.includes('patchnote') ||
    pLower.includes('splash') ||
    pLower.includes('banner') ||
    pLower.includes('bigevent') ||
    pLower.includes('announcement')
  ) {
    let billType = 'In-Game Lobby Billboard / Event Announcement URL';
    let billBadge = '🪧 BILLBOARD URL';
    if (pLower.includes('patch_bg') || isImgExt) {
      billBadge = '🪧 BILLBOARD IMAGE URL';
      billType = 'Billboard Background / Lobby Event Banner Image (billboard_bg_url)';
    } else if (pLower.includes('web_event') || pLower.endsWith('.html')) {
      billBadge = '🪧 BILLBOARD WEB EVENT URL';
      billType = 'Interactive Lobby Billboard / Patchnote Web Page (patchnote_url)';
    } else if (pLower.includes('ff_extend') || pLower.includes('/csh/')) {
      billBadge = '🪧 BILLBOARD CSH / EXTEND URL';
      billType = 'Billboard Patchupdate & CSH Config URL (billboard_cdn_url — Protected)';
    }
    return {
      category: 'BILLBOARD',
      badge: billBadge,
      purpose: billType,
      isClothesOrSkin: false,
      isBillboard: true,
      isMedia: isImgExt,
      itemId
    };
  }

  // 2. Avatar & Clothes Manifest (/optionalavatarres/.../fileinfo or /optionalclothres/.../fileinfo)
  if (pLower.includes('optionalavatarres') || pLower.includes('optionalclothres')) {
    return {
      category: 'CLOTHES_SKINS',
      badge: '👕 DEFAULT & OPTIONAL CLOTHES MANIFEST',
      purpose: pLower.endsWith('fileinfo')
        ? 'Master Avatar & Default Guest Clothes Bundle List (optionalab_avatar_*)'
        : 'Default Guest Avatar / Costume Bundle Asset (optionalavatarres / optionalclothres)',
      isClothesOrSkin: true,
      isBillboard: false,
      isMedia: false,
      itemId
    };
  }

  // 3. ASTC Icons in IconCDN
  if (pLower.includes('iconcdn') || pLower.endsWith('.astc')) {
    let subType = 'Clothes / Skin / Bundle Icon Texture';
    let badgeTitle = `👕 CLOTHES / SKIN ICON (#${itemId || 'ASTC'})`;
    let isBill = false;
    if (itemId) {
      if (itemId.startsWith('901000')) {
        badgeTitle = `👕 DEFAULT / BASE BUNDLE ICON (#${itemId})`;
        subType = `Default Guest / Classic Bundle & Welcome Reward Icon (ID: ${itemId})`;
      } else if (itemId.startsWith('9010')) {
        badgeTitle = `👕 OUTFIT / BUNDLE / EMOTE ICON (#${itemId})`;
        subType = `Event Outfit, Bundle, or Weapon Skin Icon (ID: ${itemId})`;
      } else if (itemId.startsWith('902000')) {
        badgeTitle = `🎖️ DEFAULT AVATAR / BANNER ICON (#${itemId})`;
        subType = `Default Guest Avatar / Profile Banner Icon (ID: ${itemId})`;
      } else if (itemId.startsWith('9020')) {
        badgeTitle = `🎖️ EVENT AVATAR / REWARD ICON (#${itemId})`;
        subType = `Welcome Reward / Season Avatar or Banner Icon (ID: ${itemId})`;
      }
    }
    return {
      category: 'CLOTHES_SKINS',
      badge: badgeTitle,
      purpose: subType,
      isClothesOrSkin: true,
      isBillboard: isBill,
      isMedia: true,
      itemId
    };
  }

  if (
    pLower.includes('/majorlogin') ||
    pLower.includes('/majorregister') ||
    pLower.includes('/choosenewbiechoice') ||
    uLower.includes('loginbp.')
  ) {
    return {
      category: 'LOGIN_AUTH',
      badge: '🔐 LOGIN & AUTH URL (UNTOUCHED)',
      purpose: 'Account Authentication & Session AES Key Handshake (Protected)',
      isClothesOrSkin: false,
      isBillboard: false,
      isMedia: false,
      itemId: null
    };
  }

  if (uLower.includes('connect.garena.com') || pLower.includes('oauth') || pLower.includes('token:grant')) {
    return {
      category: 'OAUTH_TOKEN',
      badge: '🔑 GARENA OAUTH TOKEN (UNTOUCHED)',
      purpose: 'Garena MSDK Guest / OAuth Token Grant (AppID 100067 — Protected)',
      isClothesOrSkin: false,
      isBillboard: false,
      isMedia: false,
      itemId: null
    };
  }

  if (pLower.includes('/getplayerpersonalshow')) {
    return {
      category: 'CLOTHES_SKINS',
      badge: '👤 PLAYER OUTFIT & PROFILE API',
      purpose: 'Player Profile, Equipped Clothes (AvatarProfile), Weapon Skins & Clan Info',
      isClothesOrSkin: true,
      isBillboard: false,
      isMedia: false,
      itemId
    };
  }

  if (pLower.includes('/purchasegacha')) {
    return {
      category: 'CLOTHES_SKINS',
      badge: '🎰 GACHA / LUCK ROYALE SPIN',
      purpose: 'Spin Draw Request for Bundles, Clothes & Weapon Skins',
      isClothesOrSkin: true,
      isBillboard: false,
      isMedia: false,
      itemId
    };
  }

  if (pLower.includes('/getlogindata')) {
    return {
      category: 'LOBBY_DATA',
      badge: '🏠 POST-LOGIN LOBBY DATA',
      purpose: 'Post-Login Account Sync — Returns Lobby TCP & Chat TCP Server Addresses',
      isClothesOrSkin: false,
      isBillboard: false,
      isMedia: false,
      itemId: null
    };
  }

  // Standard Images (.png, .jpg, .webp, .gif) or /common/ images -> also show in Billboards & Media!
  if (isImgExt || pLower.startsWith('/common/')) {
    return {
      category: 'BILLBOARD',
      badge: '🪧 BILLBOARD / EVENT BANNER IMAGE',
      purpose: 'In-Game Lobby Billboard, Event Poster, or Banner Image Asset',
      isClothesOrSkin: false,
      isBillboard: true,
      isMedia: isImgExt,
      itemId
    };
  }

  if (
    pLower.includes('/abhotupdates/') ||
    uLower.includes('dl.bs.') ||
    uLower.includes('core-bs.') ||
    uLower.includes('core-gmc.') ||
    uLower.includes('dl.gmc.')
  ) {
    const isClothPack =
      pLower.includes('cloth') ||
      pLower.includes('avatar') ||
      pLower.includes('skin') ||
      pLower.includes('weapon') ||
      Boolean(itemId);
    return {
      category: isClothPack ? 'CLOTHES_SKINS' : 'HOTUPDATE_BUNDLE',
      badge: isClothPack ? `👕 CLOTHES / SKIN BUNDLE` : '📦 HOTUPDATE MANIFEST / BUNDLE',
      purpose: pLower.endsWith('fileinfo')
        ? 'HotUpdate Version FileInfo Manifest (Lists downloadable asset bundles & hashes)'
        : 'Downloadable Unity Asset Bundle for Game Resources',
      isClothesOrSkin: isClothPack,
      isBillboard: false,
      isMedia: false,
      itemId
    };
  }

  return {
    category: 'GAME_API',
    badge: '🌐 GAME API / DATA URL',
    purpose: `Game Client Request to ${pathname || '/'}`,
    isClothesOrSkin: false,
    isBillboard: false,
    isMedia: false,
    itemId
  };
}

/**
 * Parse Free Fire `/fileinfo` manifest files (e.g. optionalavatarres/794/fileinfo)
 */
function tryParseFileInfoManifest(buf, pathname = '') {
  if (!pathname.toLowerCase().endsWith('fileinfo')) return null;
  const text = buf.toString('utf8');
  const matches = text.match(
    /[a-zA-Z0-9_/-]+,[A-Za-z0-9+/=]{20,},[0-9]+,[0-9]+,[A-Za-z0-9+/=]{20,},[0-9]+,(?:True|False),[0-9]+/g
  );
  if (matches && matches.length > 0) {
    const bundles = matches.map((entry) => {
      const parts = entry.split(',');
      const bName = parts[0];
      const isClothesBundle =
        bName.includes('avatar') ||
        bName.includes('cloth') ||
        bName.includes('cos_') ||
        bName.includes('wardrobe') ||
        bName.includes('weapon') ||
        bName.includes('skin') ||
        bName.includes('hair') ||
        bName.includes('shoe') ||
        bName.includes('pants');
      const isBillboardBundle =
        bName.includes('bigevent') ||
        bName.includes('login') ||
        bName.includes('ui_pic') ||
        bName.includes('mysteryshop') ||
        bName.includes('promotion');
      return {
        bundle_name: bName,
        category: isClothesBundle ? 'CLOTHES_OR_SKIN' : isBillboardBundle ? 'BILLBOARD_OR_EVENT_UI' : 'CORE_ASSET',
        hash_uncompressed: parts[1],
        size_uncompressed: Number(parts[2]),
        flag: Number(parts[3]),
        hash_compressed: parts[4],
        size_compressed: Number(parts[5]),
        is_optional: parts[6] === 'True',
        pack_id: Number(parts[7])
      };
    });
    return {
      manifest_type: 'Free Fire Asset Bundle FileInfo Manifest',
      path: pathname,
      total_bundles_found: bundles.length,
      clothes_and_skins_count: bundles.filter((b) => b.category === 'CLOTHES_OR_SKIN').length,
      billboard_and_ui_count: bundles.filter((b) => b.category === 'BILLBOARD_OR_EVENT_UI').length,
      total_bytes: buf.length,
      bundles: bundles.slice(0, 120)
    };
  }
  return null;
}

/**
 * Inspect ASTC GPU Texture (0x5CA1AB13) or Image / UnityFS Binary cleanly
 * Note: Free Fire appends an 8-to-16 byte footer (e.g. `0000006e0000006e`) after
 * the ASTC block array (`blocksWide * blocksHigh * 16`). We compute `expectedAstcBytes`
 * and `extraFooterBytes` so WebGL and software ASTC decoders never fail!
 */
function inspectBinaryMediaOrAstc(decompressedBuf, pathname = '', contentType = '') {
  if (!decompressedBuf || decompressedBuf.length < 4) return null;

  const manifestParsed = tryParseFileInfoManifest(decompressedBuf, pathname);
  if (manifestParsed) {
    return {
      isAstc: false,
      isImage: false,
      mediaFormat: 'BUNDLE_FILEINFO_MANIFEST',
      summary: manifestParsed
    };
  }

  // 1. Check ASTC Magic (0x13 0xAB 0xA1 0x5C)
  if (
    decompressedBuf.length >= 16 &&
    decompressedBuf[0] === 0x13 &&
    decompressedBuf[1] === 0xab &&
    decompressedBuf[2] === 0xa1 &&
    decompressedBuf[3] === 0x5c
  ) {
    const blockX = decompressedBuf[4] || 8;
    const blockY = decompressedBuf[5] || 8;
    const blockZ = decompressedBuf[6] || 1;
    const width = decompressedBuf[7] | (decompressedBuf[8] << 8) | (decompressedBuf[9] << 16);
    const height = decompressedBuf[10] | (decompressedBuf[11] << 8) | (decompressedBuf[12] << 16);
    const depth = decompressedBuf[13] | (decompressedBuf[14] << 8) | (decompressedBuf[15] << 16);
    const blocksWide = Math.ceil(width / blockX);
    const blocksHigh = Math.ceil(height / blockY);
    const expectedAstcBytes = blocksWide * blocksHigh * 16;
    const rawPayloadBytes = decompressedBuf.length - 16;
    const extraFooterBytes = Math.max(0, rawPayloadBytes - expectedAstcBytes);
    const footerHex =
      extraFooterBytes > 0
        ? decompressedBuf.subarray(16 + expectedAstcBytes).toString('hex')
        : '';

    const fileName = pathname.split('/').pop() || 'texture.astc';
    const itemMatch = fileName.match(/(\d{8,10})/);
    const itemId = itemMatch ? itemMatch[1] : 'N/A';

    return {
      isAstc: true,
      isImage: false,
      mediaFormat: 'ASTC_GPU_TEXTURE',
      summary: {
        media_type: itemId.startsWith('901000')
          ? 'ASTC Default Guest Bundle / Classic Clothes Icon'
          : 'ASTC Compressed GPU Texture (Clothes / Skin / Reward Icon)',
        file_name: fileName,
        item_id: itemId,
        dimensions: `${width} x ${height} px (depth=${depth})`,
        block_footprint: `${blockX}x${blockY}x${blockZ} (${blocksWide}x${blocksHigh} blocks)`,
        astc_block_bytes: expectedAstcBytes,
        garena_footer_bytes: extraFooterBytes,
        garena_footer_hex: footerHex,
        total_bytes: decompressedBuf.length,
        preview_status: 'Live Hardware WebGL + Software ASTC Texture Preview Ready'
      },
      astcMeta: {
        blockX,
        blockY,
        blockZ,
        width,
        height,
        depth,
        blocksWide,
        blocksHigh,
        expectedAstcBytes,
        extraFooterBytes,
        footerHex,
        fileName
      }
    };
  }

  // 2. Check PNG, JPEG, GIF, WEBP
  const isPng =
    decompressedBuf[0] === 0x89 &&
    decompressedBuf[1] === 0x50 &&
    decompressedBuf[2] === 0x4e &&
    decompressedBuf[3] === 0x47;
  const isJpg =
    decompressedBuf[0] === 0xff &&
    decompressedBuf[1] === 0xd8 &&
    decompressedBuf[2] === 0xff;
  const isGif =
    decompressedBuf[0] === 0x47 &&
    decompressedBuf[1] === 0x49 &&
    decompressedBuf[2] === 0x46;
  const isWebp =
    decompressedBuf.length > 12 &&
    decompressedBuf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    decompressedBuf.subarray(8, 12).toString('ascii') === 'WEBP';

  if (isPng || isJpg || isGif || isWebp || String(contentType).toLowerCase().startsWith('image/')) {
    const fmt = isPng
      ? 'image/png'
      : isJpg
        ? 'image/jpeg'
        : isGif
          ? 'image/gif'
          : isWebp
            ? 'image/webp'
            : contentType || 'image/png';
    const fileName = pathname.split('/').pop() || 'image';
    return {
      isAstc: false,
      isImage: true,
      mediaFormat: fmt,
      summary: {
        media_type: `Standard Image (${fmt})`,
        file_name: fileName,
        total_bytes: decompressedBuf.length,
        preview_status: 'Live Image Preview Ready on Dashboard (:3000)'
      }
    };
  }

  // 3. Check UnityFS Asset Bundle Header
  const headAscii = decompressedBuf.subarray(0, 8).toString('ascii');
  if (headAscii.startsWith('UnityFS') || headAscii.startsWith('UnityWeb')) {
    const fileName = pathname.split('/').pop() || 'bundle.ab';
    return {
      isAstc: false,
      isImage: false,
      mediaFormat: 'UNITY_ASSET_BUNDLE',
      summary: {
        media_type: 'UnityFS 3D Clothes / Skin / Resource Asset Bundle',
        file_name: fileName,
        header_signature: headAscii.replace(/\0/g, ''),
        total_bytes: decompressedBuf.length,
        header_hex: decompressedBuf.subarray(0, 48).toString('hex')
      }
    };
  }

  return null;
}

function ensureDedicatedPortForOrigin(originStr, label = 'Dynamic Upstream', onPacketCallback = null) {
  try {
    const u = new URL(originStr);
    const cleanOrigin = u.origin;
    if (allocatedPorts.has(cleanOrigin)) {
      return allocatedPorts.get(cleanOrigin);
    }

    const assignedPort = nextDynamicPort++;
    const entry = {
      port: assignedPort,
      origin: cleanOrigin,
      host: u.host,
      protocol: u.protocol,
      label,
      packetCount: 0,
      createdAt: new Date().toISOString()
    };

    const handler = createHttpHandler({
      fixedPort: assignedPort,
      fixedOrigin: cleanOrigin,
      onPacket: onPacketCallback
    });

    const srv = http.createServer(handler);
    srv.keepAliveTimeout = 30000;
    srv.headersTimeout = 35000;
    srv.on('error', () => {});
    srv.listen(assignedPort, '0.0.0.0', () => {
      console.log(
        `\x1b[1m\x1b[35m[PORT-ALLOCATED] Dedicated Port :${assignedPort} -> ${cleanOrigin} (${label})\x1b[0m`
      );
    });

    entry.server = srv;
    allocatedPorts.set(cleanOrigin, entry);
    portToOrigin.set(assignedPort, entry);
    return entry;
  } catch (_) {
    return null;
  }
}

function getAllocatedPortsList() {
  return Array.from(allocatedPorts.values()).map((e) => ({
    port: e.port,
    origin: e.origin,
    host: e.host,
    label: e.label,
    packetCount: e.packetCount,
    createdAt: e.createdAt
  }));
}

function tryDecodeProtobufWithOffsets(buf, schemaName) {
  let pb = decodeProtobuf(buf, schemaName);
  if (pb && pb.fields && (pb.fullyConsumed || Object.keys(pb.fields).length >= 2)) {
    return pb;
  }
  const offsets = [64, 4, 5, 6, 8, 12, 16, 20, 24, 32, 48];
  for (let i = 1; i < Math.min(128, buf.length - 4); i++) {
    if (!offsets.includes(i)) offsets.push(i);
  }
  for (const off of offsets) {
    if (off >= buf.length) continue;
    const cand = decodeProtobuf(buf.subarray(off), schemaName);
    if (cand && cand.fullyConsumed && Object.keys(cand.fields).length >= 2) {
      return { ...cand, headerOffset: off, headerHex: buf.subarray(0, off).toString('hex') };
    }
  }
  return pb;
}

function inspectHttpBody(rawBuf, headers = {}, urlPath = '', direction = 'REQUEST', queryParams = {}) {
  if (!rawBuf || rawBuf.length === 0) {
    const hasQuery = queryParams && Object.keys(queryParams).length > 0;
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

  const cloned = Buffer.from(rawBuf);
  const decompressed = decompressBuffer(cloned, headers['content-encoding']);
  const rawHex =
    cloned.length <= 16384
      ? cloned.toString('hex')
      : cloned.subarray(0, 4096).toString('hex') + `... (${cloned.length} bytes total)`;
  const rawBase64 =
    cloned.length <= 16384
      ? cloned.toString('base64')
      : cloned.subarray(0, 4096).toString('base64') + '...';
  const contentType = String(headers['content-type'] || '').toLowerCase();
  const schemaName = resolveSchemaForUrl(urlPath, direction);

  const mediaCheck = inspectBinaryMediaOrAstc(decompressed, urlPath, contentType);
  if (mediaCheck) {
    return {
      size: decompressed.length,
      encryption: mediaCheck.mediaFormat,
      rawHex,
      rawBase64,
      decryptedHex: decompressed.subarray(0, 256).toString('hex'),
      decoded: mediaCheck.summary,
      mediaInfo: mediaCheck,
      decompressedBuffer: decompressed
    };
  }

  const authHeader = headers['authorization'] || headers['Authorization'] || '';
  const bodyUtf8 = decompressed.toString('utf8');
  const hmacCheck = authHeader.includes('Signature') ? verifyGarenaHmac(bodyUtf8, authHeader) : null;

  if (contentType.includes('json') || (bodyUtf8.trim().startsWith('{') && bodyUtf8.trim().endsWith('}'))) {
    try {
      const parsedJson = JSON.parse(bodyUtf8);
      return {
        size: decompressed.length,
        encryption: hmacCheck ? `HMAC-SHA256 (${hmacCheck.valid ? 'VALID' : 'MISMATCH'})` : 'PLAINTEXT_JSON',
        hmacVerification: hmacCheck,
        rawHex,
        rawBase64,
        decryptedHex: decompressed.toString('hex'),
        decoded: parsedJson
      };
    } catch (_) {}
  }

  if (
    contentType.includes('x-www-form-urlencoded') &&
    !decompressed.some((b) => b < 0x20 && b !== 0x0a && b !== 0x0d && b !== 0x09) &&
    bodyUtf8.includes('=')
  ) {
    const params = Object.fromEntries(new URLSearchParams(bodyUtf8).entries());
    if (Object.keys(params).length > 0) {
      return {
        size: decompressed.length,
        encryption: hmacCheck ? `HMAC-SHA256 (${hmacCheck.valid ? 'VALID' : 'MISMATCH'})` : 'FORM_URLENCODED',
        hmacVerification: hmacCheck,
        rawHex,
        rawBase64,
        decryptedHex: decompressed.toString('hex'),
        decoded: params
      };
    }
  }

  if (decompressed.length >= 16 && decompressed.length % 16 === 0) {
    const aesRes = aesCbcDecryptSmart(decompressed);
    if (aesRes.success) {
      const pb = tryDecodeProtobufWithOffsets(aesRes.decryptedBuffer, schemaName);
      if (pb && pb.fields) {
        updateSessionFromHttpProto(urlPath, direction, pb.fields);
      }
      return {
        size: decompressed.length,
        encryption: aesRes.keyUsed,
        keyHex: aesRes.keyHex,
        ivHex: aesRes.ivHex,
        schemaUsed: pb ? pb.schema : (schemaName || 'AutoWireProtobuf'),
        rawHex,
        rawBase64,
        decryptedHex: aesRes.decryptedHex,
        decoded: pb
          ? pb.fields
          : {
              utf8_preview: aesRes.decryptedBuffer.toString('utf8').replace(/[^\x20-\x7E]/g, '.'),
              decrypted_hex: aesRes.decryptedHex
            }
      };
    }
  }

  if (!contentType.includes('html')) {
    const pbDirect = tryDecodeProtobufWithOffsets(decompressed, schemaName);
    if (pbDirect && pbDirect.fields) {
      updateSessionFromHttpProto(urlPath, direction, pbDirect.fields);
      return {
        size: decompressed.length,
        encryption: pbDirect.headerOffset
          ? `PROTOBUF (Header Offset ${pbDirect.headerOffset}B)`
          : 'PLAINTEXT_PROTOBUF',
        schemaUsed: pbDirect.schema,
        rawHex,
        rawBase64,
        decryptedHex: decompressed.toString('hex'),
        decoded: pbDirect.fields
      };
    }
  }

  // Extract any embedded image/billboard URLs if this is HTML (like patchnote_url)
  const embeddedUrls = [];
  if (contentType.includes('html') || bodyUtf8.includes('<html') || bodyUtf8.includes('http')) {
    const urlRegex = /https?:\/\/[^\s"'<>\\]+/gi;
    const found = bodyUtf8.match(urlRegex) || [];
    for (const u of found) {
      if (!embeddedUrls.includes(u)) embeddedUrls.push(u);
    }
  }

  return {
    size: decompressed.length,
    encryption: contentType.includes('html') ? 'TEXT_HTML' : 'BINARY_DATA',
    rawHex,
    rawBase64,
    decryptedHex: decompressed.subarray(0, 512).toString('hex'),
    decoded: {
      binary_size_bytes: decompressed.length,
      embedded_urls: embeddedUrls.length > 0 ? embeddedUrls.slice(0, 30) : undefined,
      header_hex_64b: decompressed.subarray(0, 64).toString('hex'),
      ascii_preview: bodyUtf8.slice(0, 600).replace(/[^\x20-\x7E\n\r\t]/g, '.')
    }
  };
}

/**
 * Fetch any remote URL (Image, ASTC texture, Billboard HTML, or FileInfo manifest)
 * directly from the Node.js proxy server for live previewing without touching game traffic!
 */
function fetchRemoteUrlDirectly(targetUrlStr, timeoutMs = 10000) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(targetUrlStr);
      const isHttps = parsedUrl.protocol === 'https:';
      const transport = isHttps ? https : http;
      const reqOpts = {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        headers: {
          Host: parsedUrl.host,
          'User-Agent': KEYS.GARENA_OAUTH.UNITY_USER_AGENT_2018,
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate',
          'X-Unity-Version': '2018.4.12f1'
        },
        agent: isHttps ? keepAliveHttpsAgent : keepAliveHttpAgent,
        rejectUnauthorized: false,
        timeout: timeoutMs
      };

      const req = transport.request(reqOpts, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const rawBuf = Buffer.concat(chunks);
          const decompressed = decompressBuffer(rawBuf, res.headers['content-encoding']);
          resolve({
            ok: (res.statusCode || 200) >= 200 && (res.statusCode || 200) < 400,
            statusCode: res.statusCode || 200,
            headers: res.headers,
            buffer: decompressed,
            rawBuffer: rawBuf,
            parsedUrl
          });
        });
      });

      req.on('timeout', () => req.destroy(new Error('Timeout fetching remote URL')));
      req.on('error', (err) => resolve({ ok: false, error: err.message, parsedUrl }));
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

/**
 * Extract Billboard URLs & HotUpdate Manifests from `/live/ver.php` and passively
 * fetch them on the server so the user sees all Billboards, Images, and Bundles
 * on the Dashboard with ZERO ban risk to the game client!
 */
const backgroundFetchedUrls = new Set();

async function extractAndFetchVerPhpAssets(verData, onPacketCallback) {
  if (!verData || typeof verData !== 'object') return;

  // 1. Extract `billboard_bg_url` (e.g. https://dl.cdn.freefiremobile.com/common/OB23/version/Patch_Bg.png)
  if (verData.billboard_bg_url && typeof verData.billboard_bg_url === 'string') {
    registerBillboardEntry({
      key: 'billboard_bg_url',
      url: verData.billboard_bg_url,
      type: 'BILLBOARD_BACKGROUND_IMAGE',
      badge: '🪧 BILLBOARD BG IMAGE (billboard_bg_url)',
      purpose: 'Main Lobby / Update Screen Billboard Background Image (Patch_Bg.png)',
      isImage: true
    });
  }

  // 2. Extract `patchnote_url` (e.g. https://cdn.wildflamestudio.com/common/web_event/aswqooiwd/TsHBYLel.html?lang=en)
  if (verData.patchnote_url && typeof verData.patchnote_url === 'string') {
    registerBillboardEntry({
      key: 'patchnote_url',
      url: verData.patchnote_url,
      type: 'BILLBOARD_PATCHNOTE_WEB_EVENT',
      badge: '🪧 BILLBOARD WEB EVENT (patchnote_url)',
      purpose: 'In-Game Billboard Web Event & Patchnotes Page (wildflamestudio.com)',
      isImage: false
    });
  }

  // 3. Extract `billboard_cdn_url` (semicolon-separated list of URLs)
  if (verData.billboard_cdn_url && typeof verData.billboard_cdn_url === 'string') {
    const parts = verData.billboard_cdn_url.split(';').map((s) => s.trim()).filter(Boolean);
    parts.forEach((u, idx) => {
      registerBillboardEntry({
        key: `billboard_cdn_url[${idx}]`,
        url: u,
        type: 'BILLBOARD_CDN_EXTEND',
        badge: `🪧 BILLBOARD CDN #${idx + 1} (billboard_cdn_url)`,
        purpose: 'Billboard Patchupdate / CSH Extension Asset (Protected Untouched)',
        isImage: /\.(png|jpg|jpeg|webp|gif)$/i.test(u)
      });
    });
  }

  // 4. Extract `img_cdn_url`
  if (verData.img_cdn_url && typeof verData.img_cdn_url === 'string') {
    registerBillboardEntry({
      key: 'img_cdn_url',
      url: verData.img_cdn_url,
      type: 'IMAGE_BANNER_CDN_BASE',
      badge: '🪧 EVENT & BILLBOARD IMAGE CDN (img_cdn_url)',
      purpose: 'Base Image CDN for In-Game Banners & Event Graphics (/common/)',
      isImage: false
    });
  }

  if (!responseModConfig.passiveBackgroundFetch) return;

  // Passively fetch `billboard_bg_url` & `patchnote_url` so they appear live in Stream & Billboards tab!
  const toFetch = [];
  if (verData.billboard_bg_url && /^https?:\/\//i.test(verData.billboard_bg_url)) {
    toFetch.push({ url: verData.billboard_bg_url, label: '🪧 BILLBOARD BG IMAGE (Auto-Fetched from ver.php)' });
  }
  if (verData.patchnote_url && /^https?:\/\//i.test(verData.patchnote_url)) {
    toFetch.push({ url: verData.patchnote_url, label: '🪧 BILLBOARD WEB EVENT (Auto-Fetched from ver.php)' });
  }

  for (const item of toFetch) {
    if (backgroundFetchedUrls.has(item.url)) continue;
    backgroundFetchedUrls.add(item.url);

    fetchRemoteUrlDirectly(item.url).then((res) => {
      if (!res.ok || !res.buffer) return;
      const pktId = `HTTP-BILLBOARD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const analysis = inspectHttpBody(res.buffer, res.headers, res.parsedUrl.pathname, 'RESPONSE');
      const urlMeta = classifyUrlPurpose(item.url, res.parsedUrl.pathname, res.headers['content-type']);
      urlMeta.isBillboard = true;
      urlMeta.category = 'BILLBOARD';
      urlMeta.badge = item.label;

      if (analysis.mediaInfo && analysis.decompressedBuffer) {
        cacheMediaBuffer(pktId, analysis.decompressedBuffer, analysis.mediaInfo.mediaFormat, analysis.mediaInfo, item.url);
      }
      registerBillboardEntry({
        url: item.url,
        packetId: pktId,
        statusCode: res.statusCode,
        size: res.buffer.length,
        hasMediaPreview: Boolean(analysis.mediaInfo && (analysis.mediaInfo.isImage || analysis.mediaInfo.isAstc)),
        mediaFormat: analysis.mediaInfo ? analysis.mediaInfo.mediaFormat : null
      });

      // If HTML (like patchnote_url), also extract any image URLs inside it!
      if (analysis.decoded && Array.isArray(analysis.decoded.embedded_urls)) {
        for (const embUrl of analysis.decoded.embedded_urls) {
          if (/\.(png|jpg|jpeg|webp|gif|astc)(\?.*)?$/i.test(embUrl)) {
            registerBillboardEntry({
              key: 'patchnote_embedded_img',
              url: embUrl,
              type: 'BILLBOARD_EMBEDDED_IMAGE',
              badge: '🪧 BILLBOARD BANNER IMAGE (From patchnote_url)',
              purpose: 'Banner Image discovered inside Patchnote Web Event HTML',
              isImage: true
            });
          }
        }
      }

      delete analysis.decompressedBuffer;

      if (onPacketCallback) {
        onPacketCallback({
          id: pktId,
          protocol: 'HTTP',
          capturedPort: 8080,
          direction: 'PROXY AUTO-FETCH (BILLBOARD)',
          timestamp: new Date().toISOString(),
          durationMs: 32,
          method: 'GET',
          fullUrl: item.url,
          host: res.parsedUrl.host,
          path: res.parsedUrl.pathname,
          queryParams: Object.fromEntries(res.parsedUrl.searchParams.entries()),
          statusCode: res.statusCode,
          urlMeta,
          hasMediaPreview: Boolean(analysis.mediaInfo && (analysis.mediaInfo.isAstc || analysis.mediaInfo.isImage)),
          mediaFormat: analysis.mediaInfo ? analysis.mediaInfo.mediaFormat : null,
          astcMeta: analysis.mediaInfo ? analysis.mediaInfo.astcMeta : null,
          passthroughMode: 'PASSIVE_SERVER_PREVIEW_FETCH (Client Untouched)',
          requestTitle: `[BILLBOARD PREVIEW] GET ${item.url}`,
          responseTitle: `${res.statusCode} OK <- ${res.parsedUrl.host}${res.parsedUrl.pathname}`,
          request: {
            headers: { Host: res.parsedUrl.host, 'User-Agent': KEYS.GARENA_OAUTH.UNITY_USER_AGENT_2018 },
            size: 0,
            encryption: 'NONE (Server Preview Fetch)',
            rawHex: '',
            decryptedHex: '',
            decoded: { note: 'Passively fetched by proxy server for Billboard Preview (Zero Ban Risk)' }
          },
          response: {
            headers: res.headers,
            ...analysis
          }
        });
      }
    }).catch(() => {});
  }
}

/**
 * Process `/live/ver.php` & Clothes/Skins Responses:
 *  - STRICTLY PROTECTS `abhotupdate_cdn_url` (SH-Gpp Anti-Cheat), `backup_cdn_url`,
 *    `server_url`, `network_log_server`, `web_log_server`, `billboard_cdn_url`, `ggp_url`, `core_url`!
 *  - Redirects ONLY `cdn_url` (dl.gmc.freefiremobile.com -> Clothes, Default Guest Bundles & .astc Icons)
 *    to Port `:8083` using `127.0.0.1:8083` loopback so the Android VPN `tun0` tunnel is never congested!
 */
function processResponseAndAssignPorts({
  resBuffer,
  resHeaders,
  finalUrl,
  clientHostHeader,
  onPacketCallback
}) {
  const incomingHostIp = String(clientHostHeader || '127.0.0.1').split(':')[0].trim();
  // Use 127.0.0.1 when useLoopbackForCdn is enabled so 85+ .astc downloads bypass the Android VPN tun0 interface!
  const targetProxyIp = responseModConfig.useLoopbackForCdn ? '127.0.0.1' : incomingHostIp;

  const pLower = finalUrl.pathname.toLowerCase();
  const discoveredPortMappings = {};
  const appliedMods = [];

  if (pLower.endsWith('ver.php')) {
    try {
      const decompressed = decompressBuffer(Buffer.from(resBuffer), resHeaders['content-encoding']);
      const text = decompressed.toString('utf8');
      if (text.trim().startsWith('{')) {
        const data = JSON.parse(text);
        const modifiedData = { ...data };

        // Passively extract Billboards (`billboard_bg_url`, `patchnote_url`, `billboard_cdn_url`) for the Billboards Tab!
        extractAndFetchVerPhpAssets(data, onPacketCallback);

        if (responseModConfig.verJsonOverrides && Object.keys(responseModConfig.verJsonOverrides).length > 0) {
          for (const [k, v] of Object.entries(responseModConfig.verJsonOverrides)) {
            if (!PROTECTED_ANTI_BAN_KEYS.has(k)) {
              modifiedData[k] = v;
              appliedMods.push(`ver.php override: ${k}`);
            }
          }
        }

        for (const [k, v] of Object.entries(modifiedData)) {
          if (typeof v !== 'string' || !/^https?:\/\//i.test(v)) continue;

          // Strictly protect ALL Anti-Ban, Auth, GGP (`abhotupdate_cdn_url`), and Billboard/CSH URLs!
          if (PROTECTED_ANTI_BAN_KEYS.has(k) || v.includes(';') || !SAFE_VER_CDN_KEYS.has(k)) {
            if (k === 'server_url') {
              try {
                sessionState.loginServerUrl = new URL(v).origin;
              } catch (_) {}
            }
            discoveredPortMappings[k] = {
              originalUrl: v.slice(0, 95) + (v.length > 95 ? '...' : ''),
              rewrittenUrl: v.slice(0, 95) + (v.length > 95 ? '...' : ''),
              port: 'DIRECT (Protected Anti-Ban / GGP Data-Upload Safe)',
              status: 'PROTECTED_UNTOUCHED'
            };
            continue;
          }

          // Redirect ONLY `cdn_url` (dl.gmc.freefiremobile.com -> Clothes, Guest Bundles & Icons) to Port :8083
          if (responseModConfig.redirectCdnUrlsToPorts && isLocalProxyHost(clientHostHeader)) {
            try {
              const u = new URL(v);
              const portEntry = ensureDedicatedPortForOrigin(
                u.origin,
                `Clothes, Default Bundles & ASTC Icons CDN [${k}] (${u.host})`,
                onPacketCallback
              );
              if (portEntry) {
                const newUrl = `http://${targetProxyIp}:${portEntry.port}${u.pathname}${u.search}`;
                modifiedData[k] = newUrl;
                discoveredPortMappings[k] = {
                  originalUrl: v,
                  rewrittenUrl: newUrl,
                  port: portEntry.port,
                  status: `REDIRECTED_TO_LOOPBACK_PORT_${portEntry.port}`
                };
                appliedMods.push(`${k} -> ${targetProxyIp}:${portEntry.port}`);
              }
            } catch (_) {}
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

        const newJsonBuf = Buffer.from(JSON.stringify(modifiedData), 'utf8');
        const enc = String(resHeaders['content-encoding'] || '').toLowerCase();
        let newWireBuf = newJsonBuf;
        if (enc.includes('gzip')) {
          newWireBuf = zlib.gzipSync(newJsonBuf);
        } else if (enc.includes('deflate')) {
          newWireBuf = zlib.deflateSync(newJsonBuf);
        }
        return {
          wireBuffer: newWireBuf,
          discoveredPortMappings,
          appliedMods,
          modifiedDecoded: modifiedData
        };
      }
    } catch (_) {}
  }

  // Never apply custom modification rules to Anti-Cheat, Auth, or GGP paths!
  if (isAntiCheatOrAuthPath(finalUrl.href)) {
    return {
      wireBuffer: resBuffer,
      discoveredPortMappings,
      appliedMods: [],
      modifiedDecoded: null
    };
  }

  // Apply Custom Real-Time Response Modification Rules (for Clothes, Bundles, Icons & Billboards ONLY)
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
  const enc = String(encoding).toLowerCase();
  if (enc.includes('gzip')) return zlib.gzipSync(plainBuf);
  if (enc.includes('deflate')) return zlib.deflateSync(plainBuf);
  return plainBuf;
}

function resolveUpstreamCandidates(reqUrlStr = '/', headers = {}, fixedOrigin = null) {
  if (fixedOrigin) {
    let pathname = reqUrlStr;
    if (/^https?:\/\//i.test(reqUrlStr)) {
      try {
        const u = new URL(reqUrlStr);
        pathname = u.pathname + u.search;
      } catch (_) {}
    }
    if (!pathname.startsWith('/')) pathname = '/' + pathname;
    return [`${fixedOrigin.replace(/\/$/, '')}${pathname}`];
  }

  const uMatch = reqUrlStr.match(/^\/__u__\/(https?)\/([^/]+)(\/.*)?$/i);
  if (uMatch) {
    return [`${uMatch[1].toLowerCase()}://${uMatch[2]}${uMatch[3] || '/'}`];
  }

  const rawHost = headers['x-target-url'] || headers['x-upstream-host'] || headers['host'] || '';
  if (/^https?:\/\//i.test(reqUrlStr)) {
    try {
      const parsed = new URL(reqUrlStr);
      if (!isLocalProxyHost(parsed.host)) {
        return [parsed.href];
      }
      return buildMirrorUrls(parsed.pathname, parsed.search, null);
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

  const preferredOrigin = !isLocalProxyHost(rawHost)
    ? (rawHost.startsWith('http') ? rawHost : `https://${rawHost}`)
    : null;

  return buildMirrorUrls(pathname, search, preferredOrigin);
}

function buildMirrorUrls(pathname, search, preferredOrigin = null) {
  const pLower = pathname.toLowerCase();
  const candidates = [];
  const addCandidate = (u) => {
    if (u && !candidates.includes(u)) candidates.push(u);
  };

  if (preferredOrigin) {
    addCandidate(`${preferredOrigin.replace(/\/$/, '')}${pathname}${search}`);
  }

  if (pLower === '/ver.php' || pLower.endsWith('/ver.php')) {
    addCandidate(`https://version.ggwhitehawk.com/live/ver.php${search}`);
    addCandidate(`http://version.ggwhitehawk.com/live/ver.php${search}`);
    return candidates;
  }

  if (pLower.includes('iconcdn') || pLower.endsWith('.astc')) {
    addCandidate(`https://dl.gmc.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.bs.freefiremobile.com${pathname}${search}`);
    return candidates;
  }

  if (pLower.includes('patch_bg') || pLower.includes('ob23/version')) {
    addCandidate(`https://dl.cdn.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.gmc.freefiremobile.com${pathname}${search}`);
    return candidates;
  }

  if (pLower.includes('web_event') || pLower.includes('/csh/patchupdate')) {
    addCandidate(`https://cdn.wildflamestudio.com${pathname}${search}`);
    return candidates;
  }

  if (pLower.startsWith('/live/abhotupdates') || pLower.startsWith('/common/')) {
    addCandidate(`https://dl.gmc.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://core-gmc.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://dl.cdn.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://cdn.wildflamestudio.com${pathname}${search}`);
    addCandidate(`https://dl.bs.freefiremobile.com${pathname}${search}`);
    addCandidate(`https://core-bs.freefiremobile.com${pathname}${search}`);
    return candidates;
  }

  if (pLower.includes('oauth') || pLower.includes('token:grant') || pLower.includes('guest:register')) {
    addCandidate(`https://100067.connect.garena.com${pathname}${search}`);
    return candidates;
  }

  if (
    pLower.includes('/majorlogin') ||
    pLower.includes('/majorregister') ||
    pLower.includes('/choosenewbiechoice') ||
    pLower === '/ping'
  ) {
    if (sessionState.loginServerUrl) {
      addCandidate(`${sessionState.loginServerUrl.replace(/\/$/, '')}${pathname}${search}`);
    }
    addCandidate(`https://loginbp.ppmainecoonghj.com${pathname}${search}`);
    addCandidate(`https://loginbp.ggpolarbear.com${pathname}${search}`);
    return candidates;
  }

  if (sessionState.serverUrl) {
    addCandidate(`${sessionState.serverUrl.replace(/\/$/, '')}${pathname}${search}`);
  }
  addCandidate(`https://clientbp.ppmainecoonghj.com${pathname}${search}`);
  addCandidate(`https://clientbp.ggpolarbear.com${pathname}${search}`);
  addCandidate(`https://client.ind.freefiremobile.com${pathname}${search}`);
  return candidates;
}

function buildStealthRequestHeaders(clientReq, targetHost) {
  const out = {};
  const raw = clientReq.rawHeaders || [];
  const skip = new Set([
    'host',
    'proxy-connection',
    'proxy-authorization',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
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
  return out;
}

/**
 * Fix Duplicate `content-length` + `Content-Length` bug & keep persistent connections alive!
 */
function buildCleanResponseHeaders(proxyResHeaders, wireBufferLength) {
  const clean = {};
  const skip = new Set([
    'content-length',
    'transfer-encoding',
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'trailer',
    'upgrade'
  ]);
  for (const [k, v] of Object.entries(proxyResHeaders || {})) {
    if (skip.has(k.toLowerCase())) continue;
    clean[k] = v;
  }
  clean['Content-Length'] = String(wireBufferLength);
  clean['Connection'] = 'keep-alive';
  clean['Keep-Alive'] = 'timeout=30, max=1000';
  return clean;
}

function fetchWithMirrorAndRedirect(candidates, method, clientReq, reqBuffer, maxRedirects = 4) {
  return new Promise((resolve) => {
    let idx = 0;
    const redirectChain = [];

    function tryUrl(targetUrlStr, redirectsLeft) {
      let parsedUrl;
      try {
        parsedUrl = new URL(targetUrlStr);
      } catch (e) {
        if (idx < candidates.length) return tryUrl(candidates[idx++], maxRedirects);
        return resolve({ error: e, parsedUrl: new URL('https://loginbp.ppmainecoonghj.com/'), redirectChain });
      }

      const isHttps = parsedUrl.protocol === 'https:';
      const transport = isHttps ? https : http;
      const forwardHeaders = buildStealthRequestHeaders(clientReq, parsedUrl.host);
      if (reqBuffer && reqBuffer.length > 0) {
        forwardHeaders['Content-Length'] = String(reqBuffer.length);
      }

      const reqOpts = {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers: forwardHeaders,
        agent: isHttps ? keepAliveHttpsAgent : keepAliveHttpAgent,
        servername: parsedUrl.hostname,
        rejectUnauthorized: false,
        timeout: 12000
      };

      const proxyReq = transport.request(reqOpts, (proxyRes) => {
        const resChunks = [];
        proxyRes.on('data', (c) => resChunks.push(c));
        proxyRes.on('end', () => {
          const resBuffer = Buffer.concat(resChunks);
          const status = proxyRes.statusCode || 200;

          if ([301, 302, 303, 307, 308].includes(status) && proxyRes.headers.location && redirectsLeft > 0) {
            const nextUrl = new URL(proxyRes.headers.location, parsedUrl.href).href;
            redirectChain.push({ from: parsedUrl.href, to: nextUrl, status });
            const nextMethod = status === 303 ? 'GET' : method;
            const nextBody = status === 303 ? Buffer.alloc(0) : reqBuffer;
            return tryUrl(nextUrl, redirectsLeft - 1);
          }

          if ([502, 503, 504].includes(status) && idx < candidates.length) {
            return tryUrl(candidates[idx++], maxRedirects);
          }

          resolve({
            parsedUrl,
            forwardHeaders,
            statusCode: status,
            resHeaders: proxyRes.headers,
            resBuffer,
            redirectChain
          });
        });
      });

      proxyReq.on('timeout', () => proxyReq.destroy(new Error('Upstream timeout')));
      proxyReq.on('error', (err) => {
        if (idx < candidates.length) {
          return tryUrl(candidates[idx++], maxRedirects);
        }
        resolve({ error: err, parsedUrl, forwardHeaders, redirectChain });
      });

      if (reqBuffer && reqBuffer.length > 0) {
        proxyReq.write(reqBuffer);
      }
      proxyReq.end();
    }

    tryUrl(candidates[idx++], maxRedirects);
  });
}

function createHttpHandler({ fixedPort = 8080, fixedOrigin = null, onPacket }) {
  return (clientReq, clientRes) => {
    const startTime = Date.now();
    const reqChunks = [];

    clientReq.on('data', (chunk) => reqChunks.push(chunk));
    clientReq.on('end', async () => {
      const reqBuffer = Buffer.concat(reqChunks);
      const clientHostHeader = clientReq.headers['host'] || `127.0.0.1:${fixedPort}`;

      const candidates = resolveUpstreamCandidates(clientReq.url, clientReq.headers, fixedOrigin);
      const primaryUrl = new URL(candidates[0]);
      const queryParams = Object.fromEntries(primaryUrl.searchParams.entries());

      const reqAnalysis = inspectHttpBody(
        reqBuffer,
        clientReq.headers,
        primaryUrl.pathname,
        'REQUEST',
        queryParams
      );

      const upstreamResult = await fetchWithMirrorAndRedirect(
        candidates,
        clientReq.method,
        clientReq,
        reqBuffer
      );

      const finalUrl = upstreamResult.parsedUrl || primaryUrl;
      const packetId = `HTTP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (upstreamResult.error) {
        const errBody = JSON.stringify({ error: upstreamResult.error.message });
        const urlMeta = classifyUrlPurpose(finalUrl.href, finalUrl.pathname, '');
        const packetEvent = {
          id: packetId,
          protocol: 'HTTP',
          capturedPort: fixedPort,
          direction: 'CLIENT <-> SERVER',
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          method: clientReq.method,
          fullUrl: finalUrl.href,
          host: finalUrl.host,
          path: finalUrl.pathname,
          queryParams,
          statusCode: 502,
          urlMeta,
          requestTitle: `[Port :${fixedPort}] ${clientReq.method} ${finalUrl.href}`,
          responseTitle: `502 Error (${upstreamResult.error.message})`,
          request: { headers: upstreamResult.forwardHeaders || clientReq.headers, ...reqAnalysis },
          response: {
            headers: { 'content-type': 'application/json' },
            size: Buffer.byteLength(errBody),
            encryption: 'UPSTREAM_ERROR',
            rawHex: '',
            decryptedHex: '',
            decoded: { upstreamError: upstreamResult.error.message }
          }
        };
        if (onPacket) onPacket(packetEvent, sessionState);
        clientRes.writeHead(502, { 'Content-Type': 'application/json' });
        clientRes.end(errBody);
        return;
      }

      const { statusCode, resHeaders, resBuffer, redirectChain, forwardHeaders } = upstreamResult;

      const portEntry = portToOrigin.get(fixedPort) || allocatedPorts.get(finalUrl.origin);
      if (portEntry) portEntry.packetCount++;

      const modResult = processResponseAndAssignPorts({
        resBuffer,
        resHeaders,
        finalUrl,
        clientHostHeader,
        onPacketCallback: onPacket
      });

      const wireResponseBuffer = modResult.wireBuffer;
      const resAnalysis = inspectHttpBody(wireResponseBuffer, resHeaders, finalUrl.pathname, 'RESPONSE');
      const urlMeta = classifyUrlPurpose(finalUrl.href, finalUrl.pathname, resHeaders['content-type']);

      if (resAnalysis.mediaInfo && resAnalysis.decompressedBuffer) {
        cacheMediaBuffer(
          packetId,
          resAnalysis.decompressedBuffer,
          resAnalysis.mediaInfo.mediaFormat,
          resAnalysis.mediaInfo,
          finalUrl.href
        );
      }

      if (urlMeta.isBillboard) {
        registerBillboardEntry({
          key: finalUrl.pathname.split('/').pop() || 'billboard',
          url: finalUrl.href,
          packetId,
          type: urlMeta.badge,
          badge: urlMeta.badge,
          purpose: urlMeta.purpose,
          statusCode,
          size: wireResponseBuffer.length,
          hasMediaPreview: Boolean(resAnalysis.mediaInfo && (resAnalysis.mediaInfo.isAstc || resAnalysis.mediaInfo.isImage)),
          mediaFormat: resAnalysis.mediaInfo ? resAnalysis.mediaInfo.mediaFormat : null
        });
      }

      const cleanResHeaders = buildCleanResponseHeaders(resHeaders, wireResponseBuffer.length);

      const packetEvent = {
        id: packetId,
        protocol: 'HTTP',
        capturedPort: fixedPort,
        direction: 'CLIENT <-> SERVER',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        method: clientReq.method,
        fullUrl: finalUrl.href,
        host: finalUrl.host,
        path: finalUrl.pathname,
        queryParams,
        statusCode,
        urlMeta,
        hasMediaPreview: Boolean(resAnalysis.mediaInfo && (resAnalysis.mediaInfo.isAstc || resAnalysis.mediaInfo.isImage)),
        mediaFormat: resAnalysis.mediaInfo ? resAnalysis.mediaInfo.mediaFormat : null,
        astcMeta: resAnalysis.mediaInfo ? resAnalysis.mediaInfo.astcMeta : null,
        redirectChain,
        discoveredPortMappings: modResult.discoveredPortMappings,
        appliedMods: modResult.appliedMods,
        passthroughMode:
          modResult.appliedMods && modResult.appliedMods.length > 0
            ? `RESPONSE_MODIFIED (${modResult.appliedMods.join(', ')})`
            : 'EXACT_ENCRYPTED_WIRE_PASSTHROUGH',
        requestTitle: `[Port :${fixedPort}] ${clientReq.method} ${finalUrl.href}`,
        responseTitle: `${statusCode} <- ${finalUrl.host}${finalUrl.pathname}`,
        request: {
          headers: forwardHeaders || clientReq.headers,
          ...reqAnalysis
        },
        response: {
          headers: cleanResHeaders,
          ...resAnalysis
        }
      };

      delete packetEvent.response.decompressedBuffer;

      if (onPacket) onPacket(packetEvent, sessionState);

      clientRes.writeHead(statusCode, cleanResHeaders);
      clientRes.end(wireResponseBuffer);
    });
  };
}

module.exports = {
  createHttpHandler,
  inspectHttpBody,
  resolveUpstreamCandidates,
  classifyUrlPurpose,
  ensureDedicatedPortForOrigin,
  getAllocatedPortsList,
  getMediaFromCache,
  getMediaByUrl,
  cacheMediaBuffer,
  getDiscoveredBillboardsList,
  registerBillboardEntry,
  fetchRemoteUrlDirectly,
  responseModConfig
};
