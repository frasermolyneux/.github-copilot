---
applyTo: "**/AGENTS.md,templates/agent*.md"
---

1. Begin with a Mission section that defines the exact problems the agent solves.
2. Enumerate Capabilities as short, action-focused bullets; tie each to a tool, script, or folder.
3. Guardrails must include disallowed commands (e.g., forbid `git reset --hard`) and required validation steps.
4. Declare environment assumptions explicitly: Windows host, default shell `pwsh.exe`, and any required tooling the agent relies on.
5. List prerequisites such as repo layout, runtimes, secrets, or VS Code extensions, and restate the Windows/`pwsh.exe` requirements when they are needed for setup.
6. Provide Escalation criteria so Copilot knows when to stop and ask for human review.
7. Reference only official GitHub or Microsoft sources when linking to external guidance, including the [agents.md best practices](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/).
8. Keep language ASCII, imperative, and under 500 lines.
9. Include a final checklist the agent can evaluate before finishing a task.

## Self-Check
- [ ] Mission, Capabilities, Guardrails, Prerequisites, and Escalation sections are present.
- [ ] Guardrails block destructive commands and require validation.
- [ ] Environment assumptions (Windows host, `pwsh.exe`, dependencies) are explicit.
- [ ] References point only to GitHub/Microsoft domains.
