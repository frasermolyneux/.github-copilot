---
description: Canonical pattern for the Release - Publish NuGet workflow that runs after Release - Version and Tag completes successfully. Layered on top of workflows.dotnet.instructions.md.
applyTo: '**/release-publish-nuget.yml'
---

# `release-publish-nuget.yml` Pattern

Runs after `Release - Version and Tag` completes successfully. Detects whether HEAD has a release tag, publishes packages to NuGet.org, and creates the GitHub release.

## Applicability

Only repos that publish NuGet packages — must always be paired with `release-version-and-tag.yml`. If one exists without the other, flag it.

## Canonical workflow

```yaml
name: Release - Publish NuGet

on:
  workflow_run:
    workflows:
      - Release - Version and Tag
    types:
      - completed

permissions: {}

jobs:
  publish-nuget-packages:
    permissions:
      contents: write
      actions: read
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    environment: NuGet
    runs-on: ubuntu-latest
    env:
      HAS_RELEASE_TAG: 'false'
      RELEASE_TAG: ''

    steps:
      - name: Checkout tagged commit
        uses: actions/checkout@v6
        with:
          ref: ${{ github.event.workflow_run.head_sha }}

      - name: Detect release tag on commit
        shell: pwsh
        run: |
          git fetch --tags --force
          $tags = git tag --points-at HEAD | Where-Object { $_ -like 'v*' }
          if (-not $tags) {
            Write-Host "No release-tag (v*) found on commit ${{ github.event.workflow_run.head_sha }}. Skipping publish."
            exit 0
          }

          $selected = ($tags | Sort-Object | Select-Object -First 1).Trim()
          Write-Host "Found release tag '$selected'. Preparing publish."
          "HAS_RELEASE_TAG=true" | Out-File -FilePath $Env:GITHUB_ENV -Encoding utf8 -Append
          "RELEASE_TAG=$selected" | Out-File -FilePath $Env:GITHUB_ENV -Encoding utf8 -Append

      - name: Publish to NuGet.org
        if: env.HAS_RELEASE_TAG == 'true'
        uses: frasermolyneux/actions/publish-nuget-packages@publish-nuget-packages/v2.0
        with:
          artifact-name: nuget-packages
          artifact-run-id: ${{ github.event.workflow_run.id }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          artifact-output-path: nuget-packages
        env:
          NUGET_API_KEY: ${{ secrets.NUGET_API_KEY }}

      - name: Create GitHub release
        if: env.HAS_RELEASE_TAG == 'true'
        uses: ncipollo/release-action@v1
        with:
          tag: ${{ env.RELEASE_TAG }}
          name: ${{ env.RELEASE_TAG }}
          generateReleaseNotes: true
          skipIfReleaseExists: true
          artifacts: nuget-packages/**/*.nupkg
          artifactErrorsFailBuild: false
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Notes

- Identical across all NuGet-publishing repos.
- The `NuGet` GitHub environment must be configured with the `NUGET_API_KEY` secret. The environment is the gate that prevents accidental publishes.
- `actions: read` permission is required to download the artifact from the upstream `Release - Version and Tag` run.

## Compliance checklist

1. Trigger is `workflow_run` watching the `Release - Version and Tag` workflow with `types: [completed]`.
2. Job guard `if: ${{ github.event.workflow_run.conclusion == 'success' }}` is present.
3. Job environment is `NuGet`.
4. `HAS_RELEASE_TAG` / `RELEASE_TAG` env block initialises both to safe defaults.
5. Checkout uses `ref: ${{ github.event.workflow_run.head_sha }}`.
6. Tag-detection step is byte-identical to canonical (no project customisation).
7. Publish and release-creation steps gated on `env.HAS_RELEASE_TAG == 'true'`.
8. Composite version `publish-nuget-packages/v2.0` matches `workflows.frasermolyneux-actions.instructions.md`.
9. Permissions: `contents: write`, `actions: read`.
