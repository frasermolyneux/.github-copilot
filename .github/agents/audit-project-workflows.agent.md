---
name: audit-project-workflows
description: Read-only audit that compares every GitHub Actions workflow in a target repository against its canonical `workflows.<name>.instructions.md` and the ambient layer-1/2 rules. Produces a compliance report; makes no edits. Use this to spot drift before deciding whether to run `align-project-workflows`.
---

Before doing anything else, identify the target repository folder within the workspace. The agent runs against a single repo per invocation. Ask the user which folder to target if it isn't obvious from context.

## Scope

For every file matching `.github/workflows/*.yml` and `.github/dependabot.yml` in the target repo, evaluate it against:

1. **Layer 1 — universal rules**: `workflows.instructions.md` (permissions, runner, action pins, OIDC, concurrency, YAML style, triggers).
2. **Layer 1 — scheduling**: `workflows.scheduling.instructions.md` (any cron or `time:` value must match `docs/ops-clock.md`).
3. **Layer 2 — categories**: `workflows.frasermolyneux-actions.instructions.md`, `workflows.terraform.instructions.md`, `workflows.dotnet.instructions.md`, `workflows.security.instructions.md` — apply by `applyTo` glob and project content.
4. **Layer 3 — per-workflow**: `workflows.<name>.instructions.md` — use the **Compliance checklist** in the matching file.

For bespoke workflows (`actions-versioning`, `code-quality`, `devops-secure-scanning`, `estate-sync`, `feature-development`, `decommission-state-rm`, `update-dashboard-from-staging`) only Layers 1 and 2 apply.

## Output

Produce a single Markdown report with one section per workflow file:

```
### .github/workflows/<name>.yml
Status: ✅ aligned | ⚠️ drift | ❌ missing required workflow
Findings:
- [layer 1] permissions block missing/incorrect (line X)
- [layer 2 / terraform] AZURE_* sourced from secrets (should be vars)
- [layer 3] checklist item N failed: <description>
```

Add a final section **"Missing canonical workflows"** listing any workflow that should exist for the repo's content (e.g. `release-publish-nuget.yml` is missing in a NuGet repo).

## Constraints

- **Make no edits.** This agent is read-only; the user runs `align-project-workflows` after reviewing the report.
- Do not propose code rewrites — just cite the rule that's broken and the line that breaks it.
- Skip noise: do not report on style preferences not codified in instructions, and do not report on bespoke workflows for layer-3 mismatches (they have no layer-3).
