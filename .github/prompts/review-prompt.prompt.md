---
name: review-prompt
description: "Review a Copilot prompt file for alignment with repository rules and VS Code prompt guidance."
argument-hint: "/review-prompt against #path/to/prompt.prompt.md"
agent: agent
model: "gpt-5.1-codex"
tools: ['edit', 'search', 'fetch', 'githubRepo']
---

# Prompt Review Prompt

**Intent**: Evaluate a `.prompt.md` file for compliance with this repo’s standards and the official VS Code prompt-file recommendations.

**Inputs**
- `{{target_file}}`: `#file:` reference to the prompt file under review.
- `{{review_focus}}`: Optional aspects to inspect (metadata, guardrails, tooling, validation).
- `{{context_links}}`: Optional supporting docs or rationale for recent changes.

**Guardrails**
1. Cross-check findings against [.github/instructions/prompt-files.instructions.md](../instructions/prompt-files.instructions.md) and the [VS Code prompt-file documentation](https://code.visualstudio.com/docs/copilot/customization/prompt-files); cite the specific directive breached.
2. Confirm the `{{target_file}}` frontmatter (`name`, `description`, `argument-hint`, `agent`, `model`, `tools`) plus Intent, Inputs, Guardrails, Validation, and Checklist sections are intact before reviewing content details.
3. Verify placeholders use `{{double_brace}}`, guardrails name concrete files or tools, and validation spells out proof steps; note when `${input:*}` variables would tighten reuse per repository guidance.
4. Use `#tool:search` to surface related prompts or prior reviews and `#tool:githubRepo` for diffs; keep the response strictly to review findings.
5. Remind authors that VS Code is the source of truth, commands must target `pwsh.exe`, and destructive git commands such as `git reset --hard` or `git clean -fd` stay banned per [.github/copilot-instructions.md](../copilot-instructions.md); flag when prompts omit these expectations or violate ASCII tone.

**Validation**
- Return a structured list (severity, issue, fix) referencing headings or line numbers.
- Provide a checklist covering metadata completeness, section presence, tooling references, and validation clarity.
- Recommend next actions (tests, documentation, template updates) if gaps remain.

**Checklist**
- [ ] Target file attached via `#file`.
- [ ] Findings cite `.github/instructions/prompt-files.instructions.md` or the VS Code docs.
- [ ] Output includes severity summary, checklist, and actionable recommendations.