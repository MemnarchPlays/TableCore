# Chronicle Combat

Self-hosted TTRPG combat tracker. DM-first, tablet-optimized. Single DM managing encounters at the physical table.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| State | Zustand (combat engine + undo/redo) |
| Database | PostgreSQL via Prisma ORM |
| Realtime | Socket.io |
| Deploy | Docker Compose on Proxmox homelab |

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run test` | Run test suite |
| `npx prisma migrate dev` | Apply DB migrations |
| `docker compose up -d` | Start full stack |

## Reading hierarchy (token optimization)

1. This file — project orientation
2. `.claude/current-feature` → active feature slug → `<slug>.feature.md`
3. `memory/KNOWN-ISSUES.md` — known bugs and tech debt
4. `*.feature.md` files — success criteria and scope per feature
5. `*.flow.md` files — pipeline architecture
6. Source code

## Hard constraints

- NO map, token, or canvas features — do not import Three.js or heavy canvas libs
- NO PDF parsing
- NO multi-user auth — single DM account only
- Zustand store is the brain — build it before any DB/persistence work
- Every combat action must be undoable (undo/redo stack)
- 2-second rule: common actions (damage, turn advance, add condition) must complete in < 2 seconds
- High-contrast dark mode only (Tailwind zinc-900 palette)
- Mobile-first: 44×44px minimum touch targets

## Design philosophy

- Settings-driven: anything that could be optional should be a configurable setting, not a fixed behavior
- Optimistic UI: state changes reflect instantly in the UI before the DB confirms
- LocalStorage sync: Zustand store persisted so a page refresh restores full combat state

## Known issues

See `memory/KNOWN-ISSUES.md`

## Plugin Enforcement

Feature-doc discipline is active (`warn` mode). When starting any non-trivial feature:

1. A `*.feature.md` must exist with numbered success criteria and a Status line.
2. `.claude/current-feature` must point at the active feature slug.
3. Use `/n` to create feature docs, `/f` to mark complete, `/t` to troubleshoot bugs.

Run `/project-setup` to reconcile this file with the latest framework version.
