---
description: Canonical pattern for the Release - Version and Tag workflow used by NuGet-publishing repos. Layered on top of workflows.dotnet.instructions.md.
applyTo: '**/release-version-and-tag.yml'
---

# `release-version-and-tag.yml` Pattern

Calculates a SemVer/NuGet version with NBGV, runs the full build, and tags the commit when the version is a public release.

## Applicability

Only repos that publish NuGet packages. Indicators:
- `version.json` (Nerdbank.GitVersioning) at repo root.
- `<GeneratePackageOnBuild>true</GeneratePackageOnBuild>` or `<IsPackable>true</IsPackable>` in csproj files.
- `Directory.Build.props` with packaging configuration.

Always paired with `release-publish-nuget.yml`.

## Triggers

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
```

`paths:` filter ensures the workflow only fires for source changes — not infra/docs.

## Required jobs

Three jobs in sequence: `calculate-version` → `dotnet-ci` → `tag-release` (conditional).

### `calculate-version`

```yaml
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
```

This job is identical across NuGet repos — do not customise.

### `dotnet-ci`

```yaml
dotnet-ci:
  permissions:
    contents: read
  needs: calculate-version
  runs-on: ubuntu-latest
  env:
    BUILD_VERSION_OVERRIDE: ${{ needs.calculate-version.outputs.nuget_version }}
  steps:
    - uses: frasermolyneux/actions/dotnet-ci@dotnet-ci/v1.4
      with:
        dotnet-version: |
          9.0.x
          10.0.x
        src-folder: "src"
```

Adjust `dotnet-version` to match the project's TFMs. Most libraries should use the dual-version matrix.

### `tag-release`

```yaml
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

## Compliance checklist

1. Trigger includes `paths: ['src/**']` on push to main, plus `workflow_dispatch`.
2. `calculate-version` job is byte-identical to the canonical version above (other than indentation).
3. `dotnet-ci` uses `BUILD_VERSION_OVERRIDE` from `calculate-version`.
4. `dotnet-version:` matrix matches the project's TFMs.
5. `tag-release` gated on `should_tag == 'true'`, depends on both upstream jobs.
6. Top-level `permissions: {}`; per-job permissions set.
7. Composite version matches `workflows.frasermolyneux-actions.instructions.md`.
