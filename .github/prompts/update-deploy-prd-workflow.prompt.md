---
name: update-deploy-prd-workflow
description: Align the repository's `.github/workflows/deploy-prd.yml` with the canonical pattern defined in `workflows.deploy-prd.instructions.md`.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

## Source of truth

`.github-copilot/.github/instructions/workflows.deploy-prd.instructions.md` is the canonical pattern for this workflow. The skip-dev-on-schedule pattern lives in `workflows.scheduling.instructions.md`. Terraform / .NET conventions come from the corresponding category instructions; action versions from `workflows.frasermolyneux-actions.instructions.md`.

## Action

1. Inspect the target repo to determine deployable components and whether it's terraform-only or mixed.
2. If `.github/workflows/deploy-prd.yml` exists, align it with the instructions file. Pay particular attention to:
   - `detect-changes` job (must be first, with `src` / `terraform` / `database` filters as applicable).
   - `terraform-state-check-dev` job in parallel with `detect-changes`.
   - Conditional Terraform action (plan-and-apply vs output) using the change flag and state-check.
   - Dev jobs gated on `src == 'true' || has_resources != 'true'` with `!failure() && !cancelled()`.
   - Prd jobs explicitly check `terraform-plan-and-apply-prd.result == 'success'`.
   - Skip-dev-on-schedule wired correctly (dev `if: github.event_name != 'schedule'`, prd gateway `|| github.event_name == 'schedule'`).
3. If it doesn't exist and the repo has deployable components, create it using the canonical templates.
4. Look up the repo's deploy-prd slot from `docs/ops-clock.md` — do not invent a cron expression.
5. Terraform-only repos use the `paths:` filter shortcut instead of `detect-changes`.
6. Verify the file against the full compliance checklist in the instructions file before considering the task complete.
