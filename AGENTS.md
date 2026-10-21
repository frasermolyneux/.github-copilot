# AGENTS.md — .github-copilot

This repository maintains shared Copilot instructions, prompts, custom agents, skills, templates, and a TypeScript MCP catalog server.

Use `.github/copilot-instructions.md` for repository-wide facts and commands. This file adds only the portable execution details needed by agents that intentionally load `AGENTS.md`.

## Key locations

- `.github/instructions/` — scoped automatic instructions and catalog guidance.
- `.github/prompts/` — manually invoked VS Code Local workflows.
- `.github/agents/` — manually selected specialist agents.
- `.github/skills/` — optional multi-step procedures.
- `templates/` — generated-file baselines.
- `mcp-server/` — on-demand catalog server.

## Commands

Run these only when MCP catalog code or content discovery changes:

```powershell
npm --prefix mcp-server ci
npm --prefix mcp-server run build
npm --prefix mcp-server run smoke
```

Documentation-only changes need targeted content checks rather than unrelated builds.

## Constraints

- Preserve frontmatter and naming conventions for each catalog primitive.
- Keep automatic instructions concise; move optional procedures into prompts, agents, or skills.
- For multi-root work, use the files in this workspace directly. For local single-repository work, query the MCP catalog only when organization knowledge is needed.
- Treat repository-native instructions as authoritative for routine work.

## Scoped guidance

- Metadata generation: `.github/instructions/metadata.*.instructions.md`
- Catalog selection: `.github/instructions/catalog.quickstart.instructions.md`
- MCP development: `mcp-server/README.md`

## Do not

- Do not modify consumer repositories from this repository task.
- Do not require the shared repository clone for cloud-agent instruction loading.
- Do not duplicate the same guidance across automatic instructions, AGENTS, MCP, prompts, agents, and skills.
