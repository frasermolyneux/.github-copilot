---
name: review-agent
description: "Review an AGENTS.md file against repository guidance."
argument-hint: "/review-agent against #path/to/AGENTS.md"
agent: agent
model: "gpt-5.1-codex"
tools: ['edit', 'search', 'fetch', 'githubRepo']
---

# Agent Review Prompt

**Intent**: Evaluate an `AGENTS.md` file for alignment with repository guardrails and GitHub recommendations.

**Inputs**
- `{{target_file}}`: `#file:` reference to the agent definition under review.
- `{{review_focus}}`: Optional list of sections or risks needing extra attention.
- `{{context_links}}`: Optional supporting docs, diffs, or change notes.

**Guardrails**
1. Compare against [.github/instructions/agent-files.instructions.md](../instructions/agent-files.instructions.md) and the [agents guidance](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/); cite the relevant bullet when flagging issues.
2. Ensure Mission, Capabilities, Guardrails, Prerequisites, and Escalation sections exist, are actionable, and stay under the 500-line cap.
3. Verify environment assumptions (VS Code as the source of truth, Windows, `pwsh.exe`, required tools) are explicit and destructive commands (for example, `git reset --hard`) are banned per [.github/copilot-instructions.md](../copilot-instructions.md).
4. Use `#tool:githubRepo` if repo context or diffs are needed; never modify files—only report findings.
5. Group findings by severity (blocker, warning, nit) and recommend concrete fixes referencing official docs only.

**Validation**
- Return a table or list with severity, issue, section reference, and recommended fix.
- Provide a checklist indicating whether each required section meets guidance.
- Note follow-up actions (tests, docs, approvals) needed before shipping.

**Checklist**
- [ ] Target file attached via `#file`.
- [ ] Findings cite [.github/instructions/agent-files.instructions.md](../instructions/agent-files.instructions.md) or GitHub agents guidance.
- [ ] Output includes severity summary, checklist, and follow-up actions.