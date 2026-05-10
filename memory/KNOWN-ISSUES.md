# Known Issues

*Last updated: 2026-05-10*

### [ISSUE-020] React does not hydrate on LAN IP — buttons unresponsive (hardcoded allowedDevOrigins)
**Severity:** high
**Status:** fixed
**Reported:** 2026-05-10

When opening the app at any local IP other than `localhost`, the page renders static HTML but React never hydrates: buttons are unresponsive and no data loads. Root cause: `next.config.ts` has `allowedDevOrigins: ['192.168.1.151']` hardcoded to one specific IP. Next.js dev server blocks its HMR WebSocket for any other origin, which prevents client components from initialising. This is a regression of ISSUE-003 — the original fix was too narrow. In dev mode the browser console will show `⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr`.

**Fix:** Replaced `allowedDevOrigins: ['192.168.1.151']` with `['192.168.*', '10.*', '172.*']` in `next.config.ts`, covering all RFC 1918 private ranges. Dev server must be restarted after the config change.
**Violates:** `zustand-combat-engine.feature.md` Criterion 17.

---

### [ISSUE-019] Active encounter not restored when accessing via LAN IP
**Severity:** high
**Status:** fixed
**Reported:** 2026-05-10

When the app is opened at `http://192.168.x.x:3000` (any origin other than `localhost:3000`), the page loads blank — no combatants, no encounter state. Root cause: `tablecore-active-id` is stored in `localStorage` under the `localhost:3000` origin; a different origin has an empty localStorage, so the DB-fetch-on-mount never fires.

**Fix:** When `tablecore-active-id` is absent from localStorage, the mount `useEffect` in `CombatTracker/index.tsx` now falls back to `GET /api/encounters` and auto-loads the most recently updated encounter. The key is written to this origin's localStorage so subsequent refreshes use the fast path. If DB is unreachable or empty, the UI starts fresh silently.
**Violates:** `postgres-persistence.feature.md` Criterion 16.

---

### [ISSUE-018] No way to edit an existing condition's rounds or level
**Severity:** medium
**Status:** fixed
**Reported:** 2026-05-10

**Fix:** `updateCondition(combatantId, conditionId, patch)` added to `src/store/combat.ts` (undoable, patches `name` and/or `remainingRounds`). `getLeveledBase` helper added to `src/data/conditions.ts`. `CombatantCard.tsx` condition badges gained a ✏ button that opens an inline edit panel below the badge list; panel shows a level selector (for leveled conditions) pre-populated with the current level, plus Permanent/Rounds controls; Save commits via `updateCondition`, Cancel discards. Edit is undoable.
**Violates:** `zustand-combat-engine.feature.md` Criterion 28.

---

### [ISSUE-017] Exhaustion mechanic text uses 2014 5e rules instead of 2024 5e
**Severity:** low
**Status:** fixed
**Reported:** 2026-05-10

**Fix:** Rewrote the `levels` array and `mechanic` summary for Exhaustion in `src/data/conditions.ts` to reflect 2024 rules: each level applies −(2 × level) to all d20 Tests and −(5 × level) ft to Speed; level 6 = death. Long rest removes 1 level noted in summary. No code changes — data only.
**Violates:** `zustand-combat-engine.feature.md` Criterion 27.

---

### [ISSUE-016] Leveled conditions (e.g. Exhaustion) have no level selector or per-level mechanic text
**Severity:** medium
**Status:** fixed
**Reported:** 2026-05-10

**Fix:** `ConditionDef` type in `src/data/conditions.ts` gained optional `levels: string[]`. Exhaustion populated with 6 cumulative-effects entries. `getConditionMechanic('Exhaustion 2')` parses base name + level and returns level-specific text. `isLeveledCondition` and `getLevelCount` helpers exported. `ConditionPicker.tsx` gained `pendingLeveled` state — clicking a leveled condition reveals an inline amber-styled level button row (1–N) with per-level hover tooltips; selecting a level applies "Exhaustion 2" etc. and closes the picker. The active leveled button is visually highlighted. Badges and badge tooltips in `InitiativeList` and `CombatantCard` automatically show level-specific text via `getConditionMechanic`.
**Violates:** `zustand-combat-engine.feature.md` Criterion 26.

---

