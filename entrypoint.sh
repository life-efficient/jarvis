#!/bin/bash
set -e

STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$STATE_DIR/workspace}"
PORT="${PORT:-3000}"

mkdir -p "$STATE_DIR" "$WORKSPACE_DIR"

if [ ! -f "$STATE_DIR/openclaw.json" ]; then
  if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "[entrypoint] ERROR: OPENROUTER_API_KEY not set and no config found" >&2
    exit 1
  fi

  echo "[entrypoint] First run — configuring OpenClaw with OpenRouter..."

  GATEWAY_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  echo -n "$GATEWAY_TOKEN" > "$STATE_DIR/gateway.token"

  node /openclaw/dist/entry.js onboard \
    --non-interactive \
    --accept-risk \
    --json \
    --no-install-daemon \
    --skip-health \
    --workspace "$WORKSPACE_DIR" \
    --gateway-bind lan \
    --gateway-port "$PORT" \
    --gateway-auth token \
    --gateway-token "$GATEWAY_TOKEN" \
    --flow quickstart \
    --auth-choice openrouter-api-key \
    --openrouter-api-key "$OPENROUTER_API_KEY"

  node /openclaw/dist/entry.js config set gateway.remote.token "$GATEWAY_TOKEN"
  echo "[entrypoint] OpenClaw configured."
else
  # Sync port, bind, and tokens on every start in case env vars changed
  GATEWAY_TOKEN=$(cat "$STATE_DIR/gateway.token" 2>/dev/null || true)
  node /openclaw/dist/entry.js config set gateway.port "$PORT"
  node /openclaw/dist/entry.js config set gateway.bind lan
  if [ -n "$GATEWAY_TOKEN" ]; then
    node /openclaw/dist/entry.js config set gateway.auth.mode token
    node /openclaw/dist/entry.js config set gateway.auth.token "$GATEWAY_TOKEN"
    node /openclaw/dist/entry.js config set gateway.remote.token "$GATEWAY_TOKEN"
  fi
fi

# Print the dashboard URL so the token is visible in logs if needed
node /openclaw/dist/entry.js dashboard --no-open || true

# Start the gateway — it serves the Control UI directly on $PORT
exec node /openclaw/dist/entry.js gateway run
