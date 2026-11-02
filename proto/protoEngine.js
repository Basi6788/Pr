/**
 * ============================================================================
 * FF-OMNI-PROXY: Schema-Aware Recursive Protobuf Wire Decoder & Encoder
 * ============================================================================
 * Supports all Protobuf messages extracted from the 10 uploaded files:
 *  - MajorLoginReq / MajorLoginRes / MajorLoginGameSecurity / BlacklistInfoRes
 *  - MajorRegisterReq / ChooseNewbieChoiceReq
 *  - GetLoginDataRes
 *  - StartMatch / StartUDPMatch / MatchFoundPacket / SquadTeamPacket
 *  - AccountPersonalShowInfo / AccountInfoBasic / GetPlayerPersonalShowReq
 *  - LikeProfileReq / ConfirmFriendReq / UidGeneratorReq / PurchaseGachaReq
 */

const KEYS = require('../config/keys');

const SCHEMAS = {
  MajorLoginReq: {
    3: { name: 'event_time', type: 'string' },
    4: { name: 'game_name', type: 'string' },
    5: { name: 'platform_id', type: 'uint32' },
    7: { name: 'client_version', type: 'string' },
    8: { name: 'system_software', type: 'string' },
    9: { name: 'system_hardware', type: 'string' },
    10: { name: 'telecom_operator', type: 'string' },
    11: { name: 'network_type', type: 'string' },
    12: { name: 'screen_width', type: 'uint32' },
    13: { name: 'screen_height', type: 'uint32' },
    14: { name: 'screen_dpi', type: 'string' },
    15: { name: 'processor_details', type: 'string' },
    16: { name: 'memory', type: 'uint32' },
    17: { name: 'gpu_renderer', type: 'string' },
    18: { name: 'gpu_version', type: 'string' },
    19: { name: 'unique_device_id', type: 'string' },
    20: { name: 'client_ip', type: 'string' },
    21: { name: 'language', type: 'string' },
    22: { name: 'open_id', type: 'string' },
    23: { name: 'open_id_type', type: 'string' },
    24: { name: 'device_type', type: 'string' },
    25: { name: 'device_model', type: 'string' },
    26: { name: 'country_code', type: 'string' },
    29: { name: 'access_token', type: 'string' },
    30: { name: 'platform_sdk_id', type: 'uint32' },
    33: { name: 'game_security_data', type: 'bytes' },
    41: { name: 'network_operator_a', type: 'string' },
    42: { name: 'network_type_a', type: 'string' },
    57: { name: 'client_using_version', type: 'string' },
    60: { name: 'external_storage_total', type: 'int32' },
    61: { name: 'external_storage_available', type: 'int32' },
    62: { name: 'internal_storage_total', type: 'int32' },
    63: { name: 'internal_storage_available', type: 'int32' },
    64: { name: 'game_disk_storage_available', type: 'int32' },
    65: { name: 'game_disk_storage_total', type: 'int32' },
    66: { name: 'external_sdcard_avail_storage', type: 'int32' },
    67: { name: 'external_sdcard_total_storage', type: 'int32' },
    70: { name: 'field_70', type: 'int32' },
    73: { name: 'login_by', type: 'int32' },
    74: { name: 'library_path', type: 'string' },
    76: { name: 'reg_avatar', type: 'int32' },
    77: { name: 'library_token', type: 'string' },
    78: { name: 'channel_type', type: 'int32' },
    79: { name: 'cpu_type', type: 'int32' },
    81: { name: 'cpu_architecture', type: 'string' },
    83: { name: 'client_version_code', type: 'string' },
    85: { name: 'field_85', type: 'int32' },
    86: { name: 'graphics_api', type: 'string' },
    87: { name: 'supported_astc_bitset', type: 'uint32' },
    88: { name: 'login_open_id_type', type: 'int32' },
    89: { name: 'analytics_detail', type: 'bytes' },
    90: { name: 'field_90', type: 'string' },
    91: { name: 'field_91', type: 'string' },
    92: { name: 'loading_time', type: 'uint32' },
    93: { name: 'release_channel', type: 'string' },
    94: { name: 'extra_info', type: 'string' },
    95: { name: 'android_engine_init_flag', type: 'uint32' },
    96: { name: 'field_96', type: 'string' },
    97: { name: 'if_push', type: 'int32' },
    98: { name: 'is_vpn', type: 'int32' },
    99: { name: 'origin_platform_type', type: 'string' },
    100: { name: 'primary_platform_type', type: 'string' },
    102: { name: 'game_security_info', type: 'message', schema: 'MajorLoginGameSecurity' },
    104: { name: 'field_104', type: 'uint32' },
    105: { name: 'field_105', type: 'int32' },
    106: { name: 'field_106', type: 'string' },
    107: { name: 'field_107', type: 'string' }
  },

  MajorLoginGameSecurity: {
    1: { name: 'raw_1', type: 'bytes' },
    2: { name: 'f2', type: 'uint32' },
    4: { name: 'f4', type: 'uint32' },
    5: { name: 'version', type: 'string' },
    6: { name: 'raw_6', type: 'bytes' }
  },

  MajorLoginRes: {
    1: { name: 'account_id', type: 'uint64' },
    2: { name: 'lock_region', type: 'string' },
    3: { name: 'noti_region', type: 'string' },
    4: { name: 'ip_region', type: 'string' },
    8: { name: 'token', type: 'jwt' },
    9: { name: 'ttl', type: 'uint32' },
    10: { name: 'server_url', type: 'string' },
    11: { name: 'emulator_score', type: 'int32' },
    12: { name: 'blacklist', type: 'message', schema: 'BlacklistInfoRes' },
    16: { name: 'ip_city', type: 'string' },
    17: { name: 'ip_subdivision', type: 'string' },
    21: { name: 'kts', type: 'uint32' },
    22: { name: 'aes_ak', type: 'bytes_ascii' },
    23: { name: 'aes_aiv', type: 'bytes_ascii' }
  },

  BlacklistInfoRes: {
    1: { name: 'ban_reason', type: 'int32' },
    2: { name: 'expire_duration', type: 'int32' },
    3: { name: 'ban_time', type: 'int64' }
  },

  MajorRegisterReq: {
    1: { name: 'nickname', type: 'string' },
    2: { name: 'access_token', type: 'string' },
    3: { name: 'open_id', type: 'string' },
    4: { name: 'platform_id', type: 'uint32' },
    5: { name: 'flag_5', type: 'uint32' },
    6: { name: 'flag_6', type: 'uint32' },
    7: { name: 'device_model', type: 'string' },
    8: { name: 'system_software', type: 'string' },
    10: { name: 'telecom_operator', type: 'string' },
    12: { name: 'flag_12', type: 'uint32' },
    13: { name: 'language', type: 'string' },
    14: { name: 'xored_open_id', type: 'xored_open_id' },
    15: { name: 'region', type: 'string' },
    16: { name: 'flag_16', type: 'uint32' },
    17: { name: 'client_version', type: 'string' }
  },

  ChooseNewbieChoiceReq: {
    1: { name: 'choice_id', type: 'uint32' },
    2: { name: 'step', type: 'uint32' }
  },

  GetLoginDataRes: {
    1: { name: 'account_id', type: 'uint64' },
    3: { name: 'region', type: 'string' },
    4: { name: 'nickname', type: 'string' },
    6: { name: 'level', type: 'uint32' },
    7: { name: 'exp', type: 'uint32' },
    12: { name: 'clan_id', type: 'int32' },
    14: { name: 'functional_addrs', type: 'string' },
    21: { name: 'likes', type: 'int32' },
    32: { name: 'informational_addrs', type: 'string' },
    44: { name: 'servers', type: 'message', schema: 'GenericSubMessage' },
    58: { name: 'clan_name', type: 'string' },
    62: { name: 'grtc', type: 'string' }
  },

  GetPlayerPersonalShowReq: {
    1: { name: 'uid', type: 'uint64' },
    2: { name: 'need_gallery_info', type: 'int32' }
  },

  AccountPersonalShowInfo: {
    1: { name: 'basic_info', type: 'message', schema: 'AccountInfoBasic' },
    2: { name: 'avatar_profile', type: 'message', schema: 'AvatarProfile' },
    3: { name: 'ranking_leaderboard_pos', type: 'int32' },
    4: { name: 'news', type: 'message', schema: 'GenericSubMessage' },
    5: { name: 'history_ep_info', type: 'message', schema: 'GenericSubMessage' },
    6: { name: 'clan_basic_info', type: 'message', schema: 'ClanInfoBasic' },
    7: { name: 'captain_basic_info', type: 'message', schema: 'AccountInfoBasic' },
    8: { name: 'pet_info', type: 'message', schema: 'PetInfo' },
    9: { name: 'social_info', type: 'message', schema: 'SocialBasicInfo' },
    10: { name: 'diamond_cost_res', type: 'message', schema: 'DiamondCostRes' },
    11: { name: 'credit_score_info', type: 'message', schema: 'CreditScoreInfoBasic' }
  },

  AccountInfoBasic: {
    1: { name: 'account_id', type: 'uint64' },
    2: { name: 'account_type', type: 'uint32' },
    3: { name: 'nickname', type: 'string' },
    4: { name: 'external_id', type: 'string' },
    5: { name: 'region', type: 'string' },
    6: { name: 'level', type: 'uint32' },
    7: { name: 'exp', type: 'uint32' },
    8: { name: 'external_type', type: 'uint32' },
    9: { name: 'external_name', type: 'string' },
    10: { name: 'external_icon', type: 'string' },
    11: { name: 'banner_id', type: 'uint32' },
    12: { name: 'head_pic', type: 'uint32' },
    13: { name: 'clan_name', type: 'string' },
    14: { name: 'rank', type: 'uint32' },
    15: { name: 'ranking_points', type: 'uint32' },
    16: { name: 'role', type: 'uint32' },
    17: { name: 'has_elite_pass', type: 'bool' },
    18: { name: 'badge_cnt', type: 'uint32' },
    19: { name: 'badge_id', type: 'uint32' },
    20: { name: 'season_id', type: 'uint32' },
    21: { name: 'liked', type: 'uint32' },
    24: { name: 'last_login_at', type: 'int64' },
    25: { name: 'external_uid', type: 'uint64' },
    26: { name: 'return_at', type: 'int64' },
    30: { name: 'cs_rank', type: 'uint32' },
    31: { name: 'cs_ranking_points', type: 'uint32' },
    32: { name: 'weapon_skin_shows', type: 'uint32' },
    33: { name: 'pin_id', type: 'uint32' },
    35: { name: 'max_rank', type: 'uint32' },
    36: { name: 'cs_max_rank', type: 'uint32' },
    44: { name: 'create_at', type: 'int64' },
    48: { name: 'title', type: 'uint32' },
    50: { name: 'release_version', type: 'string' },
    54: { name: 'clan_id', type: 'uint64' }
  },

  AvatarProfile: {
    1: { name: 'top_shirt', type: 'uint32' },
    2: { name: 'bottom_pants', type: 'uint32' },
    4: { name: 'clothes', type: 'uint32' },
    5: { name: 'CharacterId', type: 'string' },
    6: { name: 'skin_color', type: 'uint32' },
    7: { name: 'equiped_skills', type: 'uint32' },
    8: { name: 'is_selected', type: 'bool' },
    9: { name: 'pve_primary_weapon', type: 'uint32' },
    10: { name: 'is_selected_awaken', type: 'bool' },
    11: { name: 'end_time', type: 'uint32' },
    12: { name: 'unlock_type', type: 'uint32' },
    13: { name: 'unlock_time', type: 'uint32' },
    14: { name: 'is_marked_star', type: 'bool' },
    15: { name: 'clothes_tailor_effects', type: 'uint32' }
  },

  ClanInfoBasic: {
    1: { name: 'clan_id', type: 'uint64' },
    2: { name: 'clan_name', type: 'string' },
    3: { name: 'captain_id', type: 'uint64' },
    4: { name: 'clan_level', type: 'uint32' },
    5: { name: 'capacity', type: 'uint32' },
    6: { name: 'member_num', type: 'uint32' },
    7: { name: 'honor_point', type: 'uint32' }
  },

  PetInfo: {
    1: { name: 'id', type: 'uint32' },
    2: { name: 'name', type: 'string' },
    3: { name: 'level', type: 'uint32' },
    4: { name: 'exp', type: 'uint32' },
    5: { name: 'is_selected', type: 'bool' },
    6: { name: 'skin_id', type: 'uint32' },
    7: { name: 'actions', type: 'uint32' },
    9: { name: 'selected_skill_id', type: 'uint32' }
  },

  SocialBasicInfo: {
    1: { name: 'account_id', type: 'uint64' },
    2: { name: 'gender', type: 'uint32' },
    3: { name: 'language', type: 'uint32' },
    4: { name: 'time_online', type: 'uint32' },
    5: { name: 'time_active', type: 'uint32' },
    6: { name: 'battle_tag', type: 'uint32' },
    7: { name: 'social_tag', type: 'uint32' },
    8: { name: 'mode_prefer', type: 'uint32' },
    9: { name: 'signature', type: 'string' },
    10: { name: 'rank_show', type: 'uint32' }
  },

  DiamondCostRes: {
    1: { name: 'diamond_cost', type: 'uint32' }
  },

  CreditScoreInfoBasic: {
    1: { name: 'credit_score', type: 'uint32' },
    2: { name: 'is_init', type: 'bool' },
    3: { name: 'reward_state', type: 'uint32' },
    4: { name: 'periodic_summary_like_cnt', type: 'uint32' },
    5: { name: 'periodic_summary_illegal_cnt', type: 'uint32' },
    6: { name: 'weekly_match_cnt', type: 'uint32' },
    7: { name: 'periodic_summary_start_time', type: 'int64' },
    8: { name: 'periodic_summary_end_time', type: 'int64' }
  },

  LikeProfileReq: {
    1: { name: 'uid', type: 'uint64' },
    2: { name: 'region', type: 'string' }
  },

  ConfirmFriendRequestReq: {
    1: { name: 'target_uid', type: 'uint64' },
    2: { name: 'action', type: 'uint32' },
    3: { name: 'source', type: 'uint32' },
    6: { name: 'nickname', type: 'string' },
    7: { name: 'platform', type: 'uint32' },
    9: { name: 'extra', type: 'message', schema: 'GenericSubMessage' },
    10: { name: 'region', type: 'string' }
  },

  PurchaseGachaReq: {
    1: { name: 'gacha_id', type: 'uint32' },
    2: { name: 'draw_count', type: 'uint32' },
    3: { name: 'event_id', type: 'uint32' },
    4: { name: 'currency_type', type: 'uint32' },
    7: { name: 'flag_7', type: 'uint32' },
    8: { name: 'flag_8', type: 'uint32' },
    9: { name: 'flag_9', type: 'uint32' },
    10: { name: 'flag_10', type: 'uint32' },
    11: { name: 'flag_11', type: 'uint32' },
    13: { name: 'flag_13', type: 'uint32' }
  },

  StartMatch: {
    1: { name: 'mode', type: 'uint32' },
    2: { name: 'region_id', type: 'uint32' },
    3: { name: 'sub_mode', type: 'uint32' },
    4: { name: 'map_id', type: 'uint32' },
    5: { name: 'team_size', type: 'uint32' },
    7: { name: 'client_version', type: 'string' },
    9: { name: 'flag_9', type: 'uint32' },
    13: { name: 'extra_flag', type: 'uint32' }
  },

  StartUDPMatch: {
    1: { name: 'account_id', type: 'uint64' },
    2: { name: 'nickname', type: 'string' },
    3: { name: 'match_token', type: 'jwt' },
    4: { name: 'sub_mode', type: 'uint32' },
    5: { name: 'device_model', type: 'string' },
    6: { name: 'gpu_renderer', type: 'string' },
    7: { name: 'memory', type: 'uint32' },
    9: { name: 'extra_flag', type: 'uint32' },
    12: { name: 'ip_address', type: 'string' },
    20: { name: 'client_version', type: 'string' }
  },

  SquadTeamPacket: {
    1: { name: 'action_id', type: 'uint32' },
    2: { name: 'payload', type: 'message', schema: 'SquadTeamPayload' }
  },

  SquadTeamPayload: {
    1: { name: 'target_or_mode', type: 'uint64' },
    2: { name: 'region_or_code', type: 'string' },
    3: { name: 'team_size_or_slot', type: 'uint32' },
    4: { name: 'extra_info', type: 'string' },
    5: { name: 'leader_uid', type: 'uint64' },
    6: { name: 'flag_6', type: 'uint32' },
    7: { name: 'flag_7', type: 'uint32' },
    8: { name: 'version_str', type: 'string' },
    9: { name: 'flag_9', type: 'uint32' },
    11: { name: 'flag_11', type: 'uint32' }
  },

  MatchFoundPacket: {
    1: { name: 'account_id', type: 'uint64' },
    5: { name: 'server_info', type: 'message', schema: 'MatchFoundServerInfo' },
    42: { name: 'match_code', type: 'string' }
  },

  MatchFoundServerInfo: {
    1: { name: 'block_val', type: 'uint64' },
    2: { name: 'server_ip_port', type: 'string' },
    3: { name: 'udp_key', type: 'bytes' },
    4: { name: 'match_token', type: 'jwt' },
    42: { name: 'match_code', type: 'string' }
  }
};

