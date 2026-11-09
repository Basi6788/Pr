/**
 * ----------------------------------------------------------------------------
 * FF-OMNI-PROXY: Multi-Protocol Cryptographic & Framing Engine
 * ----------------------------------------------------------------------------
 * Implements:
 *  1. AES-128-CBC (Static Key/IV + Dynamic MajorLogin Session Key/IV)
 *  2. Garena OAuth HMAC-SHA256 Signer & Verifier + OpenID XOR
 *  3. TCP Framing & Decryption (7119/9219 Auth, 0515/0519/0315 AES Frames, 0300 MatchFound)
 *  4. UDP/RUDP Custom 16-Round TEA-CBC + OICQ Padding + CRC7 + Dynamic Header Masking
 *  5. UDP Special Decoders (cmd=2001 ULEB128/ZigZag Movement, cmd=104/105 Fire, cmd=447/448)
 */

const crypto = require('crypto');
const KEYS = require('../config/keys');
const { decodeProtobuf, encodeProtobuf, tryDecodeJwt } = require('../proto/protoEngine');
const { getUdpMessageName } = require('../proto/messageIds');

const sessionState = {
  accountId: null,
  nickname: null,
  region: null,
  serverUrl: null,
  jwtToken: null,
  aesKey: null,
  aesIv: null,
  functionalAddr: null,
  informationalAddr: null,
  udpServer: null,
  udpKey: Buffer.from('0102030405060708090a0b0c0d0e0f10', 'hex'),
  matchCode: '01234',
  matchToken: null,
  updatedAt: null
};

function aesCbcEncrypt(plainBuf, keyBuf = KEYS.AES_CBC.KEY_BYTES, ivBuf = KEYS.AES_CBC.IV_BYTES) {
  if (!Buffer.isBuffer(plainBuf)) plainBuf = Buffer.from(plainBuf);
  const cipher = crypto.createCipheriv('aes-128-cbc', keyBuf, ivBuf);
  return Buffer.concat([cipher.update(plainBuf), cipher.final()]);
}

function aesCbcDecryptSingle(cipherBuf, keyBuf, ivBuf, autoPad = true) {
  try {
    if (!Buffer.isBuffer(cipherBuf)) cipherBuf = Buffer.from(cipherBuf);
    if (cipherBuf.length === 0 || cipherBuf.length % 16 !== 0) return null;
    const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuf, ivBuf);
    decipher.setAutoPadding(autoPad);
    return Buffer.concat([decipher.update(cipherBuf), decipher.final()]);
  } catch (_) {
    return null;
  }
}

function aesCbcDecryptSmart(cipherBuf) {
  if (!Buffer.isBuffer(cipherBuf)) cipherBuf = Buffer.from(cipherBuf);
  if (cipherBuf.length === 0 || cipherBuf.length % 16 !== 0) {
    return { success: false, reason: 'Payload length is not a multiple of 16 bytes' };
  }

  const candidates = [
    {
      label: 'STATIC_AES_128_CBC (Yg&tc%DEuh6%Zc^8 / 6oyZDr22E3ychjM%)',
      key: KEYS.AES_CBC.KEY_BYTES,
      iv: KEYS.AES_CBC.IV_BYTES
    }
  ];

  if (sessionState.aesKey && sessionState.aesIv && sessionState.aesKey.length === 16 && sessionState.aesIv.length === 16) {
    candidates.unshift({
      label: `DYNAMIC_SESSION_AES (${sessionState.aesKey.toString('hex').slice(0, 12)}...)`,
      key: sessionState.aesKey,
      iv: sessionState.aesIv
    });
  }

  for (const cand of candidates) {
    const dec = aesCbcDecryptSingle(cipherBuf, cand.key, cand.iv, true);
    if (dec) {
      return {
        success: true,
        keyUsed: cand.label,
        keyHex: cand.key.toString('hex'),
        ivHex: cand.iv.toString('hex'),
        decryptedBuffer: dec,
        decryptedHex: dec.toString('hex')
      };
    }
  }

  for (const cand of candidates) {
    const dec = aesCbcDecryptSingle(cipherBuf, cand.key, cand.iv, false);
    if (dec) {
      return {
        success: true,
        keyUsed: cand.label + ' [RawNoUnpad]',
        keyHex: cand.key.toString('hex'),
        ivHex: cand.iv.toString('hex'),
        decryptedBuffer: dec,
        decryptedHex: dec.toString('hex')
      };
    }
  }

  return { success: false, reason: 'AES-128-CBC decryption failed with static and session keys' };
}

