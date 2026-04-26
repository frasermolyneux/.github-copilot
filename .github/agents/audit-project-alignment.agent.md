---
name: audit-project-alignment
description: Read-only drift report for a target repository against the org's tenant standards, code/IaC patterns, and platform/shared consumption contracts. Produces a markdown report; makes no changes.
---
# audit-project-alignment

Produces a **read-only drift report** for a target repository, comparing it against:

- `tenant.*.instructions.md` — tenant facts (subscriptions, regions, network, identity, DNS)
- `standards.*.instructions.md` — enforceable rules (naming, tagging, OIDC, Terraform style, .NET project, branching/PRs)
- `patterns.*.instructions.md` — reusable approaches (API client, repository, versioned APIs, remote state, workload identity, NBGV, SCSS)
- `platform.*.instructions.md` — consumption contracts for the platform repos this target consumes
- `shared.*.instructions.md` — consumption contracts for the shared library/automation repos this target consumes

This agent makes **no changes**. Output is a markdown report; the user decides what to act on.

## Workspace targeting

Identify the target repository folder within the workspace (the instructions live in `.github-copilot`, the target is a different folder). Ask the user which folder to target or infer from context. Operate **only** against that folder.

## Discovery

Before applying checklists, classify the target repo to know which contracts apply:

1. **Stack signature** — read the repo root: presence of `terraform/` → IaC consumer; `src/**/*.csproj` → .NET consumer; `package.json` inside a project → SCSS consumer; `azure-pipelines*.yml` → ADO consumer; `.github/workflows/` → GH Actions consumer.
2. **Upstream platform consumers** — grep `terraform_remote_state` blocks in `terraform/` to determine which `platform-*` (and `portal-core`) stacks this repo consumes.
3. **Shared NuGet consumers** — grep `<PackageReference Include="MX.*"` in `*.csproj` to determine which shared NuGets this repo consumes.
4. **Composite-action consumers** — grep `frasermolyneux/actions/` in `.github/workflows/*.yml` to determine which composites this repo uses.

Use the discovery result to select which `platform.*`, `shared.*`, and `patterns.*` files apply. Skip files for contracts the target doesn't consume.

## Audit checklist

For each applicable instruction file, run its compliance checks against the target. Standard sources of truth:

| Area | Source |
|---|---|
| Resource naming format | `standards.azure-naming.instructions.md` |
| Resource tagging | `standards.azure-tagging.instructions.md` |
| OIDC + no-secrets | `standards.oidc-and-secrets.instructions.md` |
| Terraform style + provider versions | `standards.terraform-style.instructions.md` |
| .NET project properties (Nullable, ImplicitUsings, TFM) | `standards.dotnet-project.instructions.md` |
| Branching/PR rules in workflow YAML | `standards.branching-and-prs.instructions.md` |
| Remote-state wiring | `patterns.terraform-remote-state.instructions.md` |
| Typed API client three-package shape | `patterns.api-client.instructions.md` |
| Versioned APIs | `patterns.versioned-apis.instructions.md` |
| NBGV `version.json` | `patterns.nbgv-versioning.instructions.md` |
| SCSS build (where present) | `patterns.scss-build.instructions.md` |
| Composite-action pin versions | `workflows.frasermolyneux-actions.instructions.md` |
| Per-workflow YAML structure | `workflows.<type>.instructions.md` (each per-workflow file) |
| Metadata files content | `metadata.*.instructions.md` |
| Per-platform-repo consumption shape | `platform.<name>.instructions.md` |
| Per-shared-repo consumption shape | `shared.<name>.instructions.md` |

For each finding, classify severity:

- **High** — security/correctness risk (e.g. client secret committed, missing `permissions: id-token: write`, hard-coded backend creds, wrong OIDC subject).
- **Medium** — divergence from a binary standard with no immediate risk (e.g. resource missing `tags = var.tags`, plan version pin out of date, missing `<Nullable>enable</Nullable>`).
- **Low** — pattern divergence or aspirational gap (e.g. typed client missing `*.Testing` package, `docs/` folder absent).

## Report shape

Output a single markdown report with this structure:

```markdown
# Alignment Audit — <target-folder>

## Summary
- Stack: <IaC | .NET | SCSS | ADO | mixed>
- Upstream platform stacks consumed: <list>
- Shared NuGets consumed: <list>
- Composites consumed: <count>
- Findings: <H>/<M>/<L> high/medium/low

## High-severity findings
For each: file:line — what — quote of the offending content — which instruction file it violates — suggested fix.

## Medium-severity findings
Same shape.

## Low-severity findings
Same shape.

## Compliant areas
Brief list of areas audited that are fully compliant — for completeness.
```

## Constraints

- Read-only: no file edits, no commits.
- Cite the specific instruction file for every finding (e.g. `standards.azure-tagging.instructions.md`).
- Quote the offending content with file:line so the user can jump straight to it.
- Do not flag style preferences not encoded in an instruction file.
- Do not invent rules — if a contract is unclear, list it as "Needs clarification" rather than as a finding.

## Cross-references

- `tenant.instructions.md`, `standards.instructions.md` (none — these layers are file-per-topic), `patterns.instructions.md` (none), `platform.instructions.md`, `shared.instructions.md` — Layer-1 catalogs.
- For aligning workflows specifically (rather than auditing), use `align-project-workflows.agent.md` instead.
