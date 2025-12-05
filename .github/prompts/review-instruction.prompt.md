---
name: review-instruction
description: "Review a Copilot instruction file for best practices."
argument-hint: "/review-instruction against #path/to/file.instructions.md"
agent: agent
model: "gpt-5.1-codex"
tools: ['edit', 'search', 'fetch', 'githubRepo']
---

# Instruction Review Prompt

**Intent**: Assess a repository or path-specific Copilot instruction file for compliance with this workspace’s standards and GitHub guidance.

**Inputs**
- `{{target_file}}`: `#file:` reference to the instruction file under review.
- `{{review_focus}}`: Optional constraints (shell usage, tooling, workflow) needing scrutiny.
- `{{context_links}}`: Optional supporting docs or related specs.

**Guardrails**
1. Cross-check against [.github/instructions/instruction-files.instructions.md](../instructions/instruction-files.instructions.md) and the [repository instruction docs](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions?tool=vscode); cite the relevant directive when reporting issues.
2. Confirm scopes/globs are accurate, imperative voice is used, ASCII-only content is preserved, and ensure destructive commands stay banned per [.github/copilot-instructions.md](../copilot-instructions.md).
3. Ensure verification steps/checklists exist per [templates/instruction.md](../../templates/instruction.md), restate that VS Code is the source of truth and commands run via `pwsh.exe` per [.github/copilot-instructions.md](../copilot-instructions.md), and keep official links GitHub/Microsoft-only.
4. Use `#tool:search` to surface related instruction files and `#tool:githubRepo` when referencing diffs or related files; provide feedback only—no edits.
5. Prioritize findings by severity, mapping each issue back to `.github/instructions/instruction-files.instructions.md` and recommending concrete path-specific remediations.

**Validation**
- Produce a severity-ordered list noting issue, affected section, and fix recommendation.
- Include a checklist confirming scope accuracy, directive clarity, verification coverage, and link compliance.
- Highlight any missing cross-links to other guides or required updates to globs.

**Checklist**
- [ ] Target file attached via `#file`.
- [ ] Findings map to [.github/instructions/instruction-files.instructions.md](../instructions/instruction-files.instructions.md) or GitHub docs.
- [ ] Output includes severity list, checklist, and remediation guidance.