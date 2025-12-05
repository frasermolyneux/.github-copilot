---
name: prompt-author
description: "Produce reusable Copilot prompt files for the provided scenario."
argument-hint: "scenario=... inputs_needed='list' constraints='policies'"
agent: agent
model: "gpt-5.1-codex"
tools: ['edit', 'search', 'fetch', 'githubRepo']
---

# Prompt Authoring Prompt

**Intent**: Produce a reusable Copilot prompt file tailored to the provided scenario.

**Inputs**
- `{{scenario}}`: Description of the workflow or persona the prompt supports.
- `{{inputs_needed}}`: List of variables/placeholders the user must supply.
- `{{constraints}}`: Tests, policies, or repos this prompt must respect.

**Guardrails**
1. Model the template in [templates/prompt.md](../../templates/prompt.md) and the instructions in [.github/instructions/prompt-files.instructions.md](../instructions/prompt-files.instructions.md).
2. Cite only official GitHub or Microsoft sources, such as the [prompt best practices](https://github.blog/ai-and-ml/github-copilot/how-to-write-great-prompts-for-github-copilot/).
3. Include a Validation section describing how Copilot proves the task is complete, mirroring [templates/prompt.md](../../templates/prompt.md).
4. Keep guardrails numbered and under 10 lines each per [.github/instructions/prompt-files.instructions.md](../instructions/prompt-files.instructions.md).
5. Remind users VS Code is the source of truth, commands must target `pwsh.exe`, and destructive git commands such as `git reset --hard` or `git clean -fd` are banned per [.github/copilot-instructions.md](../copilot-instructions.md).

**Validation**
- Summarize which inputs the prompt expects and how guardrails map to repo files/tools.
- Call out any follow-up steps (tests, reviews) the user must run after applying the prompt.

**Checklist**
- [ ] Header metadata is accurate (name, description, argument-hint, agent, model, tools).
- [ ] Guardrails cover tooling, validation, and VS Code + `pwsh.exe` expectations.
- [ ] Validation step tells Copilot exactly how to prove success.
