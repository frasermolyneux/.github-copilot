---
description: Canonical structure and content rules for a repository's README.md.
applyTo: 'README.md'
---
# README.md — Structure and Content

When creating or updating `README.md` in a target repository, follow the structure below. Apply the universal rules in `metadata.instructions.md` first (workspace targeting, editing principles, personal-project framing).

## Structure

```markdown
# [The Project Name]

[Status badges block — one badge per workflow file in `.github/workflows/`. Use the format below, replacing `workload-name` with the target repository name.]

## Documentation

[Bullet list of links to top-level documentation files within the `docs/` folder.]

## Overview

[Brief description of the project (3–4 sentences max): purpose, main functionality, key technologies/frameworks, related repositories if any.]

## Contributing

Please read the [contributing](CONTRIBUTING.md) guidance; this is a learning and development project.

## Security

Please read the [security](SECURITY.md) guidance; I am always open to security feedback through email or opening an issue.
```

## Badges block

Generate **one badge per workflow YAML file** in the target repo's `.github/workflows/` directory (read the directory at update time — do not assume a fixed set). Each badge uses the format:

```markdown
[![<Display Name>](https://github.com/frasermolyneux/<workload-name>/actions/workflows/<workflow-file-with-extension>/badge.svg)](https://github.com/frasermolyneux/<workload-name>/actions/workflows/<workflow-file-with-extension>)
```

Display name must match the workflow's `name:` value exactly (including punctuation and spacing). Do not derive or simplify names.

List badges in a deterministic order: sort by workflow filename ascending. Place badges on consecutive lines under the H1, with no blank lines between them.

For repos that publish NuGet packages:

- Include both release badges when workflows exist: `Release - Version and Tag` and `Release - Publish NuGet`.
- Use the same hyphenated display-name style as the workflow names (for example, `Release - Publish NuGet`, not `Release Publish NuGet`).

## NuGet repo detector

Treat a repository as NuGet-publishing when any of the following are true:

- At least one project has `<GeneratePackageOnBuild>true</GeneratePackageOnBuild>`.
- At least one project has `<IsPackable>true</IsPackable>`.
- `.github/workflows/release-publish-nuget.yml` exists.

## NuGet packages section (conditional)

If the target repo matches the NuGet repo detector above, include a `## NuGet Packages` section after `## Overview`.

- Single-package repos: include one row for that package.
- Multi-package repos: include one row per published package.
- Use this table shape:

```markdown
## NuGet Packages

| Package | Latest | Description |
|---|---|---|
| [`Example.Package`](https://www.nuget.org/packages/Example.Package) | [![NuGet](https://img.shields.io/nuget/v/Example.Package.svg)](https://www.nuget.org/packages/Example.Package/) | Short purpose statement |
```

Do not use standalone top-level NuGet version shields for NuGet-publishing repos; keep package-version visibility in the `## NuGet Packages` table.

## Documentation section

List the top-level files in `docs/` as bullet points with relative links and a short dash-separated description, for example:

```markdown
* [Development Workflows](/docs/development-workflows.md) - Branch strategy, CI/CD triggers, and development flows
* [Architecture Overview](/docs/architecture-overview.md) - High-level architecture diagrams and explanations of major components
```

If `docs/` has no top-level files yet, keep the `## Documentation` heading and add a short placeholder note. Do not remove the section.

## Contributing and Security sections

These two sections are **verbatim** as shown in the structure above. Do not customise wording or add extra content.

## What not to include

- Build/test command snippets (those belong in `docs/` or `.github/copilot-instructions.md`).
- Detailed architecture descriptions (link to `docs/` instead).
- Contributor lists, changelogs, or roadmaps.
- Marketing language, screenshots, or feature lists beyond the 3–4 sentence Overview.
