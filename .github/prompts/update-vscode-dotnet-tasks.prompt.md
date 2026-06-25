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
   - include `dotnet: test-integration` only when integration tests exist
   - add web/function extensions only when applicable
7. Preserve valid repo-specific non-.NET tasks (for example npm/playwright/azurite tasks) unless they conflict with baseline conventions.
8. Keep pathing stable and `${workspaceFolder}`-relative.
9. Validate each updated file against the compliance checklist in `.github-copilot/.github/instructions/standards.vscode-dotnet-tasks.instructions.md` before finishing.
10. Return a concise summary of:
   - files changed
   - project type classification
   - baseline compliance status
   - repo-specific tasks kept intentionally
   - files skipped as not applicable (with reason)
