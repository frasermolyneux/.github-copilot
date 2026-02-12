---
name: update-dependabot-automerge
description: Align the repository's Dependabot automerge with the standardized format, ensuring that it includes appropriate package ecosystems and scheduling based on the project's contents.
---
Before updating the workflow, identify the target repository folder within the workspace. Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Review the existing `.github/workflows/dependabot-automerge.yml` file in the repository. If it does not exist, create a new one with the standardized configuration for Dependabot to automate dependency updates. If it does exist, update it to match the standardized configuration, adjusting package ecosystems and directories as needed based on the project contents.

## Dependabot

This workflow can be created verbatim as below.

```yaml
name: Dependabot Auto-Merge
on:
  pull_request:
    branches:
      - main

permissions: {}

jobs:
  dependabot:
    permissions:
      contents: write
      pull-requests: write
    runs-on: ubuntu-latest

    if: ${{ github.actor == 'dependabot[bot]' }}
    steps:
    - name: Dependabot metadata
      id: metadata
      uses: dependabot/fetch-metadata@v2
      with:
        github-token: "${{ secrets.GITHUB_TOKEN }}"
    - name: Enable auto-merge for Dependabot PRs
      run: gh pr merge --auto --squash "$PR_URL"
      env:
        PR_URL: ${{github.event.pull_request.html_url}}
        GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```
