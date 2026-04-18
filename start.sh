#!/bin/bash
set -e

echo "Starting Jarvis..."

# Initialize gbrain if needed
if [ ! -f /app/.gbrain/brain.db ]; then
  echo "Initializing gbrain database..."
  cd /app && bun run gbrain/src/cli.ts init
fi

# Sync brain content
echo "Syncing brain..."
cd /app && bun run gbrain/src/cli.ts sync --repo brain && bun run gbrain/src/cli.ts embed --stale

echo "Jarvis ready!"
echo "- Brain indexed and searchable"
echo "- gbrain CLI available via: bun run gbrain/src/cli.ts <command>"
echo ""

# Keep container running
tail -f /dev/null
