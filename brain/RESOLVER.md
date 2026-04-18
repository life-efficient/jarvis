# Brain RESOLVER - Where Pages Go

This file routes new page creation to the right directory based on primary subject.

## Filing Rules

**Person mentioned?**
- If they're a key stakeholder, contact, or ongoing relationship → `brain/people/`
- If they're just quoted or referenced → mention in timeline of relevant page, no dedicated page needed

**Company mentioned?**
- Actively investing, partnering, or working with → `brain/companies/`
- Just doing due diligence research → link from relevant deal/project page, no dedicated page needed

**Deal, investment, or transaction?**
- Actively working on → `brain/deals/`
- Historical or closed → move to `brain/archive/`

**Meeting, call, or conversation?**
- Substantive discussion with decisions/outcomes → `brain/meetings/`
- Casual check-in → mention in attendee's person page timeline

**Concept, framework, or idea?**
- Recurring or foundational to your thinking → `brain/concepts/`
- One-off observation → `brain/ideas/`

**Source material (article, research, document)?**
- Raw import (PDF, email, article text) → `brain/sources/`
- Processed insight from source → filed in topic-appropriate directory

## Signal Detection Priority

The signal-detector skill runs on every message and decides what to capture:

1. **Original thinking** — Your own frameworks, insights, observations → `concepts/` or `ideas/`
2. **Entity mentions** — People, companies, deals → create or enrich their pages
3. **Source material** — New articles, research → link from relevant page
4. **Back-links** — Ensure all pages link to related entities

## MECE Check

- **Mutually exclusive:** A page goes in exactly one directory
- **Exhaustive:** No file left uncategorized
- **Complete:** All relationships captured via back-links

If a page belongs in multiple categories, the primary subject determines its home. Others are back-linked.

Example: A person working at a company that closed a deal.
- Primary page: `brain/people/person-name.md` (links to company and deal)
- Company page: `brain/companies/company-name.md` (links to person and deal)
- Deal page: `brain/deals/deal-name.md` (links to company and person)

---

See `brain/schema.md` for page format standards.
