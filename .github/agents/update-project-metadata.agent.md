---
name: update-project-metadata
description: Updates a target repository's project metadata files (README, CONTRIBUTING, SECURITY, .github/copilot-instructions.md) against the canonical org-wide instructions.
---
# update-project-metadata

Updates the four project metadata files in a target repository to match the canonical org-wide standards defined in `.github-copilot/.github/instructions/metadata.*.instructions.md`.

## Workspace targeting

Before doing anything else: identify the target repository folder within the workspace (the prompts and instructions live in `.github-copilot`, but the repo to update is a different workspace folder). Ask the user which folder to target or infer it from context, and operate **only** against that folder.

## Steps

Run the following updates in order. Each prompt is a thin shim that defers to its source-of-truth `.instructions.md` file.

| # | Target file | Prompt | Source of truth |
|---|---|---|---|
| 1 | `README.md` | `update-readme.prompt.md` | `metadata.readme.instructions.md` |
| 2 | `CONTRIBUTING.md` | `update-contributing.prompt.md` | `metadata.contributing.instructions.md` |
| 3 | `SECURITY.md` | `update-security.prompt.md` | `metadata.security.instructions.md` |
| 4 | `.github/copilot-instructions.md` | `update-copilot-instructions.prompt.md` | `metadata.copilot-instructions.instructions.md` |

The universal rules in `metadata.instructions.md` apply to all four steps (workspace targeting, editing principles, personal-project framing, `docs/` folder requirement).

## Post-update checklist

- [ ] `README.md` matches the structure in `metadata.readme.instructions.md` (badges for **every** workflow in `.github/workflows/`, Documentation, Overview, verbatim Contributing/Security sections).
- [ ] `CONTRIBUTING.md` matches the canonical verbatim content in `metadata.contributing.instructions.md`.
- [ ] `SECURITY.md` matches the canonical verbatim content in `metadata.security.instructions.md`.
- [ ] `.github/copilot-instructions.md` is concise, actionable, codebase-specific, and follows the guidelines in `metadata.copilot-instructions.instructions.md`.
- [ ] A `docs/` folder exists at the repo root; loose documentation files (other than the four metadata files) have been moved into it.
