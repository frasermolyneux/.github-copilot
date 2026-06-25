---
name: update-pr-verify-workflow
description: Use when you need to align `.github/workflows/pr-verify.yml` with the canonical organization pattern.
argument-hint: "Target repo folder (for example: talkwithtiles)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/workflows.pr-verify.instructions.md` as the source of truth.
3. Apply layered workflow rules from `.github-copilot/.github/instructions/workflows.instructions.md` plus relevant category files (`workflows.dotnet`, `workflows.terraform`, `workflows.frasermolyneux-actions`, `workflows.security` where applicable).
4. Update or create `.github/workflows/pr-verify.yml` in the target repo to match canonical behavior.
5. Keep draft-PR guards, Terraform plan semantics, and label-triggered optional jobs aligned with canonical rules.
6. Ensure workflow formatting gates are enforced where .NET build/test/publish work is present:
	- `dotnet format <solution-or-src-path> --verify-no-changes`
	- when workflows pin `frasermolyneux/actions/dotnet-ci`, `dotnet-web-ci`, or `dotnet-func-ci` at v2 or later, treat the composite-integrated format gate as compliant
	- add or update an explicit workflow-level format step only when .NET commands run outside those composites, when pinned below v2, or when `skip-format-check: "true"` is intentionally set
7. Validate against the compliance checklist in the per-workflow instructions before finishing.
8. Return a concise summary of changes, format-gate status, and any repo-specific decisions.

