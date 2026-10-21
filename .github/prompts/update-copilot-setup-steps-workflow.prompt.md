---
name: update-copilot-setup-steps-workflow
description: Use when you need to align `.github/workflows/copilot-setup-steps.yml` with the canonical organization pattern.
argument-hint: "Target repo folder (for example: platform-registry)"
agent: agent
---

1. Resolve the target repository folder first. If it is not clear, ask the user to pick one.
2. Load and follow `.github-copilot/.github/instructions/workflows.copilot-setup-steps.instructions.md` as the source of truth.
3. Decide whether pre-agent setup is needed:
	- if not, do not create the workflow; remove an existing workflow that only performs obsolete checkout or unnecessary setup;
	- for runtime-only setup, omit `checkout-repo` and enable one or more genuinely required runtimes with exact repository-derived versions;
	- when deterministic restore needs repository files, set `checkout-repo: 'true'` and add exact lockfile-based restore commands after the shared action.
4. Use only valid `copilot-setup/v2` inputs and remove every shared-repository checkout input or step.
5. Do not migrate or dispatch the workflow until the `copilot-setup/v2` tag exists.
6. Keep setup limited to reliable prerequisites; do not add build, test, lint, format, Terraform plan, secrets, or unnecessary cloud authentication.
7. Validate against the compliance checklist in the per-workflow instructions before finishing.
8. Return a concise summary of the applicability decision, changes, restore behavior, and release prerequisite.