### [ISSUE-015] Condition badges in initiative list and detail card have no mechanic tooltip
**Severity:** low
**Status:** fixed
**Reported:** 2026-05-10

Condition badges in `InitiativeList.tsx` and `CombatantCard.tsx` had no hover tooltip. Mechanic data was private to `ConditionPicker.tsx`.

**Fix:** Extracted `STANDARD_CONDITIONS` and `getConditionMechanic(name)` to `src/data/conditions.ts`. `ConditionPicker.tsx` now imports from there. Both badge sites wrap each badge in `relative group/cond` and render an `absolute bottom-full` tooltip div on hover (`opacity-0 → group-hover/cond:opacity-100`). Custom conditions (not in the standard list) return `null` from `getConditionMechanic` and show no tooltip.
**Violates:** `zustand-combat-engine.feature.md` Criterion 25.

---

### [ISSUE-014] Condition picker: hover mechanics tooltip not visible
**Severity:** low
**Status:** fixed
**Reported:** 2026-05-10

The condition picker condition buttons need to show a mechanic tooltip on hover. Duration reorder was fixed (controls now above the list). First fix attempt used native `title` attribute — not visible in Chrome/dark UI. Second fix replaced `title` with a Tailwind `group/cond` + absolutely-positioned `div` that fades in on hover (`opacity-0 group-hover/cond:opacity-100`). Mechanic text is rendered as a 224px tooltip above each button.

**Fix:** Each condition button wrapped in `relative group/cond` div; tooltip rendered as `absolute bottom-full` child with `pointer-events-none` and opacity transition.
**Violates:** `zustand-combat-engine.feature.md` Criterion 24.

---

### [ISSUE-013] Bulk action bar too tall on phone — controls require scrolling to reach
**Severity:** medium
**Status:** fixed
**Reported:** 2026-05-09

When one or more combatants are selected, the bulk action bar appears at the bottom of the screen. On a phone (375px wide) the `flex-wrap` layout causes the buttons to wrap into 3–4 rows (~130–175px), consuming most of the available vertical space and making the controls hard to reach or partially cut off.

**Fix:** Restructured `BulkActionBar.tsx` into two explicit groups in a `flex-col` on mobile. Group 1 (row 1): count + amount input + Damage + Heal. Group 2 (row 2): + Condition + Clear. On `sm:+`, parent switches to `flex-row flex-wrap` with Group 2 pushed right via `ml-auto` — same visual result as before on wide screens. Button labels shortened on mobile (`Damage`, `Heal`, `+ Condition`, `Clear`).
**Violates:** `zustand-combat-engine.feature.md` Criterion 23.

---

### [ISSUE-012] No way to edit a combatant's details after adding them
**Severity:** medium
**Status:** fixed
**Reported:** 2026-05-09

Once a combatant is added to the initiative list there is no edit control — name, initiative, tiebreaker fields, Max HP, AC, and the Lair Action flag are all read-only. DMs regularly need to correct a typo, adjust an initiative roll, or change Max HP mid-session.

**Fix:** Added `updateCombatant(id, patch)` to store — re-sorts after any change, recalculates `activeIndex`, pushes undo snapshot. `currentHp` clamped to new `maxHp` if lowered; flipping to lair action zeroes stats; flipping to normal resets `currentHp = maxHp`. Created `EditCombatantModal.tsx` (same structure as Add modal, pre-populated). Added ✏ edit button to `CombatantCard.tsx` header.
**Violates:** `zustand-combat-engine.feature.md` Criterion 22.

---

### [ISSUE-011] Cannot inspect a non-active combatant's detail card
**Severity:** medium
**Status:** fixed
**Reported:** 2026-05-09

The detail panel always shows `combatants[activeIndex]` — there is no way to click a different creature in the initiative list and see their HP, AC, or conditions unless it is their turn. DMs routinely need to check a creature mid-round (e.g. to apply a reaction damage or check a condition).

**Fix:** Added `inspectedId: string | null` state to `index.tsx`; `useEffect` clears it on `activeIndex` change. `inspectedCombatant ?? activeCombatant` used as `displayCombatant` for the detail panel. Each `SortableRow` in `InitiativeList.tsx` has `onClick={() => onInspect(c.id)}`; inspected non-active rows show a blue left border (`border-blue-400 bg-blue-400/10`). On mobile, `onInspect` also calls `setMobileView('detail')`.
**Violates:** `zustand-combat-engine.feature.md` Criterion 21.

