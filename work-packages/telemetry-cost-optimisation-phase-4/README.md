# Phase 4 — Reduce Successful-Fast Request & Dependency Telemetry (Executable Plan)

Implement recommendation 5 from the [specification](../telemetry-cost-optimisation-spec/README.md) across the non-SiteWatch application estate. This phase uses the existing shared filters where possible and retains failures, slow operations, audit events, exceptions, and performance evidence.

> **Prerequisite:** Phase 0 is complete. Phases 1–3 need not block a non-SiteWatch pilot, but their SiteWatch scopes must be excluded from Phase 4 measurements to prevent overlap.

## What Phase 4 delivers

- **Part 1 — estate inventory and pilot choice** ([part-1-inventory-and-pilot.md](part-1-inventory-and-pilot.md)): map every connected Application Insights role to its host/repo, filter stack/version, volume, consumers, and risk; select one pilot using explicit criteria.
- **Part 2 — shared capability and package gate** ([part-2-shared-filter-capability.md](part-2-shared-filter-capability.md)): prove the shared filters preserve protected telemetry and fill only genuine capability gaps package-first.
- **Part 3 — production pilot** ([part-3-production-pilot.md](part-3-production-pilot.md)): apply configuration to one workload, compare telemetry and operational outcomes, then approve or revise defaults.
- **Part 4 — estate rollout** ([part-4-estate-rollout.md](part-4-estate-rollout.md)): adopt in small risk-based batches with a per-host exception register.

## Starting scope

The investigation found ten workspace-based Application Insights components across four accessible subscriptions. Known component ownership includes SiteWatch, portal-core/shared portal telemetry, demo-manager, CraftPledge, geo-location, platform-notifications, TalkWithTiles, and platform-status workloads. This is an orientation list only: Part 1 must map actual current `AppRoleName` values to processes and repos because a single component can receive multiple hosts.

## Locked decisions

- Source-side successful-fast filtering is preferred over blanket ingestion sampling.
- The shared libraries' 1,000 ms defaults are a pilot starting point. Each host uses measured latency/SLO evidence and may override.
- HTTP 4xx/5xx, dependency errors, retained transient/limit result codes, exceptions, and slow calls are retained at 100% by filter logic.
- Health endpoint successes may be filtered; failures remain through request/exception/resource-health signals.
- Audit/custom events are out of the reduction target and must survive any shared package/config change.
- One production pilot passes before estate rollout.

## Definition of done

- Every current role is mapped to an owning executable/repo, destination component, telemetry stack/version, and policy state.
- The pilot proves measured reduction without an unexplained change to protected signals or latency diagnosis.
- Each connected host adopts the shared policy or has an owner-approved, time-bounded exception.
- No shared package consumer crosses an unpublished NuGet boundary.
- Complete-day evidence and rollback exist per batch.
- Build/tests/format, relevant Terraform checks, and `code-review` pass in every touched repo.

## Next

[Phase 5](../telemetry-cost-optimisation-phase-5/README.md) turns the proven behavior into the org standard and closes remaining drift.