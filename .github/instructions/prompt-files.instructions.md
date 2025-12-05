---
applyTo: ".github/prompts/**/*.prompt.md,templates/prompt*.md"
---

1. Start each file with YAML frontmatter matching the [VS Code prompt header](https://code.visualstudio.com/docs/copilot/customization/prompt-files) format; populate `name`, `description`, `argument-hint`, `agent`, `model`, and `tools` (list or `[]`) as appropriate.
2. Reinforce the relevant sections of the [custom instructions guide](https://code.visualstudio.com/docs/copilot/customization/custom-instructions) by citing the governing instruction file and summarizing how the prompt satisfies its guardrails.
3. Declare `pwsh.exe` as the default shell and forbid destructive commands such as `git reset --hard` or `git clean -fd`.
4. Follow the header with an **Intent** line that states the desired outcome in one sentence.
5. List required input slots using `{{placeholder}}` syntax and describe the expected value in 1 short clause.
6. Guardrails must be numbered and must cite concrete tools or files (for example, `runTests` or `package.json`).
7. Include a Validation section directing Copilot to run checks or summarize diffs before completion.
8. Reference workspace files with Markdown links and call out tools with `#tool:<name>` when relevant so Copilot can attach them automatically.
9. Mention VS Code as the editor of record and remind Copilot to respect workspace settings when relevant.
10. Only cite GitHub or Microsoft documentation; avoid third-party references.
11. Use fenced code blocks for examples and keep them language-tagged; leverage `${input:var}` and other built-in variables when it improves reuse.
12. End with a quick checklist Copilot can mentally tick off before sending a response.
13. Align prompt guidance with the repo-wide directives in [`../copilot-instructions.md`](../copilot-instructions.md) and cite them when overlapping rules apply.
14. Document any MCP dependencies or `mcp-servers` references by linking to the [MCP servers overview](https://code.visualstudio.com/docs/copilot/customization/mcp-servers) and stating which agent or tool owns the configuration.

## Self-Check
- [ ] YAML frontmatter exists with the necessary metadata fields populated.
- [ ] Intent, Inputs, Guardrails, and Validation sections all exist.
- [ ] Every guardrail references a concrete tool, file, or workflow.
- [ ] Placeholders use `{{double_brace}}` syntax and have descriptions.
- [ ] Validation tells Copilot how to prove success.
- [ ] The governing instruction file, agent, and any MCP servers are cited using official VS Code documentation links when applicable.
