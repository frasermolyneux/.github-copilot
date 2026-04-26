---
name: update-destroy-development-workflow
description: Align the repository's `.github/workflows/destroy-development.yml` with the canonical pattern defined in `workflows.destroy-development.instructions.md`. Only run this prompt when the user explicitly asks for it.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

## Applicability

Only create this workflow when the user explicitly requests it. Applicable to repos that contain `terraform/`.

## Source of truth

`.github-copilot/.github/instructions/workflows.destroy-development.instructions.md` is the canonical pattern. Cron slot rules come from `workflows.scheduling.instructions.md`.

## Action

1. Confirm the repo contains `terraform/` with a `dev` configuration.
2. If `.github/workflows/destroy-development.yml` exists, align it with the instructions file.
3. If it doesn't exist (and the user has requested it), create it using the canonical content.
4. Look up the repo's nightly destroy slot from `docs/ops-clock.md` — do not invent a cron minute.
5. Verify the file against the compliance checklist in the instructions file before considering the task complete.
