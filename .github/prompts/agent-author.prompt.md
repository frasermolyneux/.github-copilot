---
name: agent-author
description: "Draft an AGENTS.md entry with mission, capabilities, and guardrails."
argument-hint: "agent_name=... problem_space='files' tools_available='list' hard_limits='rules'"
agent: agent
model: "gpt-5.1-codex"
tools: ['edit', 'search', 'fetch', 'githubRepo']
---

# Agent Authoring Prompt

**Intent**: Draft an `AGENTS.md` entry that equips Copilot with clear mission, capabilities, and guardrails.

**Inputs**
- `{{agent_name}}`: Friendly name for the agent.
- `{{problem_space}}`: Systems or files the agent owns.
- `{{tools_available}}`: Commands, scripts, or services the agent may call.
- `{{hard_limits}}`: Forbidden actions, escalation rules, or compliance notes.

**Guardrails**
1. Follow [.github/instructions/agent-files.instructions.md](../instructions/agent-files.instructions.md) and the [GitHub guidance on agents](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/).
2. Declare prerequisites pulled from [.github/copilot-instructions.md](../copilot-instructions.md) so the agent explicitly states it runs inside VS Code on Windows with `pwsh.exe` and any required dependencies Copilot must verify.
3. Include explicit escalation triggers (e.g., "stop if tests fail twice") and align them with the expectations modeled in [templates/agent.md](../../templates/agent.md).
4. Keep the `AGENTS.md` entry ASCII and under 400 lines to satisfy rule 3 in [.github/copilot-instructions.md](../copilot-instructions.md) and match the [templates/agent.md](../../templates/agent.md) structure.
5. Save the finished agent entry under `.github/agents/{{agent_name}}.agent.md` (for example, `.github/my-agent.agent.md`) so it loads with the rest of the agents defined in `.github/agents/`.

**Validation**
- Summarize the mission, capabilities, guardrails, and prerequisite notes added to `AGENTS.md`, calling out any new sections or updates made.
- Recommend repository updates (scripts, docs) needed to enable the agent and reference the specific files or directories affected (e.g., [templates/agent.md](../../templates/agent.md), [docs/overview.md](../../docs/overview.md)).
- Before finalizing, run `pwsh -c "git diff --stat AGENTS.md"` (or cite the equivalent `#tool:edit` diff) and confirm the output matches the described changes.

**Checklist**
- [ ] Metadata and placeholders filled with ASCII content only.
- [ ] Mission, Capabilities, Guardrails, Prerequisites, and Escalations map to repo rules.
- [ ] Prerequisites restate VS Code + `pwsh.exe` environment and forbid destructive git commands.
- [ ] Validation summary references the `pwsh -c "git diff --stat AGENTS.md"` evidence.
