# Flow: Settings Panel

**Entry point:** DM taps ⚙ in the `CombatTracker` header
**Scope:** Settings modal lifecycle — open, tab switch, value change, persist, close.

---

## Steps

| # | Actor | Action | Output / Store mutation |
|---|---|---|---|
| 1 | DM | Taps ⚙ in header | Settings modal mounts; Appearance tab shown by default |
| 2 | DM | Clicks a tab label | Active tab content swaps; tab bar highlights selection |
| 3 | DM | Selects an accent color swatch (Appearance) | `useSettingsStore.setAccentColor(color)` called; CSS custom property `--color-accent-*` updated on `<html>`; UI accent repaints immediately |
| 4 | DM | Selects sort strategy (Initiative) | `useSettingsStore.setSortStrategy(strategy)` called; setting written to localStorage via persist middleware |
| 5 | DM | Closes modal (backdrop tap, ✕ button, or Done) | Modal unmounts; all changes already persisted — no explicit save step |
| 6 | Browser | Page hard-refreshed | `useSettingsStore.persist.rehydrate()` restores settings; CSS property applied in `useEffect` before first paint |

---

## Failure Modes

| Condition | Behaviour |
|---|---|
| settings localStorage key missing / corrupted | Fall back to defaults (Amber accent, Auto sort); no toast — settings failure is non-critical unlike combat state |
| Sort strategy changed mid-combat | Change affects future `addCombatant` / `updateCombatant` calls only; existing order is not disturbed |
| Accent color CSS var not applied (SSR) | First server render uses default amber classes; `useEffect` applies the var client-side; no hydration mismatch because accent is applied as an attribute, not class changes |

---

## Implementation notes

- `data-accent` attribute set on `document.documentElement` via `useEffect` in `CombatTracker/index.tsx`, watching `accentColor` from the settings store. SSR renders default amber; `useEffect` fires after hydration — no mismatch.
- Sort strategy read via `useSettingsStore.getState().sortStrategy` inside Zustand store actions (synchronous, no React dependency). Manual mode appends to list end; Auto mode uses the full tiebreaker sort chain.

## Feature docs that implement this flow

- `settings.feature.md` (Phase 2)
