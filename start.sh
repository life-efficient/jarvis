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
echo "Starting OpenClaw..."
echo "Visit the UI at the Railway URL once deployed"
echo ""
echo "=========================================="

# Start OpenClaw in foreground (Railway will manage the process)
# OpenClaw will initialize on first run with the onboarding flow
cd /app
export OPENCLAW_PORT=3000
export OPENCLAW_HOME=/app/.openclaw

# Run OpenClaw (it will handle its own config and initialization)
exec openclaw start
