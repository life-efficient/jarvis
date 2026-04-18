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

# Start OpenClaw gateway
# The built Node entry point needs the 'gateway' subcommand to actually start the server
exec node /app/openclaw/dist/entry.js gateway
