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

- Add `dotnet: test-integration` only when integration tests exist.

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
- Integration test task is only present when needed.
- Label and command style is consistent with this standard.
- Paths are `${workspaceFolder}`-relative and stable.
