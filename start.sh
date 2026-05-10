#!/usr/bin/env bash
set -euo pipefail

DEV_MODE=false
for arg in "$@"; do
  [[ "$arg" == "--dev" ]] && DEV_MODE=true
done

# Node >= 18 check
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. Download it from https://nodejs.org (v18 or newer)."
  exit 1
fi
NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
if (( NODE_MAJOR < 18 )); then
  echo "ERROR: Node.js v18+ required (found v$(node -e 'process.stdout.write(process.versions.node)'))."
  exit 1
fi

echo "Node.js $(node --version) OK"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install --prefer-offline

if $DEV_MODE; then
  # Detect local IP for convenience message
  LOCAL_IP=$(ip -4 addr show scope global 2>/dev/null \
    | grep -oP '(?<=inet\s)\d+(\.\d+){3}' \
    | head -1 || true)
  [[ -z "$LOCAL_IP" ]] && LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "your-server-ip")

  echo ""
  echo "Starting dev server..."
  echo ""
  echo "  Local:   http://localhost:3000"
  [[ -n "$LOCAL_IP" ]] && echo "  Network: http://${LOCAL_IP}:3000"
  echo ""
  exec npm run dev
else
  echo ""
  echo "Building for production..."
  npm run build

  # Detect local IP
  LOCAL_IP=$(ip -4 addr show scope global 2>/dev/null \
    | grep -oP '(?<=inet\s)\d+(\.\d+){3}' \
    | head -1 || true)
  [[ -z "$LOCAL_IP" ]] && LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "your-server-ip")

  echo ""
  echo "Starting production server..."
  echo ""
  echo "  Local:   http://localhost:3000"
  [[ -n "$LOCAL_IP" ]] && echo "  Network: http://${LOCAL_IP}:3000"
  echo ""
  exec npm start
fi
