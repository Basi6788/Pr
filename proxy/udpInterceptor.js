/**
 * ============================================================================
 * FF-OMNI-PROXY v2.2: Stealth UDP / RUDP Datagram Interceptor on Port 8080
 * ============================================================================
 * 100% Untouched Encrypted Wire Passthrough:
 *  - Forwards exact raw UDP datagram bytes immediately between Client and Server.
 *  - Clones datagram in memory solely for CRC7, Header Unmasking, and 16-Round TEA-CBC + OICQ decryption.
 */

const dgram = require('dgram');
const { parseUdpDatagram, sessionState } = require('../crypto/cipherEngine');

function createUdpInterceptor({
  listenPort = 8080,
  targetHost = '127.0.0.1',
  targetPort = 10008,
  onPacket
}) {
  const socket = dgram.createSocket('udp4');
  let dynamicTargetHost = targetHost;
  let dynamicTargetPort = targetPort;
  let lastClientRinfo = null;

  socket.on('message', (msg, rinfo) => {
    if (sessionState.udpServer && sessionState.udpServer.includes(':')) {
      const [h, p] = sessionState.udpServer.split(':');
      if (h && Number(p)) {
        dynamicTargetHost = h;
        dynamicTargetPort = Number(p);
      }
    }

    const isFromServer =
      rinfo.address === dynamicTargetHost && Number(rinfo.port) === Number(dynamicTargetPort);
    const direction = isFromServer ? 'SERVER -> CLIENT' : 'CLIENT -> SERVER';

    if (!isFromServer) {
      lastClientRinfo = rinfo;
    }

    // 1. Forward exact original encrypted UDP bytes FIRST (untouched passthrough!)
    if (!isFromServer && !(dynamicTargetHost === '127.0.0.1' && dynamicTargetPort === listenPort)) {
      socket.send(msg, dynamicTargetPort, dynamicTargetHost, () => {});
    } else if (isFromServer && lastClientRinfo) {
      socket.send(msg, lastClientRinfo.port, lastClientRinfo.address, () => {});
    }

    // 2. Decrypt a read-only clone in memory for Terminal & Dashboard viewing
    const parsed = parseUdpDatagram(Buffer.from(msg));
    const srcAddr = `${rinfo.address}:${rinfo.port}`;
    const dstAddr = isFromServer
      ? (lastClientRinfo ? `${lastClientRinfo.address}:${lastClientRinfo.port}` : 'CLIENT')
      : `${dynamicTargetHost}:${dynamicTargetPort}`;

    const evt = {
      id: `UDP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      protocol: 'UDP',
      direction,
      statusCode: parsed.crc7?.valid ? 200 : 422,
      passthroughMode: 'EXACT_ENCRYPTED_WIRE_PASSTHROUGH',
      requestTitle: !isFromServer
        ? `[UDP OUTGOING REQUEST] ${parsed.cmdName} (cmd=${parsed.cmdId}, ${parsed.msgKeyHex})`
        : `[UDP SERVER STREAM] ${srcAddr} -> ${dstAddr}`,
      responseTitle: isFromServer
        ? `[UDP INCOMING RESPONSE] Status: 200 OK | ${parsed.cmdName} (cmd=${parsed.cmdId})`
        : `[UDP PASSTHROUGH] Status: ${parsed.crc7?.valid ? '200 CRC7_OK' : '422 CRC7_MISMATCH'} -> ${dstAddr}`,
      timestamp: new Date().toISOString(),
      source: srcAddr,
      destination: dstAddr,
      size: msg.length,
      ...parsed
    };

    if (onPacket) onPacket(evt, sessionState);
  });

  socket.on('error', () => {});

  return {
    socket,
    setTarget: (host, port) => {
      dynamicTargetHost = host;
      dynamicTargetPort = Number(port);
    },
    start: () =>
      new Promise((resolve) => {
        socket.bind(listenPort, '0.0.0.0', () => resolve(listenPort));
      })
  };
}

module.exports = { createUdpInterceptor };
