---
description: Canonical content rules for a repository's CODEOWNERS file.
applyTo: '.github/CODEOWNERS,CODEOWNERS,docs/CODEOWNERS'
---
# CODEOWNERS — Generation Guidelines

`CODEOWNERS` makes every PR automatically request review from a designated owner. For personal-project repos in this org, the only owner is `@frasermolyneux` — but having the file present unlocks:

- Branch-protection rules that **require** code-owner review for PRs touching protected paths.
- Automatic review-request on PRs (including those opened by the Copilot coding agent), which the org `dependabot-automerge` and PR-verify workflows can act on.

CODEOWNERS does **not** inherit from the org-level `.github` repo — it is per-repo only.

## Location

Put it at `.github/CODEOWNERS`. Don't put it at the repo root or in `docs/` even though GitHub accepts those — `.github/` is the org convention.

> The `applyTo` pattern on this instruction intentionally includes `CODEOWNERS` and `docs/CODEOWNERS` so this guidance fires when a misplaced file is encountered — relocate it to `.github/CODEOWNERS`.

## Canonical content

For all repos in this org, the default file is exactly:

```text
# CODEOWNERS — see https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
#
# Personal-project repository: @frasermolyneux owns everything by default.
# Add path-specific overrides above the catch-all if a particular area needs
# stricter review (e.g. workload-identity JSON, branch-protection-touched files).

*           @frasermolyneux
```

Use this verbatim unless the repo has a genuine need for path-specific overrides (e.g. `platform-workloads/workloads/*.json` might require a second reviewer pattern). Overrides go **above** the catch-all `*` line — GitHub matches the last matching pattern.

## Branch-protection integration

The CODEOWNERS file only enforces review when the protected branch is configured to require it. After adding/updating `CODEOWNERS`, verify (or ask the user to verify) that the `main` branch protection rule has **Require review from Code Owners** enabled. This is a one-time settings change per repo and is out of scope for this instruction set — flag it as a follow-up if not present.

## Reference

See `.github-copilot/templates/CODEOWNERS` for the canonical skeleton.

## Cross-references

- `metadata.instructions.md` — universal metadata rules
- `standards.branching-and-prs.instructions.md` — branch-protection expectations
