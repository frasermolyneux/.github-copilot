---
name: update-dotnet-project-baseline
description: Use when you need to align .NET project baseline settings (csproj/Directory.Build.props/Directory.Packages.props) to org standards for warnings, analyzers, and style enforcement.
argument-hint: "Target repo folder (for example: portal-web)"
agent: agent
---

If this prompt is not applicable to the target repository, report the reason and stop without making changes.

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/standards.dotnet-project.instructions.md` as the source of truth.
3. Load and follow `.github-copilot/.github/instructions/workflows.dotnet.instructions.md` for workflow-level formatting gate enforcement.
4. Detect .NET scope in the target repo:
   - SDK-style projects (`*.csproj` using `Microsoft.NET.Sdk`)
   - Legacy .NET Framework projects (for documented exception handling only)
   - Root `Directory.Build.props` and `Directory.Packages.props`
5. Align the SDK-style baseline in root `Directory.Build.props` so it includes:
   - `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`
   - `<EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>`
   - `<EnableNETAnalyzers>true</EnableNETAnalyzers>`
   - `<AnalysisLevel>latest-recommended</AnalysisLevel>`
   - `<CodeAnalysisTreatWarningsAsErrors>true</CodeAnalysisTreatWarningsAsErrors>`
6. Minimize drift in individual `*.csproj` files by inheriting from root baseline unless an explicit exception is required.
7. Preserve existing repo-specific choices that do not conflict with the baseline (for example target frameworks, package references, project metadata).
8. If the target repository publishes NuGet packages (for example has `.github/workflows/release-publish-nuget.yml`, or projects with `<GeneratePackageOnBuild>true</GeneratePackageOnBuild>` / `<IsPackable>true</IsPackable>`), also align to `.github-copilot/.github/instructions/dotnet-nuget-library.instructions.md` by applying the NuGet `Directory.Build.props` profile where appropriate:
   - `<GenerateDocumentationFile>true</GenerateDocumentationFile>`
   - symbol/source defaults (`IncludeSymbols`, `SymbolPackageFormat`, `PublishRepositoryUrl`, `EmbedUntrackedSources`)
   - NBGV package reference placement when not already centrally managed
   - keep package metadata repo-specific
9. For legacy .NET Framework projects, do not force incompatible SDK-style settings; record explicit exceptions.
10. Validate against the baseline-related compliance checklist items in `standards.dotnet-project.instructions.md` before finishing.
11. If the target repo contains `.github/workflows/{build-and-test,pr-verify,codequality,deploy-dev,deploy-prd,release-version-and-tag,release-publish-nuget,copilot-setup-steps}.yml`, ensure each relevant workflow enforces:
    - `dotnet format <solution-or-src-path> --verify-no-changes`
    - when workflows pin `frasermolyneux/actions/dotnet-ci`, `dotnet-web-ci`, or `dotnet-func-ci` at v2 or later, treat the composite-integrated format gate as compliant
    - add or update an explicit workflow-level format step only when .NET commands run outside those composites, when pinned below v2, or when `skip-format-check: "true"` is intentionally set
12. Return a concise summary of files changed (including workflow files when updated), whether NuGet profile alignment was applied or not applicable, exceptions kept, workflow format-gate status, and any follow-up needed.
