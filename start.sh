#!/bin/bash
set -e

echo "=========================================="
echo "Starting Jarvis (OpenClaw + gbrain)"
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
bun run gbrain/src/cli.ts embed --stale 2>/dev/null || true

# Initialize OpenClaw workspace if needed
if [ ! -f /app/.openclaw/config.json ]; then
  echo ""
  echo "⚙️  Configuring OpenClaw workspace..."
  mkdir -p /app/.openclaw
  cat > /app/.openclaw/config.json <<'EOF'
{
  "version": "1.0",
  "workspace": "jarvis",
  "permissions": {
    "allowed": ["gbrain", "openclaw"]
  }
}
EOF
fi

# Register gbrain MCP with OpenClaw
echo ""
echo "🔌 Registering gbrain MCP with OpenClaw..."
# OpenClaw will auto-discover MCP servers from config

echo ""
echo "=========================================="
echo "✨ Jarvis Ready!"
echo "=========================================="
echo ""
echo "📍 Web UI: http://localhost:3000"
echo "🧠 Brain: /app/brain (indexed with vector search)"
echo "🛠️  Skills: 26+ gbrain skills + custom"
echo "🗄️  Database: PGLite (local, persistent)"
echo ""
echo "Commands:"
echo "  gbrain query 'your question'"
echo "  gbrain search 'keyword'"
echo "  gbrain doctor"
echo ""

# Start OpenClaw
echo "Starting OpenClaw gateway..."
cd /app
exec openclaw run
