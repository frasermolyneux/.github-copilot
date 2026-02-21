---
name: update-build-and-test-workflow
description: Align the repository's Build and Test GitHub Actions workflow with the standardized format, ensuring that it includes appropriate job templates and scheduling based on the project's contents.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Review the existing `.github/workflows/build-and-test.yml` file in the repository. If it does not exist, create a new one with the standardized configuration for the Build and Test workflow. If it does exist, update it to match the standardized configuration, adjusting job templates and directories as needed based on the project contents.

## Build and Test

All repositories should have a standardized build and test workflow `.github/workflows/build-and-test.yml` to ensure that code is built and tested on each pull request. Depending on the project type, use the appropriate template from the `frasermolyneux/actions` GitHub repository.

A repository may contain multiple types of code, in which case combine the relevant templates into a single workflow, ensuring that all are aligned with the standardized practices.

**IMPORTANT:** If the repository contains a `terraform/` folder, you **MUST** include the Terraform `terraform-plan-dev` job in addition to the build job. Both jobs should be present in the workflow — do not omit the Terraform job.

### Triggers
```yaml
name: Build and Test

on:
  push:
    branches:
      - "feature/**"
      - "bugfix/**"
      - "hotfix/**"

permissions: {}

jobs:
  # Define jobs here based on project type (see below for examples)
```

### dotnet - Solution
```yaml
  build-and-test:
    permissions:
      contents: read
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
    runs-on: ubuntu-latest
    steps:
      - uses: frasermolyneux/actions/dotnet-func-ci@dotnet-func-ci/v1.4
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
    runs-on: ubuntu-latest
    steps:
      - uses: frasermolyneux/actions/dotnet-web-ci@dotnet-web-ci/v1.4
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