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
[![<Display Name>](https://github.com/frasermolyneux/<workload-name>/actions/workflows/<workflow-file>.yml/badge.svg)](https://github.com/frasermolyneux/<workload-name>/actions/workflows/<workflow-file>.yml)
```

Display name is the human-readable workflow name (typically the value of `name:` in the YAML, or a sentence-case derivation of the filename). Place badges on consecutive lines under the H1, no blank lines between them.

## Documentation section

List the top-level files in `docs/` as bullet points with relative links and a short dash-separated description, for example:

```markdown
* [Development Workflows](/docs/development-workflows.md) - Branch strategy, CI/CD triggers, and development flows
* [Architecture Overview](/docs/architecture-overview.md) - High-level architecture diagrams and explanations of major components
```

If `docs/` is empty or absent, omit the bullet list (the section heading may still be present with a short note, or omitted entirely).

## Contributing and Security sections

These two sections are **verbatim** as shown in the structure above. Do not customise wording or add extra content.

## What not to include

- Build/test command snippets (those belong in `docs/` or `.github/copilot-instructions.md`).
- Detailed architecture descriptions (link to `docs/` instead).
- Contributor lists, changelogs, or roadmaps.
- Marketing language, screenshots, or feature lists beyond the 3–4 sentence Overview.
