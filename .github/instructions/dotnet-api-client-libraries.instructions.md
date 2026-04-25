---
description: Conventions for typed .NET API client libraries built on the MX.Api.Client / MX.Api.Abstractions framework.
applyTo: '**/src/**/*Api.Client*/**/*.cs,**/src/**/*Api.Abstractions*/**/*.cs,**/src/**/*Api.Client.Testing*/**/*.cs'
---

# .NET API Client Library Conventions

These conventions apply to repositories that publish a typed REST API client built on the `MX.Api.Client` / `MX.Api.Abstractions` framework (e.g. `invision-api-client`, `geo-location`, `platform-notifications`, `portal-repository`, `portal-servers-integration`). The framework itself is `api-client-abstractions`.

> Universal NuGet/library conventions (multi-targeting, packaging, versioning, CI/CD) are covered in [`dotnet-nuget-library.instructions.md`](./dotnet-nuget-library.instructions.md). This file layers API-client-specific patterns on top.

## Three-Package Publishing Pattern

Each API client repository publishes three NuGet packages (naming varies per repo, e.g. `MX.GeoLocation.*`, `MX.InvisionCommunity.*`, `XtremeIdiots.Portal.*`):

1. **`{Project}.Abstractions[.V1]`** — Interfaces and DTO models. DTOs typically use internal setters; `InternalsVisibleTo` grants access to client, testing, and test projects.
2. **`{Project}.Api.Client[.V1]`** — Typed HTTP client implementation extending `BaseApi<TOptions>` from `MX.Api.Client`.
3. **`{Project}.Api.Client.Testing`** — In-memory fakes, DTO factories, and `AddFake*()` DI extension for consumer test projects.

Repos with multiple API versions (e.g. `portal-repository` ships V1 and V2) publish parallel `.V1` / `.V2` Abstractions and Client packages with a single shared Testing package.

## DI Registration (Fluent Builder)

Consumers register clients via a fluent builder extension method:

```csharp
services.Add{Project}Client(opts => opts
    .WithBaseUrl("https://api.example.com")
    .WithApiKeyAuthentication("key")
    .WithEntraIdAuthentication("api://audience"));
```

- The extension wraps `AddTypedApiClient<TInterface, TImplementation>()` from `MX.Api.Client`.
- The builder persists options as singletons.
- Multiple authentication schemes can be configured and are applied per request.
- Entra ID authentication requires `IApiTokenProvider`, which is wired automatically when any `EntraIdAuthenticationOptions` are configured.

## Response Envelope Pattern

All client methods return `ApiResult<T>` (from `MX.Api.Abstractions`):

- `ApiResult<T>` wraps `HttpStatusCode` and `ApiResponse<T>` (with `Data` and `Errors` fields).
- Helpers: `IsSuccess`, `IsNotFound`.
- Methods **never throw** — client-side errors return `ApiResult` with `HttpStatusCode.InternalServerError` and an `ApiError("CLIENT_ERROR", "...")`.
- All async methods accept `CancellationToken cancellationToken = default`.
- Successful response codes considered include 200/201/204/404; others surface as failures via the envelope.

## Authentication

Authentication options under `MX.Api.Client.Configuration` are pluggable and combinable on the same request:

- `ApiKeyAuthenticationOptions`
- `EntraIdAuthenticationOptions`
- `AzureCredentialAuthenticationOptions`
- `ClientCredentialAuthenticationOptions`

Token acquisition uses `ApiTokenProvider` with credential providers under `Auth/`.

## Testing Package Conventions

The `*.Api.Client.Testing` package provides:

- **`Fake{ClientName}`** — Thread-safe in-memory fake with configurable responses, error simulation, call tracking, and reset.
- **`{Project}DtoFactory`** — Static factory methods that construct DTOs with internal setters populated.
- **`AddFake{ClientName}()`** — DI extension for consumer integration tests.

Fakes implement the same interfaces as the real client and never throw on errors — they return `ApiResult<T>` with the configured failure shape.

## Extending a Library

When adding new endpoints to a client library:

1. Add interface and DTOs under `{Project}.Abstractions/`.
2. Add implementation deriving from `BaseApi<{Project}ClientOptions>` under `{Project}.Api.Client/`.
3. Register via `AddTypedApiClient<>()` in `ServiceCollectionExtensions`.
4. Surface the new client through the aggregating `{Project}ApiClient` if applicable.
5. Add a corresponding `Fake*` and factory methods in the testing package.
6. Cover the fake and DI registration with xUnit tests in the testing package's test project.
