# Chronicle Combat

Self-hosted TTRPG combat tracker for single-DM homelab deployment.

## Start here

| File | What it tells you |
|---|---|
| `CLAUDE.md` | Stack, commands, constraints, reading hierarchy |
| `.claude/current-feature` | Active feature slug → read `<slug>.feature.md` |
| `memory/KNOWN-ISSUES.md` | Known bugs and tech debt |

## Quick start

```bash
npm install
npm run dev
```

Full stack (app + Postgres + proxy):

```bash
docker compose up -d
```

## Troubleshooting a Feature

1. Check `CLAUDE.md` constraints before adding any dependency (no canvas, no PDF, Zustand-first).
2. Check `memory/KNOWN-ISSUES.md` before investigating a bug — it may already be documented.
3. Read the active feature doc (slug in `.claude/current-feature`) for success criteria.
4. Check `*.flow.md` files for pipeline context before reading source code.
5. All combat actions must be undoable — if yours isn't, that's a bug, not a design choice.
