/**
 * ----------------------------------------------------------------------------
 * FF-OMNI-PROXY v6.0: Master Cryptographic Keys, Secrets & Regional URL Registry
 * (PAKISTAN `PK` SERVER #1 PRIORITY + SINGLE-PORT `/px/...` PATH ROUTING)
 * (Zero Astutech Redirection • 100% Vercel & Termux Ready • Zero Socket.IO)
 * ----------------------------------------------------------------------------
 */

const KEYS = {
  // 0. Pakistan (PK) #1 Priority OB55 Master Config Template (Captured from Real PK Packet #120)
  PK_OB55_VER_TEMPLATE: {
    is_firewall_open: false,
    cdn_url: 'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/',
    backup_cdn_url: 'https://dl.gmc.freefiremobile.com/live/ABHotUpdates/',
    abhotupdate_cdn_url: 'https://core-gmc.freefiremobile.com/live/ABHotUpdates/',
    img_cdn_url: 'https://dl.gmc.freefiremobile.com/common/',
    login_download_optionalpack: 'optionalclothres:shaders|optionalpetres:optionalpetres_commonab_shader|optionallobbyres:',
    need_track_hotupdate: true,
    abhotupdate_check: 'cache_res;assetindexer;SH-Gpp;assembly-cssharp-patch',
    latest_release_version: 'OB55',
    min_hint_size: 1,
    space_required_in_GB: 1.48,
    should_check_ab_load: false,
    force_refresh_restype: 'optionalavatarres',
    remote_version: '2.133.18',
    server_url: 'https://loginbp.ppmainecoonghj.com/',
    is_review_server: false,
    use_login_optional_download: true,
    use_background_download: true,
    use_background_download_lobby: true,
    country_code: 'PK',
    gdpr_version: 0,
    billboard_cdn_url:
      'https://dl.dir.freefiremobile.com/common/OB55/CSH/patchupdate/pkennbgiuabA101.ff_extend;https://dl.dir.freefiremobile.com/common/OB55/CSH/patchupdate/pkennbgiuabA102.ff_extend;https://dl.dir.freefiremobile.com/common/OB55/CSH/patchupdate/pkennbgiuabA103.ff_extend;https://dl.dir.freefiremobile.com/common/OB55/CSH/patchupdate/pkennbgiuabA104.ff_extend;https://dl.dir.freefiremobile.com/common/OB55/CSH/patchupdate/pkennbgiuabA105.ff_extend',
    billboard_msg: '',
    web_url: '',
    billboard_bg_url: 'https://dl.cdn.freefiremobile.com/common/OB23/version/Patch_Bg.png',
    max_store: '',
    max_web: '',
    max_video: '',
    patchnote_url: 'https://cdn.wildflamestudio.com/common/web_event/aswqooiwd/TsHBYLel.html?lang=en',
    multi_region: '',
    need_check_ip_list: ['202.81.108.9'],
    network_log_server: 'https://sgnetwork.ggblueshark.com/',
    web_log_server: 'https://networkselftest.ff.garena.com/api/',
    login_failed_count: 2,
    test_url: 'https://dl.cvs.freefiremobile.com/live/ABHotUpdates/nettest',
    core_url: 'csoversea.castle.freefiremobile.com',
    core_ip_list: ['0.0.0.0', '50.109.27.134', '129.226.2.163', '129.226.1.13', '129.226.1.16'],
    appstore_url: 'http://play.google.com/store/apps/details?id=com.dts.freefiremax',
    backup_appstore_url: 'http://play.google.com/store/apps/details?id=com.dts.freefireth',
    garena_login: false,
    garena_hint: false,
    gop_url: '',
    gamevar:
      'var_name,comment,var_type,var_value,var_region,var_platform\nvar_name,comment,var_type,var_value,var_region,var_platform\nLoadGppLibSOToABHotUpdate,LoadGppLibSOToABHotUpdate,bool,true,,\nEnableReplaceGGPSO,EnableReplaceGGPSO,bool,true,,\nEnableReplaceGGPSO_2022,EnableReplaceGGPSO_2022,bool,true,,\nDelGameObjectTypeSet,DelGameObjectTypeSet,int,0,,ios\nUseCompactForBaseObjectMgr,UseCompactForBaseObjectMgr,int,0,,ios\nEnable2018ABstreamed,Enable2018ABstreamed,bool,false,,ios\nDisableMishaForHorse,DisableMishaForHorse,bool,true,,\nEnableGMSDKAppleCustomAgeGate,EnableGMSDKAppleCustomAgeGate,bool,false,,\nEnableTypeTreeInternPool,EnableTypeTreeInternPool,bool,false,,ios\nAvatarGuildUrlIND,AvatarGuildUrlIND,string,https://chars.intro.web.freefireindiamobile.com/api/avatar?region={0}&lang={1}&avatar_id={2},,\nEnableVehicleOverdriveTunnelingFix,EnableVehicleOverdriveTunnelingFix,bool,false,,',
    remote_option_version:
      'optionallocres:51|optionalavatarres:744|optionalclothres:1187|optionalfootballres:47|optionalfullscreencgres:334|optionalhuntinggroundres:178|optionalinfection:121|optionalingameres:480|optionallobbyres:634|optionallonewolfres:77|optionallonewolfstrikeoutres:23|optionalludores:40|optionalmap1res:391|optionalmap2res:125|optionalmap4res:110|optionalmaphippores:90|optionalmapres:343|optionalnewblast:138|optionalpetres:876|optionalrushb:123|optionalrushingpetsres:88|optionalsnowduelres:59|optionaltrainingres:88|optionalugcres:551|optionalvoiceres:360|optionalwerewolves:173|optionalmapponyres:200|optionalsocialres:111|optionalwerunres:83|optionalugcoldparadiseres:32|optionalmultiregionres:25',
    remote_option_version_astc:
      'optionallocres:51|optionalavatarres:747|optionalclothres:1187|optionalfootballres:38|optionalfullscreencgres:318|optionalhuntinggroundres:178|optionalinfection:116|optionalingameres:449|optionallobbyres:617|optionallonewolfres:139|optionallonewolfstrikeoutres:96|optionalludores:144|optionalmap1res:391|optionalmap2res:159|optionalmap4res:144|optionalmaphippores:92|optionalmapres:377|optionalnewblast:138|optionalpetres:876|optionalrushb:227|optionalrushingpetsres:192|optionalsnowduelres:59|optionaltrainingres:84|optionalugcres:521|optionalvoiceres:393|optionalwerewolves:277|optionalmapponyres:200|optionalsocialres:106|optionalwerunres:74|optionalugcoldparadiseres:32|optionalmultiregionres:26',
    ggp_url: 'gin.freefiremobile.com',
    vercfg_sign: '1.a0d863aac04d8b16'
  },

  // 1. Primary Static AES-128-CBC Key & IV (used across HTTP APIs & default TCP payloads)
  AES_CBC: {
    KEY_STR: 'Yg&tc%DEuh6%Zc^8',
    IV_STR: '6oyZDr22E3ychjM%',
    KEY_HEX: '5967267463254445756836255a635e38',
    IV_HEX: '366f795a4472323245337963686a4d25',
    KEY_BASE64: 'WWcmdGMlREV1aDYlWmNeOA==',
    IV_BASE64: 'Nm95WkRyMjJFM3ljaGpNJQ==',
    KEY_BYTES: Buffer.from([89, 103, 38, 116, 99, 37, 68, 69, 117, 104, 54, 37, 90, 99, 94, 56]),
    IV_BYTES: Buffer.from([54, 111, 121, 90, 68, 114, 50, 50, 69, 51, 121, 99, 104, 106, 77, 37]),
    ALGORITHM: 'aes-128-cbc',
    BLOCK_SIZE: 16
  },

  // 2. Garena OAuth / MSDK Credentials & HMAC-SHA256 Secret
  GARENA_OAUTH: {
    APP_ID: '100067',
    CLIENT_SECRET_HEX: '2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3',
    CLIENT_SECRET_ASCII: Buffer.from('2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3', 'utf8'),
    CLIENT_SECRET_RAW_BYTES: Buffer.from('2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3', 'hex'),
    MSDK_USER_AGENT: 'GarenaMSDK/4.0.42(NX809J ;Android 9;en;PK;app 1.132.16 2024010012;)',
    UNITY_USER_AGENT_2018: 'UnityPlayer/2018.4.12f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)',
    UNITY_USER_AGENT_2022: 'UnityPlayer/2022.3.47f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)',
    RELEASE_VERSION: 'OB55',
    CLIENT_VERSION: '2.133.18',
    DEFAULT_REGION: 'PK',
    PAKISTAN_GEO_IP: '39.42.100.10'
  },

  // 3. MajorRegister OpenID XOR Key (32-byte cyclic XOR key)
  XOR_KEYS: {
    OPEN_ID_XOR_STR: '00020170000020170000020170000020',
    OPEN_ID_XOR_BYTES: Buffer.from([
      0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37, 0x30,
      0x30, 0x30, 0x30, 0x30, 0x32, 0x31, 0x37, 0x30,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x31,
      0x37, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30
    ])
  },

  // 4. UDP / RUDP Custom 16-Round TEA-CBC & OICQ Framing Constants
  UDP_TEA: {
    DELTA: 0x9E3779B9,
    ROUNDS: 16,
    FIELD_SIZES: { 0: 1, 1: 2, 2: 2, 3: 1, 4: 2 },
    FIELD_NAMES: { 0: 'sendOption', 1: 'cmd', 2: 'orderId', 3: 'flags', 4: 'length' },
    MSG_KEYS: {
      0x63: 'UDP_HELLO (cmd=1)',
      0x5E: 'RUDP_MATCH_PREPARE (cmd=447)',
      0x5A: 'RUDP_MATCH_POST (cmd=448)',
      0x68: 'UDP_ACK_OR_FIRE (cmd=2 / 104 / 105)',
      0x6B: 'UDP_PLAYER_STATE_SYNC (cmd=2001)',
      0x66: 'UDP_PING_66 (cmd=3)',
      0x6D: 'UDP_PING_6D (cmd=3)'
    },
    CRC7_TABLE: [
      0x00, 0x09, 0x12, 0x1B, 0x24, 0x2D, 0x36, 0x3F, 0x48, 0x41, 0x5A, 0x53, 0x6C, 0x65, 0x7E, 0x77,
      0x19, 0x10, 0x0B, 0x02, 0x3D, 0x34, 0x2F, 0x26, 0x51, 0x58, 0x43, 0x4A, 0x75, 0x7C, 0x67, 0x6E,
      0x32, 0x3B, 0x20, 0x29, 0x16, 0x1F, 0x04, 0x0D, 0x7A, 0x73, 0x68, 0x61, 0x5E, 0x57, 0x4C, 0x45,
      0x2B, 0x22, 0x39, 0x30, 0x0F, 0x06, 0x1D, 0x14, 0x63, 0x6A, 0x71, 0x78, 0x47, 0x4E, 0x55, 0x5C,
      0x64, 0x6D, 0x76, 0x7F, 0x40, 0x49, 0x52, 0x5B, 0x2C, 0x25, 0x3E, 0x37, 0x08, 0x01, 0x1A, 0x13,
      0x7D, 0x74, 0x6F, 0x66, 0x59, 0x50, 0x4B, 0x42, 0x35, 0x3C, 0x27, 0x2E, 0x11, 0x18, 0x03, 0x0A,
      0x56, 0x5F, 0x44, 0x4D, 0x72, 0x7B, 0x60, 0x69, 0x1E, 0x17, 0x0C, 0x05, 0x3A, 0x33, 0x28, 0x21,
      0x4F, 0x46, 0x5D, 0x54, 0x6B, 0x62, 0x79, 0x70, 0x07, 0x0E, 0x15, 0x1C, 0x23, 0x2A, 0x31, 0x38,
      0x41, 0x48, 0x53, 0x5A, 0x65, 0x6C, 0x77, 0x7E, 0x09, 0x00, 0x1B, 0x12, 0x2D, 0x24, 0x3F, 0x36,
      0x58, 0x51, 0x4A, 0x43, 0x7C, 0x75, 0x6E, 0x67, 0x10, 0x19, 0x02, 0x0B, 0x34, 0x3D, 0x26, 0x2F,
      0x73, 0x7A, 0x61, 0x68, 0x57, 0x5E, 0x45, 0x4C, 0x3B, 0x32, 0x29, 0x20, 0x1F, 0x16, 0x0D, 0x04,
      0x6A, 0x63, 0x78, 0x71, 0x4E, 0x47, 0x5C, 0x55, 0x22, 0x2B, 0x30, 0x39, 0x06, 0x0F, 0x14, 0x1D,
      0x25, 0x2C, 0x37, 0x3E, 0x01, 0x08, 0x13, 0x1A, 0x6D, 0x64, 0x7F, 0x76, 0x49, 0x40, 0x5B, 0x52,
      0x3C, 0x35, 0x2E, 0x27, 0x18, 0x11, 0x0A, 0x03, 0x74, 0x7D, 0x66, 0x6F, 0x50, 0x59, 0x42, 0x4B,
      0x17, 0x1E, 0x05, 0x0C, 0x33, 0x3A, 0x21, 0x28, 0x5F, 0x56, 0x4D, 0x44, 0x7B, 0x72, 0x69, 0x60,
      0x0E, 0x07, 0x1C, 0x15, 0x2A, 0x23, 0x38, 0x31, 0x46, 0x4F, 0x54, 0x5D, 0x62, 0x6B, 0x70, 0x79
    ]
  },

  // 5. TCP Framing Prefixes & Packet Types (PK / Global Priority)
  TCP_PREFIXES: {
    '7115': { name: 'OnLine_Functional_Auth (PK/Global)', type: 'STARTUP_ONLINE', region: 'PK/GLOBAL' },
    '7119': { name: 'OnLine_Functional_Auth (PK/BD/ID)', type: 'STARTUP_ONLINE', region: 'PK/BD/ID' },
    '7114': { name: 'OnLine_Functional_Auth (Other)', type: 'STARTUP_ONLINE', region: 'OTHER' },
    '9215': { name: 'ChaT_Informational_Auth (PK/Global)', type: 'STARTUP_CHAT', region: 'PK/GLOBAL' },
    '9219': { name: 'ChaT_Informational_Auth (PK/BD/ID)', type: 'STARTUP_CHAT', region: 'PK/BD/ID' },
    '9214': { name: 'ChaT_Informational_Auth (Other)', type: 'STARTUP_CHAT', region: 'OTHER' },
    '0215': { name: 'TCP_KeepAlive (PK/Global)', type: 'KEEPALIVE', region: 'PK/GLOBAL' },
    '0219': { name: 'TCP_KeepAlive (PK/BD/ID)', type: 'KEEPALIVE', region: 'PK/BD/ID' },
    '0214': { name: 'TCP_KeepAlive (Other)', type: 'KEEPALIVE', region: 'OTHER' },
    '0515': { name: 'Squad_Team_Action (PK/Global)', type: 'ENCRYPTED_PROTO', schema: 'SquadTeamPacket' },
    '0519': { name: 'Squad_Ready_Action (PK/Global)', type: 'ENCRYPTED_PROTO', schema: 'SquadTeamPacket' },
    '0315': { name: 'StartMatch_Request (PK/Global)', type: 'ENCRYPTED_PROTO', schema: 'StartMatch' },
    '0314': { name: 'StartMatch_Request (Other)', type: 'ENCRYPTED_PROTO', schema: 'StartMatch' },
    '0300': { name: 'MatchFound_UDP_Assignment', type: 'SERVER_MATCH_FOUND', schema: 'MatchFoundPacket' },
    '0600': { name: 'Social_Friend_Notification', type: 'SERVER_SOCIAL', schema: 'SocialNotificationPacket' },
    '1200': { name: 'Whisper_Chat_Message', type: 'SERVER_CHAT', schema: 'WhisperChatPacket' }
  },

  // 6. Pre-Encrypted Gacha Payloads & Special Item Registry
  GEN_SPIN: {
    ENCRYPTED_PAYLOADS: {
      SPIN_1_HEX: '54DB598CD88299E12EF19C9D2FDC19479A2754B973F8D26AA0706C461A2875B0',
      SPIN_2_HEX: 'B6804A9C3B9B41C40C4EA0439932902D8E4DCA0B0CFC63ADE3A037822663583A'
    },
    SPECIAL_ITEMS: {
      710047023: 'Sasuke Bundle (Without Katana)',
      907104742: 'Katana - Snake Sword',
      907104743: 'Groza - Sasuke Theme',
      710047022: 'Naruto Bundle'
    }
  },

  // 7. Complete Upstream Endpoints & Regional Server Registry (PAKISTAN `PK` #1 PRIORITY — ZERO ASTUTECH!)
  ENDPOINTS: {
    PRIMARY_UPSTREAM: 'https://version.ggwhitehawk.com',
    VERSION_LIVE: 'https://version.ggwhitehawk.com/live/ver.php',
    OAUTH_GUEST_REGISTER: 'https://100067.connect.garena.com/api/v2/oauth/guest:register',
    OAUTH_TOKEN_GRANT: 'https://100067.connect.garena.com/oauth/guest/token/grant',
    OAUTH_TOKEN_GRANT_V2: 'https://100067.connect.garena.com/api/v2/oauth/guest/token:grant',
    OAUTH_TOKEN_INSPECT: 'https://100067.connect.garena.com/oauth/token/inspect',

    // Pakistan (PK) #1 Priority Login & Game API Endpoints
    MAJOR_REGISTER: 'https://loginbp.ppmainecoonghj.com/MajorRegister',
    MAJOR_LOGIN: 'https://loginbp.ppmainecoonghj.com/MajorLogin',
    CHOOSE_NEWBIE: 'https://loginbp.ppmainecoonghj.com/ChooseNewbieChoice',
    LOGIN_PING: 'https://loginbp.ppmainecoonghj.com/Ping',
    GET_LOGIN_DATA_PK: 'https://clientbp.ppmainecoonghj.com/GetLoginData',
    GET_PLAYER_PERSONAL_SHOW: 'https://clientbp.ppmainecoonghj.com/GetPlayerPersonalShow',
    LIKE_PROFILE: 'https://clientbp.ppmainecoonghj.com/LikeProfile',
    CONFIRM_FRIEND_REQ: 'https://clientbp.ppmainecoonghj.com/ConfirmFriendRequest',
    PURCHASE_GACHA_PK: 'https://clientbp.ppmainecoonghj.com/PurchaseGacha',
    SEARCH_WORKSHOP: 'https://clientbp.ppmainecoonghj.com/SearchWorkshopCode',

    VERSION_SERVERS_PRIORITY: [
      'https://version.ggwhitehawk.com',
      'https://version.ggpolarbear.com',
      'https://version.ggblueshark.com',
      'https://version.common.freefiremobile.com'
    ],
    LOGIN_SERVERS_PRIORITY: [
      'https://loginbp.ppmainecoonghj.com', // #1 Pakistan (PK) Primary Login Server
      'https://loginbp.ggpolarbear.com',    // #2 Pakistan / Global MAX Login Server
      'https://loginbp.ggblueshark.com'     // #3 SG / BD / ME Login Server
    ],
    CLIENT_API_SERVERS_PRIORITY: [
      'https://clientbp.ppmainecoonghj.com', // #1 Pakistan (PK) Primary Lobby & Outfit API
      'https://clientbp.ggpolarbear.com',    // #2 Pakistan / SG / BD / ME / Global MAX API
      'https://clientbp.ggblueshark.com',    // #3 SG / SEA / Global API
      'https://client.us.freefiremobile.com', // #4 Brazil (BR) / US / SAC / NA
      'https://client.ru.freefiremobile.com'  // #5 Europe (EU) / CIS / ME
    ],
    CDN_SERVERS_PRIORITY: [
      'https://dl.gmc.freefiremobile.com',           // #1 Pakistan (PK) Primary Clothes, Bundles & ASTC Icons CDN
      'https://core-gmc.freefiremobile.com',         // #2 Pakistan (PK) Primary Core HotUpdate CDN
      'https://cdn.wildflamestudio.com',             // #3 Pakistan (PK) Billboard & Patchnote Web Event CDN
      'https://dl.cdn.freefiremobile.com',           // #4 Pakistan (PK) Billboard BG & Common Image CDN
      'https://dl.dir.freefiremobile.com',           // #5 Global / OB55 Patchupdate Dir CDN
      'https://dl-sg-production.freefiremobile.com', // #6 SG / PK Production Asset CDN
      'https://dl.bs.freefiremobile.com',            // #7 Blueshark HotUpdate CDN
      'https://core-bs.freefiremobile.com',          // #8 Blueshark Core HotUpdate CDN
      'https://dl.aw.freefiremobile.com'             // #9 AWS Global HotUpdate Mirror
    ]
  },

  // 8. Top-up CSRF Token
  MAIN_PHP: {
    TARGET_BASE_URL: 'https://ffbdtopup-com.vercel.app/',
    CSRF_TOKEN: 'c5f8e6d2b9c1047a3f1a4d5c9a0b4e7f2e0f6f8e9a3d5f2c4a8d9e7b1c2d3e4f'
  }
};

module.exports = KEYS;
