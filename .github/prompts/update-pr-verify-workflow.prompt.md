---
name: update-pr-verify-workflow
description: Align the repository's PR Verify GitHub Actions workflow with the standardized format, ensuring that it includes appropriate job templates and scheduling based on the project's contents.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Review the existing `.github/workflows/pr-verify.yml` file in the repository. If it does not exist, create a new one with the standardized configuration for the PR Verify workflow. If it does exist, update it to match the standardized configuration, adjusting job templates and directories as needed based on the project contents.

## PR Verify

All repositories should have a standardized pr verify workflow `.github/workflows/pr-verify.yml` to ensure that code is built and tested on each pull request. Depending on the project type, use the appropriate template from the `frasermolyneux/actions` GitHub repository.

A repository may contain multiple types of code, in which case combine the relevant templates into a single workflow, ensuring that all are aligned with the standardized practices.

### Triggers
```yaml
name: PR Verify

on:
  pull_request:
    branches:
      - main
    types: [opened, synchronize, reopened, ready_for_review, labeled, unlabeled]

permissions: {}

jobs:
  # Define jobs here based on project type (see below for examples)
```

### dotnet - Solution
```yaml
  build-and-test:
    permissions:
      contents: read
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: frasermolyneux/actions/dotnet-ci@dotnet-ci/v1.3
        with:
          dotnet-version: |
            9.0.x
            10.0.x
          src-folder: "src"
```

### dotnet - Functions
```yaml
  build-and-test:
    permissions:
      contents: read
      id-token: write
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: frasermolyneux/actions/dotnet-func-ci@main
        with:
          dotnet-project: "MyOrg.MyApp.Functions"
          dotnet-version: 9.0.x
          src-folder: "src"
```

### dotnet - Web App
```yaml
  build-and-test:
    permissions:
      contents: read
      id-token: write
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    steps:
      - uses: frasermolyneux/actions/dotnet-web-ci@main
        with:
          dotnet-project: "MyOrg.MyApp.Web"
          dotnet-version: 9.0.x
          src-folder: "src"
```

### Terraform
```yaml
  terraform-plan-dev:
    permissions:
      contents: read
      id-token: write
    if: github.event.pull_request.draft == false && !contains(github.event.pull_request.labels.*.name, 'deploy-dev')
    needs: build-and-test
    environment: Development
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.repository }}-dev
    env:
      AZURE_CLIENT_ID: ${{ github.event.pull_request.user.login == 'dependabot[bot]' && vars.AZURE_PLAN_CLIENT_ID || vars.AZURE_CLIENT_ID }}
      AZURE_TENANT_ID: ${{ vars.AZURE_TENANT_ID }}
      AZURE_SUBSCRIPTION_ID: ${{ vars.AZURE_SUBSCRIPTION_ID }}
    steps:
      - uses: frasermolyneux/actions/terraform-plan@main
        with:
          terraform-folder: "terraform"
          terraform-var-file: "tfvars/dev.tfvars"
          terraform-backend-file: "backends/dev.backend.hcl"
          AZURE_CLIENT_ID: ${{ env.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ env.AZURE_TENANT_ID }}
          AZURE_SUBSCRIPTION_ID: ${{ env.AZURE_SUBSCRIPTION_ID }}
```

