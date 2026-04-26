---
description: Typed API client pattern (interfaces, generated clients, testing helpers, fluent DI options).
applyTo: '**/*.cs,**/*.csproj'
---
# Pattern — Typed API Client

Used by every cross-service HTTP API consumed within the org. The pattern is built on `MX.Api.Abstractions` (see `shared.api-client-abstractions.instructions.md`).

## Shape

A typed API client comes in **three NuGet packages**:

1. **`MX.<Domain>.Api.Abstractions.V<n>`** — `IXxxApiClient` interface, request/response DTOs, error types. No implementation.
2. **`MX.<Domain>.Api.Client.V<n>`** — Concrete client implementing the interface, fluent `AddXxxApiClient(options => ...)` extension, transient handlers (auth, retry).
3. **`MX.<Domain>.Api.Client.Testing`** — Fake implementation (`FakeXxxApiClient`) with `AddFakeXxxApiClient(...)` extension and a DTO factory (`XxxDtoFactory`) for building test data.

The version suffix (`V1`, `V2`) on the first two packages enables side-by-side consumption of multiple API versions.

## Result envelope

All client methods return `IApiResult<T>` (or `IApiResult` for void responses) from `MX.Api.Abstractions`:

- `IsSuccess`, `IsNotFound`, `IsConflict`, `StatusCode`
- `Result.Data` — the strongly-typed payload
- `Result.Errors` — `ApiError[]` for non-success responses
- `Result.Pagination` — when applicable

Consumers branch on `IsSuccess` / `IsNotFound` rather than throwing; only re-throw via the consumer's domain exception types.

## DI registration (production)

```csharp
services.AddXxxApiClient(opts => opts
    .WithBaseUrl(Configuration["XxxApi:BaseUrl"])
    .WithEntraIdAuthentication(Configuration["XxxApi:Resource"]));
```

Auth options:
- `.WithApiKeyAuthentication(key)` — server-to-server with shared secret (legacy; prefer Entra)
- `.WithEntraIdAuthentication(resource)` — managed identity / federated app (preferred)

## DI registration (test)

```csharp
services.AddFakeXxxApiClient(fake =>
{
    fake.SomeApi.AddSomeResponse("id-1", XxxDtoFactory.CreateThing(id: "id-1", name: "Test"));
});
```

The fake holds an in-memory map of canned responses. Tests register expected responses up-front; unmatched calls return `IsNotFound`.

## When authoring a new API client

- Always create all three packages (`Abstractions.Vn`, `Client.Vn`, `Client.Testing`).
- Interface lives in `Abstractions`; implementation references `Abstractions` only.
- Testing package references `Abstractions` and provides DTO factory + fake.
- Version namespace prefix matches the API segment version (`Controllers.V1` → `Abstractions.V1`).

## Cross-references

- `shared.api-client-abstractions.instructions.md` — base interfaces and types
- `patterns.versioned-apis.instructions.md` — server-side versioning that consumer clients mirror
