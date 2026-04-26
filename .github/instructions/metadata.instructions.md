---
description: Universal guidelines for project metadata files (README, CONTRIBUTING, SECURITY, .github/copilot-instructions.md) shared across the frasermolyneux organization.
applyTo: '{README,CONTRIBUTING,SECURITY}.md,.github/copilot-instructions.md'
---
# Metadata Files — Universal Guidelines

These guidelines apply to every project metadata file in a target repository. More specific `metadata.<file>.instructions.md` files override these where they conflict.

## Workspace targeting

The prompts and agents in `.github-copilot` operate against a separate workspace folder (the target repository), not against `.github-copilot` itself. Before editing any metadata file:

- Identify the target repository folder. Ask the user which folder to target or infer it from context (open file paths, workspace roots).
- Operate **only** against that folder. Do not pull context from sibling repos in the workspace.

## Editing principles

- **Don't rewrite for the sake of it.** Only change content that is incorrect, outdated, or missing relative to the canonical template or the current state of the project.
- **Preserve valuable existing content** — project-specific overview prose, architectural notes, or workflow descriptions in the README that already exist should be retained and refined, not replaced wholesale.
- **Personal-project framing.** All repos in this organization are personal learning projects. Tone should be informal and matter-of-fact; do not promise support, SLAs, or contribution review processes.

## Canonical text blocks

The verbatim canonical content for `CONTRIBUTING.md` and `SECURITY.md` is identical across every repo. Do not customise per-repo. The canonical content lives in:

- `.github-copilot/.github/instructions/metadata.contributing.instructions.md`
- `.github-copilot/.github/instructions/metadata.security.instructions.md`

If those files exist in the target repo with different content, replace them with the canonical text exactly.

## docs/ folder

Every repository should have a `docs/` folder at the root containing additional documentation. The `README.md` Documentation section links to top-level files within it. If `docs/` does not exist, create it; if loose documentation files are present in the repo root (other than the four metadata files), move them into `docs/`.
