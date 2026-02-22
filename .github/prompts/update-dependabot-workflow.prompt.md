---
name: update-dependabot-workflow
description: Align the repository's Dependabot configuration with the standardized format, ensuring that it includes appropriate package ecosystems and scheduling based on the project's contents.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Review the existing `.github/dependabot.yml` file in the repository. If it does not exist, create a new one with the standardized configuration for Dependabot to automate dependency updates. If it does exist, update it to match the standardized configuration, adjusting package ecosystems and directories as needed based on the project contents.

## Dependabot

All repositories follow a centralised scheduling standard — see `docs/ops-clock.md` in the `.github-copilot` repository. Dependabot runs weekly on **Sunday** at a time that matches the repo's Monday codequality slot (staggered every 15 minutes from 01:00 to 08:00). Consult the ops clock for the exact time.

All ecosystems must use `groups` to batch updates into a single PR per ecosystem.

- **nuget** package ecosystem for .NET dependencies in the `/src` directory — *only* if the project contains .NET code.
- **terraform** package ecosystem for Terraform dependencies in the `/terraform` directory — *only* if the project contains Terraform code.
- **github-actions** package ecosystem for GitHub Actions workflows in the root directory — *only* if the project contains GitHub Actions workflows.
- **devcontainers** package ecosystem for development container configurations in the root directory — *only* if the project contains development container configurations.

If the target project does not include the relevant package ecosystems, adjust the configuration accordingly while maintaining the standardized format and scheduling practices.

```yaml
version: 2
updates:
  - package-ecosystem: "nuget"
    assignees: ["frasermolyneux"]
    directory: "/src"
    schedule:
      interval: "weekly"
      day: "sunday"
      time: "HH:MM"  # Use this repo's ops clock time
    groups:
      all-updates:
        patterns:
          - "*"

  - package-ecosystem: "terraform"
    assignees: ["frasermolyneux"]
    directory: "/terraform"
    schedule:
      interval: "weekly"
      day: "sunday"
      time: "HH:MM"
    groups:
      all-updates:
        patterns:
          - "*"

  - package-ecosystem: "github-actions"
    assignees: ["frasermolyneux"]
    directory: "/"
    schedule:
      interval: "weekly"
      day: "sunday"
      time: "HH:MM"
    groups:
      all-updates:
        patterns:
          - "*"

  - package-ecosystem: "devcontainers"
    assignees: ["frasermolyneux"]
    directory: "/"
    schedule:
      interval: "weekly"
      day: "sunday"
      time: "HH:MM"
    groups:
      all-updates:
        patterns:
          - "*"
```
