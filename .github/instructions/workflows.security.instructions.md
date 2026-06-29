---
description: "Use when Conventions for code quality, dependency review, and secure scanning jobs across CI workflows. Layered on top of workflows.instructions.md."
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
  build-target: dotnet-ci                     # or dotnet-web-ci / dotnet-func-ci / cmake-ci
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

`build-target` must match the project type (see `workflows.dotnet.instructions.md` for the .NET composite selection matrix). Web/func calls additionally need `dotnet-project:`.

For C++/CMake repositories:

```yaml
with:
  build-target: cmake-ci
  codeql-languages: cpp
  codeql-category: /language:cpp
  cmake-source-dir: .
  cmake-build-dir: build
  cmake-configure-args: -DCMAKE_BUILD_TYPE=Release -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
  cmake-build-args: --config Release
  ctest-args: --output-on-failure --build-config Release
```

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
    - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0
    - uses: actions/dependency-review-action@a1d282b36b6f3519aa1f3fc636f609c47dddb294
      with:
        comment-summary-in-pr: always
```

## Scheduled trigger

`codequality.yml` runs on a Monday cron from the ops clock — see `workflows.scheduling.instructions.md` and `workflows.codequality.instructions.md`.

## Secrets

- `SONAR_TOKEN` is the only repo-scoped scanning secret in use today. It must be configured in GitHub repository secrets (not org-level) for any repo with Sonar enabled.
