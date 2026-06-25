---
description: "Use when Shared conventions for any .NET library in this org that publishes one or more NuGet packages."
applyTo: '**/src/**/*.cs,**/version.json,**/*.csproj,**/Directory.Build.props,**/Directory.Packages.props'
---

# .NET NuGet Library Conventions

These conventions apply to every repository in the org that publishes one or more NuGet packages. Repository-specific guidance (and patterns for typed API clients built on `MX.Api.Client`) lives elsewhere — see [`.github-copilot/.github/instructions/dotnet-api-client-libraries.instructions.md`](./dotnet-api-client-libraries.instructions.md) for the API-client-specific layer.

> Some solutions in the org mix library projects with applications (Function Apps, web apps, Windows Forms hosts). The rules below apply only to projects that produce a NuGet package — in this org, identified by one or more of: `<GeneratePackageOnBuild>true</GeneratePackageOnBuild>`, `<IsPackable>true</IsPackable>`, or the presence of `.github/workflows/release-publish-nuget.yml`. Application/host projects (which set `<IsPackable>false</IsPackable>` and have no NuGet publish workflow) are not subject to multi-targeting, packaging, or release-flow rules.

## Multi-Targeting

- Libraries multi-target `net9.0;net10.0` to support both LTS and current consumers.
- Exception: libraries tightly coupled to a single runtime (e.g. an Azure Functions processor's contract package that ships alongside its host) may target a single TFM. Document the exception in the repo's own `copilot-instructions.md`.
- When adding dependencies, consider conditional references (e.g. ASP.NET test packages) to keep both TFMs buildable.

## Packaging

- Set `<GeneratePackageOnBuild>true</GeneratePackageOnBuild>` so packages are produced on every build.
- Set `<PackageId>` explicitly (do not rely on assembly name).
- Include a `<PackageReadmeFile>README.md</PackageReadmeFile>` and pack the README via the project file.
- Set `<IsPackable>false</IsPackable>` on test projects, sample apps, and any non-distributable project.
- Keep version numbers aligned across packages that ship from the same repository.

## Directory.Build.props profile for NuGet libraries

For NuGet-publishing repositories, keep the org warning/style baseline in root `Directory.Build.props` (from `standards.dotnet-project.instructions.md`) and typically include packaging-friendly defaults like:

```xml
<PropertyGroup>
	<GenerateDocumentationFile>true</GenerateDocumentationFile>

	<!-- SourceLink / symbols -->
	<IncludeSymbols>true</IncludeSymbols>
	<SymbolPackageFormat>snupkg</SymbolPackageFormat>
	<PublishRepositoryUrl>true</PublishRepositoryUrl>
	<EmbedUntrackedSources>true</EmbedUntrackedSources>
</PropertyGroup>

<ItemGroup>
	<PackageReference Include="Nerdbank.GitVersioning" Version="3.9" PrivateAssets="all" />
</ItemGroup>
```

- Keep package metadata fields (`Authors`, `Company`, `PackageLicenseExpression`, etc.) repo-specific.
- If a repo centralizes NBGV elsewhere, do not duplicate it.
- Prefer this profile in NuGet library repos to reduce rollout drift across package publishing, symbols, and source indexing.

## Versioning & Release

- Versioning is driven by Nerdbank.GitVersioning (`version.json` at the repo root).
- Release flow: `release-version-and-tag.yml` creates a tag, then `release-publish-nuget.yml` publishes to NuGet.org and creates a GitHub Release.
- Other standard workflows: `build-and-test.yml`, `pr-verify.yml`, `codequality.yml` (SonarCloud + CodeQL), `dependabot-automerge.yml`, `copilot-setup-steps.yml`.

## GitHub NuGet Integration

- Workflow names are canonical and must be exact:
	- `Release - Version and Tag`
	- `Release - Publish NuGet`
- Canonical workflow implementation details (environment name, secret name, permissions, and publish action pin) are defined in `workflows.release-publish-nuget.instructions.md`.
- Canonical README presentation details (release badges and `## NuGet Packages` section) are defined in `metadata.readme.instructions.md`.
- Keep those two layers aligned when evolving NuGet release behavior.

## Visibility & Internals

- Use `[InternalsVisibleTo]` (declared in the `.csproj` via `<ItemGroup><InternalsVisibleTo Include="..." /></ItemGroup>`) to grant access to test, testing-helper, and adjacent client projects when an internal surface exists.
- DTOs and models that round-trip through serialization may use internal setters; expose them via `InternalsVisibleTo` to test projects.

## Testing

- Unit tests use **xUnit**. **Moq** is used where mocking is needed; some repos add coverlet for coverage.
- Integration tests live in dedicated `*.IntegrationTests` projects and require external services or auth — filter them out by default.

```bash
dotnet build src/{SolutionName}.sln
dotnet test  src/{SolutionName}.sln --filter "FullyQualifiedName!~IntegrationTests"
```

## Conventions

- One project per cohesive concern; keep the public surface intentional.
- Prefer composition over inheritance for shareable behaviour.
- Set `<Nullable>enable</Nullable>` and resolve nullable warnings rather than suppressing.
- Apply XML doc comments on public APIs; surface them in the package via `<GenerateDocumentationFile>true</GenerateDocumentationFile>`.
- Pin major.minor for NuGet `<PackageReference>` entries; let Dependabot handle patch upgrades.
