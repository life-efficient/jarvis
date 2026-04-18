#!/bin/bash

echo "=========================================="
echo "🚀 Starting Jarvis (OpenClaw + gbrain)"
echo "=========================================="

cd /app

# Initialize gbrain database if needed
if [ ! -f /app/.gbrain/brain.db ] && [ ! -d /app/.gbrain/brain.pglite ]; then
  echo ""
  echo "📚 Initializing gbrain database (PGLite)..."
  bun run gbrain/src/cli.ts init || echo "GBrain init failed, continuing..."
fi

# Sync brain content
echo ""
echo "🔄 Syncing brain content..."
bun run gbrain/src/cli.ts sync --repo brain 2>/dev/null || echo "Brain sync skipped"
bun run gbrain/src/cli.ts embed --stale 2>/dev/null || echo "Embed skipped"

echo ""
echo "=========================================="
echo "✨ Jarvis Infrastructure Ready"
echo "=========================================="
echo "🧠 Brain: /app/brain (PGLite vector search)"
echo "🛠️  Skills: 28 gbrain skills available"
echo "🔌 MCP: gbrain ready for OpenClaw"
echo ""

# Set OpenClaw configuration
export OPENCLAW_STATE_DIR=/app/.openclaw
export OPENCLAW_GATEWAY_PORT=3000
mkdir -p /app/.openclaw

echo "=========================================="
echo "🎯 Starting OpenClaw Gateway on port 3000"
echo "=========================================="
echo ""
echo "Checking OpenClaw installation..."
which openclaw && echo "✓ OpenClaw found" || echo "✗ OpenClaw not found"

echo "Starting gateway..."
openclaw --version

# Run OpenClaw gateway in foreground with output
echo "Gateway starting..."
openclaw gateway run --allow-unconfigured 2>&1
