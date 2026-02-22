---
name: update-codequality-workflow
description: Align the repository's Code Quality GitHub Actions workflow with the standardized format, ensuring that it includes appropriate job templates and scheduling based on the project's contents.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Review the existing `.github/workflows/codequality.yml` file in the repository. If it does not exist, create a new one with the standardized configuration for the Code Quality workflow. If it does exist, update it to match the standardized configuration, adjusting job templates and directories as needed based on the project contents.

## Code Quality

All repositories should have a standardized code quality workflow `.github/workflows/codequality.yml` to ensure code quality and consistency. Depending on the project type, use the appropriate template from the `frasermolyneux/actions` GitHub repository. 

A repository may contain multiple types of code, in which case combine the relevant templates into a single workflow, ensuring that all are aligned with the standardized practices.

### Triggers

All repositories follow a centralised scheduling standard — see `docs/ops-clock.md` in the `.github-copilot` repository. Codequality scans run on **Monday**, staggered every 15 minutes from 01:00 to 08:00. Consult the ops clock for the repo's allocated time.

```yaml
name: Code Quality

on:
  schedule:
    - cron: "M H * * 1" # Monday — see ops clock for this repo's slot
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
    types: [opened, synchronize, reopened, ready_for_review]

permissions: {}

jobs:
  # Define jobs here based on project type (see below for examples)
```

### dotnet - Library / Solution
```yaml 
  quality:
    permissions:
      contents: read
      actions: read
      security-events: write
    uses: frasermolyneux/actions/.github/workflows/codequality.yml@main
    with:
      sonar-project-key: my-org_my-project
      sonar-organization: my-org
      sonar-host-url: https://sonarcloud.io
      build-target: dotnet-ci
      dotnet-version: |
        9.0.x
        10.0.x
      src-folder: src
    secrets:
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### dotnet - Functions
```yaml
  quality:
    permissions:
      contents: read
      actions: read
      security-events: write
    uses: frasermolyneux/actions/.github/workflows/codequality.yml@main
    with:
      sonar-project-key: my-org_my-function-app
      sonar-organization: my-org
      sonar-host-url: https://sonarcloud.io
      build-target: dotnet-func-ci
      dotnet-project: MyOrg.MyApp.Functions
      dotnet-version: 10.0.x
      src-folder: src
    secrets:
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### dotnet - Web App
```yaml
  quality:
    permissions:
      contents: read
      actions: read
      security-events: write
    uses: frasermolyneux/actions/.github/workflows/codequality.yml@main
    with:
      sonar-project-key: my-org_my-web-app
      sonar-organization: my-org
      sonar-host-url: https://sonarcloud.io
      build-target: dotnet-web-ci
      dotnet-project: MyOrg.MyApp.Web
      dotnet-version: 9.0.x
      src-folder: src
    secrets:
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### DevOps Secure Scanning and Dependency Review (for all project types)
```yaml
  devops-secure-scanning:
    permissions:
      contents: read
      actions: read
      id-token: write
      security-events: write
    uses: frasermolyneux/actions/.github/workflows/devops-secure-scanning.yml@main

  dependency-review:
    permissions:
      contents: read
      pull-requests: write
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        with:
          comment-summary-in-pr: always
```
