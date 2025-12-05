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
1. Use [.github/instructions/agent-files.instructions.md](../instructions/agent-files.instructions.md), the [VS Code custom agents documentation](https://code.visualstudio.com/docs/copilot/customization/custom-agents), and the [GitHub guidance on agents](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/) as compliance references while tailoring every mission, capability, and guardrail statement to the concrete `{{problem_space}}` files/services being curated.
2. Consult [.github/copilot-instructions.md](../copilot-instructions.md) to confirm VS Code on Windows with `pwsh.exe` is the execution environment; surface those prerequisites only where they impact the domain workflow (for example, shell commands the agent will run) and reiterate that destructive git commands such as `git reset --hard` or `git clean -fd` remain forbidden.
3. Emit YAML frontmatter with `name`, `description`, `argument-hint`, `tools`, `model`, `target`, and optional `handoffs` or `mcp-servers` entries before the body so VS Code recognizes the agent metadata.
4. Define escalation triggers and validation requirements that mirror the `{{problem_space}}` workflow (for instance, repeated failures to update the target metadata files or command retries), using [templates/agent.md](../../templates/agent.md) as inspiration rather than verbatim text.
5. Keep the `.agent.md` body ASCII, under 400 lines, and structured as Mission, Capabilities, Guardrails, Prerequisites, Escalation, and Checklist, with each section explicitly referencing the `{{problem_space}}` scope, commands, and artifacts.
6. Save the finished agent entry under `.github/agents/{{agent_name}}.agent.md` (for example, `.github/agents/my-agent.agent.md`) so it loads with the rest of the agents defined in `.github/agents/`.

**Validation**
- Summarize the mission, capabilities, guardrails, prerequisites, and handoffs added to `.github/agents/{{agent_name}}.agent.md`, calling out any new sections or updates made.
- Recommend repository updates (scripts, docs) needed to enable the agent and reference the specific files or directories affected (for example, [templates/agent.md](../../templates/agent.md), [docs/overview.md](../../docs/overview.md)).
- Before finalizing, run `pwsh -c "git diff --stat .github/agents/{{agent_name}}.agent.md"` (or cite the equivalent `#tool:edit` diff) and confirm the output matches the described changes.

**Checklist**
- [ ] YAML frontmatter includes metadata (`name`, `description`, `argument-hint`, `tools`, `model`, `target`, optional `handoffs`).
- [ ] Mission, Capabilities, Guardrails, Prerequisites, Escalations, and Checklist map to repo rules.
- [ ] Prerequisites restate VS Code + `pwsh.exe` environment and forbid destructive git commands.
- [ ] Validation summary references the `pwsh -c "git diff --stat .github/agents/{{agent_name}}.agent.md"` evidence.
