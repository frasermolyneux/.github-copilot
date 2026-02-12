---
name: update-dependabot-workflow
description: Align the repository's Dependabot configuration with the standardized format, ensuring that it includes appropriate package ecosystems and scheduling based on the project's contents.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Review the existing `.github/dependabot.yml` file in the repository. If it does not exist, create a new one with the standardized configuration for Dependabot to automate dependency updates. If it does exist, update it to match the standardized configuration, adjusting package ecosystems and directories as needed based on the project contents.

## Dependabot

- **nuget** package ecosystem for .NET dependencies in the `/src` directory, scheduled daily - *only* if the project contains .NET code.
- **terraform** package ecosystem for Terraform dependencies in the `/terraform` directory, scheduled daily - *only* if the project contains Terraform code.
- **github-actions** package ecosystem for GitHub Actions workflows in the root directory, scheduled daily - *only* if the project contains GitHub Actions workflows.
- **devcontainers** package ecosystem for development container configurations in the root directory, scheduled weekly - *only* if the project contains development container configurations.

If the target project does not include the relevant package ecosystems, adjust the configuration accordingly while maintaining the standardized format and scheduling practices.

```yaml
version: 2
updates:
  - package-ecosystem: "nuget"
    assignees: ["frasermolyneux"]
    directory: "/src"
    schedule:
      interval: "daily"

  - package-ecosystem: "terraform"
    assignees: ["frasermolyneux"]
    directory: "/terraform"
    schedule:
      interval: "daily"

  - package-ecosystem: "github-actions"
    assignees: ["frasermolyneux"]
    directory: "/"
    schedule:
      interval: "daily"

  - package-ecosystem: "devcontainers"
    assignees: ["frasermolyneux"]
    directory: "/"
    schedule:
      interval: "weekly"
```
