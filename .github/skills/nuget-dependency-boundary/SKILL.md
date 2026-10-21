---
name: nuget-dependency-boundary
description: Use only when work is blocked by an unpublished NuGet package version owned by another repository and owner/consumer delivery must be phased.
---
# NuGet Dependency Boundary

Use this skill only after identifying that a consumer cannot be completed until another repository publishes a new NuGet package version. Ordinary package upgrades and work contained within one repository do not need this procedure.

## Procedure

1. Identify the package ID, owning repository, required contract or behavior change, and every known consumer repository.
2. Complete and validate the package change in the owning repository as phase 1.
3. Stop at the publication boundary. Do not claim downstream completion while the required version is unpublished.
4. Hand off the dependency gate concisely:

```text
NuGet dependency gate reached.
Package: <package ID>
Required version: <version or TBD>
Owner: <owner repository>
Consumers: <consumer repositories>
Status: Owner change ready; consumer work waits for publication.
```

5. Resume phase 2 only after the package version is published or Fraser explicitly approves another boundary decision. Update each consumer to the published version and validate the affected behavior there.

## Boundary rules

- Do not copy contracts, constants, or DTOs into consumers as a temporary bridge.
- Do not add cross-repository project references.
- Do not replace the typed package contract with ad hoc HTTP or another temporary integration.
- Use one of those alternatives only when Fraser explicitly approves it for the current task.
- Reuse the universal personal working preferences for Git, validation, and blocker reporting; do not duplicate them here.
