---
name: update-editorconfig-baseline
description: Use when you need to align a repository .editorconfig to the org .NET analyzer and style baseline.
argument-hint: "Target repo folder (for example: portal-web)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/standards.editorconfig.instructions.md` as the source of truth.
3. Load and follow `.github-copilot/.github/instructions/workflows.dotnet.instructions.md` for workflow-level formatting gate enforcement.
4. Ensure a repository-root `.editorconfig` exists and sets `root = true`.
5. Align analyzer category severities and style baseline for `[*.{cs,vb}]` to the org standard.
6. Keep rule-level severity downgrades below baseline only when justified with inline comments.
7. Preserve allowed generated-file analyzer exclusions only for approved patterns.
8. Ensure `.editorconfig` choices remain aligned with build-time warning-as-error behavior from `.github-copilot/.github/instructions/standards.dotnet-project.instructions.md`.
9. Validate against the compliance checklist in `standards.editorconfig.instructions.md` before finishing.
10. If the target repo contains `.github/workflows/{build-and-test,pr-verify,codequality,deploy-dev,deploy-prd,release-version-and-tag,release-publish-nuget,copilot-setup-steps}.yml`, ensure each relevant workflow enforces:
	- `dotnet format <solution-or-src-path> --verify-no-changes`
	- when workflows pin `frasermolyneux/actions/dotnet-ci`, `dotnet-web-ci`, or `dotnet-func-ci` at v2 or later, treat the composite-integrated format gate as compliant
	- add or update an explicit workflow-level format step only when .NET commands run outside those composites, when pinned below v2, or when `skip-format-check: "true"` is intentionally set
11. Return a concise summary of changes (including workflow files when updated), exceptions retained, workflow format-gate status, and any follow-up needed.
