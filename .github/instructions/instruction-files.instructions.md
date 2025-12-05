---
applyTo: ".github/**/*.instructions.md,.github/copilot-instructions.md"
---

1. Write in imperative voice; no filler prose or multi-paragraph storytelling.
2. Keep instructions ASCII unless editing a file that already contains non-ASCII characters.
3. Reference files and folders using backticks (for example, `docs/overview.md`).
4. Declare the default shell (`pwsh.exe`) and forbid destructive commands such as `git reset --hard`.
5. Require verification steps (tests, linters, or checklist) before marking work complete.
6. Split unrelated rules into separate files and target them with precise globs in `applyTo`.
7. Link only to official GitHub or Microsoft resources when citing guidance.
8. When instructions depend on other guides (prompts, agents), cross-link them explicitly.
9. End each file with a short self-check list so Copilot can confirm compliance.
10. If the repository structure changes, update the `applyTo` glob immediately to avoid stale routing.

## Self-Check
- [ ] Directives stay imperative, ASCII, and reference `pwsh.exe` when needed.
- [ ] Links target only GitHub or Microsoft domains.
- [ ] Scope/glob values match the intended files.
- [ ] A verification step or checklist exists in the final instructions.
