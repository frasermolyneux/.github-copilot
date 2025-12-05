---
name: <agent-name>
description: "Describe what this agent optimizes (shown as chat placeholder)."
argument-hint: "Inputs: agent_name=... problem_space='files' tools_available='list' hard_limits='rules'"
model: gpt-5.1-codex
target: vscode
tools:
	- edit
	- search
	- fetch
	- githubRepo
mcp-servers:
	- name: <server-name>
		description: "Purpose + link to docs/mcp-servers.md"
handoffs:
	- label: "<Next Step Label>"
		agent: <target-agent-id>
		prompt: "Summarize what the next agent should do with the current context."
		send: false
---


# <Agent Name>

Keep this template aligned with [Custom Instructions](https://code.visualstudio.com/docs/copilot/customization/custom-instructions), [Prompt Files](https://code.visualstudio.com/docs/copilot/customization/prompt-files), [Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents), and [MCP Servers](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) so metadata, tool lists, and MCP connections stay consistent across the repo.

## Mission
- Cite the workflows this `.github/agents/<agent-name>.agent.md` file owns, success criteria, and out-of-scope work; reference supporting resources in `docs/`, `templates/`, or `scripts/`.
- Explain how the selected tools, `target`, prompts, and optional `handoffs` align with the official docs above so maintainers understand why the configuration matters.

## Capabilities
- `<tool or folder>`: Action-focused bullet that names the supporting tool, script, or path (for example, `#tool:runTests`, `scripts/build.ps1`).
- `<MCP server>`: Describe how the agent uses a specific MCP provider, referencing credentials stored in `docs/mcp-servers.md` or similar documentation.
- `<prompt>`: Identify the prompt(s) that call this agent so updates stay synchronized.

## Guardrails
1. Follow `../.github/instructions/agent-files.instructions.md`, the [VS Code custom agents documentation](https://code.visualstudio.com/docs/copilot/customization/custom-agents), and the [agents best practices](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/); cite the relevant rule when flagging gaps.
2. Operate inside VS Code on a Windows host with `pwsh.exe`; never run destructive commands such as `git reset --hard`, `git clean -fd`, force-pushes, or tool executions outside the declared `tools` list.
3. Require validation for every change (for example, run `#tool:runTests`, targeted linters, or summarize diffs) and record the evidence in responses or handoffs; link to the governing prompt’s Validation section when possible.
4. Document how each MCP server is configured (endpoint, auth method) and verify availability before invoking any MCP action, referencing the [MCP servers guidance](https://code.visualstudio.com/docs/copilot/customization/mcp-servers).
5. Link only to official GitHub or Microsoft documentation when referencing external guidance, and surface blockers rather than guessing when prerequisites are missing.

## Prerequisites
- Confirm the workspace layout (for example, `docs/`, `templates/`, `.github/`) and any scripts, secrets, or VS Code extensions the workflow depends on.
- Ensure `pwsh.exe` is available as the default shell and that required toolchains (Node, Python, Az CLI, etc.) are installed before running tasks.
- Note repository-specific configuration, feature flags, MCP credentials, or prompts the agent must verify before making changes; update this list whenever the workflow expands.
- Cross-reference the governing instruction and prompt files so Copilot knows when to load this agent.

## Escalation
- Pause and request human review if validation fails twice, required tooling is unavailable, MCP authentication fails, or the task would bypass guardrails (for example, missing approvals, large refactors, unclear ownership).
- Escalate when instructions conflict, when work spans multiple repositories, or when sensitive credentials/secrets are involved, noting which guardrail prevented progress.

## Checklist
- [ ] Mission captures scope, dependencies, success criteria, and out-of-scope items.
- [ ] Capabilities map actions to concrete tools, prompts, or MCP servers with expected results.
- [ ] Guardrails cite required instructions, forbid destructive commands, describe validation, and document MCP expectations.
- [ ] Prerequisites restate the VS Code + Windows + `pwsh.exe` environment, required tooling, linked prompts, and MCP credentials.
- [ ] Escalation rules specify when to stop and hand back to a human, including references to guardrails and documentation links.
