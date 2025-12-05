---
applyTo: "<glob pattern>"
description: "Short summary referencing the VS Code custom instructions guide."
---

# <Instruction Title>

Reference the governing documentation so Copilot can trace rules back to the official sources: [Custom Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions), [Prompt Files](https://code.visualstudio.com/docs/copilot/customization/prompt-files), [Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents), and [MCP Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).

## Scope
- Files: `<glob pattern>`
- Purpose: `<one sentence describing the quality bar for these files>`
- Related Guides: `<links to instructions/prompt/agent files in this repo that depend on this rule>`
- Official References: `<list the relevant VS Code docs above so downstream prompts/agents can cite them>`

## Directives
1. `<Imperative requirement scoped to the referenced files and tied to the official doc you are enforcing>`
2. `<Reference concrete files such as `docs/overview.md`, `.github/prompts/*.prompt.md`, or `.github/agents/*.agent.md` when clarifying workflows>`
3. `<Document constraints (tooling, reviews, MCP setup) that keep the quality bar high and cite the supporting doc>`
4. `<Explain how this instruction cooperates with prompts or agents so metadata stays synchronized>`

## Tooling
- Editor: `VS Code` (note workspace settings or extensions if prerequisites exist).
- Default shell: `pwsh.exe`; never run destructive commands like `git reset --hard` or `git clean -fd`.
- Tools: `<reference required #tool:<name> entries or scripts>`
- MCP Servers: `<list any Model Context Protocol servers plus links to their records in docs/>`

## Validation
- `<tests/linters Copilot must run before completion>`
- `<diff or evidence summaries the agent must capture before handoff>`
- `<MCP verification steps such as health checks or credential confirmation>`

## Self-Check
- [ ] Directives stay imperative, ASCII, and reference `pwsh.exe` when needed.
- [ ] Links point only to GitHub or Microsoft domains.
- [ ] Scope/glob values, related guides, and official doc references stay accurate.
- [ ] Tooling, MCP expectations, and validation steps are explicit.
