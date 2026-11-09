/**
 * ============================================================================
<<<<<<< HEAD
 * FF-OMNI-PROXY v4.1: Zero-Latency Port 8080 Multiplexer
 * (HTTP + CONNECT + Transparent TLS SNI + SOCKS5 + Raw Game TCP)
 * ============================================================================
 *  - Zero loopback references anywhere.
 *  - Forwards all bytes FIRST and runs inspection asynchronously via `setImmediate`
 *    so the game client never experiences proxy lag or data-upload timeouts.
=======
 * FF-OMNI-PROXY v3.2: Stealth Port 8080 Multiplexer
 * (HTTP + CONNECT + Transparent TLS SNI + SOCKS5 + Raw Game TCP)
 * ============================================================================
 * Anti-Ban "Disabling data upload" Protection on Port :8080:
 *  - Passes exact encrypted bytes between Client and Server without modification.
 *  - Supports HTTP/HTTPS proxy, CONNECT tunnels, Transparent TLS (0x16 0x03) SNI
 *    routing, and SOCKS5 (0x05) so GGP / Castle / NetworkLog data uploads never fail!
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
 */

const net = require('net');
const http = require('http');
<<<<<<< HEAD
const os = require('os');
const { parseTcpFrame, sessionState } = require('../crypto/cipherEngine');
const { createHttpHandler, classifyUrlPurpose, responseModConfig } = require('./httpInterceptor');

const HTTP_FIRST_WORDS = ['GET ', 'POST', 'PUT ', 'DELE', 'HEAD', 'OPTI', 'PATC', 'CONN'];

function getActiveLanIps() {
  const ips = new Set(['0.0.0.0']);
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const netInfo of nets[name] || []) {
        if (netInfo.family === 'IPv4' && netInfo.address) {
          ips.add(netInfo.address);
        }
      }
    }
  } catch (_) {}
  return ips;
}

=======
const { parseTcpFrame, sessionState } = require('../crypto/cipherEngine');
const { createHttpHandler, classifyUrlPurpose } = require('./httpInterceptor');

const HTTP_FIRST_WORDS = ['GET ', 'POST', 'PUT ', 'DELE', 'HEAD', 'OPTI', 'PATC', 'CONN'];

>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
function extractTlsSni(buf) {
  try {
    if (!buf || buf.length < 43) return null;
    if (buf[0] !== 0x16 || buf[1] !== 0x03) return null;
    let pos = 5;
    if (buf[pos] !== 0x01) return null;
    pos += 4 + 2 + 32;
    if (pos >= buf.length) return null;
    const sessionIdLen = buf[pos];
    pos += 1 + sessionIdLen;
    if (pos + 2 > buf.length) return null;
    const cipherSuitesLen = buf.readUInt16BE(pos);
    pos += 2 + cipherSuitesLen;
    if (pos + 1 > buf.length) return null;
    const compMethodsLen = buf[pos];
    pos += 1 + compMethodsLen;
    if (pos + 2 > buf.length) return null;
    const extensionsLen = buf.readUInt16BE(pos);
    pos += 2;
    const extEnd = Math.min(buf.length, pos + extensionsLen);
    while (pos + 4 <= extEnd) {
      const extType = buf.readUInt16BE(pos);
      const extLen = buf.readUInt16BE(pos + 2);
      pos += 4;
      if (extType === 0x0000 && pos + 5 <= extEnd) {
        const nameType = buf[pos + 2];
        const nameLen = buf.readUInt16BE(pos + 3);
        if (nameType === 0 && pos + 5 + nameLen <= extEnd) {
          return buf.subarray(pos + 5, pos + 5 + nameLen).toString('utf8');
        }
      }
      pos += extLen;
    }
  } catch (_) {}
  return null;
}

