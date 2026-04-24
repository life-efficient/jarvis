#!/bin/bash
set -e

STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$STATE_DIR/workspace}"
OC_PORT=3002  # gateway — loopback only, never exposed directly

mkdir -p "$STATE_DIR" "$WORKSPACE_DIR"

# Generate/persist a bootstrap token used only for onboard; auth is disabled after
TOKEN_FILE="$STATE_DIR/gateway.token"
if [ -f "$TOKEN_FILE" ]; then
  _BOOTSTRAP_TOKEN=$(cat "$TOKEN_FILE")
else
  _BOOTSTRAP_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  echo -n "$_BOOTSTRAP_TOKEN" > "$TOKEN_FILE"
fi

if [ ! -f "$STATE_DIR/openclaw.json" ]; then
  if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "[entrypoint] ERROR: OPENROUTER_API_KEY not set and no config found" >&2
    exit 1
  fi
  echo "[entrypoint] First run — configuring OpenClaw..."
  node /openclaw/dist/entry.js onboard \
    --non-interactive \
    --accept-risk \
    --json \
    --no-install-daemon \
    --skip-health \
    --workspace "$WORKSPACE_DIR" \
    --gateway-bind loopback \
    --gateway-port "$OC_PORT" \
    --gateway-auth token \
    --gateway-token "$_BOOTSTRAP_TOKEN" \
    --flow quickstart \
    --auth-choice openrouter-api-key \
    --openrouter-api-key "$OPENROUTER_API_KEY"
fi

# Always sync so stale volume state can't diverge.
# auth.mode=none is valid for loopback-only binding; nginx handles edge auth.
node /openclaw/dist/entry.js config set gateway.port "$OC_PORT"
node /openclaw/dist/entry.js config set gateway.bind loopback
node /openclaw/dist/entry.js config set gateway.auth.mode none

# Password protection — defaults to "password", override via GATEWAY_PASSWORD env var
if [ "${GATEWAY_PASSWORD}" = "password" ]; then
  echo "[entrypoint] WARNING: using default password. Set GATEWAY_PASSWORD in your .env to secure this instance."
fi
if [ -n "$GATEWAY_PASSWORD" ]; then
  _USER="${GATEWAY_USER:-admin}"
  printf '%s:%s\n' "$_USER" "$(openssl passwd -apr1 "$GATEWAY_PASSWORD")" > /etc/nginx/.htpasswd
  printf 'auth_basic "Jarvis";\nauth_basic_user_file /etc/nginx/.htpasswd;\n' \
    > /etc/nginx/auth-include.conf
else
  : > /etc/nginx/auth-include.conf
fi

cat > /etc/nginx/conf.d/jarvis.conf <<NGINX
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

# ── Port 3000 — Jarvis custom UI ─────────────────────────────────────────────
server {
    listen 3000;
    include /etc/nginx/auth-include.conf;

    root /app/ui;
    index index.html;
    try_files \$uri /index.html;

    # Proxy gateway WS and API — rewrite Origin to match gateway's allowedOrigins
    location /gateway-ws {
        proxy_pass         http://127.0.0.1:${OC_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    \$http_upgrade;
        proxy_set_header   Connection \$connection_upgrade;
        proxy_set_header   Host       \$host;
        proxy_set_header   Origin     http://localhost:${OC_PORT};
        proxy_read_timeout 86400s;
    }

    location /api {
        proxy_pass       http://127.0.0.1:${OC_PORT};
        proxy_set_header Host   \$host;
        proxy_set_header Origin http://localhost:${OC_PORT};
    }

    location /__openclaw {
        proxy_pass       http://127.0.0.1:${OC_PORT};
        proxy_set_header Host   \$host;
        proxy_set_header Origin http://localhost:${OC_PORT};
    }
}

# ── Port 3001 — OpenClaw Control UI (full proxy to gateway) ──────────────────
server {
    listen 3001;
    include /etc/nginx/auth-include.conf;

    location / {
        proxy_pass         http://127.0.0.1:${OC_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    \$http_upgrade;
        proxy_set_header   Connection \$connection_upgrade;
        proxy_set_header   Host       \$host;
        proxy_set_header   Origin     http://localhost:${OC_PORT};
        proxy_read_timeout 86400s;
    }
}
NGINX

nginx
echo "[entrypoint] nginx ready — custom UI :3000  OpenClaw UI :3001"

exec node /openclaw/dist/entry.js gateway run
