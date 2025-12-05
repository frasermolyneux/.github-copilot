---
applyTo: ".github/agents/**/*.agent.md,**/AGENTS.md,templates/agent*.md"
---

1. Author every custom agent as `.github/agents/<agent-name>.agent.md` and keep it under 500 ASCII-only lines per the [VS Code custom agents guidance](https://code.visualstudio.com/docs/copilot/customization/custom-agents).
2. Follow the [MCP servers documentation](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) whenever the agent depends on MCP providers; declare them in the `mcp-servers` frontmatter entry and describe how the prompt/agent workflow authenticates against them.
3. Begin each file with YAML frontmatter that declares `name`, `description`, `tools`, `model`, and `target: vscode`; include optional fields such as `argument-hint`, `handoffs`, or `mcp-servers` when the workflow requires them.
3. Structure the body with Mission, Capabilities, Guardrails, Prerequisites, Escalation, and a final Checklist so the agent’s behavior is predictable across repositories.
4. In Mission, define the exact problems the agent solves, success criteria, and explicit out-of-scope items; reference any dependent files (for example, `docs/`, `templates/`, `scripts/`).
5. Capabilities must be short, action-focused bullets that map to concrete tools or folders and reference tool calls with `#tool:<name>` where applicable so VS Code surfaces the right permissions.
6. Guardrails must block destructive commands (for example, forbid `git reset --hard`, `git clean -fd`, and force-pushes), require validation evidence (tests, linters, or diffs), and cite [`../copilot-instructions.md`](../copilot-instructions.md) plus any other relevant repo instructions.
7. Declare environment assumptions explicitly: Windows host, VS Code, default shell `pwsh.exe`, and any required toolchains, secrets, or extensions before running tasks, referencing [`../copilot-instructions.md`](../copilot-instructions.md) so agents inherit the repo-wide guardrails.
8. List prerequisites such as repo layout, runtimes, feature flags, or credentials, and restate the Windows/`pwsh.exe` requirements whenever setup steps depend on them.
9. Provide Escalation criteria so Copilot knows when to pause (for example, validation failures, unavailable tooling, conflicting instructions, or sensitive credentials) and mention when to hand back to a human.
10. Use the optional `handoffs` metadata when multi-step workflows transition to other agents; each handoff needs a label, target agent, and prompt consistent with the VS Code documentation.
11. Reference only official GitHub or Microsoft sources when linking to external guidance, including the [agents best practices](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/).
12. Cite the governing instruction and prompt files so the agent’s Mission describes how those assets coordinate.

## Self-Check
- [ ] YAML frontmatter includes `name`, `description`, `tools`, `model`, and `target`, plus any required `argument-hint`, `handoffs`, or `mcp-servers` entries.
- [ ] Mission, Capabilities, Guardrails, Prerequisites, Escalation, and Checklist sections are present.
- [ ] Guardrails block destructive commands, cite relevant instructions, and mandate validation evidence.
- [ ] Environment assumptions (Windows host, VS Code, `pwsh.exe`, dependencies) and prerequisites are explicit.
- [ ] Handoffs (when defined) include label, agent, prompt, and optional `send` flag per the Microsoft documentation.
- [ ] References point only to GitHub or Microsoft domains.
- [ ] MCP servers, prompts, and governing instruction files are cited with links to the official VS Code documentation when applicable.
