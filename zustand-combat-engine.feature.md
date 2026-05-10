# Feature: Zustand Combat Engine

**Phase:** 1
**Flow doc:** `combat-turn.flow.md`

## What It Does

Implements the in-memory combat session: a Zustand store that tracks combatants, initiative order, HP (including temp HP), conditions with round countdowns, and a full undo/redo history stack. Persists to localStorage so page refresh doesn't lose state. Powers the DM-facing combat UI — no database, no network in this phase.

## Success Criteria

1. Initiative list renders all combatants sorted by initiative value (descending); ties resolved in this priority order: (1) Initiative modifier descending, (2) Dex modifier descending, (3) Dex score descending, (4) name ascending alphabetically; remaining ties resolved by drag-to-reorder. Tiebreaker fields (Init Mod, Dex Mod, Dex Score) are hidden by default in the Add Combatant form behind a collapsible "Tiebreakers" toggle.
2. The DM can drag any combatant row to any position in the initiative list using the ⠿ drag handle; drag-to-reorder is the manual fallback for ties not resolved by the auto-sort chain; the reorder action is undoable.
3. Active turn pointer advances forward (Next) and backward (Prev) through the sorted list; round counter increments when the pointer wraps past the last combatant.
4. HP management: damage, healing, and temporary HP all applied correctly; temp HP absorbs damage before real HP; `current_hp` is always clamped `0 ≤ current_hp ≤ max_hp`.
5. Undo/Redo: every combat action (HP change, turn advance, condition add/remove, combatant add) is reversible and reapplicable via a bounded Zustand history stack (max 50 steps); undo is disabled when the stack is empty.
6. Bulk actions: select multiple combatants and apply damage, healing, or a condition to all simultaneously in a single undo step (Fireball workflow).
7. Conditions: add and remove named conditions with optional round duration; each renders as a badge with a countdown number on the combatant card.
8. Turn-triggered expiry: on each turn advance, condition `remaining_rounds` decrements for the newly active combatant per each condition's `expiry_trigger` (StartOfTurn / EndOfTurn); conditions at 0 rounds are removed automatically.
9. Reinforcements: a new combatant added mid-encounter is inserted at the correct sorted initiative position; the active-turn pointer stays on the same combatant (index recalculated).
10. The DM can remove any combatant from the initiative list at any time via a visible control on the combatant row; after removal the list reorders correctly and the active-turn pointer stays on the correct combatant.
11. When a combatant is marked as a lair action (`isEnvironmental: true`): (a) the Add Combatant form disables the AC field (and Max HP) showing "(ignored)" labels; (b) the combatant detail card shows only name and initiative with no HP controls, AC display, or condition controls — lair actions have no stats to manage.
12. LocalStorage sync: Zustand store persists to localStorage on every state change; a hard page refresh restores the full combat state and the session continues.
13. LocalStorage failure: if the stored state is corrupted or unreadable, the app displays a visible toast ("Could not restore session") and offers a "Start Fresh" button rather than hanging or silently failing.
14. All common actions (apply damage, advance turn, add condition) complete their UI update in under 2 seconds.
15. All interactive touch targets are ≥ 44×44px; the full DM interface is usable on a tablet in portrait orientation without horizontal scrolling.
16. On page load when localStorage contains a saved combat state, no React hydration mismatch warning appears in the browser console; the server-rendered HTML and the first client render are identical.
17. All interactive controls (Add Combatant button, initiative list, HP controls) function correctly when the app is accessed via the local network IP (e.g., `10.x.x.x:3000`) including on older tablets; adding a combatant on the network-IP origin persists and renders in the initiative list on that same device.
18. Any device on the local network (phone, tablet) can reach the app at the server's local IP and port (e.g., `http://10.x.x.x:3000`) without a "connection denied" or "connection refused" error; the TCP connection is accepted and the page loads.
19. The DM interface is usable on a phone screen (≥ 375px wide); below the `sm:` breakpoint the layout switches to a single-panel view (list or detail) with a "← Initiative" back button; primary actions (Next Turn, HP controls, Add Combatant) are reachable without horizontal scrolling.
20. The Add Combatant modal fits within the phone viewport without requiring vertical scrolling to reach the "Add + Continue" and "Done" buttons; the modal panel has a maximum height and the form content scrolls internally if needed.
21. The DM can tap/click any combatant row in the initiative list at any time to inspect that combatant's detail card (HP, AC, conditions), regardless of whose turn it is; the inspected combatant is visually distinguished from the active-turn combatant with a blue border; on mobile, tapping a row navigates to the detail view; the inspection clears automatically when the turn advances.
22. The DM can edit any combatant's details (name, initiative, Init Mod, Dex Mod, Dex Score, Max HP, AC, Lair Action flag) after they have been added to the initiative list via a ✏ button on the combatant detail card; the edit action is undoable; the list re-sorts and the active-turn pointer recalculates after any initiative or tiebreaker change.
23. On a phone screen (≥ 375px wide), when one or more combatants are selected, the bulk action bar (Damage, Heal, Add Condition, Clear) is fully visible without requiring the DM to scroll; all bulk controls fit within two rows maximum and do not push the active detail panel content out of reach.
24. In the condition picker, the "Permanent" toggle and "Number of rounds" input appear above the condition name list so the DM sets duration before selecting; clicking a condition name adds it immediately and closes the picker. Hovering a condition name displays a visible tooltip with that condition's mechanical effect (e.g. "Blinded: can't see, auto-fails sight checks, attacks have disadvantage").
25. Condition badges displayed on the initiative list rows and on the combatant detail card both show a visible mechanic tooltip on hover, using the same tooltip style as the condition picker (e.g. hovering the "Blinded" badge anywhere in the UI shows "Can't see. Auto-fails sight checks…"); custom conditions with no entry in the standard list show no tooltip.
26. Conditions with discrete numbered levels (e.g. Exhaustion levels 1–6) can be added at a specific level via the condition picker; the picker shows an inline level selector when a leveled condition button is clicked; the badge displays the condition name and level (e.g. "Exhaustion 2"); the mechanic tooltip on the badge shows the cumulative effects at that specific level.
27. All condition mechanic text reflects D&D 5e 2024 rules; Exhaustion uses the 2024 scaling formula (−2 × level to d20 Tests, −5 × level ft to Speed per level) rather than the 2014 model; hovering "Exhaustion 3" shows "−6 to d20 Tests. Speed −15 ft."
28. The DM can edit an existing condition on a combatant from the detail card: changing the remaining rounds on any condition and changing the level on a leveled condition (e.g. Exhaustion 2 → Exhaustion 3); a ✏ button on each badge opens an inline edit panel with Permanent/Rounds controls and a level selector for leveled conditions; the edit action is undoable.