function computeGarenaHmac(dataStr) {
  return crypto
    .createHmac('sha256', KEYS.GARENA_OAUTH.CLIENT_SECRET_ASCII)
    .update(dataStr, 'utf8')
    .digest('hex');
}

function verifyGarenaHmac(dataStr, authHeader = '') {
  const m = String(authHeader).match(/Signature\s+([0-9a-fA-F]{64})/i);
  if (!m) return null;
  const provided = m[1].toLowerCase();
  const expected = computeGarenaHmac(dataStr).toLowerCase();
  return {
    valid: provided === expected,
    providedSignature: provided,
    expectedSignature: expected,
    secretUsed: KEYS.GARENA_OAUTH.CLIENT_SECRET_HEX
  };
}

function crc7Buff(crc, buf) {
  const table = KEYS.UDP_TEA.CRC7_TABLE;
  let c = crc & 0xff;
  for (let i = 0; i < buf.length; i++) {
    c = table[((c << 1) ^ buf[i]) & 0xff];
  }
  return c;
}

function teaEncryptBlock(v0, v1, k) {
  let y = v0 >>> 0;
  let z = v1 >>> 0;
  let s = 0;
  const delta = KEYS.UDP_TEA.DELTA >>> 0;
  for (let i = 0; i < KEYS.UDP_TEA.ROUNDS; i++) {
    s = (s + delta) >>> 0;
    y = (y + ((((z << 4) >>> 0) + k[0]) ^ ((z + s) >>> 0) ^ (((z >>> 5) + k[1]) >>> 0))) >>> 0;
    z = (z + ((((y << 4) >>> 0) + k[2]) ^ ((y + s) >>> 0) ^ (((y >>> 5) + k[3]) >>> 0))) >>> 0;
  }
  return [y >>> 0, z >>> 0];
}

function teaDecryptBlock(v0, v1, k) {
  let y = v0 >>> 0;
  let z = v1 >>> 0;
  const delta = KEYS.UDP_TEA.DELTA >>> 0;
  let s = (delta * KEYS.UDP_TEA.ROUNDS) >>> 0;
  for (let i = 0; i < KEYS.UDP_TEA.ROUNDS; i++) {
    z = (z - ((((y << 4) >>> 0) + k[2]) ^ ((y + s) >>> 0) ^ (((y >>> 5) + k[3]) >>> 0))) >>> 0;
    y = (y - ((((z << 4) >>> 0) + k[0]) ^ ((z + s) >>> 0) ^ (((z >>> 5) + k[1]) >>> 0))) >>> 0;
    s = (s - delta) >>> 0;
  }
  return [y >>> 0, z >>> 0];
}

function unpackTeaKey(keyBuf) {
  if (!Buffer.isBuffer(keyBuf)) keyBuf = Buffer.from(keyBuf, 'hex');
  return [
    keyBuf.readUInt32LE(0),
    keyBuf.readUInt32LE(4),
    keyBuf.readUInt32LE(8),
    keyBuf.readUInt32LE(12)
  ];
}

function teaCbcEncrypt(paddedBuf, keyBuf) {
  const k = unpackTeaKey(keyBuf);
  const out = Buffer.alloc(paddedBuf.length);
  let iv10 = 0, iv11 = 0, iv20 = 0, iv21 = 0;

  for (let i = 0; i + 8 <= paddedBuf.length; i += 8) {
    const p0 = paddedBuf.readUInt32BE(i);
    const p1 = paddedBuf.readUInt32BE(i + 4);
    const x0 = (p0 ^ iv10) >>> 0;
    const x1 = (p1 ^ iv11) >>> 0;
    const [e0, e1] = teaEncryptBlock(x0, x1, k);
    const c0 = (e0 ^ iv20) >>> 0;
    const c1 = (e1 ^ iv21) >>> 0;
    out.writeUInt32BE(c0, i);
    out.writeUInt32BE(c1, i + 4);
    iv10 = c0;
    iv11 = c1;
    iv20 = x0;
    iv21 = x1;
  }
  return out;
}

