---
description: Canonical pattern for the Coding-Agent PR Gate workflow that hard-fails until every checkbox in the PR body is ticked. Layered on top of workflows.instructions.md.
applyTo: '**/coding-agent-pr-gate.yml'
---

# `coding-agent-pr-gate.yml` Pattern

A safety net for PRs authored by the GitHub Copilot coding agent (and any other agent that follows the [agents.md](https://agents.md) convention). The workflow:

1. **Auto-detects** agent PRs by author (`Copilot` user, `copilot-swe-agent[bot]` actor) **or** the `coding-agent` label — no manual labelling required for the gate to fire.
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
    types: [opened, edited, reopened, ready_for_review, labeled, unlabeled]

permissions: {}

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  checklist-gate:
    name: PR body checklist gate
    if: >-
      github.event.pull_request.draft == false &&
      (
        contains(github.event.pull_request.labels.*.name, 'coding-agent') ||
        github.event.pull_request.user.login == 'Copilot' ||
        github.actor == 'copilot-swe-agent[bot]'
      )
    runs-on: ubuntu-latest
    permissions:
      pull-requests: read
    steps:
      - name: Verify every Agent attestation checkbox is ticked
        uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.pull_request.body || '';

            // Strip HTML comments — guidance comments may contain unticked example boxes.
            // Then strip fenced code blocks — pasted command output must not trip the gate.
            const stripped = body
              .replace(/<!--[\s\S]*?-->/g, '')
              .replace(/```[\s\S]*?```/g, '');

            // The gate only scans the `## Agent attestation` section. Other sections
            // (Type of change, Required reading consulted) intentionally allow partial
            // ticking — only the attestation checkboxes are gating.
            const sectionMatch = stripped.match(/^##\s+Agent attestation\s*$([\s\S]*?)(?=^##\s|\z)/m);
            if (!sectionMatch) {
              core.setFailed(
                `PR body is missing the '## Agent attestation' section. ` +
                `Coding-agent PRs must include the attestation block from PULL_REQUEST_TEMPLATE.md.`
              );
              return;
            }

            const lines = sectionMatch[1].split(/\r?\n/);
            const unchecked = [];
            for (let i = 0; i < lines.length; i++) {
              const m = lines[i].match(/^\s*[-*]\s+\[\s\]\s+(.*)$/);
              if (m) {
                unchecked.push(m[1]);
              }
            }

            if (unchecked.length > 0) {
              core.setFailed(
                `Agent attestation has ${unchecked.length} unticked checkbox(es). ` +
                `Coding-agent PRs require every attestation box to be ticked before merge.\n\n` +
                unchecked.map(u => `  - ${u}`).join('\n') +
                `\n\nTick each box in the '## Agent attestation' section. If this PR was not produced by an agent, remove the 'coding-agent' label (the gate also fires automatically for the Copilot bot author).`
              );
              return;
            }

            core.info('All Agent attestation checkboxes are ticked. Gate passes.');
```

## Compliance checklist

1. Filename is exactly `coding-agent-pr-gate.yml`.
2. Trigger `types` includes `opened, edited, reopened, ready_for_review, labeled, unlabeled` — `edited` is required so re-ticking a box re-runs the gate. `synchronize` is **omitted**: code pushes don't change body content and would only burn compute.
3. Workflow-level `permissions: {}`.
4. Workflow-level `concurrency:` block uses `${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}` with `cancel-in-progress: true` (per `workflows.instructions.md`).
5. Job-level `permissions: pull-requests: read` (read-only — no comments, no statuses).
6. `if:` guard combines `draft == false` AND `(coding-agent label OR Copilot author OR copilot-swe-agent[bot] actor)` so the gate fires automatically for any agent PR and is silent on human-authored or draft PRs.
7. The script scans **only** the `## Agent attestation` section of the PR body (not the whole body). HTML comments and fenced code blocks are stripped first. Other PR-template sections (`Type of change`, `Required reading consulted`) intentionally allow partial ticking and are out of scope for the gate. A missing `## Agent attestation` section is itself a failure.
8. Uses `actions/github-script@v7` pinned per `workflows.instructions.md`.
9. Failure message lists the unticked attestation lines so the agent can self-remediate.

> **Branch-protection note:** `synchronize` is intentionally omitted (see item 2). On repos where `coding-agent-pr-gate / PR body checklist gate` is configured as a *required* status check in branch protection, the missing status on a new head SHA after `git push` would block the merge button. The personal-project repos in this org don't require this check at the branch-protection level — if that changes, either re-add `synchronize` or fast-resolve the check via re-edit / re-label.

## Cross-references

- `metadata.agents.instructions.md` — describes the AGENTS.md Validation + Escalation sections the gate enforces.
- `metadata.pull-request-template.instructions.md` — the PR template whose checkboxes are scanned.
- `standards.branching-and-prs.instructions.md` — defines the `coding-agent` and `needs-decision` labels.
- `workflows.pr-verify.instructions.md` — sibling PR-time gate (build/test/plan). This gate runs alongside, not nested.
