# Phase 5 · Part 2 — Align Shared Observability Package Contracts

## 2.A — Compare implemented semantics

Build a parity matrix for `observability-appinsights` and `observability-opentelemetry`:

- configuration section names and binding;
- request/dependency threshold and success logic;
- retained status/result codes;
- health path/method exclusions;
- trace/log severity and category matching;
- audit/custom-event preservation;
- live reload;
- diagnostics and failure-open/closed behavior;
- ASP.NET Core versus Worker/Functions registration.

Differences may remain when imposed by SDK models, but document them and expose equivalent policy outcomes.

## 2.B — Lock proven defaults

- Use Phase 4 pilot evidence before changing any default threshold or exclusion.
- Keep per-app overrides configuration-driven.
- Ensure defaults retain failures, slow calls, audit events, exceptions, and availability.
- Do not add global ingestion sampling to a shared package as a substitute for class-aware filtering.
- Add XML/package README examples for safe appsettings configuration and rollback.

## 2.C — Tests

Both stacks must cover the protected-signal matrix from Phase 4 Part 2. Also test:

- category exact/prefix behavior actually used by SiteWatch;
- audit/custom-event behavior under non-empty allow-lists;
- malformed options validation;
- no sensitive payload values in filter diagnostics;
- equivalent threshold boundary behavior (`==` versus `>`);
- registration does not create duplicate exporters/processors.

## 2.D — Release gate

If code/public package behavior changes, follow NBGV and package-first release workflows. After build/test/format and package review:

```text
NuGet dependency gate reached.
Package: <changed MX.Observability package(s)>
Required version: <published version or TBD>
Owner repo: observability-appinsights and/or observability-opentelemetry
Consumer repo(s): all rollout-ledger consumers requiring the change
Status: Phase 1 complete, waiting for publish/review before Phase 2.
```

Do not mark Phase 5 complete until the published version is consumed where required or Fraser explicitly approves stopping at the boundary.

Local work-package stop: Phase 5 Part 2 ends after the shared package release is reviewed and ready to publish; Part 3 consumer alignment resumes only after the approved published version exists.

## Part 2 exit gate

- Policy outcomes are consistent and documented across both stacks.
- Protected-signal and registration tests pass.
- Required package versions are published and approved.
- Package README/consumer contracts match actual defaults and config names.