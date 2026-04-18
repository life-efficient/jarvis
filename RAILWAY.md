# Deploying Jarvis to Railway

A step-by-step guide to deploy Jarvis to Railway.

## Prerequisites

1. **GitHub account** — Push your repo to GitHub
2. **Railway account** — Sign up at [railway.app](https://railway.app)
3. **API keys** ready:
   - `OPENAI_API_KEY` (required for embeddings)
   - `ANTHROPIC_API_KEY` (optional but recommended)

## Step 1: Push to GitHub

```bash
cd ~/projects/jarvis

# Initialize or verify git
git remote add origin https://github.com/YOUR_USERNAME/jarvis.git
git branch -M main
git push -u origin main
```

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) → Sign in/Sign up
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your `jarvis` repo
4. Authorize Railway to access your GitHub

## Step 3: Configure Environment Variables

In the Railway dashboard (Plugins → jarvis):

1. Click **"Variables"**
2. Add:
   - `OPENAI_API_KEY` = `sk-proj-...`
   - `ANTHROPIC_API_KEY` = `sk-ant-...` (optional)
   - `TZ` = `Asia/Riyadh` (or your timezone)

## Step 4: Configure Volumes (for persistence)

In the Railway dashboard (jarvis service → Volumes):

1. Click **"New Volume"**
2. Create three persistent volumes:
   - **brain** → Mount path: `/app/brain`
   - **memory** → Mount path: `/app/memory`
   - **gbrain-db** → Mount path: `/app/.gbrain`

These ensure your brain content, session memory, and database survive restarts.

## Step 5: Deploy

1. Railway should auto-detect the `Dockerfile` and `railway.toml`
2. Click **"Deploy"** (or it auto-deploys on git push)
3. Watch the logs:
   ```
   Starting Jarvis...
   Initializing gbrain database...
   Syncing brain...
   Jarvis ready!
   ```

## Step 6: Access Jarvis

Once deployed, Railway will give you a public URL (e.g., `jarvis-prod.railway.app`).

**Current status:** The container runs gbrain with your workspace indexed and searchable.

**Next:** Integrate with OpenClaw or custom web UI at that URL (Phase 2).

## Updating After Deploy

```bash
# Make changes locally
git add .
git commit -m "description"
git push origin main

# Railway auto-redeploys on git push
```

## Troubleshooting

**Check logs:**
```bash
railway logs  # CLI
# Or: Railway dashboard → jarvis → Logs
```

**Test gbrain in Railway:**
```bash
railway shell
# Inside the shell:
bun run gbrain/src/cli.ts query "search term"
```

**Restart:**
```bash
railway redeploy
```

## What's Running

- **Bun runtime** — JavaScript/TypeScript
- **gbrain CLI** — Knowledge operations (search, sync, embed)
- **PGLite database** — In `/app/.gbrain/brain.db` (persisted)
- **Workspace** — brain/, skills/, memory/ (persisted)

All indexed and searchable. Ready for Phase 2 integration (OpenClaw, custom UI, MCPs).

---

See README.md for local development and customization.
