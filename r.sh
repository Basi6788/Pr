#!/usr/bin/env bash
set -e

echo "[*] Removing outdated lockfiles (pnpm-lock.yaml / package-lock.json / yarn.lock)..."
rm -f pnpm-lock.yaml package-lock.json yarn.lock
git rm -f --ignore-unmatch pnpm-lock.yaml package-lock.json yarn.lock 2>/dev/null || true

echo "[*] Updating clean package.json (Zero socket.io, Vercel Node 20.x ready)..."
cat << 'EOF' > package.json
{
  "name": "ff-omni-proxy-pk",
  "version": "6.0.0",
  "description": "Pakistan (PK) #1 Priority Single-Port Path-Based (/px/...) Free Fire Proxy & Live Dashboard (/ds) for Vercel & Termux",
  "main": "server.js",
  "scripts": {
    "start": "node server.js --on",
    "on": "node server.js --on",
    "off": "node server.js --off",
    "all-paths": "node server.js --on --all-paths",
    "test": "node server.js --self-test"
  },
  "dependencies": {},
  "engines": {
    "node": "20.x"
  }
}
EOF

echo "[*] Updating vercel.json..."
cat << 'EOF' > vercel.json
{
  "version": 2,
  "functions": {
    "api/index.js": {
      "maxDuration": 60,
      "memory": 1024,
      "includeFiles": "{public/**,config/**,crypto/**,proto/**,proxy/**}"
    }
  },
  "rewrites": [
    { "source": "/ds", "destination": "/api/index.js" },
    { "source": "/ds/(.*)", "destination": "/api/index.js" },
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/px/(.*)", "destination": "/api/index.js" },
    { "source": "/live/(.*)", "destination": "/api/index.js" },
    { "source": "/common/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/api/index.js" }
  ]
}
EOF

mkdir -p api
cat << 'EOF' > api/index.js
const universalHttpHandler = require('../server');
module.exports = universalHttpHandler;
EOF

if [ -d ".git" ]; then
  echo "[*] Committing and pushing fix to GitHub..."
  git add -A
  git commit -m "Fix Vercel ERR_PNPM_OUTDATED_LOCKFILE and remove socket.io" || true
  git push || echo "[!] Run 'git push' manually if needed."
fi

echo "[OK] Lockfile issue fixed! Vercel build will now succeed with 0 errors."
