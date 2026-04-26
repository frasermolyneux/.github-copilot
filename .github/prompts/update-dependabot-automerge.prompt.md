---
name: update-dependabot-automerge
description: Align the repository's `.github/workflows/dependabot-automerge.yml` with the canonical pattern defined in `workflows.dependabot-automerge.instructions.md`.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

## Source of truth

`.github-copilot/.github/instructions/workflows.dependabot-automerge.instructions.md` is the canonical pattern for this workflow. The file is identical across all repos.

## Action

1. If `.github/workflows/dependabot-automerge.yml` exists, replace it with the canonical content from the instructions file.
2. If it doesn't exist (and the repo has a `.github/dependabot.yml`), create it using the canonical content.
3. No project-specific customisation is expected — the file should be byte-identical across repos.
4. Verify the file against the compliance checklist in the instructions file before considering the task complete.
