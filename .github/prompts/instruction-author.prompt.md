---
name: instruction-author
description: "Generate repository or path-specific Copilot instructions."
argument-hint: "scope=<glob> requirements='bullet list' references='links'"
agent: agent
model: "gpt-5.1-codex"
tools: ['edit', 'search', 'fetch', 'githubRepo']
---

# Instruction Authoring Prompt

**Intent**: Generate a repository or path-specific instruction file that enforces the requested quality bar.

**Inputs**
- `{{target_scope}}`: Description of the files/glob this instruction should apply to.
- `{{requirements}}`: Bullet list of must-have behaviors, tools, or validations.
- `{{references}}`: Optional relative links to supporting docs (GitHub/Microsoft only).

**Guardrails**
1. Follow the repository rules in [.github/instructions/instruction-files.instructions.md](../instructions/instruction-files.instructions.md) and the [official docs](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions?tool=vscode).
2. Keep wording ASCII, imperative, and concise, and remind Copilot it runs inside VS Code with `pwsh.exe` as the default shell per [.github/copilot-instructions.md](../copilot-instructions.md) whenever commands are required.
3. Include a checklist so Copilot can self-verify before finishing, matching the structure in [templates/instruction.md](../../templates/instruction.md).
4. Never introduce destructive git commands (for example, `git reset --hard`) per [.github/copilot-instructions.md](../copilot-instructions.md).

**Validation**
- Provide a short summary of the new/updated instruction plus the files it covers.
- Suggest any tests or reviews that must run because of the change.

**Checklist**
- [ ] Frontmatter metadata and placeholder values align with [templates/instruction.md](../../templates/instruction.md).
- [ ] Scope/glob, requirements, and references tie back to [.github/copilot-instructions.md](../copilot-instructions.md) expectations.
- [ ] Checklist inside the generated instruction reiterates VS Code + `pwsh.exe` and bans destructive git commands.
- [ ] Validation summary mentions required follow-up tests or reviews.
