---
name: update-copilot-setup-steps-workflow
description: Align the repository's Copilot setup steps workflow with the standardized format, ensuring that it includes appropriate steps and permissions based on the project's contents.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Review the existing `.github/workflows/copilot-setup-steps.yml` file in the repository. If it does not exist, create a new one with the standardized configuration for Copilot setup steps. If it does exist, update it to match the standardized configuration, adjusting steps and permissions as needed based on the project contents.

## Copilot Setup Steps

All repositories should have a standardized copilot setup steps workflow `.github/workflows/copilot-setup-steps.yml` to ensure the coding agent can build and verify the project. 

A repository may contain multiple types of code, in which case combine the relevant templates into a single workflow, ensuring that all are aligned with the standardized practices.

### Base Workflow
```yaml
name: "Copilot Setup Steps"

on:
  workflow_dispatch:
  push:
    paths:
      - .github/workflows/copilot-setup-steps.yml
  pull_request:
    paths:
      - .github/workflows/copilot-setup-steps.yml

permissions: {}

jobs:
  # The job MUST be called `copilot-setup-steps` or it will not be picked up by Copilot.
  copilot-setup-steps:
    runs-on: ubuntu-latest

    # Set the permissions to the lowest permissions possible needed for your steps.
    # Copilot will be given its own token for its operations.
    permissions:
      # If you want to clone the repository as part of your setup steps, for example to install dependencies, you'll need the `contents: read` permission. If you don't clone the repository in your setup steps, Copilot will do this for you automatically after the steps complete.
      contents: read

    # You can define any steps you want, and they will run before the agent starts.
    # If you do not check out your code, Copilot will do this for you.
    steps:
      - name: Checkout code
        uses: actions/checkout@v6

      - name: Checkout additional repo
        uses: actions/checkout@v6
        with:
          repository: frasermolyneux/.github-copilot
          path: .github-copilot
```

**IMPORTANT:** The `path: .github-copilot` parameter on the additional repo checkout is critical — without it, the second checkout will overwrite the main repository checkout. Always preserve this `path` parameter.

### Additional Steps

Include .NET setup steps if the project contains .NET code, ensuring that the appropriate .NET versions.

```yaml
      - name: Setup .NET
        uses: actions/setup-dotnet@v5
        with:
            dotnet-version: |
              9.0.x
              10.0.x
```