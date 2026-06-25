---
description: "Use when standardizing VS Code .NET task definitions across repositories."
applyTo: '**/.vscode/tasks.json'
---
# Standard - VS Code .NET Tasks

## Objective

Provide a simple and consistent `.vscode/tasks.json` baseline for .NET repositories so build, test, and format checks behave the same way across repos.

## File applicability

Apply this baseline to a `tasks.json` file only when at least one of these is true:

- the file already contains at least one `dotnet:` task label, or
- the file sits in a folder tree with a nearby .NET entrypoint (`*.sln`, `*.slnx`, `*.csproj`).

Do not apply this baseline to tooling-only files (for example npm/ruby/docs-only task files with no .NET entrypoint) unless explicitly requested.

## Mandatory baseline tasks

Every .NET-focused `tasks.json` should include these labels:

- `dotnet: clean`
- `dotnet: build`
- `dotnet: test`
- `dotnet: format`

The `dotnet: format` task must run:

```bash
dotnet format <solution-or-src-path> --verify-no-changes
```

## Command and label conventions

- Prefer `type: "process"` for `dotnet` commands.
- Use `dotnet` as the command and place arguments in `args`.
- Use a `dotnet:` prefix for labels.
- Keep command shape consistent across repos.
- Use `${workspaceFolder}`-relative paths.

## Superseded and duplicate task pruning

After aligning to the baseline, remove legacy or duplicate .NET tasks that are superseded by canonical labels.

### Required pruning outcomes

- Exactly one canonical task per mandatory baseline label remains:
  - `dotnet: clean`
  - `dotnet: build`
  - `dotnet: test`
  - `dotnet: format`
- Additional intent-equivalent tasks are allowed only when intentionally distinct and should use non-canonical labels so the canonical baseline remains unambiguous.
- Do not delete intentionally distinct tasks solely to satisfy canonical-label uniqueness. Prefer relabeling distinct extras to non-canonical labels; if relabeling would be risky, retain and report follow-up.
- When integration tests are present, keep at least one valid integration-test task. Prefer a canonical `dotnet: test-integration` when a single general integration scope exists; in multi-scope repos, keep intentional integration variants and do not force consolidation.
- For optional extensions (web/function), keep canonical labels when applicable. `dotnet: run-web` and `dotnet: watch-web` may coexist when both are intentional developer flows.

### What counts as superseded

A task is superseded when all are true:

- it uses `dotnet` and represents the same intent as a canonical baseline/extension task (for example clean/build/test/format/publish/run), and
- it is legacy-labeled or duplicate-labeled (for example `build`, `dotnet build`, `dotnet: build solution`), and
- it does not provide distinct behavior beyond the canonical task (different solution path chosen intentionally, extra meaningful flags, different execution mode, different group/default semantics, distinct problem matchers, or orchestration-only behavior).

### Safe removal guardrails

- Before removing a superseded task, rewrite `dependsOn` references to the canonical replacement label.
- After rewiring, validate task-graph integrity:
  - every `dependsOn` target exists
  - `dependsOrder` behavior is preserved when present
  - duplicate dependency edges introduced by rewiring are cleaned up
  - no dependency cycles are introduced
- Validate external task-label consumers before removal:
  - `.vscode/launch.json` `preLaunchTask` references are updated to the replacement label, or the original task is retained
  - other known label consumers in `.vscode/*.json` are updated when they reference removed labels
  - if removed labels are referenced elsewhere in the repo and consumer semantics are clear, update those references to the replacement label
  - if consumer semantics are not clear, retain the original task and report follow-up instead of guessing
- Preserve repo-specific non-.NET tasks and distinct-purpose .NET tasks (for example restore, pack, EF/migration, tool bootstrap, custom publish variants).
- If distinctness or dependency impact is ambiguous, keep the task and report it as follow-up instead of guessing.

## Path selection rules

Pick the target path for `dotnet` commands in this order:

1. A single solution file at `src/*.sln` or `src/*.slnx`.
2. A single solution file at repo root.
3. `src` folder (when solutions are absent but projects are under `src`).
4. A specific app project path only when the repo is intentionally single-app and has no useful solution entrypoint.

If multiple candidate solutions exist and no obvious default exists, keep existing path choices or ask the user.

## Test task conventions

- Default `dotnet: test` should exclude integration tests:

```bash
dotnet test <path> --filter FullyQualifiedName!~IntegrationTests
```

- Add `dotnet: test-integration` only when integration tests exist and there is not already an intentional multi-scope integration task set that should remain separate.
- Integration-test detection must be fail-safe: when signals are mixed or uncertain, preserve existing integration-test tasks and report ambiguity instead of pruning.

Integration-test presence can be detected by any of:

- project/folder naming containing `IntegrationTests`
- existing test filters using `FullyQualifiedName~IntegrationTests`
- trait/category-style integration markers (for example Category Integration)

```bash
dotnet test <path> --filter FullyQualifiedName~IntegrationTests
```

## Project-type extensions

### Library-focused repos

Required baseline tasks only (`clean`, `build`, `test`, `format`).

### Web app repos

Add:

- `dotnet: run-web` (or `dotnet: watch-web` where watch is the normal dev flow)
- `dotnet: publish`

If CSS scripts exist in `package.json` (for example `build:css`, `watch:css`), include matching npm tasks but do not rename script names.

### Function app repos

Add:

- `dotnet: publish`
- `func: host start` (when Azure Functions Core Tools are used in the repo)

Keep `dotnet: clean`, `dotnet: build`, `dotnet: test`, and `dotnet: format` present.

## Minimal baseline example

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dotnet: clean",
      "type": "process",
      "command": "dotnet",
      "args": ["clean", "${workspaceFolder}/src/MySolution.sln"]
    },
    {
      "label": "dotnet: build",
      "type": "process",
      "command": "dotnet",
      "args": ["build", "${workspaceFolder}/src/MySolution.sln"]
    },
    {
      "label": "dotnet: test",
      "type": "process",
      "command": "dotnet",
      "args": ["test", "${workspaceFolder}/src/MySolution.sln", "--filter", "FullyQualifiedName!~IntegrationTests"],
      "group": { "kind": "test", "isDefault": true }
    },
    {
      "label": "dotnet: format",
      "type": "process",
      "command": "dotnet",
      "args": ["format", "${workspaceFolder}/src/MySolution.sln", "--verify-no-changes"]
    }
  ]
}
```

## Compliance checklist

- Mandatory baseline labels exist (`clean`, `build`, `test`, `format`).
- `dotnet: format` uses `--verify-no-changes`.
- Default test excludes integration tests.
- Integration-test tasks are present when needed; extra integration variants are retained when intentionally distinct or when detection is uncertain.
- Label and command style is consistent with this standard.
- Paths are `${workspaceFolder}`-relative and stable.
- Superseded legacy/duplicate .NET tasks have been removed or explicitly reported when ambiguous.
- Dependency rewiring (when pruning occurred) preserves valid task-graph behavior.
- External label consumers (for example `preLaunchTask`) are rewired or protected from breakage.
- Integration-task pruning is conservative when detection is uncertain.
