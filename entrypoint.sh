#!/bin/bash
set -e

# Set defaults matching server.js
STATE_DIR="${OPENCLAW_STATE_DIR:=$HOME/.openclaw}"
WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:=$STATE_DIR/workspace}"

# If config already exists, just start the server
if [ -f "$STATE_DIR/openclaw.json" ]; then
  exec node src/server.js
fi

# Auto-configure with OpenRouter if OPENROUTER_API_KEY is set
if [ -n "$OPENROUTER_API_KEY" ]; then
  echo "[entrypoint] Configuring OpenClaw with OpenRouter..."

  mkdir -p "$STATE_DIR" "$WORKSPACE_DIR"

  # Generate gateway token
  if [ -f "$STATE_DIR/gateway.token" ]; then
    GATEWAY_TOKEN=$(cat "$STATE_DIR/gateway.token")
  else
    GATEWAY_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    mkdir -p "$STATE_DIR"
    echo -n "$GATEWAY_TOKEN" > "$STATE_DIR/gateway.token"
  fi

  node /openclaw/dist/entry.js onboard \
    --non-interactive \
    --accept-risk \
    --json \
    --no-install-daemon \
    --skip-health \
    --workspace "$WORKSPACE_DIR" \
    --gateway-bind loopback \
    --gateway-port 18789 \
    --gateway-auth token \
    --gateway-token "$GATEWAY_TOKEN" \
    --flow quickstart \
    --auth-choice openrouter-api-key \
    --openrouter-api-key "$OPENROUTER_API_KEY"

  echo "[entrypoint] OpenClaw configured successfully"
fi

# Start the server
exec node src/server.js
