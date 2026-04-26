---
name: align-project-workflows
description: Updates a target repository's GitHub Actions workflows, Dependabot config, and dependabot-automerge workflow to match the canonical patterns in `.github-copilot`. Each step delegates to a prompt that points at its `workflows.<name>.instructions.md` source-of-truth file. Layer-1 (`workflows.instructions.md`) and category instructions (`workflows.terraform.instructions.md`, `workflows.dotnet.instructions.md`, `workflows.frasermolyneux-actions.instructions.md`, `workflows.security.instructions.md`, `workflows.scheduling.instructions.md`) apply ambiently.
---

Before running any prompt, identify the target repository folder within the workspace. The prompts and instructions live in `.github-copilot`, but the repo to update is a different workspace folder. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

## Order of execution

Run each prompt against the target folder. Skip steps marked *(conditional)* when the criteria don't apply.

| # | Prompt | Source-of-truth instructions | Notes |
|---|---|---|---|
| 1 | `update-dependabot-workflow` | `workflows.dependabot-config.instructions.md` | `.github/dependabot.yml` |
| 2 | `update-dependabot-automerge` | `workflows.dependabot-automerge.instructions.md` | |
| 3 | `update-build-and-test-workflow` | `workflows.build-and-test.instructions.md` | |
| 4 | `update-pr-verify-workflow` | `workflows.pr-verify.instructions.md` | |
| 5 | `update-deploy-dev-workflow` | `workflows.deploy-dev.instructions.md` | *(conditional — repos with deployable components only)* |
| 6 | `update-deploy-prd-workflow` | `workflows.deploy-prd.instructions.md` | *(conditional — repos with deployable components only)* |
| 7 | `update-codequality-workflow` | `workflows.codequality.instructions.md` | |
| 8 | `update-copilot-setup-steps-workflow` | `workflows.copilot-setup-steps.instructions.md` | |
| 9 | `update-release-version-and-tag-workflow` | `workflows.release-version-and-tag.instructions.md` | *(conditional — NuGet repos only)* |
| 10 | `update-release-publish-nuget-workflow` | `workflows.release-publish-nuget.instructions.md` | *(conditional — NuGet repos only)* |
| 11 | `update-destroy-environment-workflow` | `workflows.destroy-environment.instructions.md` | *(conditional — Terraform repos only)* |
| 12 | `update-destroy-development-workflow` | `workflows.destroy-development.instructions.md` | *(conditional — only when explicitly requested by the user)* |

## Verification

After all applicable prompts have run:

1. Check each updated/new workflow against the **Compliance checklist** in its source-of-truth instructions file.
2. Confirm cron expressions match the repo's slot in `docs/ops-clock.md`.
3. Confirm action pins match `workflows.frasermolyneux-actions.instructions.md`.
4. Report any compliance gaps to the user — do not silently leave drift.

## Bespoke workflows

If the target repo contains bespoke workflows (`actions-versioning.yml`, `code-quality.yml`, `devops-secure-scanning.yml`, `estate-sync.yml`, `feature-development.yml`, `decommission-state-rm.yml`, `update-dashboard-from-staging.yml`), do **not** try to align them with a Layer-3 template — they have none. Apply only the universal/category rules from `workflows.instructions.md` and the category files.
