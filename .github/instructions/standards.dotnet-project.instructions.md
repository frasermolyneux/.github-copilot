---
description: "Use when .NET project file (csproj/Directory.Build.props) conventions for the frasermolyneux organization."
applyTo: '**/*.csproj,**/Directory.Build.props,**/Directory.Packages.props'
---
# Standard — .NET Project Files

## Target framework

- All new .NET projects target **.NET 9** (`<TargetFramework>net9.0</TargetFramework>`).
- Some legacy projects remain on .NET Framework 4.8 — do not upgrade those without an explicit migration ticket.

## Required project properties

Every new `.csproj` (typically inherited via `Directory.Build.props` at solution root):

```xml
<PropertyGroup>
  <TargetFramework>net9.0</TargetFramework>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
  <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  <EnableNETAnalyzers>true</EnableNETAnalyzers>
  <AnalysisLevel>latest-recommended</AnalysisLevel>
  <CodeAnalysisTreatWarningsAsErrors>true</CodeAnalysisTreatWarningsAsErrors>
  <LangVersion>latest</LangVersion>
</PropertyGroup>
```

- **`<Nullable>enable</Nullable>`** is mandatory for new projects.
- **`<ImplicitUsings>enable</ImplicitUsings>`** is mandatory.
- **`<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`** is the default — any deliberate suppression goes via `<NoWarn>` in the same group with a justification comment.
- **`<EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>`** is required for SDK-style projects so style diagnostics fail CI builds consistently.
- **`<EnableNETAnalyzers>true</EnableNETAnalyzers>`** is required for SDK-style projects to ensure analyzer rules are active in all environments.
- **`<AnalysisLevel>latest-recommended</AnalysisLevel>`** is the baseline for SDK-style projects unless a repo has a documented compatibility reason to pin a different value.
- **`<CodeAnalysisTreatWarningsAsErrors>true</CodeAnalysisTreatWarningsAsErrors>`** is included in the baseline so analyzer warnings are handled consistently with compiler warnings.

These warning/style properties apply to modern SDK-style projects. Legacy .NET Framework projects that cannot adopt the full baseline immediately should document exceptions and migrate incrementally.

## Directory.Build.props

A solution-root `Directory.Build.props` carries the shared properties above plus repo-wide assembly metadata (Company, Copyright, RepositoryUrl). Per-project `.csproj` files should be minimal — only declaring properties that genuinely differ from the inherited defaults.

For SDK-style repositories, this baseline should be declared once in root `Directory.Build.props` and inherited by all projects:

```xml
<PropertyGroup>
  <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  <EnableNETAnalyzers>true</EnableNETAnalyzers>
  <AnalysisLevel>latest-recommended</AnalysisLevel>
  <CodeAnalysisTreatWarningsAsErrors>true</CodeAnalysisTreatWarningsAsErrors>
</PropertyGroup>
```

## Versioning

Versioning is via **Nerdbank.GitVersioning** (NBGV). Every project (or folder grouping projects) has a `version.json` declaring its version stream. See `patterns.nbgv-versioning.instructions.md` for the full pattern.

Do not set `<Version>`, `<AssemblyVersion>`, or `<FileVersion>` directly in `.csproj` — NBGV computes these.

## Central package management

When using central package management, declare versions in `Directory.Packages.props` at the solution root:

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="Microsoft.Extensions.Logging" Version="9.0.0" />
    <!-- ... -->
  </ItemGroup>
</Project>
```

Per-`.csproj` references then become `<PackageReference Include="..." />` (no `Version` attribute).

## Compliance

- `<Nullable>enable</Nullable>` and `<ImplicitUsings>enable</ImplicitUsings>` set (typically via Directory.Build.props)
- `<TargetFramework>net9.0</TargetFramework>` for new projects
- SDK-style baseline warning/style settings present via root Directory.Build.props:
  - `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`
  - `<EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>`
  - `<EnableNETAnalyzers>true</EnableNETAnalyzers>`
  - `<AnalysisLevel>latest-recommended</AnalysisLevel>`
  - `<CodeAnalysisTreatWarningsAsErrors>true</CodeAnalysisTreatWarningsAsErrors>`
- No direct `<Version>` / `<AssemblyVersion>` overrides — NBGV handles these
- `dotnet build` and `dotnet test` succeed with zero warnings
