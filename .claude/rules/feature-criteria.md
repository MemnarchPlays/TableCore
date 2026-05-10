# Rule: Feature Success Criteria

Every criterion in a `*.feature.md` must pass all five litmus tests:

1. **Rename test** — Would renaming it to "banana" expose that it no longer fits? If yes, it's concrete enough.
2. **Outsider test** — Could someone unfamiliar with the code verify it by running the app?
3. **Rewrite test** — Would a full rewrite of the implementation leave this criterion unchanged?
4. **Negation test** — Is the opposite clearly wrong? If "don't crash" is the negation, it's too vague.
5. **Stability test** — Is this true once and stays true, not just true on the day of implementation?

Prose paragraphs and vague statements like "works correctly" or "feels fast" are not valid criteria. Rewrite them as numbered, verifiable statements before coding starts.