function teaCbcDecrypt(cipherBuf, keyBuf) {
  if (cipherBuf.length === 0 || cipherBuf.length % 8 !== 0) return null;
  const k = unpackTeaKey(keyBuf);
  const out = Buffer.alloc(cipherBuf.length);
  let iv10 = 0, iv11 = 0, iv20 = 0, iv21 = 0;

  for (let i = 0; i + 8 <= cipherBuf.length; i += 8) {
    const c0 = cipherBuf.readUInt32BE(i);
    const c1 = cipherBuf.readUInt32BE(i + 4);
    const e0 = (c0 ^ iv20) >>> 0;
    const e1 = (c1 ^ iv21) >>> 0;
    const [x0, x1] = teaDecryptBlock(e0, e1, k);
    const p0 = (x0 ^ iv10) >>> 0;
    const p1 = (x1 ^ iv11) >>> 0;
    out.writeUInt32BE(p0, i);
    out.writeUInt32BE(p1, i + 4);
    iv10 = c0;
    iv11 = c1;
    iv20 = x0;
    iv21 = x1;
  }
  return out;
}

function oicqPad(contentBuf) {
  const n = contentBuf.length;
  const r = (n + 10) % 8;
  const padLen = r === 0 ? 0 : 8 - r;
  return Buffer.concat([
    Buffer.from([padLen, 0x00, 0x00]),
    Buffer.alloc(padLen, 0x00),
    contentBuf,
    Buffer.alloc(7, 0x00)
  ]);
}

function oicqUnpad(decBuf) {
  if (!decBuf || decBuf.length < 10) return null;
  const padLen = decBuf[0] & 0x07;
  const start = 3 + padLen;
  const end = decBuf.length - 7;
  if (start > end) return null;
  return decBuf.subarray(start, end);
}

function getMaskIndices(matchCodeStr, isRudp) {
  const indices = [];
  for (const ch of String(matchCodeStr || '01234')) {
    const d = ch.charCodeAt(0) - 48;
    if (d >= 0 && d <= 4 && !indices.includes(d)) {
      if (!isRudp && d === 2) continue;
      indices.push(d);
    }
  }
  for (const d of [0, 1, 2, 3, 4]) {
    if (!isRudp && d === 2) continue;
    if (!indices.includes(d)) indices.push(d);
  }
  return indices;
}

function decodeMovement2001(bodyBuf) {
  const readUleb = (offset) => {
    let res = 0n, shift = 0n, pos = offset;
    while (pos < bodyBuf.length) {
      const b = bodyBuf[pos++];
      res |= BigInt(b & 0x7f) << shift;
      if ((b & 0x80) === 0) break;
      shift += 7n;
    }
    return [Number(res), pos];
  };
  const zzDecode = (n) => (n >>> 1) ^ -(n & 1);

  try {
    let off = 0;
    const [accountUid, o1] = readUleb(off); off = o1;
    const [playerState, o2] = readUleb(off); off = o2;
    const [xZz, o3] = readUleb(off); off = o3;
    const [yZz, o4] = readUleb(off); off = o4;
    const [zZz, o5] = readUleb(off); off = o5;
    const [moveState, o6] = readUleb(off); off = o6;
    const [tick, o7] = readUleb(off); off = o7;
    const [counter, o8] = readUleb(off); off = o8;
    return {
      type: 'UDP_PLAYER_STATE_SYNC (2001)',
      account_uid: accountUid,
      player_state: `0x${playerState.toString(16)}`,
      position: {
        x: Number((zzDecode(xZz) / 100.0).toFixed(2)),
        y: Number((zzDecode(yZz) / 100.0).toFixed(2)),
        z: Number((zzDecode(zZz) / 100.0).toFixed(2))
      },
      move_state: moveState,
      tick,
      counter,
      trailing_hex: bodyBuf.subarray(off).toString('hex')
    };
  } catch (_) {
    return null;
  }
}