// Map HTTP URL path -> Request & Response Schema
const ENDPOINT_SCHEMA_MAP = {
  '/MajorLogin': { req: 'MajorLoginReq', res: 'MajorLoginRes' },
  '/MajorRegister': { req: 'MajorRegisterReq', res: 'MajorLoginRes' },
  '/ChooseNewbieChoice': { req: 'ChooseNewbieChoiceReq', res: 'GenericSubMessage' },
  '/GetLoginData': { req: 'GenericSubMessage', res: 'GetLoginDataRes' },
  '/GetPlayerPersonalShow': { req: 'GetPlayerPersonalShowReq', res: 'AccountPersonalShowInfo' },
  '/LikeProfile': { req: 'LikeProfileReq', res: 'GenericSubMessage' },
  '/ConfirmFriendRequest': { req: 'ConfirmFriendRequestReq', res: 'GenericSubMessage' },
  '/PurchaseGacha': { req: 'PurchaseGachaReq', res: 'GenericSubMessage' }
};

/**
 * Decode JWT payload if string looks like a valid 3-part JWT
 */
function tryDecodeJwt(str) {
  if (typeof str !== 'string') return null;
  const parts = str.split('.');
  if (parts.length !== 3 || !str.startsWith('eyJ')) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return { jwt_raw: str.slice(0, 48) + '...', header, payload };
  } catch (_) {
    return null;
  }
}

