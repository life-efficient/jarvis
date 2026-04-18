# Jarvis — AI Agent Template

A complete, production-ready template for spinning up a personal AI agent with a sophisticated knowledge base, vector search, and extensible skills.

Everything runs in Docker: OpenClaw (runtime), gbrain (knowledge + vector search), 26+ skills, and your workspace.

## Features

✅ **Vector search over your knowledge** — PGLite + pgvector, semantic + keyword hybrid search  
✅ **26 gbrain skills** — Signal detection, brain-ops, enrichment, scheduling, reporting, and more  
✅ **Skill routing** — RESOLVER.md dispatcher routes user intent to the right skill  
✅ **Persistent brain** — Your notes, people, deals, concepts, ideas — all linked and searchable  
✅ **Docker-native** — One container, local development, easy Railway deployment  
✅ **Extensible** — Add custom skills, MCPs, and UI components as needed  

## Quick Start (Local)

### Prerequisites
- Docker & Docker Compose
- `.env` file with API keys:
  ```
  OPENAI_API_KEY=sk-...
  ANTHROPIC_API_KEY=sk-ant-...
  ```

### Run Locally

```bash
docker-compose up --build
```

Visit `http://localhost:3000` → OpenClaw web UI (WhatsApp + web interface)

### Common Commands

```bash
# Search brain
docker-compose exec jarvis gbrain query "tell me about deals"

# List skills
docker-compose exec jarvis gbrain features --json

# Check health
docker-compose exec jarvis gbrain doctor --json

# Manual sync & embed
docker-compose exec jarvis gbrain sync --repo brain && gbrain embed --stale

# View logs
docker-compose logs -f jarvis
```

## Architecture

```
jarvis/
├── Dockerfile                    # Full stack in one image
├── docker-compose.yml            # Local dev setup
├── gbrain/                       # Vendored gbrain source
├── brain/                        # Your knowledge base
│   ├── people/                   # Contacts, relationships
│   ├── companies/                # Organizations
│   ├── deals/                    # Investments, transactions
│   ├── meetings/                 # Conversations
│   ├── concepts/                 # Frameworks, ideas
│   └── schema.md, RESOLVER.md
├── skills/                       # All 26 gbrain skills + custom
├── memory/                       # Session continuity
├── AGENTS.md                     # Agent instructions
├── SOUL.md                       # Agent personality
├── IDENTITY.md                   # Agent identity card
└── TOOLS.md                      # Local config
```

## Customization

### Add a Custom Skill

1. Create `skills/my-skill/SKILL.md` with:
   - YAML frontmatter: `triggers`, `description`, `contract`
   - Skill logic and workflow

2. Add trigger to `skills/RESOLVER.md`

3. Skill is now callable by Claude via MCP

See `skills/signal-detector/SKILL.md` for an example.

### Add Knowledge

Create a page in `brain/` following `brain/schema.md`:

```markdown
# Jane Doe

CEO of Acme Corp, active investor.

## Current State
- Leading Series B round for climate tech
- Based in SF

## Open Threads
- Interest in AI?

---

**2026-04-18** | Met at conference, discussed funding.
```

Run `gbrain sync && gbrain embed --stale` to index it.

### Customize Identity

Edit:
- `SOUL.md` — personality and values
- `IDENTITY.md` — name, emoji, vibe
- `AGENTS.md` — operating instructions

## Deployment to Railway

1. Push this repo to GitHub
2. Create Railway project, link repo
3. Set environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
4. Railway auto-builds Dockerfile, deploys to production
5. Brain, memory, and database persist via volumes

## What Gets Built In

- **OpenClaw** — Runtime and gateway (WhatsApp + web UI)
- **gbrain CLI** — Knowledge operations
- **gbrain MCP** — Claude integration
- **26 skills** — Signal detection, brain ops, enrichment, reporting, scheduling, etc.
- **PGLite** — Embedded PostgreSQL + pgvector for vector search
- **Brain structure** — People, companies, deals, concepts, ideas

Ready to use. Just add your knowledge.

## Next Steps

1. **Add brain content** — Start filling `brain/people/`, `brain/deals/`, etc.
2. **Customize skills** — Fork, extend, or add new skills in `skills/`
3. **Build custom UI** — Add a Next.js app in `ui/` later (Phase 2)
4. **Add MCPs** — Custom integrations in `mcps/` (e.g., Granola transcripts)

## Documentation

- `AGENTS.md` — How to work with the agent
- `SOUL.md` — Agent personality
- `brain/schema.md` — Page format standards
- `brain/RESOLVER.md` — Where knowledge goes
- `gbrain/docs/` — gbrain architecture & guides

## License

MIT

---

**Jarvis** is a template. Fork it, customize it, make it your own.
