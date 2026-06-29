---
name: update-codequality-workflow
description: Use when you need to align `.github/workflows/codequality.yml` with the canonical organization pattern.
argument-hint: "Target repo folder (for example: geo-location)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/workflows.codequality.instructions.md` as the source of truth.
3. Apply layered workflow rules from `.github-copilot/.github/instructions/workflows.instructions.md`, `.github-copilot/.github/instructions/workflows.security.instructions.md`, and scheduling guidance from `.github-copilot/.github/instructions/workflows.scheduling.instructions.md`.
4. Update or create `.github/workflows/codequality.yml` in the target repo to match the canonical pattern.
	- Choose the correct reusable workflow `build-target` for the repo type: `dotnet-ci`, `dotnet-web-ci`, `dotnet-func-ci`, or `cmake-ci`.
	- For C++/CMake repos, set `codeql-languages: cpp`, `codeql-category: /language:cpp`, and pass CMake inputs.
5. Ensure workflow formatting gates are enforced where .NET build/test/publish work is present:
	- `dotnet format <solution-or-src-path> --verify-no-changes`
	- when workflows pin `frasermolyneux/actions/dotnet-ci`, `dotnet-web-ci`, or `dotnet-func-ci` at v2 or later, treat the composite-integrated format gate as compliant
	- add or update an explicit workflow-level format step only when .NET commands run outside those composites, when pinned below v2, or when `skip-format-check: "true"` is intentionally set
6. Validate against the compliance checklist in the per-workflow instructions before finishing.
7. Return a concise summary of changes, format-gate status, and any repo-specific decisions.

