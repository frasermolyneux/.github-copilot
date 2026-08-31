# .github-copilot Repository Instructions

This repository is the source for shared Copilot customization used across the `frasermolyneux` organization. It contains Markdown catalogs plus a small TypeScript MCP server; it does not contain consumer application code.

## Canonical customization model

- `.github/copilot-instructions.md` — concise repository-wide facts and commands relevant to almost every task.
- `.github/instructions/*.instructions.md` — path-scoped automatic rules when `applyTo` is present; manual/reference entries when it is absent.
- `AGENTS.md` — concise cross-agent execution details only when portability is intentional; do not repeat repository instructions.
- `.github/skills/*/SKILL.md` — optional reusable multi-step procedures.
- `.github/prompts/*.prompt.md` — manually invoked VS Code Local workflows, not automatic policy.
- `.github/agents/*.agent.md` — manually selected specialist personas or tool boundaries.
- MCP — on-demand access to external or dynamic organization knowledge, not another automatic instruction channel.
- Hooks — fast deterministic enforcement only; do not use them for planning, review, or full-suite validation.

Keep one rule in one canonical location. Link to it from other primitives instead of copying it.

## Catalog access

- Routine work uses the current repository's native instructions.
- A local single-repository session queries the `frasermolyneux-copilot` MCP catalog only when organization knowledge or an external contract is missing locally.
- A multi-root session with `.github-copilot` deliberately open reads these workspace files directly and does not query MCP for the same information.
- A cloud coding agent uses repository-native instructions and skills; it must not require this repository to be cloned only for instructions.
- GitHub.com Chat relies on the concise repository and organization instructions supported by that surface.

Use targeted retrieval. Do not read catalogs wholesale before beginning work. An absent `applyTo` marks an intentional manual/on-demand entry, not a broken instruction file.

## Repository layout

- `.github/instructions/` — path-scoped standards plus manual patterns, contracts, and reference guidance.
- `.github/prompts/` — optional authoring workflows.
- `.github/agents/` — optional specialist agents.
- `.github/skills/` — optional procedural skills.
- `templates/` — canonical generated-file baselines.
- `mcp-server/` — MCP catalog implementation and smoke test.

## MCP validation

When MCP source or catalog discovery changes:

```powershell
npm --prefix mcp-server ci
npm --prefix mcp-server run build
npm --prefix mcp-server run smoke
```

For documentation-only changes, validate the affected content and links without running unrelated stacks.

## Editing constraints

- Preserve uncommitted work and avoid consumer-repository changes.
- Keep frontmatter descriptions precise enough for targeted discovery.
- Do not rescope the broad tenant, platform, or shared instruction families without an explicit task.
- Do not modify setup workflows, MCP client configuration, VS Code configuration, or workspace files unless explicitly requested.