/**
 * Decode XORed open_id from MajorRegister field 14 using KEYS.XOR_KEYS.OPEN_ID_XOR_BYTES
 */
function decodeXoredOpenId(buf) {
  const xorKey = KEYS.XOR_KEYS.OPEN_ID_XOR_BYTES;
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ xorKey[i % xorKey.length];
  }
  return out.toString('utf8');
}

/**
 * Check if a Buffer is clean printable UTF-8
 */
function isPrintableUtf8(buf) {
  if (!buf || buf.length === 0) return false;
  const str = buf.toString('utf8');
  if (str.includes('\ufffd')) return false;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) return false;
  }
  return true;
}

/**
 * Read a Protobuf Varint (up to 64 bits) at offset
 */
function readVarint(buf, offset) {
  let result = 0n;
  let shift = 0n;
  let pos = offset;
  while (pos < buf.length) {
    const b = buf[pos++];
    result |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) {
      const numVal = result <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(result) : result.toString();
      return { value: numVal, bigValue: result, nextOffset: pos };
    }
    shift += 7n;
    if (shift > 70n) return null;
  }
  return null;
}

/**
 * Recursive Protobuf Wire-Format Decoder with Schema Resolution
 */
function decodeProtobuf(buf, schemaName = null, depth = 0) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
  if (buf.length === 0 || depth > 6) return null;

  const schema = schemaName && SCHEMAS[schemaName] ? SCHEMAS[schemaName] : null;
  const result = {};
  const rawFields = [];
  let offset = 0;
  let validFields = 0;

  while (offset < buf.length) {
    const tagVar = readVarint(buf, offset);
    if (!tagVar) break;
    const tag = Number(tagVar.bigValue);
    const fieldNo = tag >>> 3;
    const wireType = tag & 0x07;
    offset = tagVar.nextOffset;

    if (fieldNo <= 0 || fieldNo > 50000) {
      if (validFields === 0) return null;
      break;
    }

    const fieldDef = schema && schema[fieldNo] ? schema[fieldNo] : null;
    const keyLabel = fieldDef ? `${fieldDef.name} (#${fieldNo})` : `field_${fieldNo}`;
    let parsedValue = null;

    if (wireType === 0) {
      // Varint
      const v = readVarint(buf, offset);
      if (!v) break;
      offset = v.nextOffset;
      parsedValue = v.value;
      if (fieldDef && fieldDef.type === 'bool') {
        parsedValue = Boolean(v.value);
      } else if ( KEYS.GEN_SPIN.SPECIAL_ITEMS[parsedValue] ) {
        parsedValue = `${parsedValue} (${KEYS.GEN_SPIN.SPECIAL_ITEMS[parsedValue]})`;
      }
      validFields++;
    } else if (wireType === 1) {
      // 64-bit Fixed
      if (offset + 8 > buf.length) break;
      const u64 = buf.readBigUInt64LE(offset);
      offset += 8;
      parsedValue = u64 <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(u64) : u64.toString();
      validFields++;
    } else if (wireType === 2) {
      // Length-delimited
      const lenVar = readVarint(buf, offset);
      if (!lenVar) break;
      const len = Number(lenVar.bigValue);
      offset = lenVar.nextOffset;
      if (len < 0 || offset + len > buf.length) {
        if (validFields === 0) return null;
        break;
      }
      const subBuf = buf.subarray(offset, offset + len);
      offset += len;

      if (fieldDef && fieldDef.type === 'xored_open_id') {
        parsedValue = {
          cipher_hex: subBuf.toString('hex'),
          decrypted_open_id: decodeXoredOpenId(subBuf)
        };
      } else if (fieldDef && fieldDef.type === 'bytes_ascii') {
        parsedValue = {
          hex: subBuf.toString('hex'),
          ascii: isPrintableUtf8(subBuf) ? subBuf.toString('utf8') : null,
          base64: subBuf.toString('base64')
        };
      } else if (fieldDef && fieldDef.type === 'jwt') {
        const str = subBuf.toString('utf8');
        parsedValue = tryDecodeJwt(str) || str;
      } else if (fieldDef && fieldDef.type === 'message') {
        const subDecoded = decodeProtobuf(subBuf, fieldDef.schema, depth + 1);
        parsedValue = subDecoded ? subDecoded.fields : `0x${subBuf.toString('hex')}`;
      } else if (fieldDef && fieldDef.type === 'string') {
        const str = subBuf.toString('utf8');
        parsedValue = tryDecodeJwt(str) || str;
      } else if (fieldDef && fieldDef.type === 'bytes') {
        parsedValue = `0x${subBuf.toString('hex')}`;
      } else {
        // Heuristic auto-detection for unknown length-delimited fields
        if (isPrintableUtf8(subBuf) && subBuf.length > 0) {
          const str = subBuf.toString('utf8');
          parsedValue = tryDecodeJwt(str) || str;
        } else if (subBuf.length >= 2) {
          const nested = decodeProtobuf(subBuf, null, depth + 1);
          if (nested && nested.fullyConsumed && Object.keys(nested.fields).length > 0) {
            parsedValue = nested.fields;
          } else {
            parsedValue = `0x${subBuf.toString('hex')}`;
          }
        } else {
          parsedValue = `0x${subBuf.toString('hex')}`;
        }
      }
      validFields++;
    } else if (wireType === 5) {
      // 32-bit Fixed
      if (offset + 4 > buf.length) break;
      const u32 = buf.readUInt32LE(offset);
      const f32 = buf.readFloatLE(offset);
      offset += 4;
      parsedValue = (Math.abs(f32) > 0.0001 && Math.abs(f32) < 1000000 && !Number.isInteger(f32))
        ? { uint32: u32, float: Number(f32.toFixed(4)) }
        : u32;
      validFields++;
    } else {
      if (validFields === 0) return null;
      break;
    }

    if (result[keyLabel] !== undefined) {
      if (!Array.isArray(result[keyLabel])) {
        result[keyLabel] = [result[keyLabel]];
      }
      result[keyLabel].push(parsedValue);
    } else {
      result[keyLabel] = parsedValue;
    }
    rawFields.push({ fieldNo, wireType, name: fieldDef ? fieldDef.name : null, value: parsedValue });
  }

  if (validFields === 0) return null;

  return {
    schema: schemaName || 'AutoWireProtobuf',
    fullyConsumed: offset === buf.length,
    bytesConsumed: offset,
    totalBytes: buf.length,
    fields: result,
    rawFields
  };
}

