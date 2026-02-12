---
name: align-project-workflows
description: This agent will update a repositories workflows e.g. GitHub Actions, Dependabot and any contributing guidelines related to workflows. It will align them to the standardized templates and practices, ensuring consistency and clarity for contributors.
---
Before running any prompt, identify the target repository folder within the workspace (the prompts live in `.github-copilot`, but the repo to update might be a different workspace folder). Ask the user which folder to target or infer it from context (open file paths, workspace roots) and operate against that folder.

Execute the following prompts against the repository files in the chosen target folder to update the project workflows in order:

1. **Dependabot**: .github-copilot/.github/prompts/update-dependabot-workflow.prompt.md
2. **Automerge Workflow**: .github-copilot/.github/prompts/update-dependabot-automerge.prompt.md
3. **Build and Test Workflow**: .github-copilot/.github/prompts/update-build-and-test-workflow.prompt.md
4. **PR Verify Workflow**: .github-copilot/.github/prompts/update-pr-verify-workflow.prompt.md
5. **Deploy Dev Workflow**: .github-copilot/.github/prompts/update-deploy-dev-workflow.prompt.md
6. **Deploy Prd Workflow**: .github-copilot/.github/prompts/update-deploy-prd-workflow.prompt.md
7. **Code Quality Workflow**: .github-copilot/.github/prompts/update-codequality-workflow.prompt.md
8. **Copilot Setup Steps Workflow**: .github-copilot/.github/prompts/update-copilot-setup-steps-workflow.prompt.md
9. **Release - Version and Tag Workflow** *(NuGet projects only)*: .github-copilot/.github/prompts/update-release-version-and-tag-workflow.prompt.md
10. **Release - Publish NuGet Workflow** *(NuGet projects only)*: .github-copilot/.github/prompts/update-release-publish-nuget-workflow.prompt.md
11. **Destroy Environment Workflow** *(Terraform projects only)*: .github-copilot/.github/prompts/update-destroy-environment-workflow.prompt.md
12. **Destroy Development Workflow** *(Terraform projects only, only if explicitly requested)*: .github-copilot/.github/prompts/update-destroy-development-workflow.prompt.md
