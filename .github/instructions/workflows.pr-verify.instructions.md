---
description: Canonical pattern for the PR Verify workflow that runs on pull requests targeting main. Layered on top of workflows.instructions.md, workflows.dotnet.instructions.md, and workflows.terraform.instructions.md.
applyTo: '**/pr-verify.yml'
---

# `pr-verify.yml` Pattern

Quality gate for pull requests. Builds, tests, and (for Terraform repos) runs a dev plan with PR commenting. Skips drafts.

## Applicability

All non-bespoke repos.

## Triggers

```yaml
name: PR Verify

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review, labeled, unlabeled]

permissions: {}
```

`labeled, unlabeled` are required so the `run-prd-plan` and `deploy-dev` labels can re-trigger Terraform behaviour.

## Required jobs (by project content)

All jobs must guard with `if: github.event.pull_request.draft == false` so drafts don't burn CI minutes.

### .NET solution / library

```yaml
build-and-test:
  permissions:
    contents: read
  if: github.event.pull_request.draft == false
  runs-on: ubuntu-latest
  steps:
    - uses: frasermolyneux/actions/dotnet-ci@dotnet-ci/v1.4
      with:
        dotnet-version: |
          9.0.x
          10.0.x
        src-folder: "src"
```

### .NET web app

```yaml
build-and-test:
  permissions:
    contents: read
    id-token: write
  if: github.event.pull_request.draft == false
  runs-on: ubuntu-latest
  steps:
    - uses: frasermolyneux/actions/dotnet-web-ci@dotnet-web-ci/v1.4
      with:
        dotnet-project: "<MyOrg.MyApp.Web>"
        dotnet-version: 9.0.x
        src-folder: "src"
```

### .NET Functions

```yaml
build-and-test:
  permissions:
    contents: read
    id-token: write
  if: github.event.pull_request.draft == false
  runs-on: ubuntu-latest
  steps:
    - uses: frasermolyneux/actions/dotnet-func-ci@dotnet-func-ci/v1.4
      with:
        dotnet-project: "<MyOrg.MyApp.Functions>"
        dotnet-version: 9.0.x
        src-folder: "src"
```

### Terraform plan (dev) with PR comment

```yaml
terraform-plan-dev:
  permissions:
    contents: read
    id-token: write
    pull-requests: write
  if: github.event.pull_request.draft == false && !contains(github.event.pull_request.labels.*.name, 'deploy-dev')
  needs: build-and-test
  environment: Development
  runs-on: ubuntu-latest
  concurrency:
    group: ${{ github.repository }}-dev
  steps:
    - uses: frasermolyneux/actions/terraform-plan@terraform-plan/v1.4
      with:
        terraform-folder: "terraform"
        terraform-var-file: "tfvars/dev.tfvars"
        terraform-backend-file: "backends/dev.backend.hcl"
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

The `!contains(... 'deploy-dev')` guard skips the plan when the PR is intentionally being deployed to dev (the deploy workflow takes over).

### Terraform plan (prd) — opt-in via label

When the PR carries the `run-prd-plan` label, additionally run a prd plan:

```yaml
terraform-plan-prd:
  permissions:
    contents: read
    id-token: write
    pull-requests: write
  if: github.event.pull_request.draft == false && contains(github.event.pull_request.labels.*.name, 'run-prd-plan')
  needs: build-and-test
  environment: Production
  runs-on: ubuntu-latest
  concurrency:
    group: ${{ github.repository }}-prd
  steps:
    - uses: frasermolyneux/actions/terraform-plan@terraform-plan/v1.4
      with:
        terraform-folder: "terraform"
        terraform-var-file: "tfvars/prd.tfvars"
        terraform-backend-file: "backends/prd.backend.hcl"
        AZURE_CLIENT_ID: ${{ vars.AZURE_CLIENT_ID }}
        AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
        AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

## Compliance checklist

1. Trigger types include `[opened, synchronize, reopened, ready_for_review, labeled, unlabeled]`.
2. Every job guards with `if: github.event.pull_request.draft == false`.
3. Build job present matching project type.
4. Terraform `dev` plan job present if `terraform/` exists; uses `pull-requests: write`.
5. `terraform-plan-dev` includes the `!contains(..., 'deploy-dev')` label guard.
6. `terraform-plan-prd` (opt-in by `run-prd-plan` label) present for Terraform repos.
7. Composite versions match `workflows.frasermolyneux-actions.instructions.md`.
8. Concurrency group `${{ github.repository }}-<env>` on Terraform jobs.
