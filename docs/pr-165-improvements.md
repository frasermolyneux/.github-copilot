# PR #165 — workflow-hygiene improvements (P1–P6)

Source: review of issue #164 → PR #165 timeline analysis. Captured here so the rollout plan survives context compaction.

## Rollout batches

| Batch | Items | Scope | Risk | Status |
|---|---|---|---|---|
| 1 | P1 + P3 | All 9 portal repos + canonical instruction files | Low — pure compute/cleanup | ✅ Done |
| 2 | P2 + P4 | All 9 portal repos + canonical instruction files + 2 PR templates (`.github-copilot` + `.github`) + 1 issue template | Low-medium — changes gate behaviour but only on agent PRs | ✅ Done |
| 3 | P5 + P6 | New small workflow + 1 instruction-file note | Low — additive only | ⏸ Pending |

## P1 — Fix Code Quality to skip drafts

Add `if: github.event.pull_request.draft == false` to all jobs (`quality`, `devops-secure-scanning`, `dependency-review`) in `codequality.yml`. Update canonical `workflows.codequality.instructions.md` and roll out.

**Effect:** halves codequality compute per PR, cleans up the Dependency Review noise comment on intermediate drafts.

## P2 — Make the Coding-Agent PR Gate self-detecting (fixes Bug 1)

Change the gate's `if:` from "opt-in via `coding-agent` label" to "auto-detect by author OR label":

```yaml
if: >-
  github.event.pull_request.draft == false &&
  (
    contains(github.event.pull_request.labels.*.name, 'coding-agent') ||
    github.event.pull_request.user.login == 'Copilot' ||
    github.actor == 'copilot-swe-agent[bot]'
  )
```

Then drop `synchronize` from the trigger list — body content is unaffected by code pushes. Update canonical `workflows.coding-agent-pr-gate.instructions.md` and roll out.

**Effect:** the gate actually fires on every Copilot PR; no manual labelling required.

## P3 — Add `cancel-in-progress` to PR-check workflows

Extend `workflows.instructions.md` Concurrency section with a new rule: PR check workflows (`pr-verify`, `codequality`, `coding-agent-pr-gate`, `contract-changed`) should add:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

**Effect:** agent push-storms cancel obsolete runs immediately; only the final ready_for_review revision completes.

## P4 — Move agent attestation checkboxes from issue template to PR template

Delete the `### Agent-side attestation` section from `delegate-to-agent.yml` (canonical + deployed copy in `frasermolyneux/.github`) and add an equivalent `## Agent attestation` section to `PULL_REQUEST_TEMPLATE.md` (canonical at `.github-copilot/templates/` + deployed at `.github/.github/`). The Coding-Agent PR Gate (after P2) will then enforce them automatically — any unticked attestation box fails the gate.

Suggested PR-template section:

```markdown
## Agent attestation

Tick **all** boxes before marking ready for review. The Coding-Agent PR Gate fails until every box is ticked.

- [ ] Read AGENTS.md and all files in its Required reading section
- [ ] Followed personal.working-preferences.instructions.md (no unsolicited git commit/push/branch operations)
- [ ] Ran code-review sub-agent before declaring done
- [ ] PR body cites each acceptance criterion from the originating issue
- [ ] No client secrets / GUIDs / connection strings introduced

> Humans opening a PR by hand can tick all five and the gate passes — same shape, no special-casing.
```

**Effect:** R10 finally enforces what it was designed to enforce.

## P5 — Mirror issue labels onto agent-opened PRs

Small workflow on `pull_request: opened` that parses "Closes #N" from the body, fetches that issue's labels, and copies them to the PR. Helps `bug`/`enhancement`/`infra` carry forward without manual intervention.

## P6 — Recommend the agent mark PR ready itself (instruction-only)

In `personal.working-preferences.instructions.md` or `AGENTS.md`, add a note: when the agent has completed an issue end-to-end (all acceptance criteria, attestation ticked, code review passed), it **may** convert its own draft PR to ready (`gh pr ready`). Optional — trade-off is weaker final-eyes-on-it gate.

## Skipped (intentional)

- **Auto-tick attestation from agent.** Bad — defeats the purpose.
- **Auto-apply `breaking-contract` label.** Human judgement; path-triggered `contract-changed.yml` gate already covers it.
- **Block ready_for_review until checkboxes ticked.** GitHub doesn't expose that hook cleanly; gate-on-ready_for_review (after P2) achieves the same via a failing required check.
