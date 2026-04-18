#!/bin/bash

echo "=========================================="
echo "🚀 Starting Jarvis (OpenClaw + gbrain)"
echo "=========================================="

# Ensure directories exist
mkdir -p /data/openclaw /data/tools

echo "🧠 Brain: /app/brain (ready for OpenClaw)"
echo "🛠️  Skills: 28 gbrain skills available"
echo "🔌 gbrain ready as MCP for OpenClaw"
echo ""
echo "=========================================="
echo "🎯 Starting OpenClaw on port ${PORT:-8080}"
echo "=========================================="
echo ""

# Start OpenClaw server from compiled dist output
# OpenClaw build outputs to dist/entry.js
exec node /app/openclaw/dist/entry.js
