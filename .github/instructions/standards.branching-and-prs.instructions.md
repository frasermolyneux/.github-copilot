---
description: "Use when Branch strategy, PR rules, and label-driven workflow gates for the frasermolyneux organization."
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

PRs authored by `dependabot[bot]` or `Copilot` (the cloud agent) follow the same **dev Terraform plan gate** as other PRs. Dev plan remains the default safety guardrail.

Dependabot auto-merge is controlled by a dedicated policy check (`dependabot-policy`) and only enables auto-merge for approved update classes (for example patch/minor by default). High-risk updates (for example major) stay in governed manual review and can be labeled for prd planning (`run-prd-plan`).

## Labels

| Label | Effect |
|---|---|
| `run-prd-plan` | Run prd Terraform plan on any PR |
| `auto-merge` | Optional triage label; Dependabot merge eligibility is enforced by `dependabot-policy` |
| `coding-agent` | Auto-applied by the `delegate-to-agent` issue template. Signals that the PR was created through the coding-agent flow and should include the completed agent attestation section in the PR template. |
| `breaking-contract` | Apply when a PR changes a published API/NuGet contract (Abstractions / Api.Client paths) in a non-backwards-compatible way and the package major version must bump. This label is a reviewer/agent signal for triage and changelog automation. |
| `needs-decision` | Applied by the cloud coding agent (and by humans) when a PR is blocked on a human decision. PRs with this label stay in **draft**. Humans triage these before other PRs. See per-repo `AGENTS.md` Escalation section. |

## Deployment triggers

| Workflow | Trigger |
|---|---|
| `deploy-dev.yml` | Push to `feature/*`, `bugfix/*`, `hotfix/*` (where workflow exists) |
| `deploy-prd.yml` | Push to `main`; weekly schedule for drift prevention |
| `release-version-and-tag.yml` | Push to `main` after `deploy-prd` succeeds (where releases apply) |

## Compliance

- Workflows use the branch globs above as `on.push.branches`
- `pr-verify.yml` follows the canonical pattern in `workflows.pr-verify.instructions.md`
- Dependabot/Copilot PRs run the default dev plan gate
- Dependabot auto-merge is gated by a required `dependabot-policy` check
- `deploy-prd.yml` includes the weekly schedule and skip-dev-on-schedule guards (see `workflows.scheduling.instructions.md`)
