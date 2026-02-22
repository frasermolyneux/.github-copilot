# .github-copilot

Shared GitHub Copilot instructions, prompts, and agent specs for the frasermolyneux organization. Keep this repo open in the same VS Code workspace as any project so Copilot can apply the guidance automatically.

## Repository Purpose
- Provide a single source of truth for Copilot instructions across projects.
- Supply vetted prompt and agent templates that follow GitHub best practices.
- Document how to extend and validate the instruction set as requirements evolve.

## Structure
- `docs/` – developer-facing documentation (overview, governance, [ops clock](docs/ops-clock.md), change log).
- `templates/` – starter files matching the Copilot guides.
- `.github/copilot-instructions.md` – repository-wide guidance that always loads with Copilot.
- `.github/instructions/*.instructions.md` – path-specific rules targeted through glob frontmatter.
- `.github/prompts/*.prompt.md` – reusable prompts for Copilot Chat.

## Alignment With VS Code Guidance
- **Custom instructions** – mirror the structure documented in [Custom Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions) so repository and path rules load consistently.
- **Prompt files** – follow the metadata, intent, input, guardrail, and validation guidance in [Prompt Files](https://code.visualstudio.com/docs/copilot/customization/prompt-files); cross-link the governing instruction file.
- **Custom agents** – configure `.github/agents/*.agent.md` files per [Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents) and ensure tool lists match the prompts that invoke them.
- **MCP servers** – document any Model Context Protocol integrations per [MCP Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) so agents, prompts, and instructions share the same credentials and connection names.

## Daily Usage Flow
1. Clone this repo alongside the active project and open both in a multi-root VS Code workspace.
2. Keep Copilot Chat and inline completions enabled so repository instructions are respected automatically.
3. Start new prompts/instructions/agents from the templates, then cross-check with the official docs above to confirm metadata, tool lists, and MCP references stay in sync.
4. Run the verification checklist in each guide before committing changes and capture evidence (test output, diffs, MCP connection notes).

## Maintaining the Repository
- Treat docs and templates as code: open PRs, request review, and describe how changes affect Copilot output.
- Update `.github/instructions/*.instructions.md` whenever folders change so globs stay accurate.
- Capture rationale for major instruction changes inside `docs/overview.md`.

## References
- [Add repository instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions?tool=vscode)
- [Custom Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
- [Prompt Files](https://code.visualstudio.com/docs/copilot/customization/prompt-files)
- [Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [MCP Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
- [How to write a great agents.md](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
