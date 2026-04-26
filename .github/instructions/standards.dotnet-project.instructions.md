---
description: .NET project file (csproj/Directory.Build.props) conventions for the frasermolyneux organization.
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
  <LangVersion>latest</LangVersion>
</PropertyGroup>
```

- **`<Nullable>enable</Nullable>`** is mandatory for new projects.
- **`<ImplicitUsings>enable</ImplicitUsings>`** is mandatory.
- **`<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`** is the default — any deliberate suppression goes via `<NoWarn>` in the same group with a justification comment.

## Directory.Build.props

A solution-root `Directory.Build.props` carries the shared properties above plus repo-wide assembly metadata (Company, Copyright, RepositoryUrl). Per-project `.csproj` files should be minimal — only declaring properties that genuinely differ from the inherited defaults.

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
- No direct `<Version>` / `<AssemblyVersion>` overrides — NBGV handles these
- `dotnet build` and `dotnet test` succeed with zero warnings
