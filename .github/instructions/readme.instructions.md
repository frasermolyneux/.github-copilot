---
description: These readme.md instructions provides project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes related to the readme.md file.
applyTo: 'README.md'
---
When making changes to an existing README.md file, focus on accurately reflecting the current state of the project, only make changes if required to reflect changes. Don't rewrite for the sake of it.

The README structure should include the following sections:

# [The Project Name]
[A list of status badges (e.g., build status, code quality, deployment status) of all the workflows defined in the `.github/workflows/` directory. Use the following markdown format for each badge, replacing `workload-name` with the actual repository name:]

```markdown
[![Code Quality](https://github.com/frasermolyneux/workload-name/actions/workflows/codequality.yml/badge.svg)](https://github.com/frasermolyneux/workload-name/actions/workflows/codequality.yml)
[![PR Verify](https://github.com/frasermolyneux/workload-name/actions/workflows/pr-verify.yml/badge.svg)](https://github.com/frasermolyneux/workload-name/actions/workflows/pr-verify.yml)
[![Deploy Dev](https://github.com/frasermolyneux/workload-name/actions/workflows/deploy-dev.yml/badge.svg)](https://github.com/frasermolyneux/workload-name/actions/workflows/deploy-dev.yml)
[![Deploy Prd](https://github.com/frasermolyneux/workload-name/actions/workflows/deploy-prd.yml/badge.svg)](https://github.com/frasermolyneux/workload-name/actions/workflows/deploy-prd.yml)
```

## Documentation
[A bullet point list of links to top-level documentation files within the docs/ folder. e.g.:]

```markdown
* [Development Workflows](/docs/development-workflows.md) - Branch strategy, CI/CD triggers, and development flows
* [Architecture Overview](/docs/architecture-overview.md) - High level architecture diagrams and explanations of major components
```

## Overview
[A brief description of the project, its purpose, and its main functionalities. Mention any relevant technologies or frameworks used and related repositories if applicable. No more than 3-4 sentences.]

## Contributing
[The following text verbatim:]

Please read the [contributing](CONTRIBUTING.md) guidance; this is a learning and development project.

## Security
[The following text verbatim:]

Please read the [security](SECURITY.md) guidance; I am always open to security feedback through email or opening an issue.