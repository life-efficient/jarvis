# Jarvis — OpenClaw on Railway

Deploy a preconfigured AI agent on Railway with one click. Zero setup friction.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new?templateUrl=https%3A%2F%2Fgithub.com%2Flife-efficient%2Fjarvis)

## What you get

- **OpenClaw Gateway + Control UI** (served at `/` and `/openclaw`)
- **Preconfigured with OpenRouter** for flexible model access (Claude, GPT-4, Llama, etc.)
- **Setup Wizard** at `/setup` for device pairing and configuration
- **Persistent state** via Railway Volume (config/credentials/memory survive redeploys)
- **One-click backup/restore** at `/setup` (easy migration)

## Quick start

1. Click the **Deploy on Railway** button above
2. Railway will ask for:
   - `SETUP_PASSWORD` — password to access setup wizard
   - `OPENROUTER_API_KEY` — your OpenRouter API key ([get one free](https://openrouter.ai))
3. Wait for the build to complete
4. Visit `https://<your-railway-domain>/setup`
   - Username: anything
   - Password: the `SETUP_PASSWORD` you set
5. Approve the Control UI for pairing
6. Chat with your OpenClaw agent at `/`

## How it works

- The container runs a wrapper web server that:
  - Protects `/setup` and `/openclaw` with HTTP Basic auth
  - Auto-configures OpenClaw with OpenRouter on first run
  - Reverse-proxies requests (including WebSockets) to the local gateway
- OpenClaw handles the AI agent, memory, workspace, and channel integrations
- Everything persists to `/data` volume so state survives redeploys

## Configuration

The wrapper automatically configures:
- ✅ OpenRouter as the model provider (from `OPENROUTER_API_KEY`)
- ✅ Device pairing approval UI
- ✅ Workspace identity files (SOUL.md, IDENTITY.md, USER.md, etc.)

You can customize further in the **Setup Wizard** at `/setup`:
- Add Telegram/Discord/Slack bots
- Edit the agent's personality (SOUL.md, IDENTITY.md)
- Configure advanced settings (via Debug Console or Config Editor)

## Local testing

```bash
docker build -t jarvis .

docker run --rm -p 3000:3000 \
  -e PORT=3000 \
  -e SETUP_PASSWORD=test \
  -e OPENROUTER_API_KEY=sk-or-your-key-here \
  -v $(pwd)/.tmpdata:/data \
  jarvis

# Open http://localhost:3000/setup (password: test)
```

## Persistence

Railway volumes at `/data` persist across redeploys:

**What persists:**
- Workspace files (SOUL.md, IDENTITY.md, etc.)
- Agent memory and sessions
- OpenClaw configuration
- Global npm/pnpm installs (configured to use `/data`)

**What doesn't persist:**
- System packages from `apt-get` (use `/data` instead)
- Temporary files in `/tmp`

## Troubleshooting

### Device pairing shows "pairing required"

This is normal on first run. The Control UI needs approval to connect:

1. Open `/setup`
2. Go to **Device Pairing** section
3. Click **Open Control UI (triggers pairing)**
4. A new window opens — wait a moment
5. Pairing request appears in the list
6. Click **Approve**
7. Refresh the Control UI

(The Setup Wizard streamlines this into one step so users don't see the error.)

### Gateway connection errors / 502

Usually means the wrapper is up but the gateway failed to start.

Check:
- `/setup/api/debug` for gateway status
- Railway logs for wrapper errors
- Ensure volume is mounted at `/data`
- Ensure `OPENROUTER_API_KEY` is set

### "Reached heap limit" during build

Building OpenClaw from source needs 2GB+ memory.

On Railway: upgrade to a plan with more memory and redeploy.

## Files

- `Dockerfile` — Multi-stage build (compiles OpenClaw + runtime image)
- `src/server.js` — Express wrapper + reverse proxy
- `src/setup-app.js` — Browser setup wizard UI
- `entrypoint.sh` — Container entrypoint (runs onboarding, starts wrapper)
- `railway.toml` — Railway deployment config
- `TODO.md` — Future improvements (security, features)

## Roadmap

See `TODO.md` for planned improvements:
- Stronger auth (passkeys, OAuth)
- Pre-configurable agent personality
- Custom UI themes
- Multi-user support

## License

MIT (inherits from OpenClaw)

## Credits

- Built on [OpenClaw](https://openclaw.ai) by the OpenClaw team
- Inspired by [clawdbot-railway-template](https://github.com/vignesh07/clawdbot-railway-template)
- Customized for Jarvis with OpenRouter preconfiguration
