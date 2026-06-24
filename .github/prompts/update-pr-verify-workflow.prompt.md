---
name: update-pr-verify-workflow
description: Align the repository's `.github/workflows/pr-verify.yml` with the canonical pattern defined in `workflows.pr-verify.instructions.md`.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

## Source of truth

`.github-copilot/.github/instructions/workflows.pr-verify.instructions.md` is the canonical pattern for this workflow. Universal rules come from `workflows.instructions.md`; .NET / Terraform conventions come from the corresponding category instructions; action versions come from `workflows.frasermolyneux-actions.instructions.md`.

## Action

1. Inspect the target repo to determine project content.
2. If `.github/workflows/pr-verify.yml` exists, align it with the instructions file.
3. If it doesn't exist, create it using the canonical templates for the detected project types.
4. Ensure every job guards on `if: github.event.pull_request.draft == false`.
5. For Terraform repos, include `terraform-plan-dev` as a required check job that runs only on `opened|synchronize|reopened|ready_for_review` (plus the `!contains(... 'deploy-dev')` guard), and include supported opt-in label jobs (`terraform-plan-and-apply-dev`, `terraform-plan-prd`) with label-triggered runs gated on exact label events (`deploy-dev` / `run-prd-plan`).
6. Verify the file against the compliance checklist in the instructions file before considering the task complete.
