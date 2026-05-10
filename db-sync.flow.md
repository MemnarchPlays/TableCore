# Flow: DB Sync

**Entry point:** Any Zustand state mutation after `encounterId` is set, or `CombatTracker` mount.
**Scope:** How combat state moves between the in-memory Zustand store and the PostgreSQL database.

---

## Steps

| # | Trigger | Action | Output |
|---|---|---|---|
| 1 | DM clicks Start Combat | `CombatTracker` POSTs to `/api/encounters` with `encounterName` | New `Encounter` row created; `encounterId` stored in Zustand + `tablecore-active-id` in `localStorage` |
| 2 | Any meaningful state change (HP, turn, condition, combatant) | `usePersistToDB` subscriber fires; 1 s debounce timer resets | Pending sync indicator shown in header |
| 3 | Debounce settles (1 s of inactivity) | `PUT /api/encounters/[id]` with full snapshot | DB transaction: update Encounter row, delete+recreate all Combatants and ActiveConditions |
| 4 | PUT succeeds | `syncState` → `'idle'`; indicator clears | DB and store are in sync |
| 5 | PUT fails | `syncState` → `'error'`; toast shown | Session continues in memory; next successful write catches up |
| 6 | Page refresh / tab re-open (primary) | `CombatTracker` mount `useEffect` reads `tablecore-active-id` from `localStorage` | If ID found: `GET /api/encounters/[id]` called; response populates store via `loadEncounter` |
| 6a | Page load at different origin (fallback) | `tablecore-active-id` absent from this origin's localStorage → `GET /api/encounters` fetched; most-recently-updated encounter loaded automatically | Covers LAN IP access (`192.168.x.x`) where `localhost` localStorage key is not present |
| 7 | GET succeeds on refresh | `loadEncounter` called; DB data wins | Store populated from DB; `tablecore-active-id` written to this origin's localStorage |
| 8 | GET fails on refresh (savedId present) | `localStorage` key cleared; restore-error toast shown | DM directed to `/encounters` history list to resume manually |
| 9 | DM clicks Resume on `/encounters` | `GET /api/encounters/[id]` → `loadEncounter` → navigate to `/` | Same restore path as step 7; `tablecore-active-id` written |
| 10 | DM clicks Reset | Store cleared; `localStorage.removeItem('tablecore-active-id')` | New encounter starts; previous encounter preserved in DB history |

---

## Error Paths

| Condition | Behaviour |
|---|---|
| DB unreachable on Start Combat | POST returns 500 (caught); `encounterId` remains null; session continues in memory with no DB sync; server log shows `[POST /api/encounters]` with error |
| DB tables missing (migration not applied) | Same as above; server log shows `PrismaClientKnownRequestError`; fix: run `npx prisma migrate deploy` or use `start.bat`/`start.sh` which auto-applies migrations via Docker |
| PUT fails mid-session | Non-blocking toast: "Auto-save failed. Session continues in memory."; next state change retries |
| GET fails on page refresh | Toast: "Could not restore session from database." with "View History" link to `/encounters` |
| Encounter deleted externally while active | Next PUT returns 404/500; treated as a PUT failure (toast shown) |
| `tablecore-active-id` in localStorage but no matching DB row | GET returns 404 → same path as GET failure above |
| `tablecore-active-id` absent (different origin, e.g. LAN IP) | `GET /api/encounters` fetched; most recent encounter auto-loaded; key written for this origin |
| No encounters in DB and no saved ID | `GET /api/encounters` returns empty list; store stays empty; fresh UI shown |

---

## Layers

```
UI (CombatTracker, /encounters)
  ↓ usePersistToDB (debounce)
  ↓ fetch()
API Routes (Next.js App Router)
  ↓ prisma.$transaction
PostgreSQL (via PrismaPg adapter)
```

The Zustand store is the authoritative in-session source of truth. The DB is the durable source of truth across sessions. `localStorage` holds only the 36-byte `encounterId` string — no combat state.
