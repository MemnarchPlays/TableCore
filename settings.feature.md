# Feature: Settings Panel

**Phase:** 2
**Flow doc:** `settings.flow.md`

## What It Does

A tabbed Settings modal accessible from the combat tracker header (⚙ button). Phase 2 ships two tabs: **Appearance** (accent color presets) and **Initiative** (sort strategy selector). Settings persist to localStorage via a dedicated Zustand store. Future tabs can be added without structural changes.

Delivers the sort-strategy toggle noted in ISSUE-007 fix and the color customization requested by the DM.

## Success Criteria

### Settings panel

1. A ⚙ button is visible in the combat tracker header at all times (before and after combat starts); tapping it opens the Settings modal without affecting combat state.
2. The Settings modal has a tab bar with at minimum two tabs labeled "Appearance" and "Initiative"; clicking a tab switches content without closing the modal; the active tab is visually highlighted.
3. The Settings modal is accessible on both desktop and phone (≥ 375px wide): on phone it renders as a bottom sheet with `max-h-[90dvh]` and internal scroll, matching the Add Combatant modal pattern; all tab content and close controls are reachable without horizontal scrolling.
4. Closing the modal (backdrop tap, ✕ button) dismisses it without losing any setting that was changed during the session.
5. All settings persist to localStorage via a dedicated Zustand settings store (`src/store/settings.ts` with `persist` middleware and `skipHydration: true`); closing the browser tab and reopening restores the last saved settings.
6. If settings localStorage data is corrupted or unreadable, the app silently falls back to defaults (Amber accent, Auto sort); no toast is shown — settings failure is non-critical and should not distract the DM mid-session.

### Appearance tab

7. The Appearance tab displays at least 5 preset accent color swatches: Amber (default), Blue, Teal, Purple, Red; clicking a swatch immediately applies that accent to the live UI without a page reload.
8. The accent color applies to all of the following and no other UI chrome: the active-combatant left border and background tint in the initiative list; the "Next Turn" primary action button; the "Add + Continue" and "Save Changes" submit buttons; input focus rings; the "TableCORE" header wordmark.
9. The currently selected swatch is marked as active (visible ring or checkmark); the rest of the zinc-900 dark palette is unchanged regardless of accent selection.
10. The accent is applied via a CSS custom property (`--accent`) set on `<html>` in a client-side `useEffect`; SSR renders with the default amber classes so there is no React hydration mismatch.

### Initiative tab

11. The Initiative tab provides a labeled "Sort strategy" control with exactly two options: "Auto — Init Mod → Dex Mod → Dex Score → Name" and "Manual only"; the selected option is saved immediately on change.
12. When "Auto" is selected (the default), `addCombatant` and `updateCombatant` re-sort the list using the existing tiebreaker chain, exactly as they do today.
13. When "Manual only" is selected, `addCombatant` appends the new combatant at the bottom of the current list (initiative value is still stored but not used for sorting); `updateCombatant` applies the patch without re-sorting; the DM uses the ⠿ drag handle as the sole ordering mechanism.
14. Changing the sort strategy mid-combat does not reorder the existing list; it only affects the next `addCombatant` or `updateCombatant` call.

## Status

COMPLETE

### Progress

- [x] `src/store/settings.ts` — Zustand settings store (`accentColor`, `sortStrategy`) with persist + skipHydration
- [x] `src/app/globals.css` — accent CSS custom properties per preset; keyed to `[data-accent]` on `<html>`
- [x] `src/components/Settings/SettingsModal.tsx` — modal shell with tab bar (Appearance | Initiative)
- [x] `src/components/Settings/AppearanceTab.tsx` — 5 accent color swatches with active ring indicator
- [x] `src/components/Settings/InitiativeTab.tsx` — sort strategy radio cards
- [x] `src/components/CombatTracker/index.tsx` — ⚙ button in header; settings rehydrate in useEffect; `data-accent` applied on `accentColor` change; modal render
- [x] `src/store/combat.ts` — `addCombatant` / `updateCombatant` gate on `sortStrategy` from settings store
- [x] Accent classes rewired to `var(--accent-*)` in: InitiativeList, AddCombatantModal, EditCombatantModal, CombatantCard, ConditionPicker, BulkActionBar, index.tsx
- [x] Touch target audit: InitiativeTab radio card labels given min-h-[44px]; SettingsModal and AppearanceTab controls already compliant

## Scope

Appearance and Initiative tabs only. Out of scope for this phase:
- Theme switching (dark/light) — CLAUDE.md mandates high-contrast dark mode only; accent color only changes the single accent hue, not the base zinc-900 palette.
- Per-combatant color overrides.
- Any tab beyond Appearance and Initiative (tab slots reserved for future phases).
- Exporting or importing settings.

## Files

- `src/store/settings.ts` — settings Zustand store
- `src/components/Settings/SettingsModal.tsx` — modal + tab bar
- `src/components/Settings/AppearanceTab.tsx` — accent picker
- `src/components/Settings/InitiativeTab.tsx` — sort strategy selector
- `src/components/CombatTracker/index.tsx` — ⚙ button, settings modal render, CSS var bootstrap
- `src/store/combat.ts` — sort strategy gate in `addCombatant` / `updateCombatant`
