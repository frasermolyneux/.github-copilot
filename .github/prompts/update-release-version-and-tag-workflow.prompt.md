---
name: update-release-version-and-tag-workflow
description: Align the repository's Release - Version and Tag GitHub Actions workflow with the standardized format. This workflow should only exist in projects that publish NuGet packages.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

## Applicability

This workflow should **only** exist in repositories that publish NuGet packages. Check for indicators such as:
- `version.json` (Nerdbank.GitVersioning) in the repository root
- `<GeneratePackageOnBuild>true</GeneratePackageOnBuild>` or `<IsPackable>true</IsPackable>` in `.csproj` files
- Existing NuGet package references or `Directory.Build.props` with packaging configuration

If the repository does not publish NuGet packages, do **not** create this workflow. If it already exists and shouldn't, flag it for the user.

## Release - Version and Tag

Review the existing `.github/workflows/release-version-and-tag.yml` file in the repository. If it does not exist and the project publishes NuGet packages, create a new one with the standardized configuration. If it does exist, update it to match the standardized configuration, adjusting the `dotnet-ci` step based on the project's dotnet version requirements.

### Standardized Workflow

The workflow has three jobs:
1. **calculate-version** — Uses NBGV to determine the SemVer/NuGet version and whether a new tag is needed.
2. **dotnet-ci** — Builds and tests the solution using `frasermolyneux/actions/dotnet-ci`, with `BUILD_VERSION_OVERRIDE` set to the calculated NuGet version.
3. **tag-release** — Creates and pushes a git tag if `should_tag` is true.

```yaml
name: Release - Version and Tag

on:
  workflow_dispatch:
  push:
    branches:
      - main
    paths:
      - 'src/**'

permissions: {}

jobs:
  calculate-version:
    permissions:
      contents: read
    runs-on: ubuntu-latest
    outputs:
      semver: ${{ steps.capture_version.outputs.semver }}
      nuget_version: ${{ steps.capture_version.outputs.nuget_version }}
      tag_name: ${{ steps.release_tag.outputs.tag_name }}
      should_tag: ${{ steps.release_tag.outputs.should_tag }}

    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Install Nerdbank.GitVersioning tool
        run: |
          dotnet tool install --global nbgv
          echo "$HOME/.dotnet/tools" >> $GITHUB_PATH

      - name: Determine version
        id: capture_version
        shell: pwsh
        run: |
          $versionInfo = nbgv get-version -f json | ConvertFrom-Json
          $semVer = $versionInfo.SemVer2
          $nuGetVersion = $versionInfo.NuGetPackageVersion
          $isPublicRelease = $versionInfo.PublicRelease

          Write-Host "SemVer: $semVer"
          Write-Host "NuGet version: $nuGetVersion"
          Write-Host "Public release: $isPublicRelease"

          "semver=$semVer" | Out-File -FilePath $Env:GITHUB_OUTPUT -Encoding utf8 -Append
          "nuget_version=$nuGetVersion" | Out-File -FilePath $Env:GITHUB_OUTPUT -Encoding utf8 -Append
          "public_release=$isPublicRelease" | Out-File -FilePath $Env:GITHUB_OUTPUT -Encoding utf8 -Append

      - name: Decide tag requirement
        id: release_tag
        shell: pwsh
        env:
          SEMVER: ${{ steps.capture_version.outputs.semver }}
          PUBLIC_RELEASE: ${{ steps.capture_version.outputs.public_release }}
        run: |
          git fetch --tags --force
          if ($Env:PUBLIC_RELEASE -ne 'True' -and $Env:PUBLIC_RELEASE -ne 'true') {
            Write-Host 'Current commit is not a public release. No tag will be created.'
            "should_tag=false" | Out-File -FilePath $Env:GITHUB_OUTPUT -Encoding utf8 -Append
            "tag_name=" | Out-File -FilePath $Env:GITHUB_OUTPUT -Encoding utf8 -Append
            exit 0
          }
          $tagName = "v$Env:SEMVER"
          $existing = git tag --points-at HEAD | Where-Object { $_ -like 'v*' } | Select-Object -First 1
          if ($existing) {
            Write-Host "HEAD already tagged with $existing; skipping tag creation."
            "should_tag=false" | Out-File -FilePath $Env:GITHUB_OUTPUT -Encoding utf8 -Append
            "tag_name=$existing" | Out-File -FilePath $Env:GITHUB_OUTPUT -Encoding utf8 -Append
            exit 0
          }
          Write-Host "Next release tag: $tagName"
          "should_tag=true" | Out-File -FilePath $Env:GITHUB_OUTPUT -Encoding utf8 -Append
          "tag_name=$tagName" | Out-File -FilePath $Env:GITHUB_OUTPUT -Encoding utf8 -Append

  dotnet-ci:
    permissions:
      contents: read
    needs: calculate-version
    runs-on: ubuntu-latest
    env:
      BUILD_VERSION_OVERRIDE: ${{ needs.calculate-version.outputs.nuget_version }}

    steps:
      - uses: frasermolyneux/actions/dotnet-ci@dotnet-ci/v1.3
        with:
          dotnet-version: |
            9.0.x
            10.0.x
          src-folder: "src"

  tag-release:
    permissions:
      contents: write
    needs:
      - calculate-version
      - dotnet-ci
    if: needs.calculate-version.outputs.should_tag == 'true'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Create tag
        shell: pwsh
        run: |
          git tag ${{ needs.calculate-version.outputs.tag_name }}

      - name: Push tag
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        shell: pwsh
        run: |
          git push origin ${{ needs.calculate-version.outputs.tag_name }}
```

### Notes
- Adjust `dotnet-version` in the `dotnet-ci` step to match the project's target frameworks (e.g., `9.0.x` only, or `9.0.x` + `10.0.x`).
- The `paths` trigger filter ensures the workflow only runs when source code changes, not for infrastructure or documentation changes.
- The `calculate-version` job is identical across all NuGet-publishing repositories and should not be customized.
```
