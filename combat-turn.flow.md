# Flow: Combat Turn Loop

*Move this file next to the combat tracker entry-point component once Next.js is scaffolded (e.g., `src/components/CombatTracker/combat-turn.flow.md`).*

**Entry point:** DM opens `/` (combat tracker page)
**Scope:** Covers the full in-memory combat session lifecycle from encounter creation through turn advancement, HP/condition management, undo, and page reload recovery.

---

## Steps

| # | Actor | Action | Output / Store mutation |
|---|---|---|---|
| 1 | DM | Creates encounter, names it | `encounter` initialised in Zustand with empty `combatants[]`, `round: 0`, `activeIndex: null` |
| 2 | DM | Adds each combatant (name + initiative) | `combatants[]` auto-sorted: initiative desc → init mod desc → dex mod desc → dex score desc → name asc; remaining ties resolved by drag-to-reorder (⠿ handle); `activeIndex` still null |
| 3 | DM | Starts combat | `activeIndex` set to 0 (highest initiative); `round` set to 1; history stack cleared |
| 4 | DM | Advances turn (Next) | `activeIndex++`; if past last combatant → `activeIndex = 0`, `round++`; turn-triggered condition expiry fires for the *new* active combatant |
| 5 | DM | Retreats turn (Prev) | `activeIndex--`; if below 0 → `activeIndex = last`; round decrements if crossing round boundary and undo history permits |
| 6 | DM | Applies HP change (damage / heal) | `current_hp` updated; temp HP absorbs damage first; result clamped `0 ≤ hp ≤ max_hp`; action pushed to history stack |
| 7 | DM | Selects multiple combatants, applies bulk action | Same HP/condition logic applied to each selected combatant atomically; single undo step undoes all |
| 8 | DM | Adds condition to combatant | Condition appended to combatant's `conditions[]` with `remaining_rounds` and `expiry_trigger` (StartOfTurn / EndOfTurn); rendered as badge |
| 8a | DM | Edits existing condition (✏ button) | `updateCondition(combatantId, conditionId, patch)` merges patch (`name` and/or `remainingRounds`) into the matching condition; undo snapshot pushed; badge re-renders with new values |
| 9 | Turn advances | Condition expiry check fires | For each condition on the newly-active combatant: decrement `remaining_rounds`; remove if `remaining_rounds === 0` |
| 10 | DM | Undoes last action | Previous snapshot restored from history stack; UI re-renders; redo stack updated |
| 11 | DM | Adds reinforcement mid-encounter | New combatant inserted at correct sorted position; `activeIndex` recalculated to keep same combatant active |
| 12 | DM | Edits an existing combatant mid-encounter | `updateCombatant(id, patch)` merges the patch; if initiative or tiebreaker fields changed, list re-sorts and `activeIndex` recalculated; action pushed to undo history |
| 13 | Browser | Page hard-refreshed | `CombatTracker` reads `tablecore-active-id` from localStorage; fetches full encounter from DB via `GET /api/encounters/[id]`; calls `loadEncounter`; DB is the source of truth (see `db-sync.flow.md`) |

---

## Failure Modes

| Condition | Behaviour |
|---|---|
| Initiative tie | Auto-resolved by dex mod → dex score → name; remaining ties use ⠿ drag handle (`reorderCombatant`); undoable |
| Edit changes initiative of active combatant | Re-sort fires; `activeIndex` recalculated so the same combatant remains active at its new position |
| HP would go below 0 | Clamp to 0; combatant shows "0 HP" (not negative) |
| HP would exceed `max_hp` | Clamp to `max_hp`; temp HP absorbed before real HP |
| Undo stack empty | Undo control disabled; no-op |
| Undo stack at max depth (50) | Oldest entry silently dropped |
| LocalStorage read fails / corrupted | Toast: "Could not restore session." + "Start Fresh" button; do not hang |
| SSR / hydration | Store initialises with empty state on server and first client render (`skipHydration: true`); `persist.rehydrate()` fires in `useEffect` so localStorage state is applied as a normal client re-render, not during hydration — no React mismatch warning |
| Concentration damage | Prompt DM for Concentration Save (Phase 2; out of scope here — stub hook only) |
| Network IP access (dev) | `localStorage` is per browser origin; `tablecore-active-id` set on `localhost:3000` is not present on `192.168.x.x:3000`. Handled by Phase 2 fallback: on load, if key absent, `GET /api/encounters` fetches most-recent encounter from DB (see `db-sync.flow.md` step 6a). |
| Network IP blocked — HMR cross-origin | Next.js 16 blocks `/_next/webpack-hmr` requests from non-localhost origins by default. Symptom: dev server logs `⚠ Blocked cross-origin request … from "192.168.x.x"`; React never hydrates; buttons unresponsive. Fix: `allowedDevOrigins: ['192.168.*', '10.*', '172.*']` in `next.config.ts` covers all RFC 1918 private ranges — do not hardcode a single IP. |

---

## Feature docs that implement this flow

- `zustand-combat-engine.feature.md` (Phase 1)
