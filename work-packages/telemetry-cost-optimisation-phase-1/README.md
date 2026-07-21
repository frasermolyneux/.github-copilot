# Phase 1 — Suppress Routine SiteWatch HTTP Traces (Executable Plan)

Implement recommendation 1 from the [specification](../telemetry-cost-optimisation-spec/README.md): stop exporting successful `HttpClient` lifecycle chatter from SiteWatch while preserving structured availability and actionable failures.

> **Prerequisite:** [Phase 0](../telemetry-cost-optimisation-phase-0/README.md) is complete, including a controlled availability alert fire and recovery.

## What Phase 1 delivers

- **Part 1 — filter and tests** ([part-1-filter-and-tests.md](part-1-filter-and-tests.md)): establish the exact logger categories, apply a stable category/severity filter, and prove protected traces and dependency spans remain.
- **Part 2 — rollout and measurement** ([part-2-rollout-and-measurement.md](part-2-rollout-and-measurement.md)): deploy progressively, verify alerting and failures, and measure complete-day ingestion reduction.

```mermaid
flowchart LR
  B[Fresh post-transition baseline] --> F[Category filter + characterization tests]
  F --> D[Dev controlled success/failure]
  D --> P[Production rollout]
  P --> M{{3-day minimum / 7-day preferred comparison}}
```

## Locked implementation boundary

Start in `platform-sitewatch-func`. Filter the named client's framework logger category/prefix (for example the actual `System.Net.Http.HttpClient.SiteWatch.*` categories discovered by characterization) to `Warning` at the logging provider boundary. Do not disable `HttpClient` tracing: dependency spans are a separate performance/failure signal.

If the host cannot filter these categories before export, add the minimum stable category capability to `MX.Observability.OpenTelemetry`; this creates a package-first NuGet gate. Do not filter by the four English message strings unless category metadata is unavailable and the exception is explicitly justified.

## Definition of done

- The four routine successful lifecycle messages are absent from dev and production `AppTraces` after deployment.
- Retry warnings, terminal failures, exceptions, structured availability results, and dependency failure/latency spans remain.
- Every alert in the reconciled availability inventory retains current metric input, and a controlled non-customer dev failure still fires/resolves.
- Equal-window measurement records GB/day before/after and protected-signal counts.
- No broad `Microsoft.* = Warning` rule suppresses unrelated Function host diagnostics.
- Build, tests, format, applicable Terraform checks, and `code-review` pass.

## Next

[Phase 2](../telemetry-cost-optimisation-phase-2/README.md) removes redundant derived metric series after their consumers are mapped.