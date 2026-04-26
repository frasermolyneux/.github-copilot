---
name: update-destroy-environment-workflow
description: Align the repository's `.github/workflows/destroy-environment.yml` with the canonical pattern defined in `workflows.destroy-environment.instructions.md`.
---

Identify the target repository folder within the workspace before doing anything else. Ask the user which folder to target if it isn't obvious from context.

## Applicability

This workflow applies to **repos that contain Terraform infrastructure** (a `terraform/` folder with `dev` and `prd` backend/tfvars). If the repo has no Terraform, do not create this workflow.

## Source of truth

`.github-copilot/.github/instructions/workflows.destroy-environment.instructions.md` is the canonical pattern. The file is identical across Terraform repos.

## Action

1. Confirm the repo contains `terraform/` with `dev` and `prd` configurations.
2. If `.github/workflows/destroy-environment.yml` exists, align it with the instructions file.
3. If it doesn't exist, create it using the canonical content.
4. The default environment input must be `dev` to reduce risk of accidental prd destruction.
5. Verify the file against the compliance checklist in the instructions file before considering the task complete.