<<<<<<< HEAD
function isSelfProxyTarget(hostStr = '', portNum = 8080, listenPort = 8080) {
  if (Number(portNum) !== Number(listenPort)) return false;
  const h = String(hostStr).trim().toLowerCase();
  if (!h) return true;
  const localIps = getActiveLanIps();
  return localIps.has(h);
=======
function isLocalLoopbackOrSelf(hostStr = '', portNum = 8080, listenPort = 8080) {
  const h = String(hostStr).trim().toLowerCase();
  if (Number(portNum) !== Number(listenPort)) return false;
  return h === '127.0.0.1' || h === 'localhost' || h === '0.0.0.0' || h.startsWith('10.') || h.startsWith('192.168.');
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
}

function attachRawTcpFrameInspector({
  clientSocket,
  upstreamSocket,
  clientAddr,
  targetAddr,
  initialChunk,
  onPacket
}) {
  const handleClientChunk = (chunk) => {
    if (upstreamSocket && !upstreamSocket.destroyed && upstreamSocket.writable) {
      upstreamSocket.write(chunk);
    }
<<<<<<< HEAD
    const cloned = Buffer.from(chunk);
    const activeMode = responseModConfig.modifierEnabled ? 'ON' : 'OFF';
    setImmediate(() => {
      try {
        const parsed = parseTcpFrame(cloned, 'CLIENT->SERVER');
        const evt = {
          id: `TCP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          protocol: 'TCP',
          capturedPort: 8080,
          modifierMode: activeMode,
          wasModified: false,
          direction: 'CLIENT -> SERVER',
          statusCode: 200,
          passthroughMode: 'ZERO_LATENCY_TCP_PASSTHROUGH',
          requestTitle: `[TCP OUTGOING REQUEST] [MOD:${activeMode}] ${parsed.packetType || 'TCP_FRAME'} (${clientAddr} -> ${targetAddr})`,
          responseTitle: `[TCP PASSTHROUGH] Status: 200 OK -> ${targetAddr}`,
          timestamp: new Date().toISOString(),
          source: clientAddr,
          destination: targetAddr,
          size: cloned.length,
          ...parsed
        };
        if (onPacket) onPacket(evt, sessionState);
      } catch (_) {}
    });
=======
    const parsed = parseTcpFrame(Buffer.from(chunk), 'CLIENT->SERVER');
    const evt = {
      id: `TCP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      protocol: 'TCP',
      capturedPort: 8080,
      direction: 'CLIENT -> SERVER',
      statusCode: 200,
      passthroughMode: 'EXACT_ENCRYPTED_WIRE_PASSTHROUGH',
      requestTitle: `[TCP OUTGOING REQUEST] ${parsed.packetType || 'TCP_FRAME'} (${clientAddr} -> ${targetAddr})`,
      responseTitle: `[TCP PASSTHROUGH] Status: 200 OK -> ${targetAddr}`,
      timestamp: new Date().toISOString(),
      source: clientAddr,
      destination: targetAddr,
      size: chunk.length,
      ...parsed
    };
    if (onPacket) onPacket(evt, sessionState);
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  };

  const handleServerChunk = (chunk) => {
    if (clientSocket && !clientSocket.destroyed && clientSocket.writable) {
      clientSocket.write(chunk);
    }
<<<<<<< HEAD
    const cloned = Buffer.from(chunk);
    const activeMode = responseModConfig.modifierEnabled ? 'ON' : 'OFF';
    setImmediate(() => {
      try {
        const parsed = parseTcpFrame(cloned, 'SERVER->CLIENT');
        const evt = {
          id: `TCP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          protocol: 'TCP',
          capturedPort: 8080,
          modifierMode: activeMode,
          wasModified: false,
          direction: 'SERVER -> CLIENT',
          statusCode: 200,
          passthroughMode: 'ZERO_LATENCY_TCP_PASSTHROUGH',
          requestTitle: `[TCP STREAM] [MOD:${activeMode}] ${targetAddr} -> ${clientAddr}`,
          responseTitle: `[TCP INCOMING RESPONSE] Status: 200 OK | ${parsed.packetType || 'TCP_FRAME'}`,
          timestamp: new Date().toISOString(),
          source: targetAddr,
          destination: clientAddr,
          size: cloned.length,
          ...parsed
        };
        if (onPacket) onPacket(evt, sessionState);
      } catch (_) {}
    });
=======
    const parsed = parseTcpFrame(Buffer.from(chunk), 'SERVER->CLIENT');
    const evt = {
      id: `TCP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      protocol: 'TCP',
      capturedPort: 8080,
      direction: 'SERVER -> CLIENT',
      statusCode: 200,
      passthroughMode: 'EXACT_ENCRYPTED_WIRE_PASSTHROUGH',
      requestTitle: `[TCP STREAM] ${targetAddr} -> ${clientAddr}`,
      responseTitle: `[TCP INCOMING RESPONSE] Status: 200 OK | ${parsed.packetType || 'TCP_FRAME'}`,
      timestamp: new Date().toISOString(),
      source: targetAddr,
      destination: clientAddr,
      size: chunk.length,
      ...parsed
    };
    if (onPacket) onPacket(evt, sessionState);
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  };

  if (initialChunk && initialChunk.length > 0) {
    handleClientChunk(initialChunk);
  }

  clientSocket.on('data', handleClientChunk);
  if (upstreamSocket) {
    upstreamSocket.on('data', handleServerChunk);
  }
}

<<<<<<< HEAD
function handleSocks5Connection(clientSocket, firstChunk, listenPort, onPacket) {
=======
/**
 * Handle SOCKS5 Connections on Port :8080 (for Android VPN apps using SOCKS5 mode)
 */
function handleSocks5Connection(clientSocket, firstChunk, listenPort, onPacket) {
  // Greeting: [0x05, nmethods, ...methods] -> reply [0x05, 0x00] (No Auth)
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
  clientSocket.write(Buffer.from([0x05, 0x00]));

  clientSocket.once('data', (reqChunk) => {
    if (!reqChunk || reqChunk.length < 7 || reqChunk[0] !== 0x05 || reqChunk[1] !== 0x01) {
      clientSocket.destroy();
      return;
    }
<<<<<<< HEAD
    const startTime = Date.now();
=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    const atyp = reqChunk[3];
    let targetHost = '';
    let targetPort = 443;
    let offset = 4;

    if (atyp === 0x01 && reqChunk.length >= 10) {
<<<<<<< HEAD
      targetHost = `${reqChunk[4]}.${reqChunk[5]}.${reqChunk[6]}.${reqChunk[7]}`;
      offset = 8;
    } else if (atyp === 0x03) {
=======
      // IPv4
      targetHost = `${reqChunk[4]}.${reqChunk[5]}.${reqChunk[6]}.${reqChunk[7]}`;
      offset = 8;
    } else if (atyp === 0x03) {
      // Domain name
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      const domainLen = reqChunk[4];
      if (reqChunk.length < 5 + domainLen + 2) {
        clientSocket.destroy();
        return;
      }
      targetHost = reqChunk.subarray(5, 5 + domainLen).toString('utf8');
      offset = 5 + domainLen;
    } else {
      clientSocket.destroy();
      return;
    }

    targetPort = reqChunk.readUInt16BE(offset);
<<<<<<< HEAD
    if (isSelfProxyTarget(targetHost, targetPort, listenPort)) {
=======
    if (isLocalLoopbackOrSelf(targetHost, targetPort, listenPort)) {
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      clientSocket.destroy();
      return;
    }

    const upstream = net.connect(targetPort, targetHost, () => {
<<<<<<< HEAD
      upstream.setNoDelay(true);
      clientSocket.setNoDelay(true);
      const reply = Buffer.from([0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0]);
      clientSocket.write(reply);

      clientSocket.pipe(upstream);
      upstream.pipe(clientSocket);

      setImmediate(() => {
        const activeMode = responseModConfig.modifierEnabled ? 'ON' : 'OFF';
        const fullUrl = `${targetPort === 443 ? 'https' : 'http'}://${targetHost}:${targetPort}/`;
        if (onPacket) {
          onPacket(
            {
              id: `SOCKS5-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              protocol: 'HTTP',
              capturedPort: listenPort,
              modifierMode: activeMode,
              wasModified: false,
              direction: 'SOCKS5 TUNNEL',
              timestamp: new Date().toISOString(),
              durationMs: Date.now() - startTime,
              method: 'SOCKS5',
              fullUrl,
              host: targetHost,
              path: '/',
              queryParams: {},
              statusCode: 200,
              urlMeta: classifyUrlPurpose(fullUrl, '/', ''),
              passthroughMode: 'ZERO_LATENCY_SOCKS5_PASSTHROUGH',
              requestTitle: `[SOCKS5 :${listenPort}] [MOD:${activeMode}] ${targetHost}:${targetPort}`,
              responseTitle: `200 SOCKS5 Tunnel Established <- ${targetHost}:${targetPort}`,
              request: {
                headers: { Host: `${targetHost}:${targetPort}` },
                size: reqChunk.length,
                encryption: 'SOCKS5_TUNNEL',
                rawHex: reqChunk.toString('hex'),
                decryptedHex: '',
                decoded: { targetHost, targetPort }
              },
              response: {
                headers: { status: 'SOCKS5 Tunnel Established' },
                size: 0,
                encryption: 'PASSTHROUGH',
                rawHex: '',
                decryptedHex: '',
                decoded: { status: 'Connected & Piped Untouched' }
              }
            },
            sessionState
          );
        }
      });
=======
      // SOCKS5 success reply
      const reply = Buffer.from([0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0]);
      clientSocket.write(reply);
      clientSocket.pipe(upstream);
      upstream.pipe(clientSocket);
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    });

    upstream.on('error', () => clientSocket.destroy());
    clientSocket.on('error', () => upstream.destroy());
  });
}

function createUnifiedPort8080Server({
  listenPort = 8080,
<<<<<<< HEAD
  defaultTcpTargetHost = '',
  defaultTcpTargetPort = 39003,
  onUniversalHttpRequest = null,
  onPacket
}) {
  const httpHandler = onUniversalHttpRequest || createHttpHandler({ fixedPort: listenPort, onPacket });
  const internalHttpServer = http.createServer(httpHandler);
  internalHttpServer.keepAliveTimeout = 30000;
  internalHttpServer.headersTimeout = 35000;
=======
  defaultTcpTargetHost = '127.0.0.1',
  defaultTcpTargetPort = 39003,
  onPacket
}) {
  const httpHandler = createHttpHandler({ fixedPort: listenPort, onPacket });
  const internalHttpServer = http.createServer(httpHandler);
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c

  internalHttpServer.on('connect', (req, clientSocket, head) => {
    const startTime = Date.now();
    const rawTarget = String(req.url || '').replace(/^https?:\/\//i, '');
    const [targetHost, targetPortStr] = rawTarget.split(':');
    const targetPort = Number(targetPortStr) || 443;
    const clientAddr = `${clientSocket.remoteAddress || 'client'}:${clientSocket.remotePort || ''}`;
    const targetAddr = `${targetHost}:${targetPort}`;

<<<<<<< HEAD
    if (!targetHost || isSelfProxyTarget(targetHost, targetPort, listenPort)) {
=======
    if (!targetHost || isLocalLoopbackOrSelf(targetHost, targetPort, listenPort)) {
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      clientSocket.destroy();
      return;
    }

<<<<<<< HEAD
    clientSocket.pause();

    const serverSocket = net.connect(targetPort, targetHost, () => {
      serverSocket.setNoDelay(true);
      clientSocket.setNoDelay(true);
=======
    const serverSocket = net.connect(targetPort, targetHost, () => {
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');

      let firstChunkInspected = false;
      let isRawGameTcp = false;

      const inspectChunk = (chunk, dir) => {
<<<<<<< HEAD
        const cloned = Buffer.from(chunk);
        const activeMode = responseModConfig.modifierEnabled ? 'ON' : 'OFF';
        setImmediate(() => {
          if (!firstChunkInspected && dir === 'C->S') {
            firstChunkInspected = true;
            const sni = extractTlsSni(cloned);
            if (cloned[0] === 0x16 && cloned[1] === 0x03) {
              const fullTunnelUrl = `https://${sni || targetHost}:${targetPort}/`;
              const evt = {
                id: `HTTP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                protocol: 'HTTP',
                capturedPort: listenPort,
                modifierMode: activeMode,
                wasModified: false,
                direction: 'CONNECT TUNNEL',
                timestamp: new Date().toISOString(),
                durationMs: Date.now() - startTime,
                method: 'CONNECT',
                fullUrl: fullTunnelUrl,
                host: sni || targetHost,
                path: '/',
                queryParams: {},
                statusCode: 200,
                urlMeta: classifyUrlPurpose(fullTunnelUrl, '/', ''),
                passthroughMode: 'ZERO_LATENCY_TLS_PASSTHROUGH',
                requestTitle: `[Port :${listenPort}] [MOD:${activeMode}] CONNECT ${fullTunnelUrl} (SNI: ${sni || targetHost})`,
                responseTitle: `200 Connection Established <- ${targetAddr}`,
                request: {
                  headers: req.headers,
                  size: cloned.length,
                  encryption: `TLS_PASSTHROUGH (SNI=${sni || targetHost})`,
                  rawHex: cloned.subarray(0, 64).toString('hex'),
                  decryptedHex: '',
                  decoded: {
                    tunnel_target: targetAddr,
                    tls_sni_hostname: sni || targetHost,
                    client_hello_bytes: cloned.length
                  }
                },
                response: {
                  headers: { status: '200 Connection Established' },
                  size: 0,
                  encryption: 'TLS_TUNNEL_ESTABLISHED',
                  rawHex: '',
                  decryptedHex: '',
                  decoded: { status: '200 Connection Established', upstream: targetAddr }
                }
              };
              if (onPacket) onPacket(evt, sessionState);
            } else {
              isRawGameTcp = true;
            }
          }

          if (isRawGameTcp) {
            const parsed = parseTcpFrame(cloned, dir === 'C->S' ? 'CLIENT->SERVER' : 'SERVER->CLIENT');
            const evt = {
              id: `TCP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              protocol: 'TCP',
              capturedPort: listenPort,
              modifierMode: activeMode,
              wasModified: false,
              direction: dir === 'C->S' ? 'CLIENT -> SERVER' : 'SERVER -> CLIENT',
              statusCode: 200,
              passthroughMode: 'ZERO_LATENCY_TCP_PASSTHROUGH',
              requestTitle: dir === 'C->S'
                ? `[TCP REQUEST] [MOD:${activeMode}] ${parsed.packetType} (${clientAddr} -> ${targetAddr})`
                : `[TCP STREAM] [MOD:${activeMode}] ${targetAddr} -> ${clientAddr}`,
              responseTitle: dir === 'S->C'
                ? `[TCP RESPONSE] Status: 200 OK | ${parsed.packetType} <- ${targetAddr}`
                : `[TCP FORWARDED] Status: 200 OK -> ${targetAddr}`,
              timestamp: new Date().toISOString(),
              source: dir === 'C->S' ? clientAddr : targetAddr,
              destination: dir === 'C->S' ? targetAddr : clientAddr,
              size: cloned.length,
              ...parsed
            };
            if (onPacket) onPacket(evt, sessionState);
          }
        });
=======
        if (!firstChunkInspected && dir === 'C->S') {
          firstChunkInspected = true;
          const sni = extractTlsSni(chunk);
          if (chunk[0] === 0x16 && chunk[1] === 0x03) {
            const fullTunnelUrl = `https://${sni || targetHost}:${targetPort}/`;
            const evt = {
              id: `HTTP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              protocol: 'HTTP',
              capturedPort: listenPort,
              direction: 'CONNECT TUNNEL',
              timestamp: new Date().toISOString(),
              durationMs: Date.now() - startTime,
              method: 'CONNECT',
              fullUrl: fullTunnelUrl,
              host: sni || targetHost,
              path: '/',
              queryParams: {},
              statusCode: 200,
              urlMeta: classifyUrlPurpose(fullTunnelUrl, '/', ''),
              passthroughMode: 'EXACT_TLS_PASSTHROUGH (Anti-Ban Safe)',
              requestTitle: `CONNECT ${fullTunnelUrl} (TLS SNI: ${sni || targetHost})`,
              responseTitle: `200 Connection Established <- ${targetAddr}`,
              request: {
                headers: req.headers,
                size: chunk.length,
                encryption: `TLS_PASSTHROUGH (SNI=${sni || targetHost})`,
                rawHex: chunk.subarray(0, 64).toString('hex'),
                decryptedHex: '',
                decoded: {
                  tunnel_target: targetAddr,
                  tls_sni_hostname: sni || targetHost,
                  client_hello_bytes: chunk.length
                }
              },
              response: {
                headers: { status: '200 Connection Established' },
                size: 0,
                encryption: 'TLS_TUNNEL_ESTABLISHED',
                rawHex: '',
                decryptedHex: '',
                decoded: { status: '200 Connection Established', upstream: targetAddr }
              }
            };
            if (onPacket) onPacket(evt, sessionState);
          } else {
            isRawGameTcp = true;
          }
        }

        if (isRawGameTcp) {
          const parsed = parseTcpFrame(Buffer.from(chunk), dir === 'C->S' ? 'CLIENT->SERVER' : 'SERVER->CLIENT');
          const evt = {
            id: `TCP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            protocol: 'TCP',
            capturedPort: listenPort,
            direction: dir === 'C->S' ? 'CLIENT -> SERVER' : 'SERVER -> CLIENT',
            statusCode: 200,
            passthroughMode: 'EXACT_ENCRYPTED_WIRE_PASSTHROUGH',
            requestTitle: dir === 'C->S'
              ? `[TCP REQUEST] ${parsed.packetType} (${clientAddr} -> ${targetAddr})`
              : `[TCP STREAM] ${targetAddr} -> ${clientAddr}`,
            responseTitle: dir === 'S->C'
              ? `[TCP RESPONSE] Status: 200 OK | ${parsed.packetType} <- ${targetAddr}`
              : `[TCP FORWARDED] Status: 200 OK -> ${targetAddr}`,
            timestamp: new Date().toISOString(),
            source: dir === 'C->S' ? clientAddr : targetAddr,
            destination: dir === 'C->S' ? targetAddr : clientAddr,
            size: chunk.length,
            ...parsed
          };
          if (onPacket) onPacket(evt, sessionState);
        }
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      };

      if (head && head.length > 0) {
        if (!serverSocket.destroyed) serverSocket.write(head);
        inspectChunk(head, 'C->S');
      }

<<<<<<< HEAD
      clientSocket.on('data', (chunk) => inspectChunk(chunk, 'C->S'));
      serverSocket.on('data', (chunk) => inspectChunk(chunk, 'S->C'));

      // Native kernel-backpressure piping so large HTTPS downloads never stall or drop chunks!
      clientSocket.pipe(serverSocket);
      serverSocket.pipe(clientSocket);
      clientSocket.resume();
=======
      clientSocket.on('data', (chunk) => {
        if (!serverSocket.destroyed) serverSocket.write(chunk);
        inspectChunk(chunk, 'C->S');
      });

      serverSocket.on('data', (chunk) => {
        if (!clientSocket.destroyed) clientSocket.write(chunk);
        inspectChunk(chunk, 'S->C');
      });
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    });

    serverSocket.on('error', () => clientSocket.destroy());
    clientSocket.on('error', () => serverSocket.destroy());
  });

  const muxServer = net.createServer((socket) => {
<<<<<<< HEAD
    socket.setNoDelay(true);
=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
    socket.once('data', (firstChunk) => {
      if (!firstChunk || firstChunk.length === 0) return;

      // 1. Check SOCKS5 Handshake (0x05)
      if (firstChunk[0] === 0x05 && firstChunk.length >= 2 && firstChunk.length <= 16) {
        handleSocks5Connection(socket, firstChunk, listenPort, onPacket);
        return;
      }

      // 2. Check Standard HTTP / CONNECT
      const prefixAscii = firstChunk.subarray(0, 4).toString('ascii').toUpperCase();
      const isHttp = HTTP_FIRST_WORDS.includes(prefixAscii);
      if (isHttp) {
<<<<<<< HEAD
        socket.pause();
        socket.unshift(firstChunk);
        internalHttpServer.emit('connection', socket);
        socket.resume();
        return;
      }

      // 3. Check Transparent TLS ClientHello (0x16 0x03) — Extract SNI and forward immediately!
      if (firstChunk[0] === 0x16 && firstChunk[1] === 0x03) {
        const sni = extractTlsSni(firstChunk);
        if (sni && !isSelfProxyTarget(sni, 443, listenPort)) {
          const startTime = Date.now();
          socket.pause();
          const tlsUpstream = net.connect(443, sni, () => {
            tlsUpstream.setNoDelay(true);
            tlsUpstream.write(firstChunk);
            socket.pipe(tlsUpstream);
            tlsUpstream.pipe(socket);
            socket.resume();

            setImmediate(() => {
              const activeMode = responseModConfig.modifierEnabled ? 'ON' : 'OFF';
              const fullTunnelUrl = `https://${sni}:443/`;
              const evt = {
                id: `HTTP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                protocol: 'HTTP',
                capturedPort: listenPort,
                modifierMode: activeMode,
                wasModified: false,
                direction: 'TRANSPARENT TLS SNI',
                timestamp: new Date().toISOString(),
                durationMs: Date.now() - startTime,
                method: 'TLS_SNI',
                fullUrl: fullTunnelUrl,
                host: sni,
                path: '/',
                queryParams: {},
                statusCode: 200,
                urlMeta: classifyUrlPurpose(fullTunnelUrl, '/', ''),
                passthroughMode: 'ZERO_LATENCY_TLS_SNI_PASSTHROUGH',
                requestTitle: `[TLS SNI] [MOD:${activeMode}] ${fullTunnelUrl}`,
                responseTitle: `200 TLS Passthrough <- ${sni}:443`,
                request: {
                  headers: { Host: sni },
                  size: firstChunk.length,
                  encryption: `TLS_CLIENT_HELLO (SNI=${sni})`,
                  rawHex: firstChunk.subarray(0, 64).toString('hex'),
                  decryptedHex: '',
                  decoded: { tls_sni_hostname: sni, target_port: 443, bytes: firstChunk.length }
                },
                response: {
                  headers: { status: 'TLS Stream Forwarded' },
                  size: 0,
                  encryption: 'TLS_PASSTHROUGH',
                  rawHex: '',
                  decryptedHex: '',
                  decoded: { status: 'Connected & Forwarded Untouched', sni }
                }
              };
              if (onPacket) onPacket(evt, sessionState);
            });
=======
        internalHttpServer.emit('connection', socket);
        socket.unshift(firstChunk);
        return;
      }

      // 3. Check Transparent TLS ClientHello (0x16 0x03) — Extract SNI and forward directly to :443!
      if (firstChunk[0] === 0x16 && firstChunk[1] === 0x03) {
        const sni = extractTlsSni(firstChunk);
        if (sni && !isLocalLoopbackOrSelf(sni, 443, listenPort)) {
          const startTime = Date.now();
          const tlsUpstream = net.connect(443, sni, () => {
            tlsUpstream.write(firstChunk);
            socket.pipe(tlsUpstream);
            tlsUpstream.pipe(socket);

            const fullTunnelUrl = `https://${sni}:443/`;
            const evt = {
              id: `HTTP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              protocol: 'HTTP',
              capturedPort: listenPort,
              direction: 'TRANSPARENT TLS SNI',
              timestamp: new Date().toISOString(),
              durationMs: Date.now() - startTime,
              method: 'TLS_SNI',
              fullUrl: fullTunnelUrl,
              host: sni,
              path: '/',
              queryParams: {},
              statusCode: 200,
              urlMeta: classifyUrlPurpose(fullTunnelUrl, '/', ''),
              passthroughMode: 'TRANSPARENT_TLS_SNI_PASSTHROUGH (Data-Upload Safe)',
              requestTitle: `[TLS SNI] ${fullTunnelUrl}`,
              responseTitle: `200 TLS Passthrough <- ${sni}:443`,
              request: {
                headers: { Host: sni },
                size: firstChunk.length,
                encryption: `TLS_CLIENT_HELLO (SNI=${sni})`,
                rawHex: firstChunk.subarray(0, 64).toString('hex'),
                decryptedHex: '',
                decoded: { tls_sni_hostname: sni, target_port: 443, bytes: firstChunk.length }
              },
              response: {
                headers: { status: 'TLS Stream Forwarded' },
                size: 0,
                encryption: 'TLS_PASSTHROUGH',
                rawHex: '',
                decryptedHex: '',
                decoded: { status: 'Connected & Forwarded Untouched', sni }
              }
            };
            if (onPacket) onPacket(evt, sessionState);
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
          });
          tlsUpstream.on('error', () => socket.destroy());
          socket.on('error', () => tlsUpstream.destroy());
          return;
        }
      }

<<<<<<< HEAD
      // 4. Raw Game TCP Frame
=======
      // 4. Raw Game TCP Frame (only connect if a valid functionalAddr or external target exists)
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      let targetHost = defaultTcpTargetHost;
      let targetPort = defaultTcpTargetPort;
      if (sessionState.functionalAddr && sessionState.functionalAddr.includes(':')) {
        const [h, p] = sessionState.functionalAddr.split(':');
        if (h && Number(p)) {
          targetHost = h;
          targetPort = Number(p);
        }
      }
<<<<<<< HEAD
      if (!targetHost) {
        socket.destroy();
        return;
      }

=======
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
      const clientAddr = `${socket.remoteAddress || 'client'}:${socket.remotePort || ''}`;
      const targetAddr = `${targetHost}:${targetPort}`;

      const upstreamSocket = new net.Socket();
<<<<<<< HEAD
      upstreamSocket.setNoDelay(true);
      if (!isSelfProxyTarget(targetHost, targetPort, listenPort)) {
=======
      if (!isLocalLoopbackOrSelf(targetHost, targetPort, listenPort) && targetHost !== '127.0.0.1') {
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
        upstreamSocket.connect(targetPort, targetHost, () => {});
      }
      upstreamSocket.on('error', () => {});

      attachRawTcpFrameInspector({
        clientSocket: socket,
        upstreamSocket,
        clientAddr,
        targetAddr,
        initialChunk: firstChunk,
        onPacket
      });

      socket.on('close', () => upstreamSocket.destroy());
      socket.on('error', () => upstreamSocket.destroy());
    });

    socket.on('error', () => {});
  });

  return {
    server: muxServer,
    start: () =>
      new Promise((resolve) => {
        muxServer.listen(listenPort, '0.0.0.0', () => resolve(listenPort));
      })
  };
}

module.exports = {
  createUnifiedPort8080Server,
  extractTlsSni
};