function parseUdpDatagram(pktBuf, customUdpKey = null, customMatchCode = null) {
  if (!Buffer.isBuffer(pktBuf)) pktBuf = Buffer.from(pktBuf);
  if (pktBuf.length < 8) {
    return { valid: false, reason: 'Datagram shorter than 8 bytes', rawHex: pktBuf.toString('hex') };
  }

  const udpKey = customUdpKey || sessionState.udpKey || Buffer.alloc(16, 1);
  const matchCode = customMatchCode || sessionState.matchCode || '01234';

  const msgKey = pktBuf[0];
  const packetCrc = pktBuf[1];
  const calcCrc = crc7Buff(0, pktBuf.subarray(2)) & 0x7f;
  const crcValid = packetCrc === calcCrc;

  const k = udpKey[0];
  const v80 = ((k << 8) | k) & 0xffff;

  let parsedHeader = null;
  let headerEndOffset = 10;

  for (const isRudp of [true, false]) {
    const indices = getMaskIndices(matchCode, isRudp);
    const hdrSize = indices.reduce((acc, idx) => acc + KEYS.UDP_TEA.FIELD_SIZES[idx], 0);
    if (2 + hdrSize > pktBuf.length) continue;

    let pos = 2;
    const fields = {};
    for (const idx of indices) {
      const fName = KEYS.UDP_TEA.FIELD_NAMES[idx];
      const fSize = KEYS.UDP_TEA.FIELD_SIZES[idx];
      if (fSize === 1) {
        fields[fName] = (pktBuf[pos] ^ k) & 0xff;
        pos += 1;
      } else {
        const raw16 = pktBuf.readUInt16LE(pos);
        fields[fName] = (raw16 ^ v80) & 0xffff;
        pos += 2;
      }
    }

    const bodyAvailable = pktBuf.length - (2 + hdrSize);
    if (fields.length === bodyAvailable) {
      parsedHeader = { ...fields, isRudp, matchCodeUsed: matchCode };
      headerEndOffset = 2 + hdrSize;
      break;
    }
  }

  if (!parsedHeader) {
    const indices = getMaskIndices(matchCode, true);
    let pos = 2;
    const fields = {};
    for (const idx of indices) {
      const fName = KEYS.UDP_TEA.FIELD_NAMES[idx];
      const fSize = KEYS.UDP_TEA.FIELD_SIZES[idx];
      if (pos + fSize > pktBuf.length) break;
      if (fSize === 1) {
        fields[fName] = (pktBuf[pos] ^ k) & 0xff;
        pos += 1;
      } else {
        fields[fName] = (pktBuf.readUInt16LE(pos) ^ v80) & 0xffff;
        pos += 2;
      }
    }
    parsedHeader = { ...fields, isRudp: true, matchCodeUsed: matchCode, lengthMismatch: true };
    headerEndOffset = pos;
  }

  const rawBody = pktBuf.subarray(headerEndOffset);
  const cmdId = parsedHeader.cmd ?? 0;
  const cmdName = getUdpMessageName(cmdId);
  const isEncrypted = Boolean((parsedHeader.flags ?? 0) & 1);

  let decryptedBody = rawBody;
  let encryptionStatus = 'PLAINTEXT (flags=0)';

  if (isEncrypted && rawBody.length >= 8 && rawBody.length % 8 === 0) {
    const teaDec = teaCbcDecrypt(rawBody, udpKey);
    const unpadded = oicqUnpad(teaDec);
    if (unpadded) {
      decryptedBody = unpadded;
      encryptionStatus = `TEA-16-CBC + OICQ_UNPAD (key=${udpKey.toString('hex').slice(0, 12)}...)`;
    } else if (teaDec) {
      decryptedBody = teaDec;
      encryptionStatus = `TEA-16-CBC (raw blocks)`;
    }
  }

  let decodedPayload = null;
  if (cmdId === 2001 && !isEncrypted) {
    decodedPayload = decodeMovement2001(decryptedBody);
  } else if ((cmdId === 104 || cmdId === 105) && decryptedBody.length >= 11) {
    decodedPayload = {
      type: cmdName,
      player_id: decryptedBody.readUInt32LE(0),
      timestamp: decryptedBody.readUInt32LE(4),
      weapon_id: decryptedBody.readUInt16LE(8),
      fire_state: decryptedBody[10]
    };
  } else if (cmdId === 3 && decryptedBody.length >= 4) {
    decodedPayload = {
      type: 'UDP_PING',
      ping_counter: decryptedBody.readUInt32LE(0),
      tail_hex: decryptedBody.subarray(4).toString('hex')
    };
  } else if (cmdId === 447 && decryptedBody.length > 4) {
    const protoSlice = decryptedBody.subarray(4);
    const pb = decodeProtobuf(protoSlice, 'StartUDPMatch');
    decodedPayload = pb ? pb.fields : { raw_hex: decryptedBody.toString('hex') };
  } else if (decryptedBody.length > 0) {
    let pb = decodeProtobuf(decryptedBody, null);
    if ((!pb || !pb.fullyConsumed) && decryptedBody.length > 4) {
      const pbSkip4 = decodeProtobuf(decryptedBody.subarray(4), null);
      if (pbSkip4 && pbSkip4.fullyConsumed) pb = pbSkip4;
    }
    decodedPayload = pb
      ? pb.fields
      : {
          hex: decryptedBody.toString('hex'),
          ascii: decryptedBody.toString('utf8').replace(/[^\x20-\x7E]/g, '.')
        };
  }

  return {
    valid: true,
    statusCode: crcValid ? 200 : 422,
    msgKeyHex: `0x${msgKey.toString(16).padStart(2, '0')}`,
    msgKeyDesc: KEYS.UDP_TEA.MSG_KEYS[msgKey] || 'UDP_DATAGRAM',
    crc7: { packet: packetCrc, calculated: calcCrc, valid: crcValid },
    header: parsedHeader,
    cmdId,
    cmdName,
    encryptionStatus,
    rawHex: pktBuf.toString('hex'),
    decryptedHex: decryptedBody.toString('hex'),
    decodedPayload
  };
}

