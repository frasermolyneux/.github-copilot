---
description: "Use when Mandatory health endpoint and probe contract for all frasermolyneux applications and infrastructure."
applyTo: '**/Program.cs,**/Controllers/**/HealthController.cs,**/Functions/HealthCheck.cs,**/HealthCheck.cs,**/*WebAppFactory.cs,**/*InfoAndHealthTests.cs,**/*RootApiTests*.cs,**/web_app*.tf,**/function_app*.tf,**/container_app*.tf'
---
# Standards - Health Endpoints and Probes

Use this file as the source of truth for health route design, implementation, tests, and probe wiring.

## Required routes only

Expose exactly two health endpoints per app:

- Liveness endpoint: process-only check with no downstream dependencies
- Readiness endpoint: dependency-aware check using the full health pipeline

Do not expose compatibility aliases such as `/health` or `/healthz`.

## Route format by app type

- Versioned APIs: `/<version>/health/live` and `/<version>/health/ready` (for example `/v1.0/health/live`)
- ASP.NET Core web apps: `/api/health/live` and `/api/health/ready`
- Azure Functions isolated: route templates `health/live` and `health/ready` (runtime path is `/api/health/...`)
- Worker or containerized background services: `/health/live` and `/health/ready`

## Response semantics

- Liveness should return success when the process is healthy enough to keep running
- Readiness should return `200` when dependencies are ready, otherwise `503`
- Keep response payloads stable and lightweight; include detailed dependency status on readiness only

## Probe wiring

Infrastructure probes must target liveness:

- App Service or Function App `health_check_path` must point to the liveness route
- Container startup, liveness, and readiness probes should use explicit live or ready routes only
- Never point platform probes to readiness unless there is a documented exception

## Tests

- Integration tests must validate `live` and `ready` routes
- Do not keep tests for removed shim routes (`/health`, `/healthz`)
- For readiness tests, accept both `200` and `503` where dependency state can vary in test environments

## Documentation

When adding or changing health behavior:

- Update repo docs to reference only `live` and `ready`
- Keep examples and runbooks free of compatibility routes
