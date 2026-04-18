#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Starting Jarvis (OpenClaw + gbrain)"
echo "=========================================="

# Initialize gbrain database if needed
if [ ! -f /app/.gbrain/brain.db ] && [ ! -d /app/.gbrain/brain.pglite ]; then
  echo ""
  echo "📚 Initializing gbrain database (PGLite)..."
  cd /app && bun run gbrain/src/cli.ts init
fi

# Sync brain content
echo ""
echo "🔄 Syncing brain content..."
cd /app && bun run gbrain/src/cli.ts sync --repo brain 2>/dev/null || true
cd /app && bun run gbrain/src/cli.ts embed --stale 2>/dev/null || true

echo ""
echo "=========================================="
echo "✨ Jarvis Infrastructure Ready"
echo "=========================================="
echo ""
echo "🧠 Brain: /app/brain (PGLite vector search)"
echo "🛠️  Skills: 28 gbrain skills available"
echo "🔌 MCP: gbrain ready for OpenClaw"
echo ""
echo "=========================================="
echo "🎯 Starting OpenClaw Gateway"
echo "=========================================="

cd /app

# Set OpenClaw state directory
export OPENCLAW_STATE_DIR=/app/.openclaw

# Configure OpenClaw to use port 3000 (for Railway)
# OpenClaw reads config from ~/.openclaw or OPENCLAW_STATE_DIR
mkdir -p /app/.openclaw

# Initialize config if needed (set gateway port to 3000)
if [ ! -f /app/.openclaw/config.json ]; then
  echo ""
  echo "⚙️  Initializing OpenClaw config..."
  # OpenClaw will auto-create config on first run
  # It will prompt for setup via its chat interface
fi

echo ""
echo "Starting OpenClaw daemon on port 3000..."
echo "Once running, visit the Railway URL and go through the setup"
echo ""

# Run OpenClaw Gateway daemon in foreground
# It will handle its own initialization and configuration via the web UI
exec openclaw daemon --port 3000
