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
8. For legacy .NET Framework projects, do not force incompatible SDK-style settings; record explicit exceptions.
9. Validate against the baseline-related compliance checklist items in `standards.dotnet-project.instructions.md` before finishing.
10. If the target repo contains `.github/workflows/{build-and-test,pr-verify,codequality,deploy-dev,deploy-prd,release-version-and-tag,release-publish-nuget,copilot-setup-steps}.yml`, ensure each relevant workflow enforces:
    - `dotnet format <solution-or-src-path> --verify-no-changes`
    - an explicit workflow-level format check when pinned composites do not yet provide equivalent enforcement
   - if missing, add or update workflow steps to meet the gate
11. Return a concise summary of files changed (including workflow files when updated), exceptions kept, workflow format-gate status, and any follow-up needed.
