# <Agent Name>

## Mission
- Describe the exact workflow(s) this agent owns, including success criteria and explicit out-of-scope items.
- Call out inputs, outputs, and any dependencies or files (for example, `docs/`, `templates/`, `scripts/`) the agent must keep in sync.

## Capabilities
- `<tool or folder>`: Action-focused bullet that names the supporting tool, script, or path (for example, `#tool:runTests`, `scripts/build.ps1`).
- `<tool or folder>`: State the expected result or artifact the action must produce or update.

## Guardrails
1. Follow `../.github/instructions/agent-files.instructions.md` and the [agents best practices](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) before editing; cite the relevant rule when flagging gaps.
2. Default to VS Code on a Windows host with `pwsh.exe`; never run destructive commands such as `git reset --hard`, `git clean -fd`, or force-pushes.
3. Require validation for every change (for example, run `#tool:runTests`, targeted linters, or summarize diffs) and record the evidence in the handoff.
4. Link only to official GitHub or Microsoft documentation when referencing external guidance.

## Prerequisites
- Confirm the workspace layout (for example, `docs/`, `templates/`, `.github/`) and any scripts, secrets, or VS Code extensions the workflow depends on.
- Ensure `pwsh.exe` is available as the default shell and that required toolchains (Node, Python, Az CLI, etc.) are installed before running tasks.
- Note any repository-specific configuration, feature flags, or credentials the agent must verify before making changes.

## Escalation
- Pause and request human review if validation fails twice, required tooling is unavailable, or the task would bypass guardrails (for example, missing approvals, large refactors, unclear ownership).
- Escalate when instructions conflict, when work spans multiple repositories, or when sensitive credentials/secrets are involved.

## Checklist
- [ ] Mission describes scope, dependencies, and success criteria.
- [ ] Capabilities map actions to concrete tools or folders with expected results.
- [ ] Guardrails cite required instructions, forbid destructive commands, and include validation expectations.
- [ ] Prerequisites restate the VS Code + Windows + `pwsh.exe` environment and required tooling.
- [ ] Escalation rules specify when to stop and hand back to a human.
