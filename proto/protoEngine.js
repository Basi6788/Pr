/**
 * ============================================================================
<<<<<<< HEAD
 * FF-OMNI-PROXY v4.0: Complete Protobuf Engine (Merged with protos-main.zip)
 * ============================================================================
 * Includes all Protobuf schemas & descriptors from:
 *  - protos-main.zip:
 *      1. account_show_pb2.py (AccountPersonalShow.proto -> AvatarProfile, AccountInfoBasic, AccountPersonalShowInfo, etc.)
 *      2. freefire_pb2.py     (FreeFire.proto -> LoginReq, LoginRes, BlacklistInfoRes, LoginQueueInfo, BanReason)
 *      3. register_req.proto  (PlatformRegisterReq.proto -> PlatformRegisterReq, EAuth_ClientUsingVersion)
 *      4. core_pb2.py         (sample.proto -> JwtGenerator, GetPlayerPersonalShow, SearchWorkshopCode)
 *      5. count_likes_pb2.py  (like_count.proto -> BasicInfo, Info)
 *      6. send_like_pb2.py    (like.proto -> like)
 *  - Plus OB55 MajorLoginReq, GetLoginDataRes, StartMatch, StartUDPMatch, MatchFoundPacket, SquadTeamPacket
=======
 * FF-OMNI-PROXY: Schema-Aware Recursive Protobuf Wire Decoder & Encoder
 * ============================================================================
 * Supports all Protobuf messages extracted from the 10 uploaded files:
 *  - MajorLoginReq / MajorLoginRes / MajorLoginGameSecurity / BlacklistInfoRes
 *  - MajorRegisterReq / ChooseNewbieChoiceReq
 *  - GetLoginDataRes
 *  - StartMatch / StartUDPMatch / MatchFoundPacket / SquadTeamPacket
 *  - AccountPersonalShowInfo / AccountInfoBasic / GetPlayerPersonalShowReq
 *  - LikeProfileReq / ConfirmFriendReq / UidGeneratorReq / PurchaseGachaReq
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
 */

const KEYS = require('../config/keys');

<<<<<<< HEAD
const BAN_REASON_ENUM = {
  0: 'BAN_REASON_UNKNOWN',
  1: 'BAN_REASON_IN_GAME_AUTO',
  2: 'BAN_REASON_REFUND',
  3: 'BAN_REASON_OTHERS',
  4: 'BAN_REASON_SKINMOD',
  1014: 'BAN_REASON_IN_GAME_AUTO_NEW'
};

