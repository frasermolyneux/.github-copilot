---
name: update-deploy-dev-workflow
description: Align the repository's `.github/workflows/deploy-dev.yml` with the canonical pattern defined in `workflows.deploy-dev.instructions.md`.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

## Source of truth

`.github-copilot/.github/instructions/workflows.deploy-dev.instructions.md` is the canonical pattern for this workflow. Terraform / .NET conventions come from the corresponding category instructions; action versions from `workflows.frasermolyneux-actions.instructions.md`.

## Action

1. Inspect the target repo to determine deployable components (terraform-only / web app / functions / static web app / database).
2. If `.github/workflows/deploy-dev.yml` exists, align it with the instructions file (build → terraform → deploy chain, concurrency, permissions, terraform output extraction).
3. If it doesn't exist and the repo has deployable components, create it using the canonical templates for the detected project types.
4. Trigger must be `workflow_dispatch` only — do not add `push:` or `schedule:`.
5. Verify the file against the compliance checklist in the instructions file before considering the task complete.
