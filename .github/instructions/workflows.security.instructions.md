---
description: Conventions for code quality, dependency review, and secure scanning jobs across CI workflows. Layered on top of workflows.instructions.md.
applyTo: '.github/workflows/{codequality,pr-verify,build-and-test}.yml'
---

# Security & Quality Job Conventions

Used by `codequality.yml` primarily, and by `pr-verify.yml` / `build-and-test.yml` when they include scanning steps.

## SonarCloud

Sonar runs via the reusable workflow `frasermolyneux/actions/.github/workflows/codequality.yml@main`.

Required inputs:

```yaml
with:
  sonar-project-key: <org>_<project>          # e.g. frasermolyneux_portal-web
  sonar-organization: <org>                   # e.g. frasermolyneux
  sonar-host-url: https://sonarcloud.io
  build-target: dotnet-ci                     # or dotnet-web-ci / dotnet-func-ci
  dotnet-version: |
    9.0.x
    10.0.x
  src-folder: src
secrets:
  SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

Required permissions on the calling job:

```yaml
permissions:
  contents: read
  actions: read
  security-events: write
```

`build-target` must match the project type (see `workflows.dotnet.instructions.md` for the composite selection matrix). Web/func calls additionally need `dotnet-project:`.

## DevOps secure scanning

A repo-agnostic bundle (DevSkim, Trivy, CodeQL, etc.). Always include in `codequality.yml`:

```yaml
devops-secure-scanning:
  permissions:
    contents: read
    actions: read
    id-token: write
    security-events: write
  uses: frasermolyneux/actions/.github/workflows/devops-secure-scanning.yml@main
```

## Dependency review

PR-only check that flags new vulnerable transitive deps. Always include in `codequality.yml`:

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

## Scheduled trigger

`codequality.yml` runs on a Monday cron from the ops clock — see `workflows.scheduling.instructions.md` and `workflows.codequality.instructions.md`.

## Secrets

- `SONAR_TOKEN` is the only repo-scoped scanning secret in use today. It must be configured in GitHub repository secrets (not org-level) for any repo with Sonar enabled.
