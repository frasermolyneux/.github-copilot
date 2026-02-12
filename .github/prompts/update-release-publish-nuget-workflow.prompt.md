---
name: update-release-publish-nuget-workflow
description: Align the repository's Release - Publish NuGet GitHub Actions workflow with the standardized format. This workflow should only exist in projects that publish NuGet packages.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

## Applicability

This workflow should **only** exist in repositories that publish NuGet packages. It is always paired with the `release-version-and-tag.yml` workflow — if one exists, the other should too.

Check for indicators such as:
- An existing `.github/workflows/release-version-and-tag.yml` workflow
- `version.json` (Nerdbank.GitVersioning) in the repository root
- `<GeneratePackageOnBuild>true</GeneratePackageOnBuild>` or `<IsPackable>true</IsPackable>` in `.csproj` files

If the repository does not publish NuGet packages, do **not** create this workflow. If it already exists and shouldn't, flag it for the user.

## Release - Publish NuGet

Review the existing `.github/workflows/release-publish-nuget.yml` file in the repository. If it does not exist and the project publishes NuGet packages, create a new one with the standardized configuration. If it does exist, update it to match the standardized configuration.

### Standardized Workflow

This workflow is triggered by the completion of the `Release - Version and Tag` workflow. It has a single job that:
1. Checks out the tagged commit.
2. Detects whether a release tag (`v*`) exists on the commit.
3. Downloads and publishes NuGet packages using `frasermolyneux/actions/publish-nuget-packages`.
4. Creates a GitHub release with release notes and attached `.nupkg` artifacts.

This workflow is identical across all NuGet-publishing repositories and should not require project-specific customization.

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
      uses: frasermolyneux/actions/publish-nuget-packages@publish-nuget-packages/v1.2
      with:
        artifact-name: nuget-packages
        artifact-run-id: ${{ github.event.workflow_run.id }}
        github-token: ${{ secrets.GITHUB_TOKEN }}
        artifact-output-path: nuget-packages
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

### Notes
- The `publish-nuget-packages` action version should be kept at the latest pinned version (currently `publish-nuget-packages/v1.2`).
- The `NuGet` environment must be configured in GitHub with the `NUGET_API_KEY` secret.
- This workflow requires no project-specific changes — it is the same across all NuGet-publishing repositories.
```
