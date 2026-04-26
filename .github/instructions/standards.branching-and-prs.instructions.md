---
description: Branch strategy, PR rules, and label-driven workflow gates for the frasermolyneux organization.
applyTo: '.github/workflows/**/*.yml,.github/dependabot.yml'
---
# Standard — Branching and Pull Requests

## Branch model

| Branch | Purpose | Triggers |
|---|---|---|
| `main` | Production line; what's deployed to prd | Push → deploy-prd; tag → release |
| `feature/*` | New functionality | Push → deploy-dev (where applicable) |
| `bugfix/*` | Non-urgent fixes | Push → deploy-dev |
| `hotfix/*` | Urgent prd fixes | Push → deploy-dev; PR to `main` fast-tracked |

There is no long-lived `develop` branch. All work flows through short-lived branches → PR to `main`.

## PR verification gates

The `pr-verify.yml` workflow runs on every PR to `main` and is the gate before merge. Standard gates:

- Build and unit tests (.NET projects)
- `terraform fmt -check` and `terraform validate`
- **Dev Terraform plan** runs automatically (always)
- **Prd Terraform plan** runs only when the PR carries the `run-prd-plan` label
- Code-quality scans where configured

## Dependabot and Copilot PRs

PRs authored by `dependabot[bot]` or `Copilot` (the cloud agent) skip Terraform plans **unless** the PR carries the `run-prd-plan` label or `run-dev-plan` label. This avoids burning OIDC plan runs on routine dependency bumps.

The skip is implemented via a `if: github.actor != 'dependabot[bot]' && github.actor != 'Copilot' || contains(github.event.pull_request.labels.*.name, 'run-dev-plan')` condition (or equivalent). See `workflows.pr-verify.instructions.md` for the canonical pattern.

## Labels

| Label | Effect |
|---|---|
| `run-dev-plan` | Force dev Terraform plan on Dependabot/Copilot PRs |
| `run-prd-plan` | Run prd Terraform plan on any PR |
| `auto-merge` | Eligible for Dependabot auto-merge after checks pass |

## Deployment triggers

| Workflow | Trigger |
|---|---|
| `deploy-dev.yml` | Push to `feature/*`, `bugfix/*`, `hotfix/*` (where workflow exists) |
| `deploy-prd.yml` | Push to `main`; weekly schedule for drift prevention |
| `release-version-and-tag.yml` | Push to `main` after `deploy-prd` succeeds (where releases apply) |

## Compliance

- Workflows use the branch globs above as `on.push.branches`
- `pr-verify.yml` follows the canonical pattern in `workflows.pr-verify.instructions.md`
- Dependabot/Copilot PR-skip conditions are present where Terraform plans run
- `deploy-prd.yml` includes the weekly schedule and skip-dev-on-schedule guards (see `workflows.scheduling.instructions.md`)
