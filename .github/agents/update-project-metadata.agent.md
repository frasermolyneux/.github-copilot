---
name: update-project-metadata
description: This agent will update a repositories metadata e.g. README.md, CONTRIBUTING.md, SECURITY.md and Copilot instructions file.
---
Before running any prompt, identify the target repository folder within the workspace (the prompts live in `.github-copilot`, but the repo to update might be a different workspace folder). Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Execute the following prompts against the repository files in the chosen target folder to update the project metadata in order:

1. **README.md**: .github-copilot/.github/prompts/update-readme.prompt.md
2. **CONTRIBUTING.md**: .github-copilot/.github/prompts/update-contributing.prompt.md
3. **SECURITY.md**: .github-copilot/.github/prompts/update-security.prompt.md
4. **.github/copilot-instructions.md**: .github-copilot/.github/prompts/update-copilot-instructions.prompt.md

## Checklist

After updating all project metadata files, ensure the following checklist items are addressed:

* The README.md has been updated in line with the latest project features and instructions.
* The CONTRIBUTING.md reflects the current contribution guidelines and project status.
* The SECURITY.md includes the latest security policies and reporting procedures.
* The .github/copilot-instructions.md provides accurate and helpful instructions for using GitHub Copilot
* There should be a docs/ folder in the root of the target repository with any additional documentation files. If it does not exist, create it and add/move any relevant documentation files there.
