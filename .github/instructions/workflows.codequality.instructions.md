---
description: Canonical pattern for the Code Quality workflow (Sonar + DevOps secure scanning + dependency review). Layered on top of workflows.instructions.md, workflows.dotnet.instructions.md, workflows.security.instructions.md, and workflows.scheduling.instructions.md.
applyTo: '**/codequality.yml'
---

# `codequality.yml` Pattern

Combines Sonar analysis, DevOps secure scanning, and dependency review on a Monday cron, on push to main, and on PRs to main.

## Applicability

All non-bespoke repos. The bespoke `code-quality.yml` (note hyphen, in `actions/` repo) is separate and not covered here.

## Triggers

```yaml
name: Code Quality

on:
  schedule:
    - cron: "M H * * 1"   # Monday — see ops clock for this repo's slot
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
    types: [opened, synchronize, reopened, ready_for_review]

permissions: {}
```

The Monday cron slot is allocated in `docs/ops-clock.md` — see `workflows.scheduling.instructions.md`. Do not invent a time.

## Required jobs

All three jobs must be present in every repo (Sonar, DevOps secure scanning, dependency review).

### Sonar (project-type-specific)

The `quality` job uses the reusable workflow with the appropriate `build-target`. See `workflows.security.instructions.md` for the parameter contract.

#### .NET library / solution

```yaml
quality:
  permissions:
    contents: read
    actions: read
    security-events: write
  uses: frasermolyneux/actions/.github/workflows/codequality.yml@main
  with:
    sonar-project-key: <org>_<project>
    sonar-organization: <org>
    sonar-host-url: https://sonarcloud.io
    build-target: dotnet-ci
    dotnet-version: |
      9.0.x
      10.0.x
    src-folder: src
  secrets:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

#### .NET Functions

```yaml
quality:
  permissions:
    contents: read
    actions: read
    security-events: write
  uses: frasermolyneux/actions/.github/workflows/codequality.yml@main
  with:
    sonar-project-key: <org>_<project>
    sonar-organization: <org>
    sonar-host-url: https://sonarcloud.io
    build-target: dotnet-func-ci
    dotnet-project: <MyOrg.MyApp.Functions>
    dotnet-version: 10.0.x
    src-folder: src
  secrets:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

#### .NET web app

```yaml
quality:
  permissions:
    contents: read
    actions: read
    security-events: write
  uses: frasermolyneux/actions/.github/workflows/codequality.yml@main
  with:
    sonar-project-key: <org>_<project>
    sonar-organization: <org>
    sonar-host-url: https://sonarcloud.io
    build-target: dotnet-web-ci
    dotnet-project: <MyOrg.MyApp.Web>
    dotnet-version: 9.0.x
    src-folder: src
  secrets:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### DevOps secure scanning (always)

```yaml
devops-secure-scanning:
  permissions:
    contents: read
    actions: read
    id-token: write
    security-events: write
  uses: frasermolyneux/actions/.github/workflows/devops-secure-scanning.yml@main
```

### Dependency review (always, PR-only)

```yaml
dependency-review:
  permissions:
    contents: read
    pull-requests: write
  if: github.event_name == 'pull_request'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: actions/dependency-review-action@v4
      with:
        comment-summary-in-pr: always
```

## Compliance checklist

1. Triggers include schedule (Monday), push to main, and PR types.
2. Cron matches the repo's allocated Monday slot in `docs/ops-clock.md`.
3. `quality` job uses the reusable codequality workflow with the right `build-target` for project type.
4. `devops-secure-scanning` job always present.
5. `dependency-review` job always present, gated on `pull_request`.
6. `SONAR_TOKEN` secret threaded into the `quality` job.
7. Top-level `permissions: {}`; per-job permissions declared.
