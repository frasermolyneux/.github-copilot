---
description: "Automatic canonical template rules for .github/workflows/dependabot-automerge.yml."
applyTo: '.github/workflows/dependabot-automerge.yml,.github/workflows/dependabot-automerge.yaml'
---

# `dependabot-automerge.yml` Pattern

Canonical across all repos. Adds a required `dependabot-policy` check and enables auto-merge (squash) only for pull requests authored by an approved automation account.

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
    runs-on: ubuntu-latest
    if: ${{ github.event.pull_request.draft == false }}
    outputs:
      auto_merge_allowed: ${{ steps.evaluate.outputs.auto_merge_allowed }}
    steps:
      - name: Evaluate auto-merge policy
        id: evaluate
        uses: frasermolyneux/actions/dependabot-policy@dependabot-policy/v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

  auto-merge:
    needs:
      - dependabot-policy
    permissions:
      contents: write
      pull-requests: write
    runs-on: ubuntu-latest
    if: ${{ needs.dependabot-policy.outputs.auto_merge_allowed == 'true' }}
    steps:
      - name: Enable auto-merge for eligible bot PRs
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Compliance checklist

1. Filename `dependabot-automerge.yml`.
2. Triggered on `pull_request` to `main` with types `[opened, synchronize, reopened, ready_for_review]`.
3. `dependabot-policy` job exists and completes successfully on non-draft PRs.
4. `dependabot-policy` emits `auto_merge_allowed`, based only on PR author (`pull_request.user.login`), not event actor.
5. Approved authors are `dependabot[bot]` and the `mx-io-idp-bot` bot account (`mx-io-idp-bot[bot]`, or `mx-io-idp-bot` when GitHub reports its type as `Bot`); all other authors are denied.
6. `dependabot-policy` uses `frasermolyneux/actions/dependabot-policy@dependabot-policy/v2`, verified published before adoption.
7. Dependency version type, changed file type (including Terraform), and dependency metadata/evidence do not affect eligibility.
8. Auto-merge job is gated only by `needs.dependabot-policy.outputs.auto_merge_allowed`.
9. Auto-merge command remains `gh pr merge --auto --squash`; do not use admin merge or bypass branch protection.
10. Top-level permissions remain `{}` and per-job permissions are least-privilege.
11. Required checks and branch protection remain the authority that determines when an eligible pull request can merge.
