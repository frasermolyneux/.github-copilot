# .github-copilot

Shared GitHub Copilot instructions, prompts, and agent specs for the frasermolyneux organization. Keep this repo open in the same VS Code workspace as any project so Copilot can apply the guidance automatically.

## Repository Purpose
- Provide a single source of truth for Copilot instructions across projects.
- Supply vetted prompt and agent templates that follow GitHub best practices.
- Document how to extend and validate the instruction set as requirements evolve.

## Structure
- `docs/` – developer-facing documentation (overview, governance, change log).
- `templates/` – starter files matching the Copilot guides.
- `.github/copilot-instructions.md` – repository-wide guidance that always loads with Copilot.
- `.github/instructions/*.instructions.md` – path-specific rules targeted through glob frontmatter.
- `.github/prompts/*.prompt.md` – reusable prompts for Copilot Chat.

## Daily Usage Flow
1. Clone this repo alongside the active project and open both in a multi-root VS Code workspace.
2. Keep Copilot Chat and inline completions enabled so repository instructions are respected automatically.
3. Start new prompts/instructions/agents from the templates, then cross-check with the best-practice guides.
4. Run the verification checklist in each guide before committing changes.

## Maintaining the Repository
- Treat docs and templates as code: open PRs, request review, and describe how changes affect Copilot output.
- Update `.github/instructions/*.instructions.md` whenever folders change so globs stay accurate.
- Capture rationale for major instruction changes inside `docs/overview.md`.

## References
- [Add repository instructions](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions?tool=vscode)
- [How to write a great agents.md](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
