---
name: prompt-name
description: "Short description of the workflow"
argument-hint: "key=value additionalContext=..."
agent: agent
model: "<model name or remove to inherit>"
tools:
  - tool-or-toolset
---

# <Prompt Name>

Default shell: `pwsh.exe`; never run destructive commands such as `git reset --hard` or `git clean -fd`. Keep this prompt aligned with the official docs for [Custom Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions), [Prompt Files](https://code.visualstudio.com/docs/copilot/customization/prompt-files), [Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents), and [MCP Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) so tool metadata, handoffs, and MCP references stay synchronized.

Reference the governing instruction (for example, [`../.github/instructions/prompt-files.instructions.md`](../.github/instructions/prompt-files.instructions.md)) and the agent declared in the YAML header so Copilot can load the entire workflow.

## Intent
Describe the one-sentence outcome Copilot must deliver, tying it back to the governing instruction.

## Inputs
- `{{input_one}}`: Primary request or scenario summary the workflow must satisfy.
- `{{input_two}}`: Key context such as target files, environments, or business rules.
- `{{input_three}}`: Optional MCP server or external dependency reference (name it exactly as configured in the agent file).

## Guardrails
1. Run every shell command in `pwsh.exe`, avoid destructive git commands per [`../copilot-instructions.md`](../copilot-instructions.md), and stay within the tools declared in this header.
2. Work inside VS Code, respect workspace settings, and reference touched files with Markdown links (example: [`docs/overview.md`](../docs/overview.md)).
3. Call out which `#tool:<name>` handles validation or context gathering so the prompt honors the tool-priority rules from the [custom agents documentation](https://code.visualstudio.com/docs/copilot/customization/custom-agents).
4. Document any MCP dependency (name, command, credentials owner) and link back to the [MCP servers guidance](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) so downstream agents know how to connect.
5. Validate functional changes via `#tool:runTests`, targeting the suites documented in [`docs/overview.md`](../docs/overview.md); include pass/fail details, or explain why validation is not applicable before escalating.

## Validation
- Run `#tool:runTests` on affected suites and report the command plus results.
- If tests are not applicable, state why and provide a `#tool:get_changed_files` summary of modified files and their impacts.
- Mention any `#tool:fetch` or `#tool:githubRepo` evidence gathered when the prompt is read-only so downstream agents can trust the context.
- Confirm MCP health (for example, `#tool:fetch` against the server endpoint) whenever the workflow depends on an external provider.

## Checklist
- [ ] Header metadata is accurate (name, description, argument-hint, agent, model, tools) and mirrors the referenced custom agent.
- [ ] Guardrails reference `pwsh.exe`, VS Code workspace rules, `#tool:runTests`, MCP guidance, and fallback documentation.
- [ ] Validation tells Copilot exactly how to prove success or summarize pending work, including evidence for read-only flows.
- [ ] All referenced files use Markdown links and tooling references use `#tool:<name>` syntax per the Microsoft documentation.
- [ ] The prompt cites the governing instruction, agent, and MCP references so the workflow stays in sync with the official VS Code docs.