function buildUdpDatagram({
  msgKey = 0x5e,
  sendOption = 6,
  cmd = 447,
  orderId = 1,
  flags = 1,
  payloadBuf = Buffer.alloc(0),
  udpKey = null,
  matchCode = null
}) {
  const key = udpKey || sessionState.udpKey || Buffer.from('0102030405060708090a0b0c0d0e0f10', 'hex');
  const mCode = matchCode || sessionState.matchCode || '01234';
  const isRudp = orderId !== null && orderId !== undefined;

  let body = payloadBuf;
  if (flags & 1) {
    body = teaCbcEncrypt(oicqPad(payloadBuf), key);
  }

  const k = key[0];
  const v80 = ((k << 8) | k) & 0xffff;
  const fieldVals = { 0: sendOption, 1: cmd, 2: orderId || 0, 3: flags, 4: body.length };
  const indices = getMaskIndices(mCode, isRudp);

  const hdrChunks = [];
  for (const idx of indices) {
    const sz = KEYS.UDP_TEA.FIELD_SIZES[idx];
    const val = fieldVals[idx];
    if (sz === 1) {
      hdrChunks.push(Buffer.from([(val ^ k) & 0xff]));
    } else {
      const b = Buffer.alloc(2);
      b.writeUInt16LE((val ^ v80) & 0xffff, 0);
      hdrChunks.push(b);
    }
  }

  const hdrBuf = Buffer.concat(hdrChunks);
  const tail = Buffer.concat([hdrBuf, body]);
  const crc = crc7Buff(0, tail) & 0x7f;
  return Buffer.concat([Buffer.from([msgKey, crc]), tail]);
}

