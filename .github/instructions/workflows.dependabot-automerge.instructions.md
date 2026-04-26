---
description: Canonical pattern for the Dependabot Auto-Merge workflow that auto-squashes Dependabot PRs.
applyTo: '**/dependabot-automerge.yml'
---

# `dependabot-automerge.yml` Pattern

Identical across all repos. Enables auto-merge (squash) for Dependabot PRs after checks pass.

## Applicability

All non-bespoke repos that have a `.github/dependabot.yml`.

## Canonical workflow

```yaml
name: Dependabot Auto-Merge

on:
  pull_request:
    branches:
      - main

permissions: {}

jobs:
  dependabot:
    permissions:
      contents: write
      pull-requests: write
    runs-on: ubuntu-latest
    if: ${{ github.actor == 'dependabot[bot]' }}
    steps:
      - name: Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v3
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"

      - name: Enable auto-merge for Dependabot PRs
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Compliance checklist

1. Filename `dependabot-automerge.yml`.
2. Triggered on `pull_request` to `main` only.
3. Actor guard `if: ${{ github.actor == 'dependabot[bot]' }}` is present.
4. Permissions are `contents: write`, `pull-requests: write` on the job (top-level `{}` retained).
5. Uses `dependabot/fetch-metadata@v3`.
6. Merge command is `gh pr merge --auto --squash`.
7. No project-specific customisation — the file should be byte-identical across repos.
