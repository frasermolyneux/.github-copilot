# Phase 0 · Part 2 — Remediate the Failing Probe & Sensitive Logging

Assigned to a stronger agent. The investigation must identify the affected configuration without copying its secret-bearing URL into source, issues, PRs, terminal summaries, or telemetry.

## Known starting point

- One logical probe repeatedly failed in all three regions with `Invalid Task Method`.
- `ExternalHealthCheck` currently sends `GET` for every test.
- On terminal non-success it logs the expanded URI and response content, then includes the expanded URI in the thrown exception.
- Test URLs can replace `%TOKEN%` placeholders from configuration, so the expanded URI can contain credentials.

## Investigation

1. Identify the logical probe by configured `app`/`component` and a one-way hash of its sanitised host/path. Do not output query values.
2. Confirm the endpoint's intended health-check contract from its owning repo/API documentation: method, authentication placement, acceptable status codes, timeout, and safe response handling.
3. Decide whether the probe should use a different method, a purpose-built read-only health endpoint, or be removed. Do not make a mutating request merely to satisfy monitoring.
4. Establish where the exposed credential is owned (Key Vault/App Configuration/provider), its rotation procedure, and every consumer requiring coordinated update.

## Remediation requirements

- Extend `TestConfig` with an allow-listed method only if required. Default remains `GET`; permit only safe methods justified by the endpoint contract. Do not accept arbitrary method/body configuration.
- Prefer a read-only health endpoint over `POST`. If the only valid check is mutating, stop for an architecture decision.
- Replace expanded-URI logging with a sanitised logical check identifier, host/path without query, status class, duration, region, and retry attempt.
- Never log response bodies. If diagnostic classification is necessary, use a bounded allow-listed error code/header that cannot contain user or secret data.
- Exceptions must not contain expanded URLs or response bodies.
- Dispose every `HttpResponseMessage` and preserve cancellation/timeout behavior.
- Keep retry warnings and one terminal error. Avoid logging the same terminal failure both before throwing and again in the outer catch unless each event has a distinct consumer.
- Rotate the potentially exposed credential outside source control, then update its secure reference. Do not place the value in the implementation report.

## Tests

- Method default and any allow-listed alternative.
- Unsupported/mutating method rejection.
- Token replacement still works without appearing in captured logs/exceptions.
- Non-success and exception paths contain no query string, token value, response body, or expanded URI.
- Retry count/backoff, timeout, cancellation, and terminal availability failure remain correct.
- Successful execution emits one structured availability success after Part 1 is fixed.

## Exit gate

- The logical probe succeeds from all three regions using its documented read-only contract, or the owner approves its removal with alert/config cleanup.
- A controlled failure produces retry warnings, one sanitised terminal failure, and one structured availability failure.
- Secret-scanning assertions pass over captured logs and exceptions.
- Credential rotation is confirmed by the owner without disclosing the value.
- Existing unrelated probes remain healthy.
- Build, tests, `dotnet format --verify-no-changes`, Terraform format/validate/plan when configuration changes, and `code-review` pass.