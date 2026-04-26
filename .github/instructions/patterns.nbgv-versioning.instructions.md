---
description: Nerdbank.GitVersioning (NBGV) pattern — version.json placement, computed versions, release flow.
applyTo: '**/version.json,**/*.csproj,**/*.sln'
---
# Pattern — NBGV Versioning

All .NET projects (and Bicep modules in `platform-registry`) use **Nerdbank.GitVersioning** (NBGV) for deterministic version numbers derived from git history. There is no hand-edited `<Version>` anywhere in source.

## version.json placement

A `version.json` file lives at the **scope** of a versioned artefact:

- **Repo root** — single version stream for the whole repo (most common; e.g. NuGet package repos).
- **Per-project folder** — independent versioning when a repo ships multiple artefacts on different cadences (e.g. `actions/` repo has one per composite, `platform-registry` has one per Bicep module).

Each `version.json` declares:

```json
{
  "$schema": "https://raw.githubusercontent.com/dotnet/Nerdbank.GitVersioning/master/src/NerdBank.GitVersioning/version.schema.json",
  "version": "1.2",
  "publicReleaseRefSpec": [ "^refs/heads/main$" ],
  "pathFilters": [ "." ]
}
```

- **`version`** — the major.minor stream; patch comes from git height.
- **`publicReleaseRefSpec`** — branches that produce "public" (non-prerelease) versions. `main` only.
- **`pathFilters`** — when multiple `version.json` files exist in a repo, this scopes which paths affect this version's git height.

## How versions are computed

| Branch context | Version produced |
|---|---|
| `main` (publicRelease) | `<major>.<minor>.<git-height>` (e.g. `1.2.45`) |
| Feature branch | `<major>.<minor>.<git-height>-<branch>.<commit-id>` (prerelease) |
| Tag at HEAD | matches the tag |

Computation happens at build time via the NBGV MSBuild integration — `<Version>`, `<AssemblyVersion>`, `<FileVersion>`, `<InformationalVersion>` are all set automatically.

## CI integration

Workflows that need the computed version use the `nbgv-metadata` composite:

```yaml
- uses: frasermolyneux/actions/nbgv-metadata@nbgv-metadata/v1
  id: version
- run: echo "Building ${{ steps.version.outputs.build_version }}"
```

The `dotnet-ci` composite already runs NBGV internally and emits `build_version` and `semver` outputs.

## Tag and release flow

After a successful `deploy-prd` (where releases apply), the `release-version-and-tag` workflow:

1. Reads the current `build_version` from NBGV.
2. Creates a git tag `v<build_version>`.
3. Optionally publishes a GitHub Release.

For composite-action repos (`actions/`), each composite is tagged independently as `<composite-name>/v<major>.<minor>.<patch>` and additionally as a moving `<composite-name>/v<major>` tag — consumers reference the moving tag (see `workflows.frasermolyneux-actions.instructions.md` for pinned versions).

For NuGet package repos, `release-publish-nuget` then pushes the `.nupkg` artefact.

## Compliance

- Repo has at least one `version.json`.
- No `<Version>`, `<AssemblyVersion>`, or `<FileVersion>` overrides in `.csproj` files.
- `nbgv get-version` runs cleanly at the repo root or any scoped folder.
- `publicReleaseRefSpec` matches the actual prd-deploy branch (typically `main`).

## Cross-references

- `shared.actions.instructions.md` — `nbgv-metadata` composite
- `workflows.release-version-and-tag.instructions.md` — release workflow
- `workflows.release-publish-nuget.instructions.md` — NuGet publish
