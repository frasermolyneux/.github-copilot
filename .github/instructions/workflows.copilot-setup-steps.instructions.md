---
description: "Use when Canonical pattern for the Copilot Setup Steps workflow that prepares the Copilot coding-agent environment."
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
      - name: Shared Copilot setup
        uses: frasermolyneux/actions/copilot-setup@copilot-setup/v1
        with:
          checkout-repo: 'true'
          checkout-shared-copilot: 'true'
```

> **Critical:** if you override `shared-copilot-path`, preserve a non-root path (for example `.github-copilot`). A root-path checkout will overwrite the main repo checkout.

## Optional steps (by project content)

### .NET projects

```yaml
      - name: Shared Copilot setup
        uses: frasermolyneux/actions/copilot-setup@copilot-setup/v1
        with:
          checkout-repo: 'true'
          checkout-shared-copilot: 'true'
          setup-dotnet: 'true'
          dotnet-version: |
            9.0.x
            10.0.x
```

### Node / SCSS projects

```yaml
      - name: Shared Copilot setup
        uses: frasermolyneux/actions/copilot-setup@copilot-setup/v1
        with:
          checkout-repo: 'true'
          checkout-shared-copilot: 'true'
          setup-node: 'true'
          node-version: 20.x
```

### Python (rare)

```yaml
      - name: Shared Copilot setup
        uses: frasermolyneux/actions/copilot-setup@copilot-setup/v1
        with:
          checkout-repo: 'true'
          checkout-shared-copilot: 'true'
          setup-python: 'true'
          python-version: '3.x'
```

## Compliance checklist

1. Job is named `copilot-setup-steps`.
2. Triggers limited to file-self-changes plus `workflow_dispatch`.
3. Uses `frasermolyneux/actions/copilot-setup@copilot-setup/v1` with `checkout-repo: 'true'` and `checkout-shared-copilot: 'true'`.
4. Setup steps match the project's runtimes (.NET, Node, Python).
5. Action pins match `workflows.instructions.md`.
6. No secrets referenced; `permissions: contents: read` only.

## Rollout ordering

When introducing a brand-new composite and a new canonical pin:

1. Merge the `actions/` repo change first.
2. Confirm the rolling tag exists (for example `copilot-setup/v1`).
3. Then apply the canonical pinned reference in consumer repos.
