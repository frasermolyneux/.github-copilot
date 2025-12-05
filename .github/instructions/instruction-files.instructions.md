---
applyTo: ".github/**/*.instructions.md,.github/copilot-instructions.md"
---

1. Write in imperative voice; no filler prose or multi-paragraph storytelling.
2. Structure every file per the [VS Code custom instructions guide](https://code.visualstudio.com/docs/copilot/customization/custom-instructions); keep `applyTo` frontmatter accurate and explain how the scope interacts with prompts, agents, or MCP servers when relevant.
3. Keep instructions ASCII unless editing a file that already contains non-ASCII characters.
4. Reference files and folders using backticks (for example, `docs/overview.md`).
5. Declare the default shell (`pwsh.exe`) and forbid destructive commands such as `git reset --hard`; restate these guardrails when instructions chain into prompts or agents.
6. Require verification steps (tests, linters, or checklist) before marking work complete.
7. Split unrelated rules into separate files and target them with precise globs in `applyTo`.
8. Link only to official GitHub or Microsoft resources when citing guidance.
9. When instructions depend on other guides (prompts, agents, MCP servers), cross-link them explicitly so Copilot can load the whole workflow.
10. End each file with a short self-check list so Copilot can confirm compliance.
11. If the repository structure changes, update the `applyTo` glob immediately to avoid stale routing.

## Self-Check
- [ ] Directives stay imperative, ASCII, and reference `pwsh.exe` when needed.
- [ ] Links target only GitHub or Microsoft domains.
- [ ] Scope/glob values match the intended files.
- [ ] A verification step or checklist exists in the final instructions.
- [ ] The relevant official doc (custom instructions, prompts, agents, MCP servers) is cited where the workflow depends on it.
