/**
 * ============================================================================
 * FF-OMNI-PROXY: Master Cryptographic Keys, Secrets, Tables & Endpoint Registry
 * ============================================================================
 * Extracted and consolidated from all 10 uploaded archives & scripts:
 *  - GenXDivan.py
 *  - GenSpin.py
 *  - GG.GLORY.zip (main.py, app.py, message_ids.py, RbcFF_pb2, RbcTeam_pb2, StartMatch_pb2, thunderFF_pb2)
 *  - LW UDP SOURCE.zip (Main.py, dashboard_server.py, message_ids.py, thunderFF_pb2)
 *  - Info-Api-Src.zip (app.py, AccountPersonalShow.proto, FreeFire.proto, sample.proto)
 *  - OB55_LIKE_LIMIT-CK(1).zip & UID-PASS-LIKE-API.zip (app.py, like.proto, like_count.proto, uid_generator.proto)
 *  - main.php (topup token & API config)
 */

const KEYS = {
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

  // 2. Garena OAuth / MSDK Credentials & HMAC-SHA256 Secret (GenXDivan.py, GenSpin.py, GG.GLORY, LW UDP)
  GARENA_OAUTH: {
    APP_ID: '100067',
    CLIENT_SECRET_HEX: '2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3',
    CLIENT_SECRET_ASCII: Buffer.from('2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3', 'utf8'),
    CLIENT_SECRET_RAW_BYTES: Buffer.from('2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3', 'hex'),
    MSDK_USER_AGENT: 'GarenaMSDK/4.0.42(NX809J ;Android 9;en;US;app 1.132.9 2024010012;)',
    UNITY_USER_AGENT_2018: 'UnityPlayer/2018.4.12f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)',
    UNITY_USER_AGENT_2022: 'UnityPlayer/2022.3.47f1 (UnityWebRequest/1.0, libcurl/8.5.0-DEV)',
    RELEASE_VERSION: 'OB55',
    CLIENT_VERSION: '1.132.9'
  },

  // 3. MajorRegister OpenID XOR Key (32-byte cyclic XOR key from GenXDivan.py & GenSpin.py)
  XOR_KEYS: {
    OPEN_ID_XOR_STR: '00020170000020170000020170000020',
    OPEN_ID_XOR_BYTES: Buffer.from([
      0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37, 0x30,
      0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x31, 0x37,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30, 0x31,
      0x37, 0x30, 0x30, 0x30, 0x30, 0x30, 0x32, 0x30
    ])
  },

  // 4. UDP / RUDP Custom 16-Round TEA-CBC & OICQ Framing Constants (GG.GLORY & LW UDP SOURCE)
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

  // 5. TCP Framing Prefixes & Packet Types (GG.GLORY & LW UDP SOURCE)
  TCP_PREFIXES: {
    '7119': { name: 'OnLine_Functional_Auth (ID/BD)', type: 'STARTUP_ONLINE', region: 'ID/BD' },
    '7114': { name: 'OnLine_Functional_Auth (IND)', type: 'STARTUP_ONLINE', region: 'IND' },
    '7115': { name: 'OnLine_Functional_Auth (Global)', type: 'STARTUP_ONLINE', region: 'GLOBAL' },
    '9219': { name: 'ChaT_Informational_Auth (ID/BD)', type: 'STARTUP_CHAT', region: 'ID/BD' },
    '9214': { name: 'ChaT_Informational_Auth (IND)', type: 'STARTUP_CHAT', region: 'IND' },
    '9215': { name: 'ChaT_Informational_Auth (Global)', type: 'STARTUP_CHAT', region: 'GLOBAL' },
    '0219': { name: 'TCP_KeepAlive (ID/BD)', type: 'KEEPALIVE', region: 'ID/BD' },
    '0214': { name: 'TCP_KeepAlive (IND)', type: 'KEEPALIVE', region: 'IND' },
    '0215': { name: 'TCP_KeepAlive (Global)', type: 'KEEPALIVE', region: 'GLOBAL' },
    '0515': { name: 'Squad_Team_Action', type: 'ENCRYPTED_PROTO', schema: 'SquadTeamPacket' },
    '0519': { name: 'Squad_Ready_Action', type: 'ENCRYPTED_PROTO', schema: 'SquadTeamPacket' },
    '0315': { name: 'StartMatch_Request (Global)', type: 'ENCRYPTED_PROTO', schema: 'StartMatch' },
    '0314': { name: 'StartMatch_Request (IND)', type: 'ENCRYPTED_PROTO', schema: 'StartMatch' },
    '0300': { name: 'MatchFound_UDP_Assignment', type: 'SERVER_MATCH_FOUND', schema: 'MatchFoundPacket' },
    '0600': { name: 'Social_Friend_Notification', type: 'SERVER_SOCIAL', schema: 'SocialNotificationPacket' },
    '1200': { name: 'Whisper_Chat_Message', type: 'SERVER_CHAT', schema: 'WhisperChatPacket' }
  },

  // 6. Pre-Encrypted Gacha Payloads & Special Item Registry (GenSpin.py)
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

  // 7. Known Upstream Endpoints & Target Hosts across all 10 files
  ENDPOINTS: {
    OAUTH_GUEST_REGISTER: 'https://100067.connect.garena.com/api/v2/oauth/guest:register',
    OAUTH_TOKEN_GRANT: 'https://100067.connect.garena.com/oauth/guest/token/grant',
    OAUTH_TOKEN_GRANT_V2: 'https://100067.connect.garena.com/api/v2/oauth/guest/token:grant',
    OAUTH_TOKEN_INSPECT: 'https://100067.connect.garena.com/oauth/token/inspect',
    MAJOR_REGISTER: 'https://loginbp.ppmainecoonghj.com/MajorRegister',
    MAJOR_LOGIN: 'https://loginbp.ppmainecoonghj.com/MajorLogin',
    CHOOSE_NEWBIE: 'https://loginbp.ppmainecoonghj.com/ChooseNewbieChoice',
    LOGIN_PING: 'https://loginbp.ppmainecoonghj.com/Ping',
    GET_LOGIN_DATA_BP: 'https://clientbp.ppmainecoonghj.com/GetLoginData',
    GET_LOGIN_DATA_IND: 'https://client.ind.freefiremobile.com/GetLoginData',
    GET_PLAYER_PERSONAL_SHOW: 'https://clientbp.ppmainecoonghj.com/GetPlayerPersonalShow',
    LIKE_PROFILE: 'https://clientbp.ppmainecoonghj.com/LikeProfile',
    CONFIRM_FRIEND_REQ: 'https://clientbp.ppmainecoonghj.com/ConfirmFriendRequest',
    PURCHASE_GACHA_IND: 'https://client.ind.freefiremobile.com/PurchaseGacha',
    SEARCH_WORKSHOP: 'https://clientbp.ggpolarbear.com/SearchWorkshopCode',
    VERSION_LIVE: 'https://version.ggwhitehawk.com/live/ver.php',
    REGIONAL_SERVERS: {
      IND: 'https://client.ind.freefiremobile.com',
      BR_US_SAC_NA: 'https://client.us.freefiremobile.com',
      EU_ME_CIS: 'https://client.ru.freefiremobile.com',
      DEFAULT_BP: 'https://clientbp.ggpolarbear.com',
      MAIN_BP: 'https://clientbp.ppmainecoonghj.com'
    },
    EXTERNAL_SERVICES: {
      DIVAN_ACTIVATOR: 'https://divan-activator.vercel.app/bind',
      FLASH_TOKEN: 'https://flash-token-v2.vercel.app/token',
      LUNES_TOKEN: 'http://node54.lunes.host:3069/token',
      FFBD_TOPUP: 'https://ffbdtopup-com.vercel.app/'
    }
  },

  // 8. Top-up CSRF Token from main.php
  MAIN_PHP: {
    TARGET_BASE_URL: 'https://ffbdtopup-com.vercel.app/',
    CSRF_TOKEN: 'c5f8e6d2b9c1047a3f1a4d5c9a0b4e7f2e0f6f8e9a3d5f2c4a8d9e7b1c2d3e4f'
  }
};

module.exports = KEYS;
