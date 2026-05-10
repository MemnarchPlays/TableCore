# Feature: PostgreSQL Persistence (Phase 2)

**Phase:** 2
**Flow doc:** `db-sync.flow.md` *(to be created)*

## What It Does

Adds PostgreSQL via Prisma ORM as the durable persistence layer. The Zustand store remains the in-session brain (no change to combat UX); this phase wires the store to sync encounter state to the DB so sessions survive server restarts, appear in an encounter history list, and are recoverable from any device on the LAN.

## Success Criteria

1. Running `docker compose up -d` starts both the Next.js app and a PostgreSQL container; no manual DB setup is required beyond copying `.env.example` to `.env`.
2. An `.env.example` file exists at the project root documenting all required environment variables (`DATABASE_URL`, `NEXTAUTH_SECRET` stub, and any others) with placeholder values; `.env` is in `.gitignore`.
3. `npx prisma migrate dev` applies all migrations against the local Postgres container without errors.
4. The Prisma schema defines: `Encounter` (id, publicSlug, name, round, activeIndex, createdAt, updatedAt), `Combatant` (id, encounterId, all fields from the Zustand `Combatant` type, position for sort order), `ActiveCondition` (id, combatantId, name, remainingRounds, expiryTrigger).
5. `publicSlug` on `Encounter` is a UUID, globally unique, enforced at the DB level with a unique index; it is never a sequential integer.
6. When the DM starts a new encounter, a row is created in the `Encounter` table and its `id` is stored in the Zustand store; all subsequent actions update that row.
7. Every Zustand action that mutates combat state (add/remove combatant, HP change, condition change, turn advance) triggers an async DB write; the UI does not wait for the DB — state updates are optimistic.
8. If a DB write fails, the DM sees a visible non-blocking toast ("Auto-save failed"); the in-memory session continues uninterrupted and the next successful write catches up with the latest Zustand snapshot.
9. On page load, if `localStorage` contains a valid `encounterId`, the app attempts to rehydrate from the DB (not just localStorage); if the DB record is newer than the localStorage snapshot, the DB wins.
10. An "Encounters" list page at `/encounters` shows all saved encounters (name, date, round count) sorted by most recently updated; the DM can click any row to resume that encounter.
11. Resuming an encounter from `/encounters` restores full combat state (combatants, HP, conditions, round, activeIndex) into the Zustand store and navigates to `/`.
12. The DM can delete an encounter from the `/encounters` list; deletion removes the DB row and all related combatants and conditions (cascade); a confirmation dialog is shown before deletion.
13. All DB writes complete within 2 seconds on a local LAN Postgres instance under normal load.
14. `docker-compose.yml` defines a `postgres` service with a named volume so DB data survives `docker compose restart`; the `app` service depends on `postgres` and sets `DATABASE_URL` via environment variable.
15. A `Dockerfile` exists for the Next.js app that runs `prisma generate` and `prisma migrate deploy` before starting the server, so the Docker image is self-migrating on first run.
16. [BUG] When the app is loaded at any origin (e.g. `http://192.168.x.x:3000`), an active encounter is automatically displayed without the DM needing to navigate to `/encounters` first; the page does not load blank when `tablecore-active-id` is absent from that origin's localStorage.

## Status

COMPLETE

### Progress

- [x] Prisma 6 installed with `@prisma/adapter-pg`; `prisma/schema.prisma` defines Encounter, Combatant, ActiveCondition
- [x] `.env.example` documents all required variables
- [x] `docker-compose.yml` — postgres:16-alpine + app services with healthcheck and named volume
- [x] `Dockerfile` — single-stage Node 20 Alpine; runs `prisma migrate deploy` before `npm start`
- [x] Initial migration SQL in `prisma/migrations/20260510000000_init/`
- [x] `src/lib/prisma.ts` — singleton PrismaClient with PrismaPg adapter
- [x] API route: `POST /api/encounters` + `GET /api/encounters` (list)
- [x] API route: `GET /api/encounters/[id]` + `PUT /api/encounters/[id]` (snapshot upsert) + `DELETE /api/encounters/[id]`
- [x] Zustand store extended: `encounterId`, `encounterName`, `setEncounterId`, `setEncounterName`, `loadEncounter`; both persisted to localStorage
- [x] `src/hooks/usePersistToDB.ts` — debounced (1 s) PUT on any meaningful state change; returns `syncState` and `clearError`
- [x] Start Combat button creates encounter in DB (POST) then stores `encounterId`
- [x] Sync indicator (● pending) and History link added to CombatTracker header
- [x] DB write failure toast in CombatTracker (`syncState === 'error'`)
- [x] `src/app/encounters/page.tsx` — encounter list with resume and delete (confirmation dialog)
- [x] Resume flow: fetch full encounter → `loadEncounter` → navigate to `/`
- [x] Page-load rehydration: localStorage persist middleware removed; on mount reads `tablecore-active-id` key, GETs from DB, calls `loadEncounter`; DB always wins on refresh; GET failure shows restore-error toast with link to `/encounters`
- [x] db-sync.flow.md created

## Scope

Prisma + PostgreSQL persistence layer and the encounters list UI. No auth, no multi-user, no spectator view (Phase 3). The Zustand store UX is unchanged — this phase adds durability without touching the combat UI.

## Files

- `prisma/schema.prisma`
- `prisma/migrations/`
- `.env.example`
- `docker-compose.yml`
- `Dockerfile`
- `src/lib/prisma.ts` — singleton Prisma client
- `src/app/api/encounters/route.ts` — GET list, POST create
- `src/app/api/encounters/[id]/route.ts` — GET, PUT, DELETE
- `src/app/encounters/page.tsx` — encounter history list
- `src/store/combat.ts` — extended with `encounterId` + DB sync thunk
