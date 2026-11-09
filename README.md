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
