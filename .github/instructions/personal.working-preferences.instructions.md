---
description: "Always-on concise working preferences for Fraser across repository tasks."
applyTo: '**'
---
# Personal Working Preferences (Fraser)

These preferences apply across repositories and override conflicting defaults.

## Git

- Do not commit, push, stage, create or delete branches, merge, rebase, reset, tag, stash, or otherwise mutate Git state unless explicitly requested in the current message.
- Read-only Git operations such as `status`, `diff`, `log`, `show`, and branch listing are allowed.
- Work in the current repository and assigned branch. Do not create a branch or pull request unless requested.

## Cross-repository packages

- Surface dependencies on packages owned by another repository as soon as they are identified.
- Do not bypass an unpublished package boundary with copied contracts, cross-repository project references, or ad hoc alternatives unless explicitly approved.
- When an unpublished NuGet dependency blocks progress, use the optional `nuget-dependency-boundary` skill for the detailed owner/consumer handoff.

## Validation and blockers

- Validate only the changed behavior, using commands documented by the current repository.
- Report failures, unresolved dependencies, ambiguity, and other blockers plainly.
