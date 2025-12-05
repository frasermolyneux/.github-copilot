# Copilot Instruction Stack Overview

Use this document to understand how the Copilot-facing assets in this repository fit together and how to evolve them safely.

## Components
- **Repository Instructions (`.github/copilot-instructions.md`)**: always-loaded guidance for every Copilot request in this workspace.
- **Path-Specific Instructions (`.github/instructions/*.instructions.md`)**: glob-scoped rules defined via frontmatter.
- **Templates (`/templates`)**: ready-to-copy scaffolds that already conform to their respective guides.
- **Prompts (`.github/prompts/*.prompt.md`)**: reusable chat prompts wired to this repository.
- **Docs (`/docs`)**: supporting material for humans (overview, governance, change history, FAQ).

## Governance Workflow
1. Design or update guidance in a feature branch.
2. Validate with VS Code + GitHub Copilot by loading this repo beside a sample project.
3. Ensure each instruction guide's checklist passes.
4. Submit a PR summarizing what changed, why, and which teams should adopt it.
5. Record noteworthy changes in `docs/changelog.md` (create when first needed).

## Update Principles
- Prefer small, focused instructions tailored to a path or asset type.
- Reference only official GitHub or Microsoft documentation when citing best practices.
- Keep language imperative and machine-friendly to optimize Copilot interpretation.
- Document non-obvious constraints (tool availability, lint rules, testing requirements).

## Validation Tips
- Use Copilot Chat's **/explain** on new instructions to confirm it interprets them correctly.
- Trigger completions in the target folder to ensure path-specific content is applied.
- Run your usual test suite or linters in the associated project to surface regressions early.
