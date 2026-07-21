# Phase 5 — Codify & Enforce the Estate Telemetry Policy (Executable Plan)

Implement recommendation 6 from the [specification](../telemetry-cost-optimisation-spec/README.md): turn the proven SiteWatch and application pilots into durable org standards, shared package guidance, templates, and alignment checks.

> **Prerequisite:** Phases 1–4 have measured outcomes. Do not encode unproven thresholds or speculative savings as mandatory defaults.

## What Phase 5 delivers

- **Part 1 — org standard and agent guidance** ([part-1-org-standard-and-guidance.md](part-1-org-standard-and-guidance.md)): add a scoped telemetry standard and update the central catalogs, consumer contracts, metadata generation, and code-review checks.
- **Part 2 — shared package contract** ([part-2-shared-package-contract.md](part-2-shared-package-contract.md)): align package semantics/docs/tests and publish any necessary additive changes package-first.
- **Part 3 — final estate alignment and governance** ([part-3-alignment-and-governance.md](part-3-alignment-and-governance.md)): align remaining repos, register exceptions, and establish a low-overhead recurring cost/signal review.

## Locked policy outcome

- 100% retention through the application pipeline for audit/security events, exceptions, failures, retained error/status codes, slow operations, and structured availability.
- Source-side suppression of routine successful framework logs.
- Successful-fast request/dependency filtering using measured, configurable thresholds.
- Canonical metrics only when a named operational consumer exists.
- Three SiteWatch regions at a configurable 60-second production cadence.
- No expanded URLs/query strings, secrets, or response bodies in telemetry.
- Cost reviewed together with alert and troubleshooting usefulness, never in isolation.

## Definition of done

- Org guidance and code-review rules describe the implemented policy consistently.
- Shared package docs/configuration names and protected-signal behavior are consistent across classic AI and OpenTelemetry stacks.
- All current connected roles are aligned or have an owner-approved exception/review date.
- A repeatable aggregate-only review reports ingestion by table/role/class and validates protected-signal presence.
- No new always-on telemetry is introduced merely to measure telemetry reduction.
- All changed repos pass required validation and `code-review`.