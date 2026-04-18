# Brain Index

Your personal knowledge base. Everything is linked and searchable.

## Collections

- **[people/](people/)** — Contacts, relationships, colleagues, collaborators
- **[companies/](companies/)** — Organizations, investors, partners, targets
- **[deals/](deals/)** — Investments, partnerships, transactions, negotiations
- **[meetings/](meetings/)** — Conversations, calls, discussions, decisions
- **[concepts/](concepts/)** — Frameworks, ideas, principles, learnings
- **[ideas/](ideas/)** — Raw thoughts, observations, possibilities
- **[sources/](sources/)** — Articles, research, documents, references
- **[archive/](archive/)** — Closed deals, inactive relationships, historical

## How to Use

1. **Search:** `gbrain search "name or topic"` for keyword search
2. **Query:** `gbrain query "natural language question"` for semantic search
3. **Get:** `gbrain get person/john-doe` for direct page access

Search is smart — it uses vector embeddings + keyword matching + back-link ranking.

## Standards

- **Format:** See [schema.md](schema.md)
- **Filing:** See [RESOLVER.md](RESOLVER.md)
- **Sync:** Every 15 minutes automatically; manual: `gbrain sync && gbrain embed --stale`

## Status

- Pages indexed: (auto-updated by gbrain)
- Last sync: (auto-updated by gbrain)
- Database: PGLite (local, embedded)

---

Start adding content. The brain compounds over time.