---

### [ISSUE-010] Add Combatant modal too tall — action buttons scroll off screen on phone
**Severity:** medium
**Status:** fixed
**Reported:** 2026-05-09

The modal panel has no `max-height` constraint. On a short phone viewport the form content pushes the "Add + Continue" / "Done" buttons off the bottom of the screen, requiring the DM to scroll to submit. The modal is a bottom-sheet on mobile (`items-end` positioning) with no internal scroll.

**Fix:** Panel gets `max-h-[90dvh] flex flex-col`; header `shrink-0`; form `flex flex-col flex-1 min-h-0`; fields in `overflow-y-auto flex-1`; action buttons in `shrink-0` div pinned below scroll region.
**Violates:** `zustand-combat-engine.feature.md` Criterion 20.

---

### [ISSUE-009] AC field not disabled in Add Combatant form when Lair Action is checked
**Severity:** low
**Status:** fixed
**Reported:** 2026-05-09

Partial fix of ISSUE-005 — the detail card and initiative list correctly hide AC for lair actions, but the Add Combatant form still shows an editable AC field when `isEnvironmental` is checked. Max HP is already disabled in the form; AC needs the same treatment.

**Fix:** AC `<input>` in `AddCombatantModal.tsx` gets `disabled={isEnvironmental}` and `disabled:opacity-40`; AC validation and storage both skip/zero when environmental.
**Violates:** `zustand-combat-engine.feature.md` Criterion 11.

---

### [ISSUE-008] DM interface unusable on phone-width screens
**Severity:** medium
**Status:** fixed
**Reported:** 2026-05-09

The layout uses a fixed `w-72` (288px) sidebar next to a flex main panel — on a phone (375px wide) this leaves 87px for the main panel, causing overflow or horizontal scroll. The header also has many buttons that likely wrap or clip at phone widths. The app is tablet-optimised by design but the phone is used at the table.

**Violates:** `zustand-combat-engine.feature.md` Criterion 19 (new).
**Fix:** Added `mobileView: 'list' | 'detail'` state to `index.tsx`. Below `sm:` (640px) only one panel renders at a time. Initiative sidebar is full-width in list view, hidden in detail view (`hidden sm:block sm:w-72`). Detail panel has a "← Initiative" back button (sm:hidden). Combat start auto-switches to detail. Next Turn button also navigates to detail on mobile. Header compacted: Redo and Reset hidden on mobile, Prev/Next/Start shortened.
**Violates:** `zustand-combat-engine.feature.md` Criterion 19.

---

### [ISSUE-007] Initiative tiebreaker chain missing — needs Dex mod → Dex score → alphabetical
**Severity:** low
**Status:** fixed
**Reported:** 2026-05-09

Auto-sort should resolve initiative ties in priority order: Dex modifier (desc) → Dex score (desc) → name (asc). `dexMod` was removed in ISSUE-004 as "unused" because its effect wasn't visible; this issue restores it with proper tiebreaker semantics and adds `dexScore`. Alphabetical fallback is new. The DM-requested future extension is a settings toggle to choose the sort strategy — out of scope here, but note it.

**Violates:** `zustand-combat-engine.feature.md` Criterion 1 (updated to [BUG]).
**Look first:** `src/types/combat.ts` — add `dexMod?: number` and `dexScore?: number` back to `Combatant` and `CombatantInput`; `src/store/combat.ts` — `sortedInsert` tiebreak chain; `src/components/CombatTracker/AddCombatantModal.tsx` — add optional Dex Mod + Dex Score fields. **Note:** reopens part of ISSUE-004.

---

### [ISSUE-006] No UI control to remove combatants from the initiative list
**Severity:** medium
**Status:** fixed
**Reported:** 2026-05-09

`removeCombatant` exists in the Zustand store and handles active-index recalculation correctly, but there is no remove button wired up in the UI — the DM cannot remove a combatant once added.

**Fix:** Added ✕ remove button to each row in `InitiativeList.tsx`; calls `removeCombatant(id)`. Action is undoable via the undo stack.
**Violates:** `zustand-combat-engine.feature.md` Criterion 18.

---

### [ISSUE-005] Lair action combatants still show AC and HP controls
**Severity:** low
**Status:** fixed
**Reported:** 2026-05-09

