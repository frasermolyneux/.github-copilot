---
description: Canonical pattern for the Copilot Setup Steps workflow that prepares the Copilot coding-agent environment.
applyTo: '**/copilot-setup-steps.yml'
---

# `copilot-setup-steps.yml` Pattern

Defines the steps the Copilot coding agent runs before each session — installs runtimes, checks out auxiliary repos, etc.

## Applicability

All non-bespoke repos.

## Triggers

```yaml
name: "Copilot Setup Steps"

on:
  workflow_dispatch:
  push:
    paths:
      - .github/workflows/copilot-setup-steps.yml
  pull_request:
    paths:
      - .github/workflows/copilot-setup-steps.yml

permissions: {}
```

Triggers are intentionally narrow — the workflow only re-runs when the file itself changes (so the agent picks up updated steps).

## Required job

The job **must** be named `copilot-setup-steps`, otherwise Copilot will not pick it up.

```yaml
jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Checkout .github-copilot for shared instructions
        uses: actions/checkout@v6
        with:
          repository: frasermolyneux/.github-copilot
          path: .github-copilot
```

> **Critical:** the second checkout must include `path: .github-copilot`. Without it, the second checkout overwrites the main repo checkout. Always preserve this.

## Optional steps (by project content)

### .NET projects

```yaml
      - name: Setup .NET
        uses: actions/setup-dotnet@v5
        with:
          dotnet-version: |
            9.0.x
            10.0.x
```

### Node / SCSS projects

```yaml
      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 20.x
```

### Python (rare)

```yaml
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.x'
```

## Compliance checklist

1. Job is named `copilot-setup-steps`.
2. Triggers limited to file-self-changes plus `workflow_dispatch`.
3. Main repo checkout first; `.github-copilot` checkout includes `path: .github-copilot`.
4. Setup steps match the project's runtimes (.NET, Node, Python).
5. Action pins match `workflows.instructions.md`.
6. No secrets referenced; `permissions: contents: read` only.
