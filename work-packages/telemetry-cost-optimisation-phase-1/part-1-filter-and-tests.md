# Phase 1 · Part 1 — Implement the SiteWatch HTTP Category Filter

Implementation evidence: [part-1-implementation-evidence.md](part-1-implementation-evidence.md)

## 1.A — Fresh baseline and characterization

Before editing:

1. Use at least three complete UTC days after the Phase 0 deployment.
2. Aggregate `AppTraces` by SiteWatch role, logger category, severity, and a safe message-template hash.
3. Confirm the four routine messages still map to the named `SiteWatch` client's logical/transport handler categories.
4. Record routine GB/day, row count, retry warnings, terminal failures, exceptions, dependency failures, dependency duration percentiles, and availability result count.

If category metadata is missing or unstable, stop and add a characterization test/log-export fixture before choosing a filter.

## 1.B — Configure the narrow filter

Preferred order:

1. Use Azure Functions/.NET logging configuration to set only the named SiteWatch `HttpClient` category prefix to `Warning`.
2. If configuration binding cannot express a prefix safely, configure `AddFilter` for the exact named-client categories in `Program.cs`.
3. Only if both fail, extend the shared OpenTelemetry log filter with tested prefix matching and publish it package-first.

Requirements:

- Do not change the `MX.Platform.SiteWatch.App.ExternalHealthCheck` category in this part.
- Do not remove `AddHttpClientInstrumentation()` or dependency spans.
- Do not lower retry/terminal-failure severity.
- Keep the filter config-driven where the host supports it.
- Add an orientation comment only if the distinction between framework logs and dependency spans is otherwise unclear.

## 1.C — Tests

Add characterization around the actual logging pipeline:

- Information lifecycle logs from the named `SiteWatch` handlers are rejected.
- Warning/error records from those categories are retained.
- Unrelated Function host and application categories are unchanged.
- `ExternalHealthCheck` retry warning and terminal error remain observable.
- A successful and a failed HTTP activity still reaches the tracing exporter/filter with status and duration.
- Audit-event bypass remains unaffected if shared code changes.

## 1.D — Validate

In `platform-sitewatch-func`, prefer repo VS Code tasks; fallback:

```pwsh
dotnet build src/MX.Platform.SiteWatch.sln
dotnet test src/MX.Platform.SiteWatch.sln --filter "FullyQualifiedName!~IntegrationTests"
dotnet format src/MX.Platform.SiteWatch.sln --verify-no-changes
```

Use the actual solution path found in the repo if it differs. If Terraform/app settings change:

```pwsh
terraform -chdir=terraform fmt -check -recursive
terraform -chdir=terraform init -backend-config=backends/dev.backend.hcl
terraform -chdir=terraform validate
terraform -chdir=terraform plan -var-file=tfvars/dev.tfvars
```

## Part 1 exit gate

- Narrow category filter implemented and tested.
- No shared package change is consumed before publication.
- Local protected-signal tests pass.
- Exact rollback is documented (prior logging setting/package version).