/**
 * Encode a simple JS object of { fieldNo: value } into Protobuf wire bytes
 */
function writeVarint(val) {
  let v = BigInt(val);
  const bytes = [];
  while (v >= 0x80n) {
    bytes.push(Number((v & 0x7fn) | 0x80n));
    v >>= 7n;
  }
  bytes.push(Number(v));
  return Buffer.from(bytes);
}

function encodeProtobuf(fieldMap) {
  const chunks = [];
  for (const [fieldKey, val] of Object.entries(fieldMap)) {
    const fieldNo = Number(String(fieldKey).replace(/\D+/g, ''));
    if (!fieldNo || val === undefined || val === null) continue;

    if (typeof val === 'number' || typeof val === 'bigint' || typeof val === 'boolean') {
      chunks.push(writeVarint((fieldNo << 3) | 0));
      chunks.push(writeVarint(typeof val === 'boolean' ? (val ? 1 : 0) : val));
    } else if (typeof val === 'string') {
      const strBuf = Buffer.from(val, 'utf8');
      chunks.push(writeVarint((fieldNo << 3) | 2));
      chunks.push(writeVarint(strBuf.length));
      chunks.push(strBuf);
    } else if (Buffer.isBuffer(val)) {
      chunks.push(writeVarint((fieldNo << 3) | 2));
      chunks.push(writeVarint(val.length));
      chunks.push(val);
    } else if (typeof val === 'object') {
      const subBuf = encodeProtobuf(val);
      chunks.push(writeVarint((fieldNo << 3) | 2));
      chunks.push(writeVarint(subBuf.length));
      chunks.push(subBuf);
    }
  }
  return Buffer.concat(chunks);
}

/**
 * Resolve schema name from URL path and direction ('REQUEST' | 'RESPONSE')
 */
function resolveSchemaForUrl(urlPath = '', direction = 'REQUEST') {
  for (const [pathKey, map] of Object.entries(ENDPOINT_SCHEMA_MAP)) {
    if (urlPath.toLowerCase().includes(pathKey.toLowerCase())) {
      return direction === 'REQUEST' ? map.req : map.res;
    }
  }
  return null;
}

module.exports = {
  SCHEMAS,
  ENDPOINT_SCHEMA_MAP,
  decodeProtobuf,
  encodeProtobuf,
  resolveSchemaForUrl,
  tryDecodeJwt,
  decodeXoredOpenId
};
