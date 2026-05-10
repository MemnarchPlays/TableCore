# Rule: Flow Docs

One pipeline per `*.flow.md` file. A flow doc describes HOW data moves through the system, not what a feature does.

- Feature docs describe WHAT success looks like. Flow docs describe HOW the pipeline works.
- Features reference flows; flows do not reference features.
- Place flow docs colocated with the entry-point code they describe.
- A flow doc must have: Entry Point, Steps table (step / actor / output), and Error Paths.

Create a flow doc when a pipeline spans more than two layers (e.g., UI → store → WebSocket → DB → spectator client).
