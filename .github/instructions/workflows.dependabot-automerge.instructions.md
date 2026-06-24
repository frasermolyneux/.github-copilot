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
      - name: Dependabot metadata
        id: metadata
        if: ${{ github.event.pull_request.user.login == 'dependabot[bot]' }}
        uses: dependabot/fetch-metadata@25dd0e34f4fe68f24cc83900b1fe3fe149efef98
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"

      - name: Evaluate Dependabot policy
        id: evaluate
        uses: actions/github-script@v7
        env:
          UPDATE_TYPE: ${{ steps.metadata.outputs.update-type }}
        with:
          script: |
            const prAuthor = context.payload.pull_request?.user?.login || '';
            const isDependabot = prAuthor === 'dependabot[bot]';
            const updateType = process.env.UPDATE_TYPE || '';
            const allowedUpdateTypes = new Set([
              'version-update:semver-patch',
              'version-update:semver-minor',
              'security-update:semver-patch',
              'security-update:semver-minor'
            ]);
            const isMajor = updateType === 'version-update:semver-major' || updateType === 'security-update:semver-major';

            let autoMergeAllowed = false;
            let reason = 'Auto-merge policy not applicable (non-Dependabot pull request).';

            if (isDependabot) {
              autoMergeAllowed = allowedUpdateTypes.has(updateType);
              reason = autoMergeAllowed
                ? `Auto-merge allowed for update type: ${updateType || 'unknown'}.`
                : `Auto-merge blocked for update type: ${updateType || 'unknown'}. Manual review required.`;

              if (isMajor) {
                const existingLabels = (context.payload.pull_request.labels || []).map(label => label.name);
                if (!existingLabels.includes('run-prd-plan')) {
                  await github.rest.issues.addLabels({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    issue_number: context.issue.number,
                    labels: ['run-prd-plan']
                  });
                  reason += ' Added run-prd-plan label.';
                }
              }
            }

            core.info(reason);
            core.setOutput('is_dependabot', isDependabot ? 'true' : 'false');
            core.setOutput('auto_merge_allowed', autoMergeAllowed ? 'true' : 'false');

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
6. `dependabot-policy` uses `dependabot/fetch-metadata@25dd0e34f4fe68f24cc83900b1fe3fe149efef98` for Dependabot PRs.
7. Auto-merge policy is fail-closed and only allows approved update classes (patch/minor by default).
8. Major updates are marked non-auto-merge and `run-prd-plan` is applied.
9. Auto-merge job is gated by `needs.dependabot-policy.outputs.*`.
10. Auto-merge command remains `gh pr merge --auto --squash`.
11. Top-level permissions remain `{}` and per-job permissions are least-privilege.