function parseTcpFrame(buf, direction = 'CLIENT->SERVER') {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
  const hex = buf.toString('hex');
  if (buf.length < 2) {
    return { packetType: 'TCP_RAW', statusCode: 200, rawHex: hex };
  }

  const prefix4 = hex.slice(0, 4).toLowerCase();
  const knownPrefix = KEYS.TCP_PREFIXES[prefix4];

  if (buf.length === 2 && knownPrefix && knownPrefix.type === 'KEEPALIVE') {
    return {
      packetType: knownPrefix.name,
      prefix: prefix4,
      statusCode: 200,
      encryptionStatus: 'PLAINTEXT_HEARTBEAT',
      rawHex: hex,
      decryptedHex: hex,
      decodedPayload: { heartbeat: true, region: knownPrefix.region }
    };
  }

  if (knownPrefix && knownPrefix.type === 'STARTUP_ONLINE' && buf.length > 22) {
    const uid = buf.readBigUInt64BE(2).toString();
    const serverTime = buf.readUInt32BE(10);
    const encLen = buf.readUInt32BE(18);
    const cipherJwt = buf.subarray(22, 22 + encLen);
    const aesRes = aesCbcDecryptSmart(cipherJwt);
    const jwtStr = aesRes.success ? aesRes.decryptedBuffer.toString('utf8') : null;
    return {
      packetType: knownPrefix.name,
      prefix: prefix4,
      statusCode: 200,
      encryptionStatus: aesRes.success ? aesRes.keyUsed : 'AES_CBC_ENCRYPTED_JWT',
      rawHex: hex,
      decryptedHex: aesRes.success ? aesRes.decryptedHex : cipherJwt.toString('hex'),
      decodedPayload: {
        uid,
        server_time: serverTime,
        jwt_length: encLen,
        jwt_decoded: jwtStr ? (tryDecodeJwt(jwtStr) || jwtStr) : 'Encrypted JWT'
      }
    };
  }

  if (knownPrefix && knownPrefix.type === 'STARTUP_CHAT' && buf.length > 18) {
    const uid = buf.readBigUInt64BE(2).toString();
    const serverTime = buf.readUInt32BE(10);
    const encLen = buf.readUInt32BE(14);
    const cipherJwt = buf.subarray(18, 18 + encLen);
    const aesRes = aesCbcDecryptSmart(cipherJwt);
    const jwtStr = aesRes.success ? aesRes.decryptedBuffer.toString('utf8') : null;
    return {
      packetType: knownPrefix.name,
      prefix: prefix4,
      statusCode: 200,
      encryptionStatus: aesRes.success ? aesRes.keyUsed : 'AES_CBC_ENCRYPTED_JWT',
      rawHex: hex,
      decryptedHex: aesRes.success ? aesRes.decryptedHex : cipherJwt.toString('hex'),
      decodedPayload: {
        uid,
        server_time: serverTime,
        jwt_length: encLen,
        jwt_decoded: jwtStr ? (tryDecodeJwt(jwtStr) || jwtStr) : 'Encrypted JWT'
      }
    };
  }

  if (knownPrefix && knownPrefix.type === 'ENCRYPTED_PROTO' && buf.length >= 22) {
    const declaredLen = buf.readUInt32BE(2);
    const cipherSlice = buf.subarray(6, 6 + declaredLen);
    const aesRes = aesCbcDecryptSmart(cipherSlice);
    let pb = null;
    if (aesRes.success) {
      pb = decodeProtobuf(aesRes.decryptedBuffer, knownPrefix.schema);
    }
    return {
      packetType: knownPrefix.name,
      prefix: prefix4,
      statusCode: 200,
      declaredLength: declaredLen,
      encryptionStatus: aesRes.success ? aesRes.keyUsed : 'AES_128_CBC_ENCRYPTED',
      rawHex: hex,
      decryptedHex: aesRes.success ? aesRes.decryptedHex : cipherSlice.toString('hex'),
      decodedPayload: pb ? pb.fields : (aesRes.success ? { raw_decrypted_hex: aesRes.decryptedHex } : { error: aesRes.reason })
    };
  }

  if (prefix4 === '0300' && buf.length >= 20) {
    const protoBuf = buf.subarray(5);
    const pb = decodeProtobuf(protoBuf, 'MatchFoundPacket');
    if (pb && pb.fields) {
      const srv = pb.fields['server_info (#5)'];
      const topMatchCode = pb.fields['match_code (#42)'];
      if (topMatchCode) sessionState.matchCode = String(topMatchCode);
      if (srv && typeof srv === 'object') {
        if (srv['server_ip_port (#2)']) sessionState.udpServer = String(srv['server_ip_port (#2)']);
        if (srv['match_code (#42)']) sessionState.matchCode = String(srv['match_code (#42)']);
        if (srv['udp_key (#3)']) {
          const keyHex = String(srv['udp_key (#3)']).replace(/^0x/, '');
          if (keyHex.length === 32) {
            sessionState.udpKey = Buffer.from(keyHex, 'hex');
            sessionState.updatedAt = new Date().toISOString();
          }
        }
      }
    }
    return {
      packetType: 'MatchFound_UDP_Assignment (0300)',
      prefix: '0300',
      statusCode: 200,
      encryptionStatus: 'PLAINTEXT_PROTOBUF (Offset 5)',
      rawHex: hex,
      decryptedHex: protoBuf.toString('hex'),
      decodedPayload: pb ? pb.fields : { raw_hex: protoBuf.toString('hex') },
      sessionUpdated: true
    };
  }

  for (const offset of [5, 6, 4, 8, 0]) {
    if (buf.length > offset + 2) {
      const slice = buf.subarray(offset);
      if (slice.length >= 16 && slice.length % 16 === 0) {
        const aesRes = aesCbcDecryptSmart(slice);
        if (aesRes.success) {
          const pb = decodeProtobuf(aesRes.decryptedBuffer, null);
          return {
            packetType: knownPrefix ? knownPrefix.name : `TCP_AES_FRAME_${prefix4.toUpperCase()}`,
            prefix: prefix4,
            statusCode: 200,
            encryptionStatus: aesRes.keyUsed,
            rawHex: hex,
            decryptedHex: aesRes.decryptedHex,
            decodedPayload: pb ? pb.fields : { raw_decrypted_hex: aesRes.decryptedHex }
          };
        }
      }
      const pbPlain = decodeProtobuf(slice, null);
      if (pbPlain && pbPlain.fullyConsumed && Object.keys(pbPlain.fields).length >= 2) {
        return {
          packetType: knownPrefix ? knownPrefix.name : `TCP_PROTO_FRAME_${prefix4.toUpperCase()} (offset=${offset})`,
          prefix: prefix4,
          statusCode: 200,
          encryptionStatus: `PLAINTEXT_PROTOBUF (offset=${offset})`,
          rawHex: hex,
          decryptedHex: slice.toString('hex'),
          decodedPayload: pbPlain.fields
        };
      }
    }
  }

  return {
    packetType: knownPrefix ? knownPrefix.name : `TCP_STREAM_${prefix4.toUpperCase()}`,
    prefix: prefix4,
    statusCode: 200,
    encryptionStatus: 'RAW_STREAM',
    rawHex: hex,
    decryptedHex: hex,
    decodedPayload: {
      length: buf.length,
      ascii_preview: buf.toString('utf8').replace(/[^\x20-\x7E]/g, '.')
    }
  };
}

