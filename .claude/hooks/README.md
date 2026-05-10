# Project Hooks

Place project-specific Claude Code hook scripts here.

Hooks run automatically on events (PreToolUse, PostToolUse, Stop, etc.) and are wired via `.claude/settings.json`.

To add a hook:
1. Write the script here (e.g., `validate-feature-doc.sh`).
2. Add the hook entry to `.claude/settings.json` under `hooks`.

Do not edit `.claude/settings.json` directly during a Claude session — use the `/update-config` skill.
