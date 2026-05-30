---
description: Canonical content rules for the org-wide PULL_REQUEST_TEMPLATE.md (provided by the `.github` repo) and any per-repo override.
applyTo: '.github/PULL_REQUEST_TEMPLATE.md,.github/pull_request_template.md'
---
# PULL_REQUEST_TEMPLATE.md — Generation Guidelines

The PR template prompts the contributor (or the Copilot coding agent) to fill in the validation evidence we need before a PR is mergeable. It exists at two layers:

1. **Org-wide default** — `.github/PULL_REQUEST_TEMPLATE.md` in the `frasermolyneux/.github` repository. Inherited by every repo without its own.
2. **Per-repo override** — `.github/PULL_REQUEST_TEMPLATE.md` inside an individual repo. Use only when the repo genuinely needs a different shape (rare for personal projects).

Default to the org-wide version. Only create a per-repo override if the user explicitly asks.

## Canonical content

The org-wide template lives at `.github-copilot/templates/PULL_REQUEST_TEMPLATE.md`. Keep that file as the source of truth and copy it verbatim into `frasermolyneux/.github/.github/PULL_REQUEST_TEMPLATE.md`.

Required sections (in order):

1. **Summary** — one-line description of the change and the user request that drove it.
2. **Type of change** — checklist (`bugfix`, `feature`, `chore`, `docs`, `infra`, `ci`, `dependencies`, `breaking`).
3. **Required reading consulted** — checkboxes for `.github/copilot-instructions.md`, relevant `.github-copilot/.github/instructions/*` files. The Copilot coding agent uses this to attest it followed the workflow.
4. **Validation evidence** — what the author ran locally / in CI, with paste blocks for command output where applicable. Includes build, test, format-check (and `terraform fmt -check -recursive` / `terraform validate` for IaC).
5. **Risk and rollout** — blast radius, whether deploy-dev / deploy-prd are auto-triggered, manual steps required, rollback plan.
6. **Consumer impact** — optional. Required when a PR touches a published contract (Abstractions / Api.Client NuGet packages, Service Bus DTO / queue-name constants). Lists downstream consumers, whether the change is breaking, and migration notes. Authors delete the section entirely when no contract changed. The `contract-changed.yml` workflow enforces presence of this section on PRs that modify contract paths (see `workflows.contract-changed.instructions.md`).
7. **Linked issues** — `Closes #N` or `Refs #N`.
8. **Reviewer focus areas** — explicit asks (e.g. "double-check the role-assignment scope on line X").

## Style

- Use HTML comments (`<!-- … -->`) for inline guidance — they don't render in the PR body so the author/agent removes them as they fill in each section.
- Checkboxes (`- [ ]`) for everything the reviewer scans first.
- Keep the template short enough to be filled in for trivial PRs without feeling bureaucratic — target ~60–90 lines.

## Reference

See `.github-copilot/templates/PULL_REQUEST_TEMPLATE.md` for the canonical skeleton.

## Cross-references

- `metadata.instructions.md` — universal metadata rules
- `metadata.issue-templates.instructions.md` — sister file for issue templates
- `standards.branching-and-prs.instructions.md` — branch and PR conventions
