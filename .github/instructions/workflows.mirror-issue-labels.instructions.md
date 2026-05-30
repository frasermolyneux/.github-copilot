---
description: Canonical pattern for the Mirror Issue Labels workflow that copies labels from the linked issue onto an agent-opened PR. Layered on top of workflows.instructions.md.
applyTo: '**/mirror-issue-labels.yml'
---

# `mirror-issue-labels.yml` Pattern

A small helper for PRs authored by the GitHub Copilot coding agent (and any other agent that follows the [agents.md](https://agents.md) convention). The workflow:

1. **Auto-detects** agent PRs by author (`Copilot` user, `copilot-swe-agent[bot]` actor) **or** the `coding-agent` label — same guard as `coding-agent-pr-gate.yml`.
2. Parses `Closes #N` / `Fixes #N` / `Resolves #N` references from the PR body.
3. Fetches each referenced issue and copies any labels it has onto the PR.

This carries `bug`, `enhancement`, `infra`, `security`, etc. forward from the issue to the agent's PR without the human having to relabel by hand. Existing PR labels are left alone (no removal, no churn).

## Applicability

Every repo that has an `AGENTS.md` brief and accepts cloud-agent-authored PRs — same scope as `coding-agent-pr-gate.yml`. In this org, that means all `portal-*` repos.

## Canonical template

```yaml
name: Mirror Issue Labels to PR

on:
  pull_request:
    types: [opened, reopened, ready_for_review]

permissions: {}

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  mirror:
    name: Mirror linked issue labels to PR
    if: >-
      contains(github.event.pull_request.labels.*.name, 'coding-agent') ||
      github.event.pull_request.user.login == 'Copilot' ||
      github.actor == 'copilot-swe-agent[bot]'
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      issues: read
    steps:
      - name: Copy labels from linked issue(s)
        uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.pull_request.body || '';

            // Strip HTML comments and fenced code blocks before matching, so
            // example "Closes #N" lines in template guidance don't trigger.
            const stripped = body
              .replace(/<!--[\s\S]*?-->/g, '')
              .replace(/```[\s\S]*?```/g, '');

            // Match "Closes #N", "Fixes #N", "Resolves #N" (case-insensitive,
            // with optional ing/d/s suffixes). Only same-repo references are mirrored.
            const pattern = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi;
            const issueNumbers = new Set();
            let m;
            while ((m = pattern.exec(stripped)) !== null) {
              issueNumbers.add(parseInt(m[1], 10));
            }

            if (issueNumbers.size === 0) {
              core.info('No "Closes #N" references found in PR body; nothing to mirror.');
              return;
            }

            const prNumber = context.payload.pull_request.number;
            const existingLabels = new Set(
              (context.payload.pull_request.labels || []).map(l => l.name)
            );

            const toAdd = new Set();
            for (const num of issueNumbers) {
              try {
                const { data: issue } = await github.rest.issues.get({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: num,
                });
                for (const label of issue.labels || []) {
                  const name = typeof label === 'string' ? label : label.name;
                  if (!name) continue;
                  if (existingLabels.has(name)) continue;
                  toAdd.add(name);
                }
              } catch (err) {
                core.warning(`Failed to fetch issue #${num}: ${err.message}`);
              }
            }

            if (toAdd.size === 0) {
              core.info('Linked issue(s) had no new labels to mirror.');
              return;
            }

            const labels = Array.from(toAdd);
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: prNumber,
              labels,
            });
            core.info(`Mirrored ${labels.length} label(s) to PR: ${labels.join(', ')}`);
```

## Compliance checklist

1. Filename is exactly `mirror-issue-labels.yml`.
2. Trigger `types` is `opened, reopened, ready_for_review` only. Re-running on `edited` would re-add labels a human intentionally removed; re-running on `synchronize` would burn compute on every code push without changing the body. `reopened` is included because the additive, set-deduped mirror is idempotent — re-running it after a PR is closed-and-reopened is safe and recovers the labels if a curator stripped them during triage.
3. Workflow-level `permissions: {}`.
4. Workflow-level `concurrency:` block uses `${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}` with `cancel-in-progress: true` (per `workflows.instructions.md`).
5. Job-level `permissions: pull-requests: write` + `issues: read`. **Nothing else** — the workflow does not need contents, statuses, or comments scopes.
6. `if:` guard matches the `coding-agent-pr-gate.yml` shape: `coding-agent` label **or** `Copilot` author **or** `copilot-swe-agent[bot]` actor. Human-authored PRs are intentionally untouched — humans curate their own labels.
7. The script strips HTML comments and fenced code blocks before matching `Closes #N`, so template guidance and pasted command output don't trigger spurious lookups.
8. Existing PR labels are **never removed** — only additive. Labels the PR already has are skipped (no API churn).
9. Cross-repo references (`owner/repo#N`) are intentionally **not** supported — labels are repo-local and copying foreign labels would create new noise labels in this repo.
10. Uses `actions/github-script@v7` pinned per `workflows.instructions.md`.

> **Non-goals.** This workflow does not: tick checkboxes, set draft/ready state, post comments, request reviewers, or remove labels. Those decisions stay with the human or with other workflows (`coding-agent-pr-gate.yml`).
