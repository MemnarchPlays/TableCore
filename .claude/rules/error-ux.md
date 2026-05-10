# Rule: Error UX

- Never silently swallow errors. If an operation fails, the DM must see a visible, actionable message.
- Never show raw stack traces or Prisma error objects to the UI layer.
- Optimistic UI updates must roll back visibly if the server write fails — do not leave the UI in a phantom state.
- Network errors during a combat session must degrade gracefully: show a reconnect indicator, not a blank screen.
- LocalStorage read failures (corrupted state) must offer "Start fresh" rather than hanging.
- Toast/snackbar for transient errors; modal only for data-loss risk (e.g., "Encounter not saved — export before leaving?").
