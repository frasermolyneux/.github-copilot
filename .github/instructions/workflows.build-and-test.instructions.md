---
description: Canonical pattern for the Build and Test workflow that runs on feature/bugfix/hotfix branch pushes. Layered on top of workflows.instructions.md, workflows.dotnet.instructions.md, and workflows.terraform.instructions.md.
applyTo: '**/build-and-test.yml'
---

# `build-and-test.yml` Pattern

Lightweight CI for in-progress branches. Runs build and (where Terraform is present) a dev plan to give early feedback before a PR is opened.

## Applicability

All non-bespoke repos with .NET source, Terraform, or both.

## Triggers

```yaml
name: Build and Test

on:
  push:
    branches:
      - "feature/**"
      - "bugfix/**"
      - "hotfix/**"

permissions: {}
```

Do not add `pull_request` here — that's `pr-verify.yml`'s job.

## Required jobs (by project content)

Combine as needed; a repo with both .NET and Terraform must include both jobs.

### .NET solution / library

```yaml
build-and-test:
  permissions:
    contents: read
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
  runs-on: ubuntu-latest
  steps:
    - uses: frasermolyneux/actions/dotnet-func-ci@dotnet-func-ci/v1.4
      with:
        dotnet-project: "<MyOrg.MyApp.Functions>"
        dotnet-version: 9.0.x
        src-folder: "src"
```

### Terraform plan (dev)

**Required if the repo has a `terraform/` folder**, in addition to any .NET job.

```yaml
terraform-plan-dev:
  permissions:
    contents: read
    id-token: write
  runs-on: ubuntu-latest
  environment: Development
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

## Compliance checklist

1. Top-level `permissions: {}`.
2. Triggered only by feature/bugfix/hotfix branch pushes.
3. .NET job present if `src/*.sln` or .NET project files exist.
4. Terraform plan job present if `terraform/` exists — non-negotiable.
5. Composite versions match `workflows.frasermolyneux-actions.instructions.md`.
6. Per-job `permissions:` declared (least privilege).
7. Concurrency group set on Terraform job.
