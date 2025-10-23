CODEX INGENIUM — Usage and Integration

Purpose
- `CODEX_INGENIUM.md` is the human-readable source-of-truth for Cain's brand, aesthetics, and decision rules.
- `codex.json` is the machine-readable version intended for scripts, linters, and agents.

How to use
- Designers and developers should reference the Codex when making design, copy, or interaction decisions.
- Automated tools (style linters, CI checks, review bots) can parse `codex.json` to enforce palette, typography, and allowed/disallowed elements.

Conventions
- When proposing a design change, include a short justification mapping to specific sections in `CODEX_INGENIUM.md` (e.g., "matches: Design Principles — full-screen immersive").
- Use the activation prompt for AI agents: include `codex.json` in the prompt or set an environment variable `CODEX_PATH` pointing to the file.

Next steps (optional)
- Add a small node script to validate CSS variables and palette against `codex.json`.
- Create a CI lint step that fails PRs which introduce disallowed colors or fonts.

Contact
- For questions about interpretation, refer to Cain directly; prefer direct, clear, and critical feedback.
