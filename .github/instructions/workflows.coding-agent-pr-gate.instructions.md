---
description: Canonical pattern for the Coding-Agent PR Gate workflow that hard-fails until every checkbox in the PR body is ticked. Layered on top of workflows.instructions.md.
applyTo: '**/coding-agent-pr-gate.yml'
---

# `coding-agent-pr-gate.yml` Pattern

A safety net for PRs authored by the GitHub Copilot coding agent (and any other agent that follows the [agents.md](https://agents.md) convention). The workflow:

1. Only runs when the PR carries the `coding-agent` label.
2. Skips drafts (drafts can have unticked boxes legitimately — they're work in progress).
3. Inspects the PR body and **fails** if any `- [ ]` unticked checkbox remains.

This forces the agent (and the human reviewer) to confirm every attestation in `.github/PULL_REQUEST_TEMPLATE.md` before the PR is mergeable. It pairs with the per-repo `AGENTS.md` Validation section and the `needs-decision` / draft escalation convention.

## Applicability

Every repo that has an `AGENTS.md` brief and accepts cloud-agent-authored PRs. In this org, that means all `portal-*` repos.

## Canonical template

```yaml
name: Coding-Agent PR Gate

on:
  pull_request:
    types: [opened, edited, reopened, ready_for_review, synchronize, labeled, unlabeled]

permissions: {}

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  checklist-gate:
    name: PR body checklist gate
    if: github.event.pull_request.draft == false && contains(github.event.pull_request.labels.*.name, 'coding-agent')
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
    steps:
      - name: Verify every checkbox in PR body is ticked
        uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.pull_request.body || '';

            // Strip HTML comments — guidance comments may contain unticked example boxes.
            // Then strip fenced code blocks — pasted command output must not trip the gate.
            const stripped = body
              .replace(/<!--[\s\S]*?-->/g, '')
              .replace(/```[\s\S]*?```/g, '');

            const lines = stripped.split(/\r?\n/);
            const unchecked = [];
            for (let i = 0; i < lines.length; i++) {
              const m = lines[i].match(/^\s*[-*]\s+\[\s\]\s+(.*)$/);
              if (m) {
                unchecked.push(`L${i + 1}: ${m[1]}`);
              }
            }

            if (unchecked.length > 0) {
              core.setFailed(
                `PR body has ${unchecked.length} unticked checkbox(es). ` +
                `The 'coding-agent' label requires every checkbox to be ticked before merge.\n\n` +
                unchecked.map(u => `  - ${u}`).join('\n') +
                `\n\nTick each box in the PR description, or remove the 'coding-agent' label if this PR was not produced by the agent.`
              );
              return;
            }

            core.info('All checkboxes in the PR body are ticked. Gate passes.');
```

## Compliance checklist

1. Filename is exactly `coding-agent-pr-gate.yml`.
2. Trigger `types` includes `opened, edited, reopened, ready_for_review, synchronize, labeled, unlabeled` — `edited` is required so re-ticking a box re-runs the gate.
3. Workflow-level `permissions: {}`.
4. Workflow-level `concurrency:` block uses `${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}` with `cancel-in-progress: true` (per `workflows.instructions.md`).
5. Job-level `permissions: pull-requests: read` (read-only — no comments, no statuses).
6. `if:` guard combines `draft == false` AND `contains(... 'coding-agent')` so the gate is silent on human-authored or draft PRs.
7. HTML comments are stripped before scanning — the org PR template uses them for guidance and they may contain example unticked boxes.
8. Uses `actions/github-script@v7` pinned per `workflows.instructions.md`.
9. Failure message lists the unticked lines so the agent can self-remediate.

## Cross-references

- `metadata.agents.instructions.md` — describes the AGENTS.md Validation + Escalation sections the gate enforces.
- `metadata.pull-request-template.instructions.md` — the PR template whose checkboxes are scanned.
- `standards.branching-and-prs.instructions.md` — defines the `coding-agent` and `needs-decision` labels.
- `workflows.pr-verify.instructions.md` — sibling PR-time gate (build/test/plan). This gate runs alongside, not nested.
