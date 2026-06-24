---
description: "Use when Canonical content rules for the org-wide ISSUE_TEMPLATE/ folder (provided by the `.github` repo) and any per-repo override. Includes the \"Delegate to coding agent\" form that's the headline reason these exist."
applyTo: '.github/ISSUE_TEMPLATE/**,.github/issue_template/**'
---
# ISSUE_TEMPLATE/ — Generation Guidelines

The issue templates serve two purposes:

1. **Bug / feature reports** — light structure so an issue is actionable without a back-and-forth.
2. **Delegate-to-coding-agent** — the **primary lever** for handing work to the GitHub Copilot coding agent. A well-scoped form here is what makes parallel remote agent work safe and reviewable.

Like PR templates, these live at two layers:

1. **Org-wide default** — `.github/ISSUE_TEMPLATE/*.yml` in the `frasermolyneux/.github` repository. Inherited by every repo.
2. **Per-repo override** — same path inside an individual repo. Use only for genuinely repo-specific forms.

Default to the org-wide version.

## Required forms

Every org-wide ISSUE_TEMPLATE folder must contain:

| File | Purpose |
|---|---|
| `config.yml` | `blank_issues_enabled: false` (force structured forms), contact_links to docs/dashboards |
| `delegate-to-agent.yml` | Structured form for handing a task to the Copilot coding agent |
| `bug_report.yml` | Lightweight bug-report form |
| `feature_request.yml` | Lightweight feature/change-request form |

## `delegate-to-agent.yml` — required fields

This form is the single biggest leverage point for safe remote-agent delegation. It must capture:

1. **Requester-side affirmation** — a checkbox at the top of the form (before the goal) confirming the requester has read `AGENTS.md` for the target repo and understands the task is in scope for that repo.
2. **Goal** — one-line description of the desired outcome.
3. **Background context** — links/files the agent should read before starting.
4. **Acceptance criteria** — checklist of testable outcomes. The agent's PR must cite each one.
5. **Out of scope** — explicit list of what the agent must NOT do.
6. **Risk level** — dropdown (`low`/`medium`/`high`) to flag whether the work touches infra/auth/data.
7. **Validation expectations** — which build/test/format commands must pass; whether integration tests are in scope.
8. **Labels** — auto-apply `coding-agent`, `needs-triage`.

`needs-triage` means a developer triages first and decides whether to hand the issue to Copilot.

> **Agent-side attestation lives in the PR template, not here.** The `## Agent attestation` checkbox block is part of `PULL_REQUEST_TEMPLATE.md` so the gate runs against the PR body regardless of how the work was kicked off (issue form, direct prompt, manual dispatch). See `metadata.pull-request-template.instructions.md`.

The form is filed in the target repo (so a "which repo?" dropdown is unnecessary). Do **not** auto-assign Copilot in the form. Keep triage ownership with developers: `needs-triage` flags the issue for review, and `coding-agent` signals it is likely suitable for Copilot once triaged.

## Style

- Use YAML issue forms (`.yml`), not Markdown templates. Forms produce structured data; Markdown templates allow arbitrary text and reduce signal.
- Each field should have a placeholder/description explaining what good input looks like.
- Mark required fields with `validations: required: true`.
- Default-apply labels via `labels:` at the top of each form so triage is automatic.

## Reference

See `.github-copilot/templates/ISSUE_TEMPLATE/` for canonical skeletons.

## Cross-references

- `metadata.instructions.md` — universal metadata rules
- `metadata.pull-request-template.instructions.md` — sister file for PR template
- `metadata.agents.instructions.md` — `AGENTS.md` is the in-repo brief the delegated agent reads after picking up an issue
