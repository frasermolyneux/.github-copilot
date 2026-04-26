---
description: API versioning pattern — namespaced controllers, APIM segment versioning, runtime OpenAPI.
applyTo: '**/Controllers/**/*.cs,**/openapi.yaml,**/openapi.json'
---
# Pattern — Versioned APIs

HTTP APIs use **segment-based versioning** at the URL path (`/v1/...`, `/v1.1/...`), surfaced in code via namespaced controllers and reflected in APIM.

## Code shape

Controllers live in a version-namespaced folder and namespace:

```
src/MyApi/
├── Controllers/
│   ├── V1/
│   │   ├── PlayersController.cs   // namespace MyApi.Controllers.V1
│   │   └── ServersController.cs
│   └── V1_1/
│       └── PlayersController.cs   // namespace MyApi.Controllers.V1_1
```

- `V1` → routed at `/v1/...`
- `V1_1` → routed at `/v1.1/...` (underscore in C# namespace, dot in the URL)

Each controller declares `[Route("v1/[controller]")]` (or equivalent) explicitly — do not rely on assembly-wide route conventions for version segmentation.

## OpenAPI surface

Each version exposes its own OpenAPI document at runtime:

- `/swagger/v1/openapi.json`
- `/swagger/v1.1/openapi.json`

Generated using the OpenAPI tooling appropriate to the framework (Swashbuckle for ASP.NET Core; Microsoft.OpenApi for .NET 9+ minimal APIs). The specs are served at runtime, not committed to source.

## APIM mirror

Each runtime API version is imported into APIM as a separate API revision under a shared **API Version Set**. Imports happen in the deploy workflow via the `apim-api-import` composite (see `shared.actions.instructions.md`):

- One `apim-api-import` step per version, with matching `api-version` and `api-version-set-id`.
- The composite waits for the deployed app's `/info` endpoint to report the expected `buildVersion` before importing — preventing imports of OpenAPI specs from the previous deployment.

## Adding a new version

1. Create `Controllers/V<n>_<m>/` namespace with the new controllers.
2. Update routing.
3. Update the runtime OpenAPI registration to expose `/swagger/v<n>.<m>/openapi.json`.
4. Add a new `apim-api-import` step in the deploy workflow with the new `api-version`.
5. Cut a new `Abstractions.V<n>_<m>` / `Client.V<n>_<m>` NuGet package pair (see `patterns.api-client`).

## Backwards compatibility

- A new minor version (`V1_1`) coexists with `V1` — keep `V1` working until consumers migrate.
- Breaking changes require a new major (`V2`).
- Removing an old version requires consumer-side coordination; track usage via APIM analytics first.

## Cross-references

- `patterns.api-client.instructions.md` — consumer side
- `shared.actions.instructions.md` — `apim-api-import` and `wait-for-version` composites
