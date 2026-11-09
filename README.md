<<<<<<< HEAD
# FF-OMNI-PROXY v6.0 — Pakistan (`PK`) #1 Priority + Single-Port Path Router (`/px/...`)
**100% Ready for Both Vercel Serverless & Termux (Zero Astutech Redirection • Zero Socket.IO • Zero Multi-Ports)**

## Key Upgrades in v6.0
1. **Astutech Redirection Completely Removed (`version.astutech.online` & `mainecoonnodex` Removed)**:
   - Connects directly to official Garena Pakistan (`PK`) & Global servers (`version.ggwhitehawk.com`, `dl.gmc.freefiremobile.com`, `core-gmc.freefiremobile.com`, `loginbp.ppmainecoonghj.com`, `clientbp.ppmainecoonghj.com`, `sgnetwork.ggblueshark.com`).
   - Built-in Pakistan (`PK`) OB55 `ver.php` template fallback (from your captured Packet #120) guarantees `/live/ver.php` never fails even if upstream is slow.
2. **Pakistan (`PK`) URLs Enforced Instead of Brazil (`BR`) URLs**:
   - Automatically replaces Brazil URLs (`dl.aw.freefiremobile.com`, `core-aw.freefiremobile.com`, `brnetwork.ggblueshark.com`, `brnbgiuabA101..105.ff_extend`, `country_code: "BR"`) with Pakistan (`PK`) URLs (`dl.gmc.freefiremobile.com`, `core-gmc.freefiremobile.com`, `sgnetwork.ggblueshark.com`, `pkennbgiuabA101..105.ff_extend`, `country_code: "PK"`).
   - Automatically syncs `remote_version` to your client's `?version=` parameter (`2.133.18` / `2.133.15`) and syncs `remote_option_version_astc` (`optionalavatarres:747|optionalclothres:1187...`) so auto-download works 100% without Error 400.
3. **Single-Port Path Routing (`/px/<proto>/<host>/<path>`) — Zero Extra Ports**:
   - No `:8081..:8085` multi-ports are opened!
   - All CDN & asset URLs are routed via paths on the same server/domain:
     - **Vercel**: `https://<your-app>.vercel.app/px/https/dl.gmc.freefiremobile.com/live/ABHotUpdates/...`
     - **Termux**: `http://<your-ip>:8080/px/https/dl.gmc.freefiremobile.com/live/ABHotUpdates/...`
4. **Zero `socket.io` (100% Vercel Serverless Compatible)**:
   - Uses fast HTTP polling (`/api/poll`) + `/tmp` storage on Vercel so the `/ds` Live Dashboard works seamlessly on both Vercel and Termux.

---

## How to Run in Termux
```bash
# 1. Run with Pakistan (PK) #1 Priority + /px/ Path Routing ON (Default):
node server.js --on

# 2. Run in 100% Untouched Normal Passthrough Mode (for comparing logs):
node server.js --off

# 3. Route ALL ver.php URLs through /px/ paths:
node server.js --on --all-paths
```
- **Dashboard**: `http://<your-lan-ip>:8080/ds`
- **Game Proxy `/live/ver.php`**: `http://<your-lan-ip>:8080/live/ver.php`

---

## How to Deploy on Vercel
1. Extract `rm.zip` into a folder (or push to a GitHub repository).
2. `vercel.json` and `api/index.js` are already pre-configured inside the project root.
3. Deploy via Vercel CLI or GitHub Import:
   ```bash
   npx vercel --prod
   ```
4. Once deployed on Vercel (`https://your-project.vercel.app`):
   - **Live Dashboard**: `https://your-project.vercel.app/ds`
   - **Game Version URL**: `https://your-project.vercel.app/live/ver.php`
   - **Path Proxy Route**: `https://your-project.vercel.app/px/https/dl.gmc.freefiremobile.com/live/ABHotUpdates/...`
=======
# FF-OMNI-PROXY (Node.js + Socket.IO Multi-Protocol Traffic Decryptor & Protobuf Analyzer)

A modular **Node.js + Socket.IO** proxy and real-time packet decryption suite built from all keys, ciphers, framing protocols, and Protobuf schemas extracted from your 10 uploaded archives (`GenXDivan.py`, `GenSpin.py`, `GG.GLORY.zip`, `LW UDP SOURCE.zip`, `Info-Api-Src.zip`, `OB55_LIKE_LIMIT-CK(1).zip`, `UID-PASS-LIKE-API.zip`, `UID-PASS-LIKE-API (1).zip`, and `main.php`).

## 1. Architecture Overview

```
ff-omni-proxy/
├── server.js                  # Main Node.js + Socket.IO Hub (:3000) + Proxy Orchestrator
├── package.json               # Node.js package manifest (runs both with npm install AND zero-dependency!)
├── config/
│   └── keys.js                # Extracted AES-128-CBC keys/IVs, Garena HMAC secret, XOR key, CRC7 table, endpoints
├── crypto/
│   └── cipherEngine.js        # AES-128-CBC (Static + Dynamic Session), HMAC-SHA256, 16-Round TEA-CBC + OICQ, CRC7
├── proto/
│   ├── all_protos.proto       # Unified Protobuf v3 schema definitions across all 10 uploaded archives
│   ├── protoEngine.js         # Recursive wire-format Protobuf decoder/encoder + URL/OpCode schema mapper
│   └── messageIds.js          # All 1,883 UDP / RUDP Message IDs (MESSAGE_ID_TO_NAME)
├── proxy/
│   ├── httpInterceptor.js     # HTTP/HTTPS Forward & Reverse Proxy (:8080) with full URL & AES/Protobuf decoding
│   ├── tcpInterceptor.js      # TCP Stream MITM Proxy (:9001) for 7119/9219 Auth, 0515 Squad, 0315 Match, 0300 UDP Key
│   └── udpInterceptor.js      # UDP/RUDP Datagram Proxy (:9002) with CRC7, match_code unmasking & TEA-CBC + OICQ
└── public/
    └── index.html             # Real-time Socket.IO Traffic Inspector & Interactive Decryptor Lab UI
```

## 2. Extracted Keys & Cryptographic Constants Used

| Protocol / Layer | Algorithm / Mode | Key / Secret / Table | Source File(s) |
| :--- | :--- | :--- | :--- |
| **HTTP / API & Static TCP** | `AES-128-CBC` (PKCS#7) | **Key:** `Yg&tc%DEuh6%Zc^8` (`5967267463254445756836255a635e38`)<br>**IV:** `6oyZDr22E3ychjM%` (`366f795a4472323245337963686a4d25`) | `GenXDivan.py`, `GenSpin.py`, `GG.GLORY`, `LW UDP`, `Info-Api`, `LIKE-API` |
| **Dynamic Session TCP** | `AES-128-CBC` (Session) | Auto-captured from `/MajorLogin` response Protobuf (`field 22 = aes_ak`, `field 23 = aes_aiv`) | `GG.GLORY/main.py`, `LW UDP/Main.py`, `GenSpin.py` |
| **Garena OAuth (`100067`)** | `HMAC-SHA256` | `2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3` | `GenXDivan.py`, `GenSpin.py`, `GG.GLORY`, `LW UDP` |
| **`MajorRegister` Field 14** | `Cyclic 32B XOR` | `00020170000020170000020170000020` (`[0x30, 0x30, 0x30, 0x32, ...]`) | `GenXDivan.py`, `GenSpin.py` |
| **UDP / RUDP Header** | `CRC7` + `XOR Mask` | 256-byte `CRC7_TABLE`, dynamic `match_code` layout (`01234` / `10324`), `k = udp_key[0]`, `v80 = (k << 8) \| k` | `GG.GLORY/main.py`, `LW UDP/Main.py` |
| **UDP / RUDP Body (`flags & 1`)** | `16-Round TEA-CBC` + `OICQ` | `_DELTA = 0x9E3779B9`, `_ROUNDS = 16`, 16-byte `udp_key` auto-extracted from TCP `0300` MatchFound (`field 5.3`) | `GG.GLORY/main.py`, `LW UDP/Main.py` |
| **`PurchaseGacha` Payloads** | `AES-128-CBC` + Protobuf | `54DB598CD88299E12EF19C9D2FDC1947...` & `B6804A9C3B9B41C40C4EA0439932902D...` | `GenSpin.py` |

## 3. Quick Start

```bash
# Option A: Run immediately (Zero external dependencies required!)
node server.js

# Option B: Install optional npm packages (express, socket.io, protobufjs) & start
npm install
npm start
```

Then open **`http://localhost:3000`** in your browser to view the live Socket.IO dashboard.
>>>>>>> 5677000af0c617e1869aedc40e2171780baea37c