## Status

COMPLETE

### Progress

- [x] Next.js app scaffolded (TypeScript, Tailwind, App Router)
- [x] Zustand store: initiative list slice (add, remove, sort)
- [x] Zustand store: HP slice (damage, heal, temp HP, clamping)
- [x] Zustand store: history middleware (undo/redo, max 50 steps)
- [x] Zustand store: bulk action support (multi-select + apply)
- [x] Zustand store: condition slice (add/remove, round tracking)
- [x] Zustand store: turn-triggered expiry logic
- [x] Zustand store: reinforcement flow (insert at sorted position)
- [x] Zustand store: localStorage persistence middleware
- [x] LocalStorage failure handling (corrupt state → toast + Start Fresh)
- [x] DM UI: initiative sidebar with active indicator
- [x] DM UI: active combatant detail card with HP controls
- [x] DM UI: condition badges with countdown
- [x] DM UI: bulk-select and apply controls
- [x] DM UI: undo/redo controls
- [x] DM UI: drag-to-reorder on initiative list (replaces dex mod tie-breaking)
- [x] AddCombatantModal: tiebreaker fields (Init Mod, Dex Mod, Dex Score) hidden behind collapsible toggle; initMod/dexMod/dexScore in store/types
- [x] DM UI: click any row to inspect combatant detail (inspectedId state; blue border; clears on turn advance; mobile nav)
- [x] AddCombatantModal: max-height + internal scroll; action buttons pinned outside scroll region
- [x] AddCombatantModal: AC disabled when Lair Action is checked
- [x] DM UI: edit combatant details via ✏ button on detail card (EditCombatantModal + updateCombatant store action)
- [x] Touch target audit: Tiebreakers toggle (AddCombatantModal) and condition-badge ✕ (CombatantCard) given min-h-[44px]; all other interactive elements already compliant

## Scope

In-memory Zustand store and the DM-facing combat UI. No PostgreSQL, no Prisma, no Socket.io, no spectator view. Persistence is localStorage only. Concentration Save prompt is out of scope — stub the hook for Phase 2.

## Files

*(Move this doc next to the store file once scaffolded)*

- `src/store/combat.ts` — Zustand store (all slices + history + persistence)
- `src/components/CombatTracker/` — DM UI components