function updateSessionFromHttpProto(urlPath, direction, decodedFields) {
  if (!decodedFields || typeof decodedFields !== 'object') return false;
  let updated = false;

  if (urlPath.toLowerCase().includes('/majorlogin') && direction === 'RESPONSE') {
    if (decodedFields['account_id (#1)']) {
      sessionState.accountId = decodedFields['account_id (#1)'];
      updated = true;
    }
    if (decodedFields['lock_region (#2)']) {
      sessionState.region = decodedFields['lock_region (#2)'];
      updated = true;
    }
    if (decodedFields['server_url (#10)']) {
      sessionState.serverUrl = String(decodedFields['server_url (#10)']);
      updated = true;
    }
    if (decodedFields['aes_ak (#22)'] && decodedFields['aes_ak (#22)'].hex) {
      sessionState.aesKey = Buffer.from(decodedFields['aes_ak (#22)'].hex, 'hex');
      updated = true;
    }
    if (decodedFields['aes_aiv (#23)'] && decodedFields['aes_aiv (#23)'].hex) {
      sessionState.aesIv = Buffer.from(decodedFields['aes_aiv (#23)'].hex, 'hex');
      updated = true;
    }
    if (decodedFields['token (#8)']) {
      sessionState.jwtToken = decodedFields['token (#8)'];
      updated = true;
    }
  }

  if (urlPath.toLowerCase().includes('/getlogindata') && direction === 'RESPONSE') {
    if (decodedFields['nickname (#4)']) {
      sessionState.nickname = decodedFields['nickname (#4)'];
      updated = true;
    }
    if (decodedFields['functional_addrs (#14)']) {
      sessionState.functionalAddr = decodedFields['functional_addrs (#14)'];
      updated = true;
    }
    if (decodedFields['informational_addrs (#32)']) {
      sessionState.informationalAddr = decodedFields['informational_addrs (#32)'];
      updated = true;
    }
  }

  if (updated) {
    sessionState.updatedAt = new Date().toISOString();
  }
  return updated;
}

module.exports = {
  sessionState,
  aesCbcEncrypt,
  aesCbcDecryptSmart,
  computeGarenaHmac,
  verifyGarenaHmac,
  crc7Buff,
  teaCbcEncrypt,
  teaCbcDecrypt,
  oicqPad,
  oicqUnpad,
  parseUdpDatagram,
  buildUdpDatagram,
  parseTcpFrame,
  updateSessionFromHttpProto
};
