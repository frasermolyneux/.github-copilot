---
name: create-workflow
description: Bootstraps a single new GitHub Actions workflow (or `.github/dependabot.yml`) in a target repository, picking the right Layer-3 canonical template based on project content. Use this when adding one workflow at a time; for full alignment of all workflows in a repo, use `align-project-workflows`.
---

Before doing anything else, identify the target repository folder within the workspace and ask the user which canonical workflow to create. Available canonical workflows (each maps to a Layer-3 instruction file):

- `build-and-test.yml`
- `pr-verify.yml`
- `codequality.yml`
- `copilot-setup-steps.yml`
- `dependabot-automerge.yml`
- `.github/dependabot.yml` (config)
- `deploy-dev.yml`
- `deploy-prd.yml`
- `destroy-environment.yml`
- `destroy-development.yml` *(only when explicitly requested)*
- `release-version-and-tag.yml` *(NuGet repos only)*
- `release-publish-nuget.yml` *(NuGet repos only)*

Bespoke workflows are out of scope — this agent will refuse to create them.

## Action

1. Confirm the target repo and the workflow to create.
2. Refuse if the file already exists — direct the user to the corresponding `update-*-workflow` prompt or `align-project-workflows` agent instead.
3. Confirm applicability:
   - NuGet release workflows require `version.json` or packable csproj evidence.
   - Terraform destroy workflows require a `terraform/` folder.
   - Deploy workflows require deployable components (Terraform + at least one app/func/static project).
4. Inspect the repo to determine project type (.NET solution / web / functions, Terraform, etc.).
5. Read the matching `workflows.<name>.instructions.md` for the canonical template.
6. Look up any cron / `time:` values in `docs/ops-clock.md` for the target repo. If the repo has no allocated slot, ask the user to allocate one (and update `docs/ops-clock.md` afterwards).
7. Create the file using the canonical template, customising only the parameters that the instructions file marks as project-specific (csproj names, Sonar keys, db project name, etc.).
8. Verify the new file against the **Compliance checklist** in its source-of-truth instructions file before reporting completion.
9. If the new workflow has dependencies on other workflows (e.g. `release-publish-nuget.yml` requires `release-version-and-tag.yml`), confirm those exist or flag as a follow-up.
