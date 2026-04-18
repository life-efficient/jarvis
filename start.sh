#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Starting Jarvis (OpenClaw + gbrain)"
echo "=========================================="

cd /app

# Initialize gbrain if needed
if [ ! -d /app/.gbrain/brain.pglite ]; then
  echo "📚 Initializing gbrain (PGLite)..."
  cd /app/gbrain && npx ts-node -P tsconfig.json -O '{"module":"commonjs"}' src/cli.ts init || true
fi

# Sync brain content
echo "🔄 Syncing brain..."
cd /app/gbrain && npx ts-node -P tsconfig.json -O '{"module":"commonjs"}' src/cli.ts sync --repo ../brain 2>/dev/null || true
cd /app/gbrain && npx ts-node -P tsconfig.json -O '{"module":"commonjs"}' src/cli.ts embed --stale 2>/dev/null || true

echo ""
echo "=========================================="
echo "✨ Jarvis Infrastructure Ready"
echo "=========================================="
echo "🧠 Brain: /app/brain (PGLite vector search)"
echo "🛠️  Skills: 28 gbrain skills available"
echo "🔌 MCP: gbrain ready for OpenClaw"
echo ""

# Create OpenClaw config directory
mkdir -p /data/openclaw /data/tools

# Pre-configure OpenClaw with API keys if provided
if [ -n "$OPENAI_API_KEY" ] || [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "⚙️  Pre-configuring OpenClaw with API keys..."
  # OpenClaw will use env vars if present, no need to write config files
fi

echo "=========================================="
echo "🎯 Starting OpenClaw on port ${PORT:-8080}"
echo "=========================================="
echo ""
echo "✓ Jarvis ready - visiting the URL will start OpenClaw"
echo ""

# Start OpenClaw server (uses NODE_ENV=production, OPENCLAW_STATE_DIR, PORT from Railway)
cd /app/openclaw
exec node src/server.js
