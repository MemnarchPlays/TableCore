# Rule: Data Integrity

- All DB writes go through Prisma. No raw SQL in UI or API route handlers.
- HP values are always integers; never store or display fractional HP.
- `current_hp` must satisfy: `0 ≤ current_hp ≤ max_hp + temp_hp`. Enforce this invariant in the Zustand reducer, not just the UI.
- Conditions with `remaining_rounds = 0` are expired; remove them on the next turn tick, not lazily.
- `public_slug` on Encounter must be globally unique — use a UUID, never a sequential ID, as the public URL fragment.
- Undo/redo history must be bounded (e.g., max 50 steps) to prevent unbounded memory growth in long sessions.
- Export (JSON backup) must include all tables: encounters, combatants, active effects, roll log.