const SCHEMAS = {
  // 1. LoginReq / MajorLoginReq & JwtGenerator (freefire_pb2.py + core_pb2.py + OB55)
  LoginReq: {
    3: { name: 'timestamp', type: 'string' },
    4: { name: 'game_name', type: 'string' },
    5: { name: 'version_code', type: 'uint32' },
    7: { name: 'app_version', type: 'string' },
    8: { name: 'android_version', type: 'string' },
    9: { name: 'device_type', type: 'string' },
    10: { name: 'network_provider', type: 'string' },
    11: { name: 'network_type', type: 'string' },
    12: { name: 'screen_width', type: 'uint32' },
    13: { name: 'screen_height', type: 'uint32' },
    14: { name: 'dpi', type: 'string' },
    15: { name: 'cpu_info', type: 'string' },
    16: { name: 'fps', type: 'uint32' },
    17: { name: 'gpu_model', type: 'string' },
    18: { name: 'opengl_version', type: 'string' },
    19: { name: 'device_id', type: 'string' },
    20: { name: 'ip_address', type: 'string' },
    21: { name: 'language', type: 'string' },
    22: { name: 'open_id', type: 'string' },
    23: { name: 'open_id_type', type: 'string' },
    24: { name: 'os_build_type', type: 'string' },
    25: { name: 'device_model', type: 'string' },
    26: { name: 'country_code', type: 'string' },
    29: { name: 'login_token', type: 'string' },
    30: { name: 'platform_sdk_id', type: 'uint32' },
    33: { name: 'game_security_data', type: 'bytes' },
    41: { name: 'carrier_name', type: 'string' },
    42: { name: 'network_generation', type: 'string' },
    57: { name: 'app_signature', type: 'string' },
    60: { name: 'player_id', type: 'int64' },
    61: { name: 'session_id', type: 'int64' },
    62: { name: 'match_id', type: 'int32' },
    64: { name: 'score', type: 'int64' },
    65: { name: 'total_score', type: 'int64' },
    66: { name: 'high_score', type: 'int64' },
    67: { name: 'max_score', type: 'int64' },
    73: { name: 'player_rank', type: 'int32' },
    74: { name: 'native_lib_path', type: 'string' },
    76: { name: 'is_debuggable', type: 'int32' },
    77: { name: 'app_source', type: 'string' },
    78: { name: 'is_beta', type: 'int32' },
    79: { name: 'is_tester', type: 'int32' },
    81: { name: 'target_architecture', type: 'string' },
    83: { name: 'app_version_code', type: 'string' },
    85: { name: 'app_revision_code', type: 'int32' },
    86: { name: 'graphics_api', type: 'string' },
    87: { name: 'max_texture_size', type: 'int32' },
    88: { name: 'processor_count', type: 'int32' },
    89: { name: 'encryption_key', type: 'string' },
    92: { name: 'frame_buffer_size', type: 'int32' },
    93: { name: 'platform_type', type: 'string' },
    94: { name: 'security_token', type: 'string' },
    96: { name: 'display_settings', type: 'string' },
    97: { name: 'is_logged_in', type: 'int32' },
    98: { name: 'is_vpn', type: 'int32' },
    99: { name: 'orign_platform_type', type: 'string' },
    100: { name: 'primary_platform_type', type: 'string' },
    102: { name: 'game_security_info', type: 'message', schema: 'MajorLoginGameSecurity' }
=======
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
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  },

  MajorLoginGameSecurity: {
    1: { name: 'raw_1', type: 'bytes' },
    2: { name: 'f2', type: 'uint32' },
    4: { name: 'f4', type: 'uint32' },
    5: { name: 'version', type: 'string' },
    6: { name: 'raw_6', type: 'bytes' }
  },

<<<<<<< HEAD
  // 2. LoginRes / MajorLoginRes (freefire_pb2.py + OB55)
  LoginRes: {
=======
  MajorLoginRes: {
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    1: { name: 'account_id', type: 'uint64' },
    2: { name: 'lock_region', type: 'string' },
    3: { name: 'noti_region', type: 'string' },
    4: { name: 'ip_region', type: 'string' },
<<<<<<< HEAD
    5: { name: 'agora_environment', type: 'string' },
    6: { name: 'new_active_region', type: 'string' },
    7: { name: 'recommend_regions', type: 'string' },
    8: { name: 'token', type: 'jwt' },
    9: { name: 'ttl', type: 'uint32' },
    10: { name: 'server_url', type: 'string' },
    11: { name: 'emulator_score', type: 'uint32' },
    12: { name: 'blacklist', type: 'message', schema: 'BlacklistInfoRes' },
    13: { name: 'queue_info', type: 'message', schema: 'LoginQueueInfo' },
    14: { name: 'tp_url', type: 'string' },
    15: { name: 'app_server_id', type: 'uint32' },
    16: { name: 'ano_url', type: 'string' },
    17: { name: 'ip_city', type: 'string' },
    18: { name: 'ip_subdivision', type: 'string' },
=======
    8: { name: 'token', type: 'jwt' },
    9: { name: 'ttl', type: 'uint32' },
    10: { name: 'server_url', type: 'string' },
    11: { name: 'emulator_score', type: 'int32' },
    12: { name: 'blacklist', type: 'message', schema: 'BlacklistInfoRes' },
    16: { name: 'ip_city', type: 'string' },
    17: { name: 'ip_subdivision', type: 'string' },
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    21: { name: 'kts', type: 'uint32' },
    22: { name: 'aes_ak', type: 'bytes_ascii' },
    23: { name: 'aes_aiv', type: 'bytes_ascii' }
  },

  BlacklistInfoRes: {
<<<<<<< HEAD
    1: { name: 'ban_reason', type: 'uint32' },
    2: { name: 'expire_duration', type: 'uint32' },
    3: { name: 'ban_time', type: 'uint32' }
  },

  LoginQueueInfo: {
    1: { name: 'allow', type: 'bool' },
    2: { name: 'queue_position', type: 'uint32' },
    3: { name: 'need_wait_secs', type: 'uint32' },
    4: { name: 'queue_is_full', type: 'bool' }
  },

  // 3. PlatformRegisterReq (register_req.proto from protos-main.zip)
  PlatformRegisterReq: {
=======
    1: { name: 'ban_reason', type: 'int32' },
    2: { name: 'expire_duration', type: 'int32' },
    3: { name: 'ban_time', type: 'int64' }
  },

  MajorRegisterReq: {
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    1: { name: 'nickname', type: 'string' },
    2: { name: 'access_token', type: 'string' },
    3: { name: 'open_id', type: 'string' },
    4: { name: 'platform_id', type: 'uint32' },
<<<<<<< HEAD
    5: { name: 'avatar_id', type: 'uint32' },
    6: { name: 'platform_type', type: 'uint32' },
    7: { name: 'platform_sdk_id', type: 'uint32' },
    8: { name: 'system_software', type: 'string' },
    10: { name: 'telecom_operator', type: 'string' },
    12: { name: 'flag_12', type: 'uint32' },
    13: { name: 'using_version', type: 'uint32' },
    14: { name: 'platform_register_info', type: 'xored_open_id' },
    15: { name: 'language', type: 'string' },
    16: { name: 'unknown_16', type: 'uint32' },
    17: { name: 'unknown_17', type: 'uint32' }
=======
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
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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

<<<<<<< HEAD
  // 4. core_pb2.py messages (SearchWorkshopCode, GetPlayerPersonalShow, JwtGenerator)
  SearchWorkshopCode: {
    1: { name: 'a', type: 'string' },
    2: { name: 'b', type: 'int32' }
  },

  GetPlayerPersonalShow: {
    1: { name: 'a', type: 'int64' },
    2: { name: 'b', type: 'int32' }
  },

  // 5. account_show_pb2.py (AccountPersonalShow.proto from protos-main.zip)
  AccountPersonalShowInfo: {
    1: { name: 'basic_info', type: 'message', schema: 'AccountInfoBasic' },
    2: { name: 'profile_info', type: 'message', schema: 'AvatarProfile' },
    3: { name: 'ranking_leaderboard_pos', type: 'int32' },
    4: { name: 'news', type: 'message', schema: 'AccountNews' },
    5: { name: 'history_ep_info', type: 'message', schema: 'BasicEPInfo' },
=======
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
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    6: { name: 'clan_basic_info', type: 'message', schema: 'ClanInfoBasic' },
    7: { name: 'captain_basic_info', type: 'message', schema: 'AccountInfoBasic' },
    8: { name: 'pet_info', type: 'message', schema: 'PetInfo' },
    9: { name: 'social_info', type: 'message', schema: 'SocialBasicInfo' },
    10: { name: 'diamond_cost_res', type: 'message', schema: 'DiamondCostRes' },
<<<<<<< HEAD
    11: { name: 'credit_score_info', type: 'message', schema: 'CreditScoreInfoBasic' },
    12: { name: 'pre_veteran_type', type: 'uint32' },
    13: { name: 'equipped_ach', type: 'message', schema: 'EquipAchInfo' }
  },

  // Exact AvatarProfile from protos-main/ff_proto/account_show_pb2.py!
  AvatarProfile: {
    1: { name: 'avatar_id', type: 'uint32' },
    2: { name: 'skin_color', type: 'uint32' },
    3: { name: 'clothes', type: 'uint32' },
    4: { name: 'equiped_skills', type: 'uint32' },
    5: { name: 'is_selected', type: 'bool' },
    6: { name: 'pve_primary_weapon', type: 'uint32' },
    7: { name: 'is_selected_awaken', type: 'bool' },
    8: { name: 'end_time', type: 'uint32' },
    9: { name: 'unlock_type', type: 'uint32' },
    10: { name: 'unlock_time', type: 'uint32' },
    11: { name: 'is_marked_star', type: 'bool' },
    12: { name: 'clothes_tailor_effects', type: 'uint32' }
  },

  AvatarSkillSlot: {
    1: { name: 'slot_id', type: 'uint64' },
    2: { name: 'skill_id', type: 'uint64' },
    3: { name: 'equip_source', type: 'uint32' }
  },

  AccountPrefers: {
    1: { name: 'hide_my_lobby', type: 'bool' },
    2: { name: 'pregame_show_choices', type: 'uint32' },
    3: { name: 'br_pregame_show_choices', type: 'uint32' },
    4: { name: 'hide_personal_info', type: 'bool' },
    5: { name: 'disable_friend_spectate', type: 'bool' },
    6: { name: 'hide_occupation', type: 'bool' }
  },

  ExternalIconInfo: {
    1: { name: 'external_icon', type: 'string' },
    2: { name: 'status', type: 'uint32' },
    3: { name: 'show_type', type: 'uint32' }
  },

  SocialHighLight: {
    1: { name: 'high_light', type: 'uint32' },
    2: { name: 'expire_at', type: 'int64' },
    3: { name: 'value', type: 'uint32' }
  },

  WeaponPowerTitleInfo: {
    1: { name: 'region', type: 'string' },
    2: { name: 'title_cfg_id', type: 'uint32' },
    3: { name: 'leaderboard_id', type: 'uint64' },
    4: { name: 'weapon_id', type: 'uint32' },
    5: { name: 'rank', type: 'uint32' },
    6: { name: 'expire_time', type: 'int64' },
    7: { name: 'reward_time', type: 'int64' },
    8: { name: 'RegionName', type: 'string' },
    9: { name: 'RegionType', type: 'uint32' },
    10: { name: 'IsBr', type: 'bool' }
  },

  GuildWarTitleInfo: {
    1: { name: 'region', type: 'string' },
    2: { name: 'clan_id', type: 'uint64' },
    3: { name: 'title_cfg_id', type: 'uint32' },
    4: { name: 'leaderboard_id', type: 'uint64' },
    5: { name: 'rank', type: 'uint32' },
    6: { name: 'expire_time', type: 'int64' },
    7: { name: 'reward_time', type: 'int64' },
    8: { name: 'clan_name', type: 'string' }
  },

  LeaderboardTitleInfo: {
    1: { name: 'weapon_power_title_info', type: 'message', schema: 'WeaponPowerTitleInfo' },
    2: { name: 'guild_war_title_info', type: 'message', schema: 'GuildWarTitleInfo' }
  },

  OccupationInfo: {
    1: { name: 'occupation_id', type: 'uint32' },
    2: { name: 'scores', type: 'uint64' },
    3: { name: 'proficients', type: 'uint64' },
    4: { name: 'proficient_lv', type: 'uint32' }
  },

  OccupationSeasonInfo: {
    1: { name: 'season_id', type: 'uint32' },
    2: { name: 'game_mode', type: 'uint32' },
    3: { name: 'info', type: 'message', schema: 'OccupationInfo' }
  },

  SocialHighLightsWithSocialBasicInfo: {
    1: { name: 'social_high_lights', type: 'message', schema: 'SocialHighLight' },
    2: { name: 'social_basic_info', type: 'message', schema: 'SocialBasicInfo' }
=======
    11: { name: 'credit_score_info', type: 'message', schema: 'CreditScoreInfoBasic' }
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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
<<<<<<< HEAD
    22: { name: 'is_deleted', type: 'bool' },
    23: { name: 'show_rank', type: 'bool' },
    24: { name: 'last_login_at', type: 'int64' },
    25: { name: 'external_uid', type: 'uint64' },
    26: { name: 'return_at', type: 'int64' },
    27: { name: 'championship_team_name', type: 'string' },
    28: { name: 'championship_team_member_num', type: 'uint32' },
    29: { name: 'championship_team_id', type: 'uint64' },
=======
    24: { name: 'last_login_at', type: 'int64' },
    25: { name: 'external_uid', type: 'uint64' },
    26: { name: 'return_at', type: 'int64' },
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    30: { name: 'cs_rank', type: 'uint32' },
    31: { name: 'cs_ranking_points', type: 'uint32' },
    32: { name: 'weapon_skin_shows', type: 'uint32' },
    33: { name: 'pin_id', type: 'uint32' },
<<<<<<< HEAD
    34: { name: 'is_cs_ranking_ban', type: 'bool' },
    35: { name: 'max_rank', type: 'uint32' },
    36: { name: 'cs_max_rank', type: 'uint32' },
    37: { name: 'max_ranking_points', type: 'uint32' },
    38: { name: 'game_bag_show', type: 'uint32' },
    39: { name: 'peak_rank_pos', type: 'uint32' },
    40: { name: 'cs_peak_rank_pos', type: 'uint32' },
    41: { name: 'account_prefers', type: 'message', schema: 'AccountPrefers' },
    42: { name: 'periodic_ranking_points', type: 'uint32' },
    43: { name: 'periodic_rank', type: 'uint32' },
    44: { name: 'create_at', type: 'int64' },
    45: { name: 'veteran_leave_days_tag', type: 'uint32' },
    46: { name: 'selected_item_slots', type: 'uint32' },
    47: { name: 'pre_veteran_type', type: 'uint32' },
    48: { name: 'title', type: 'uint32' },
    49: { name: 'external_icon_info', type: 'message', schema: 'ExternalIconInfo' },
    50: { name: 'release_version', type: 'string' },
    51: { name: 'veteran_expire_time', type: 'uint64' },
    52: { name: 'show_br_rank', type: 'bool' },
    53: { name: 'show_cs_rank', type: 'bool' },
    54: { name: 'clan_id', type: 'uint64' },
    55: { name: 'clan_badge_id', type: 'uint32' },
    56: { name: 'custom_clan_badge', type: 'string' },
    57: { name: 'use_custom_clan_badge', type: 'bool' },
    58: { name: 'clan_frame_id', type: 'uint32' },
    59: { name: 'membership_state', type: 'bool' },
    60: { name: 'select_occupations', type: 'message', schema: 'OccupationSeasonInfo' },
    61: { name: 'social_high_lights_with_basic_info', type: 'message', schema: 'SocialHighLightsWithSocialBasicInfo' }
  },

  AccountNewsContent: {
    1: { name: 'item_ids', type: 'uint32' },
    2: { name: 'rank', type: 'uint32' },
    3: { name: 'match_mode', type: 'uint32' },
    4: { name: 'map_id', type: 'uint32' },
    5: { name: 'game_mode', type: 'uint32' },
    6: { name: 'group_mode', type: 'uint32' },
    7: { name: 'treasurebox_id', type: 'uint32' },
    8: { name: 'commodity_id', type: 'uint32' },
    9: { name: 'store_id', type: 'uint32' }
  },

  AccountNews: {
    1: { name: 'type', type: 'uint32' },
    2: { name: 'content', type: 'message', schema: 'AccountNewsContent' },
    3: { name: 'update_time', type: 'int64' }
  },

  BasicEPInfo: {
    1: { name: 'ep_event_id', type: 'uint32' },
    2: { name: 'owned_pass', type: 'bool' },
    3: { name: 'ep_badge', type: 'uint32' },
    4: { name: 'badge_cnt', type: 'uint32' },
    5: { name: 'bp_icon', type: 'string' },
    6: { name: 'max_level', type: 'uint32' },
    7: { name: 'event_name', type: 'string' }
=======
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
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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

<<<<<<< HEAD
  PetSkillInfo: {
    1: { name: 'pet_id', type: 'uint32' },
    2: { name: 'skill_id', type: 'uint32' },
    3: { name: 'skill_level', type: 'uint32' }
  },

=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  PetInfo: {
    1: { name: 'id', type: 'uint32' },
    2: { name: 'name', type: 'string' },
    3: { name: 'level', type: 'uint32' },
    4: { name: 'exp', type: 'uint32' },
    5: { name: 'is_selected', type: 'bool' },
    6: { name: 'skin_id', type: 'uint32' },
    7: { name: 'actions', type: 'uint32' },
<<<<<<< HEAD
    8: { name: 'skills', type: 'message', schema: 'PetSkillInfo' },
    9: { name: 'selected_skill_id', type: 'uint32' },
    10: { name: 'is_marked_star', type: 'bool' },
    11: { name: 'end_time', type: 'uint32' }
=======
    9: { name: 'selected_skill_id', type: 'uint32' }
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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
<<<<<<< HEAD
    10: { name: 'rank_show', type: 'uint32' },
    11: { name: 'battle_tag_count', type: 'uint32' },
    12: { name: 'signature_ban_expire_time', type: 'int64' },
    13: { name: 'leaderboard_titles', type: 'message', schema: 'LeaderboardTitleInfo' }
=======
    10: { name: 'rank_show', type: 'uint32' }
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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

<<<<<<< HEAD
  EquipAchInfo: {
    1: { name: 'ach_id', type: 'uint32' },
    2: { name: 'level', type: 'uint32' }
  },

  // 6. count_likes_pb2.py & send_like_pb2.py
  BasicInfo: {
    1: { name: 'UID', type: 'int64' },
    3: { name: 'PlayerNickname', type: 'string' },
    21: { name: 'Likes', type: 'int64' }
  },

  Info: {
    1: { name: 'AccountInfo', type: 'message', schema: 'BasicInfo' }
  },

  like: {
    1: { name: 'uid', type: 'int64' },
=======
  LikeProfileReq: {
    1: { name: 'uid', type: 'uint64' },
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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

<<<<<<< HEAD
// Aliases so both old & new schema names resolve cleanly
SCHEMAS.MajorLoginReq = SCHEMAS.LoginReq;
SCHEMAS.MajorLoginRes = SCHEMAS.LoginRes;
SCHEMAS.JwtGenerator = SCHEMAS.LoginReq;
SCHEMAS.MajorRegisterReq = SCHEMAS.PlatformRegisterReq;
SCHEMAS.GetPlayerPersonalShowReq = SCHEMAS.GetPlayerPersonalShow;
SCHEMAS.LikeProfileReq = SCHEMAS.like;

const ENDPOINT_SCHEMA_MAP = {
  '/MajorLogin': { req: 'LoginReq', res: 'LoginRes' },
  '/MajorRegister': { req: 'PlatformRegisterReq', res: 'LoginRes' },
  '/ChooseNewbieChoice': { req: 'ChooseNewbieChoiceReq', res: 'GenericSubMessage' },
  '/GetLoginData': { req: 'GenericSubMessage', res: 'GetLoginDataRes' },
  '/GetPlayerPersonalShow': { req: 'GetPlayerPersonalShow', res: 'AccountPersonalShowInfo' },
  '/LikeProfile': { req: 'like', res: 'GenericSubMessage' },
=======
// Map HTTP URL path -> Request & Response Schema
const ENDPOINT_SCHEMA_MAP = {
  '/MajorLogin': { req: 'MajorLoginReq', res: 'MajorLoginRes' },
  '/MajorRegister': { req: 'MajorRegisterReq', res: 'MajorLoginRes' },
  '/ChooseNewbieChoice': { req: 'ChooseNewbieChoiceReq', res: 'GenericSubMessage' },
  '/GetLoginData': { req: 'GenericSubMessage', res: 'GetLoginDataRes' },
  '/GetPlayerPersonalShow': { req: 'GetPlayerPersonalShowReq', res: 'AccountPersonalShowInfo' },
  '/LikeProfile': { req: 'LikeProfileReq', res: 'GenericSubMessage' },
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  '/ConfirmFriendRequest': { req: 'ConfirmFriendRequestReq', res: 'GenericSubMessage' },
  '/PurchaseGacha': { req: 'PurchaseGachaReq', res: 'GenericSubMessage' }
};

<<<<<<< HEAD
=======
/**
 * Decode JWT payload if string looks like a valid 3-part JWT
 */
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
function tryDecodeJwt(str) {
  if (typeof str !== 'string') return null;
  const parts = str.split('.');
  if (parts.length !== 3 || !str.startsWith('eyJ')) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
<<<<<<< HEAD
    return { jwt_raw: str.slice(0, 48) + '...', full_token: str, header, payload };
=======
    return { jwt_raw: str.slice(0, 48) + '...', header, payload };
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  } catch (_) {
    return null;
  }
}

<<<<<<< HEAD
=======
/**
 * Decode XORed open_id from MajorRegister field 14 using KEYS.XOR_KEYS.OPEN_ID_XOR_BYTES
 */
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
function decodeXoredOpenId(buf) {
  const xorKey = KEYS.XOR_KEYS.OPEN_ID_XOR_BYTES;
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ xorKey[i % xorKey.length];
  }
  return out.toString('utf8');
}

<<<<<<< HEAD
=======
/**
 * Check if a Buffer is clean printable UTF-8
 */
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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

<<<<<<< HEAD
=======
/**
 * Read a Protobuf Varint (up to 64 bits) at offset
 */
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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
<<<<<<< HEAD
 * `plainFieldNames=true` outputs clean field names (matching Google Protobuf MessageToDict in protos-main/app.py)
 */
function decodeProtobuf(buf, schemaName = null, depth = 0, plainFieldNames = false) {
=======
 */
function decodeProtobuf(buf, schemaName = null, depth = 0) {
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
  if (buf.length === 0 || depth > 6) return null;

  const schema = schemaName && SCHEMAS[schemaName] ? SCHEMAS[schemaName] : null;
  const result = {};
<<<<<<< HEAD
  const cleanDict = {};
=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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
<<<<<<< HEAD
    const keyLabel = plainFieldNames
      ? (fieldDef ? fieldDef.name : `field_${fieldNo}`)
      : (fieldDef ? `${fieldDef.name} (#${fieldNo})` : `field_${fieldNo}`);
    const cleanKey = fieldDef ? fieldDef.name : `field_${fieldNo}`;
    let parsedValue = null;
    let cleanValue = null;

    if (wireType === 0) {
=======
    const keyLabel = fieldDef ? `${fieldDef.name} (#${fieldNo})` : `field_${fieldNo}`;
    let parsedValue = null;

    if (wireType === 0) {
      // Varint
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      const v = readVarint(buf, offset);
      if (!v) break;
      offset = v.nextOffset;
      parsedValue = v.value;
<<<<<<< HEAD
      cleanValue = v.value;
      if (fieldDef && fieldDef.type === 'bool') {
        parsedValue = Boolean(v.value);
        cleanValue = Boolean(v.value);
      } else if (schemaName === 'BlacklistInfoRes' && fieldNo === 1 && BAN_REASON_ENUM[v.value]) {
        parsedValue = `${v.value} (${BAN_REASON_ENUM[v.value]})`;
        cleanValue = BAN_REASON_ENUM[v.value];
      } else if (KEYS.GEN_SPIN.SPECIAL_ITEMS[parsedValue]) {
=======
      if (fieldDef && fieldDef.type === 'bool') {
        parsedValue = Boolean(v.value);
      } else if ( KEYS.GEN_SPIN.SPECIAL_ITEMS[parsedValue] ) {
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
        parsedValue = `${parsedValue} (${KEYS.GEN_SPIN.SPECIAL_ITEMS[parsedValue]})`;
      }
      validFields++;
    } else if (wireType === 1) {
<<<<<<< HEAD
=======
      // 64-bit Fixed
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      if (offset + 8 > buf.length) break;
      const u64 = buf.readBigUInt64LE(offset);
      offset += 8;
      parsedValue = u64 <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(u64) : u64.toString();
<<<<<<< HEAD
      cleanValue = parsedValue;
      validFields++;
    } else if (wireType === 2) {
=======
      validFields++;
    } else if (wireType === 2) {
      // Length-delimited
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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

<<<<<<< HEAD
      // Support packed repeated uint32 (e.g. AvatarProfile.clothes field 3 or weapon_skin_shows field 32)
      if (fieldDef && fieldDef.type === 'uint32' && subBuf.length > 0) {
        const packedVals = [];
        let pOff = 0;
        while (pOff < subBuf.length) {
          const pv = readVarint(subBuf, pOff);
          if (!pv) break;
          packedVals.push(pv.value);
          pOff = pv.nextOffset;
        }
        parsedValue = packedVals;
        cleanValue = packedVals;
      } else if (fieldDef && fieldDef.type === 'xored_open_id') {
=======
      if (fieldDef && fieldDef.type === 'xored_open_id') {
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
        parsedValue = {
          cipher_hex: subBuf.toString('hex'),
          decrypted_open_id: decodeXoredOpenId(subBuf)
        };
<<<<<<< HEAD
        cleanValue = subBuf.toString('base64');
=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      } else if (fieldDef && fieldDef.type === 'bytes_ascii') {
        parsedValue = {
          hex: subBuf.toString('hex'),
          ascii: isPrintableUtf8(subBuf) ? subBuf.toString('utf8') : null,
          base64: subBuf.toString('base64')
        };
<<<<<<< HEAD
        cleanValue = isPrintableUtf8(subBuf) ? subBuf.toString('utf8') : subBuf.toString('base64');
      } else if (fieldDef && fieldDef.type === 'jwt') {
        const str = subBuf.toString('utf8');
        parsedValue = plainFieldNames ? str : (tryDecodeJwt(str) || str);
        cleanValue = str;
      } else if (fieldDef && fieldDef.type === 'message') {
        const subDecoded = decodeProtobuf(subBuf, fieldDef.schema, depth + 1, plainFieldNames);
        parsedValue = subDecoded ? subDecoded.fields : `0x${subBuf.toString('hex')}`;
        cleanValue = subDecoded ? subDecoded.cleanDict : subBuf.toString('base64');
      } else if (fieldDef && fieldDef.type === 'string') {
        const str = subBuf.toString('utf8');
        parsedValue = plainFieldNames ? str : (tryDecodeJwt(str) || str);
        cleanValue = str;
      } else if (fieldDef && fieldDef.type === 'bytes') {
        parsedValue = `0x${subBuf.toString('hex')}`;
        cleanValue = subBuf.toString('base64');
      } else {
        if (isPrintableUtf8(subBuf) && subBuf.length > 0) {
          const str = subBuf.toString('utf8');
          parsedValue = plainFieldNames ? str : (tryDecodeJwt(str) || str);
          cleanValue = str;
        } else if (subBuf.length >= 2) {
          const nested = decodeProtobuf(subBuf, null, depth + 1, plainFieldNames);
          if (nested && nested.fullyConsumed && Object.keys(nested.fields).length > 0) {
            parsedValue = nested.fields;
            cleanValue = nested.cleanDict;
          } else {
            parsedValue = `0x${subBuf.toString('hex')}`;
            cleanValue = subBuf.toString('base64');
          }
        } else {
          parsedValue = `0x${subBuf.toString('hex')}`;
          cleanValue = subBuf.toString('base64');
=======
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
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
        }
      }
      validFields++;
    } else if (wireType === 5) {
<<<<<<< HEAD
=======
      // 32-bit Fixed
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      if (offset + 4 > buf.length) break;
      const u32 = buf.readUInt32LE(offset);
      const f32 = buf.readFloatLE(offset);
      offset += 4;
      parsedValue = (Math.abs(f32) > 0.0001 && Math.abs(f32) < 1000000 && !Number.isInteger(f32))
        ? { uint32: u32, float: Number(f32.toFixed(4)) }
        : u32;
<<<<<<< HEAD
      cleanValue = u32;
=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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
<<<<<<< HEAD

    if (cleanDict[cleanKey] !== undefined) {
      if (!Array.isArray(cleanDict[cleanKey])) {
        cleanDict[cleanKey] = [cleanDict[cleanKey]];
      }
      cleanDict[cleanKey].push(cleanValue);
    } else {
      cleanDict[cleanKey] = cleanValue;
    }

=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    rawFields.push({ fieldNo, wireType, name: fieldDef ? fieldDef.name : null, value: parsedValue });
  }

  if (validFields === 0) return null;

  return {
    schema: schemaName || 'AutoWireProtobuf',
    fullyConsumed: offset === buf.length,
    bytesConsumed: offset,
    totalBytes: buf.length,
    fields: result,
<<<<<<< HEAD
    cleanDict,
=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    rawFields
  };
}

<<<<<<< HEAD
function writeVarint(val) {
  let v = BigInt(val);
  if (v < 0n) v = BigInt.asUintN(64, v);
=======
/**
 * Encode a simple JS object of { fieldNo: value } into Protobuf wire bytes
 */
function writeVarint(val) {
  let v = BigInt(val);
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  const bytes = [];
  while (v >= 0x80n) {
    bytes.push(Number((v & 0x7fn) | 0x80n));
    v >>= 7n;
  }
  bytes.push(Number(v));
  return Buffer.from(bytes);
}

<<<<<<< HEAD
/**
 * Schema-Aware Protobuf Encoder (supports both numeric keys AND field names like `open_id`, `clothes`, etc.)
 */
function encodeProtobuf(fieldMap, schemaName = null) {
  const schema = schemaName && SCHEMAS[schemaName] ? SCHEMAS[schemaName] : null;
  const nameToFieldNo = {};
  if (schema) {
    for (const [fNo, def] of Object.entries(schema)) {
      nameToFieldNo[def.name] = { fieldNo: Number(fNo), ...def };
    }
  }

  const chunks = [];
  for (const [fieldKey, rawVal] of Object.entries(fieldMap || {})) {
    if (rawVal === undefined || rawVal === null) continue;

    let fieldNo = null;
    let fieldDef = null;

    if (nameToFieldNo[fieldKey]) {
      fieldNo = nameToFieldNo[fieldKey].fieldNo;
      fieldDef = nameToFieldNo[fieldKey];
    } else {
      const m = String(fieldKey).match(/#(\d+)/) || String(fieldKey).match(/(\d+)/);
      if (m) {
        fieldNo = Number(m[1]);
        fieldDef = schema ? schema[fieldNo] : null;
      }
    }
    if (!fieldNo) continue;

    const values = Array.isArray(rawVal) ? rawVal : [rawVal];
    for (const val of values) {
      if (val === undefined || val === null) continue;

      if (typeof val === 'number' || typeof val === 'bigint' || typeof val === 'boolean') {
        chunks.push(writeVarint((fieldNo << 3) | 0));
        chunks.push(writeVarint(typeof val === 'boolean' ? (val ? 1 : 0) : val));
      } else if (typeof val === 'string') {
        if (fieldDef && (fieldDef.type === 'uint32' || fieldDef.type === 'uint64' || fieldDef.type === 'int32' || fieldDef.type === 'int64') && /^\d+$/.test(val)) {
          chunks.push(writeVarint((fieldNo << 3) | 0));
          chunks.push(writeVarint(BigInt(val)));
        } else {
          const strBuf = Buffer.from(val, 'utf8');
          chunks.push(writeVarint((fieldNo << 3) | 2));
          chunks.push(writeVarint(strBuf.length));
          chunks.push(strBuf);
        }
      } else if (Buffer.isBuffer(val)) {
        chunks.push(writeVarint((fieldNo << 3) | 2));
        chunks.push(writeVarint(val.length));
        chunks.push(val);
      } else if (typeof val === 'object') {
        const subSchema = fieldDef && fieldDef.schema ? fieldDef.schema : null;
        const subBuf = encodeProtobuf(val, subSchema);
        chunks.push(writeVarint((fieldNo << 3) | 2));
        chunks.push(writeVarint(subBuf.length));
        chunks.push(subBuf);
      }
=======
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
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    }
  }
  return Buffer.concat(chunks);
}

<<<<<<< HEAD
=======
/**
 * Resolve schema name from URL path and direction ('REQUEST' | 'RESPONSE')
 */
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
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
<<<<<<< HEAD
  BAN_REASON_ENUM,
=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  ENDPOINT_SCHEMA_MAP,
  decodeProtobuf,
  encodeProtobuf,
  resolveSchemaForUrl,
  tryDecodeJwt,
  decodeXoredOpenId
};
