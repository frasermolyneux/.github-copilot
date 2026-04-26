---
name: update-codequality-workflow
description: Align the repository's `.github/workflows/codequality.yml` with the canonical pattern defined in `workflows.codequality.instructions.md`.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

## Source of truth

`.github-copilot/.github/instructions/workflows.codequality.instructions.md` is the canonical pattern for this workflow. Sonar / scanning rules come from `workflows.security.instructions.md`; cron rules from `workflows.scheduling.instructions.md`.

## Action

1. Inspect the target repo to determine project type (.NET solution / web / functions).
2. If `.github/workflows/codequality.yml` exists, align it with the instructions file.
3. If it doesn't exist, create it using the canonical templates for the detected project types.
4. Always include all three jobs: `quality` (Sonar), `devops-secure-scanning`, `dependency-review`.
5. Look up the Monday cron slot from `docs/ops-clock.md` in `.github-copilot` — do not invent a cron expression.
6. Verify the file against the compliance checklist in the instructions file before considering the task complete.