When a combatant is added with "lair action" enabled (`isEnvironmental: true`), HP controls are presumably already suppressed, but AC display/interaction remains active. Lair actions have no stats — the detail card should show only name and initiative position.

**Fix:** Guarded AC display and Conditions section in `CombatantCard.tsx` behind `!c.isEnvironmental`; also guarded AC badge in `InitiativeList.tsx` rows. Label now reads "Lair Action" instead of "Environmental".
**Violates:** `zustand-combat-engine.feature.md` Criterion 17.

---

### [ISSUE-004] Dex Mod field is unnecessary complexity; drag-to-reorder not implemented
**Severity:** low
**Status:** fixed
**Reported:** 2026-05-09

The Add Combatant form includes a Dex Mod field that is invisible to players and only used for automatic tie-breaking — a hidden complexity that adds friction without DM value. Criterion 1 already names drag ordering as the intended tie-break mechanism; it was never built. Removing Dex Mod and implementing drag-to-reorder resolves both gaps in one pass.

**Fix:** Removed `dexMod` from types, store, modal, and list display. Added `reorderCombatant(from, to)` to the Zustand store (undoable, recalculates activeIndex). Rewrote `InitiativeList.tsx` to use `@dnd-kit/sortable` with `PointerSensor` (mouse) and `TouchSensor` (tablet) — each row has a ⠿ drag handle.
**Violates:** `zustand-combat-engine.feature.md` Criteria 1 and 16.

---

### [ISSUE-001] React hydration mismatch on page load with saved localStorage state
**Severity:** medium
**Status:** fixed
**Reported:** 2026-05-09

The server renders the combat tracker with empty Zustand state (no localStorage on the server). The client rehydrates from localStorage immediately, causing React to report a tree mismatch: "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties." The UI is not patched up and may be in an inconsistent state.

**Violates:** `zustand-combat-engine.feature.md` Criterion 13 (and Criterion 9 — localStorage sync).
**Look first:** `src/store/combat.ts` — `createJSONStorage` with `typeof window` guard; `src/components/CombatTracker/index.tsx` — no `mounted` guard before rendering store state.
**Fix direction:** Add `skipHydration: true` to persist options and call `useCombatStore.persist.rehydrate()` inside `useEffect`, or wrap store-dependent render in a `mounted` state check.

---

### [ISSUE-002] App non-functional when accessed via local network IP
**Severity:** high
**Status:** fixed
**Reported:** 2026-05-09

When opened via local network IP (`10.x.x.x:3000`) instead of `localhost:3000`: (1) combatants added on localhost are not visible — expected, localStorage is per-origin — but (2) the Add Combatant button also does not function, suggesting client-side React components (Zustand store, `'use client'` components) are not initialising correctly on network-IP access. Likely cause: Next.js dev server HMR WebSocket connects back to `localhost` by default; when loaded via network IP the WebSocket handshake fails, which can prevent client component hydration from completing.

**Violates:** `zustand-combat-engine.feature.md` Criterion 14.
**Look first:** `next.config.ts` — no `--hostname` or WebSocket config; Next.js dev server default HMR target; browser console on network-IP load for WebSocket errors.
**Workaround:** Access via `localhost:3000` on the DM machine only.

---

### [ISSUE-003] Phone gets "connection denied" — cannot reach dev server from local network
**Severity:** high
**Status:** fixed
**Reported:** 2026-05-09

A phone on the local network got a "connection denied" when navigating to `http://192.168.1.151:3000`. Root cause: **Next.js 16 blocks cross-origin requests to dev resources (`/_next/webpack-hmr`) by default** — not a firewall or binding issue. Windows Firewall allows Node.js on Private+Public profiles; `next dev` binds to `0.0.0.0:3000` correctly. The dev server emits `⚠ Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr from "192.168.1.151"` at startup when the issue is present.

**Fix:** Added `allowedDevOrigins: ['192.168.1.151']` to `next.config.ts`. Restart dev server after applying.
**Violates:** `zustand-combat-engine.feature.md` Criterion 15.

---

## Template

```
### [ISSUE-NNN] Short title
**Severity:** low | medium | high
**Status:** open | investigating | workaround | fixed
**Reported:** YYYY-MM-DD

Description and reproduction steps.

**Workaround:** (if any)
```
