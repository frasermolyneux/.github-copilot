---
name: update-build-and-test-workflow
description: Align the repository's `.github/workflows/build-and-test.yml` with the canonical pattern defined in `workflows.build-and-test.instructions.md`.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

## Source of truth

`.github-copilot/.github/instructions/workflows.build-and-test.instructions.md` is the canonical pattern for this workflow. Universal rules come from `workflows.instructions.md`; .NET / Terraform conventions come from the corresponding category instructions; action versions come from `workflows.frasermolyneux-actions.instructions.md`.

## Action

1. Inspect the target repo to determine project content (`.NET` solution / web / functions, Terraform, etc.).
2. If `.github/workflows/build-and-test.yml` exists, align it with the instructions file (jobs, triggers, permissions, action pins, concurrency).
3. If it doesn't exist, create it using the canonical templates for the detected project types.
4. **A repo with `terraform/` MUST include the `terraform-plan-dev` job in addition to the .NET build job.**
5. Verify the file against the compliance checklist in the instructions file before considering the task complete.

Do not invent new patterns — only assemble from the templates in the instructions file.
