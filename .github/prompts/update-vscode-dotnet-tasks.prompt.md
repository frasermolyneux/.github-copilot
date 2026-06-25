---
name: update-vscode-dotnet-tasks
description: Use when you need to align a repository's VS Code .NET tasks.json to the shared baseline (library, web, function, and test-aware).
argument-hint: "Target repo folder (for example: portal-web)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/standards.vscode-dotnet-tasks.instructions.md` as the source of truth.
3. Discover all `.vscode/tasks.json` files in the target repo (including nested app folders) using deterministic per-repo directory inspection. Do not rely on glob-only discovery in multi-root workspaces.
4. Determine per-file applicability before editing any `tasks.json`:
   - applicable when the file already contains at least one `dotnet:` task label, or
   - applicable when its folder tree has a nearby .NET entrypoint (`*.sln`, `*.slnx`, `*.csproj`) and the folder is not tooling-only.
   - skip tooling-only or frontend-only files by default (for example tasks files that only host npm, ruby, or docs tooling with no .NET entrypoint).
   - if applicability is ambiguous, keep the file unchanged and report it for user confirmation.
5. Detect project shape in that repo:
   - library-focused .NET repo
   - web app repo
   - function app repo
   - test coverage split (unit only vs unit + integration)
6. Align each applicable `tasks.json` to the baseline:
   - include `dotnet: clean`, `dotnet: build`, `dotnet: test`, `dotnet: format`
   - ensure `dotnet: format` runs `dotnet format <solution-or-src-path> --verify-no-changes`
   - ensure default `dotnet: test` excludes integration tests
   - when integration tests exist, keep at least one valid integration-test task; prefer canonical `dotnet: test-integration` only when a single general integration scope exists, and preserve intentional multi-scope integration variants
   - when integration detection is uncertain, keep existing integration-test tasks and report ambiguity instead of pruning
   - add web/function extensions only when applicable
   - remove superseded or duplicate .NET tasks replaced by canonical labels, per pruning rules in the source-of-truth instruction
   - do not delete intentionally distinct tasks solely to enforce canonical-label uniqueness; relabel distinct extras to non-canonical labels when safe, otherwise retain and report
   - before removing a superseded task, update any `dependsOn` references to point at the canonical replacement label
   - after rewiring/removal, validate task-graph safety: all `dependsOn` targets exist, `dependsOrder` behavior is preserved, duplicate edges are removed, and no cycles were introduced
   - validate external label consumers before removal: update `.vscode/launch.json` `preLaunchTask` (and other `.vscode/*.json` task-label references) to the replacement label
   - search the target repo for removed task labels; if non-.vscode consumers are found with clear semantics, update them; if semantics are unclear, retain the original task and report follow-up instead of guessing
   - if removal safety is ambiguous, keep the task and report it as follow-up instead of guessing
7. Preserve valid repo-specific non-.NET tasks (for example npm/playwright/azurite tasks) unless they conflict with baseline conventions.
8. Keep pathing stable and `${workspaceFolder}`-relative.
9. Validate each updated file against the compliance checklist in `.github-copilot/.github/instructions/standards.vscode-dotnet-tasks.instructions.md` before finishing.
10. Return a concise summary of:
   - files changed
   - project type classification
   - baseline compliance status
   - superseded/duplicate .NET tasks removed
   - external task-label consumers rewired (or task retained when ambiguous)
   - uncertain integration-detection cases retained safely (with reason)
   - ambiguous tasks intentionally retained (with reason)
   - repo-specific tasks kept intentionally
   - files skipped as not applicable (with reason)
