---
description: "Use when Canonical pattern for the Dependabot configuration file (.github/dependabot.yml). Layered on top of workflows.scheduling.instructions.md."
applyTo: '**/.github/dependabot.yml'
---

# `.github/dependabot.yml` Pattern

Configures Dependabot to raise weekly grouped PRs per ecosystem on Sunday, matching the repo's Monday codequality slot.

## Applicability

All non-bespoke repos.

## Ecosystem selection

Include only the ecosystems present in the repo:

| Ecosystem | When to include | Directory |
|---|---|---|
| `nuget` | .NET projects | `/src` |
| `terraform` | `terraform/` folder | `/terraform` |
| `github-actions` | Any `.github/workflows/*.yml` | `/` |
| `devcontainers` | `.devcontainer/` exists | `/` |
| `npm` | `package.json` exists | `/src/<project>` (where the package lives) |

## Schedule

All ecosystems use the same weekly Sunday schedule. The `time:` must match the repo's Monday codequality slot from `docs/ops-clock.md` — see `workflows.scheduling.instructions.md`.

## Grouping

All ecosystems must include `groups.all-updates.patterns: ["*"]` to batch updates into a single PR per ecosystem.

The group key name is a strict contract: use `all-updates` exactly. Ecosystem-specific keys like `nuget`, `terraform`, or `github-actions` are non-compliant even when patterns are identical.

## Canonical config

```yaml
version: 2
updates:
  - package-ecosystem: "nuget"
    assignees: ["frasermolyneux"]
    directory: "/src"
    schedule:
      interval: "weekly"
      day: "sunday"
      time: "HH:MM"   # repo's ops-clock time
      timezone: "Etc/UTC"
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
      timezone: "Etc/UTC"
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
      timezone: "Etc/UTC"
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
      timezone: "Etc/UTC"
    groups:
      all-updates:
        patterns:
          - "*"
```

## Compliance checklist

1. `version: 2`.
2. Only ecosystems applicable to the repo are present.
3. `assignees: ["frasermolyneux"]` on every ecosystem.
4. `schedule.day: "sunday"` and `schedule.interval: "weekly"` everywhere.
5. All `time:` values match the repo's codequality Monday slot.
6. `schedule.timezone: "Etc/UTC"` is present on every ecosystem.
7. `groups.all-updates.patterns: ["*"]` present on every ecosystem.
8. Group key name is exactly `all-updates` on every ecosystem.
9. `directory:` is correct per ecosystem (see table).
