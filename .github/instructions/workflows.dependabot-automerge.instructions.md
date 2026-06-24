---
description: "Use when Canonical pattern for the Dependabot Auto-Merge workflow that auto-squashes Dependabot PRs."
applyTo: '**/dependabot-automerge.yml'
---

# `dependabot-automerge.yml` Pattern

Canonical across all repos. Adds a required `dependabot-policy` check and enables auto-merge (squash) only when the policy allows it.

## Applicability

All non-bespoke repos that have a `.github/dependabot.yml`.

## Canonical workflow

```yaml
name: Dependabot Auto-Merge

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    branches:
      - main

permissions: {}

jobs:
  dependabot-policy:
    permissions:
      contents: read
      issues: write
      pull-requests: write
    runs-on: ubuntu-latest
    if: ${{ github.event.pull_request.draft == false }}
    outputs:
      is_dependabot: ${{ steps.evaluate.outputs.is_dependabot }}
      auto_merge_allowed: ${{ steps.evaluate.outputs.auto_merge_allowed }}
    steps:
      - name: Evaluate Dependabot policy
        id: evaluate
        uses: frasermolyneux/actions/dependabot-policy@dependabot-policy/v1.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

  dependabot:
    needs:
      - dependabot-policy
    permissions:
      contents: write
      pull-requests: write
    runs-on: ubuntu-latest
    if: ${{ needs.dependabot-policy.outputs.is_dependabot == 'true' && needs.dependabot-policy.outputs.auto_merge_allowed == 'true' }}
    steps:
      - name: Enable auto-merge for Dependabot PRs
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Compliance checklist

1. Filename `dependabot-automerge.yml`.
2. Triggered on `pull_request` to `main` with types `[opened, synchronize, reopened, ready_for_review]`.
3. `dependabot-policy` job exists and completes successfully on non-draft PRs.
4. `dependabot-policy` emits outputs `is_dependabot` and `auto_merge_allowed`.
5. Dependabot detection in policy is based on PR author (`pull_request.user.login`), not event actor.
6. `dependabot-policy` uses `frasermolyneux/actions/dependabot-policy@dependabot-policy/v1.0`.
7. Auto-merge policy is fail-closed and only allows approved update classes (patch/minor by default).
8. Major updates are marked non-auto-merge and `run-prd-plan` is applied.
9. Auto-merge job is gated by `needs.dependabot-policy.outputs.*`.
10. Auto-merge command remains `gh pr merge --auto --squash`.
11. Top-level permissions remain `{}` and per-job permissions are least-privilege.
