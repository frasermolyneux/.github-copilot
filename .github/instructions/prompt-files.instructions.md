---
applyTo: ".github/prompts/**/*.prompt.md,templates/prompt*.md"
---

1. Start each file with YAML frontmatter matching the [VS Code prompt header](https://code.visualstudio.com/docs/copilot/customization/prompt-files) format; populate `name`, `description`, `argument-hint`, `agent`, `model`, and `tools` (list or `[]`) as appropriate.
2. Declare `pwsh.exe` as the default shell and forbid destructive commands such as `git reset --hard` or `git clean -fd`.
3. Follow the header with an **Intent** line that states the desired outcome in one sentence.
4. List required input slots using `{{placeholder}}` syntax and describe the expected value in 1 short clause.
5. Guardrails must be numbered and must cite concrete tools or files (for example, `runTests` or `package.json`).
6. Include a Validation section directing Copilot to run checks or summarize diffs before completion.
7. Reference workspace files with Markdown links and call out tools with `#tool:<name>` when relevant so Copilot can attach them automatically.
8. Mention VS Code as the editor of record and remind Copilot to respect workspace settings when relevant.
9. Only cite GitHub or Microsoft documentation; avoid third-party references.
10. Use fenced code blocks for examples and keep them language-tagged; leverage `${input:var}` and other built-in variables when it improves reuse.
11. End with a quick checklist Copilot can mentally tick off before sending a response.
12. Align prompt guidance with the repo-wide directives in [`../copilot-instructions.md`](../copilot-instructions.md) and cite them when overlapping rules apply.

## Self-Check
- [ ] YAML frontmatter exists with the necessary metadata fields populated.
- [ ] Intent, Inputs, Guardrails, and Validation sections all exist.
- [ ] Every guardrail references a concrete tool, file, or workflow.
- [ ] Placeholders use `{{double_brace}}` syntax and have descriptions.
- [ ] Validation tells Copilot how to prove success.
