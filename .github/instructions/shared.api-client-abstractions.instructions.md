---
description: Consumption contract for api-client-abstractions — MX.Api.Abstractions NuGet (base types for typed API clients).
applyTo: '**/*.cs,**/*.csproj'
---
# api-client-abstractions — Consumer Contract

Provides **`MX.Api.Abstractions`** — the base interfaces and types that every typed API client across the org builds on. Targets `net9.0` and `net10.0`.

## Public surface

| Type | Purpose |
|---|---|
| `IApiResult` | Non-generic result envelope (`IsSuccess`, `IsNotFound`, `IsConflict`, `StatusCode`, `ApiResponse`) |
| `IApiResult<T>` | Generic result with strongly-typed `ApiResponse<T>` |
| `ApiResponse` | Non-generic envelope (`Errors[]`, `Metadata`) |
| `ApiResponse<T>` | Generic envelope (`Data: T`, `Errors[]`, `Pagination`, `Metadata`) |
| `ApiError` | Error object (`Field`, `Code`, `Message`, `Details`) |
| `ApiPagination` | `PageNumber`, `PageSize`, `TotalPages`, `TotalCount` |
| `CollectionModel<T>` | Wrapper for paginated collections |
| `IRestClientService` | Base abstraction for REST client lifecycle |

## DI registration

Registration extensions live in the **sibling `MX.Api.Client` package** (consumed alongside `MX.Api.Abstractions`):

```csharp
services.AddApiClient<IMyApiClient, MyApiClient>(options => options
    .WithBaseUrl("https://api.example.com")
    .WithApiKeyAuthentication("api-key"));

// or with custom options/builder types:
services.AddTypedApiClient<ICustom, CustomImpl, CustomOptions, CustomBuilder>(configure);
```

Configuration is **fluent-builder only** — there are no out-of-box appsettings binding helpers. Consumers wire URL/auth from `Configuration[...]` lookups inside the `options =>` lambda.

## Consumer pattern

```csharp
public class UserService(IUserApiClient api)
{
    public async Task<UserDto> GetUserAsync(int id, CancellationToken ct = default)
    {
        var result = await api.GetUser(id, ct);
        if (result.IsNotFound)
            throw new KeyNotFoundException();
        if (!result.IsSuccess)
            throw new InvalidOperationException(result.ApiResponse?.Errors?[0].Message);
        return result.Result.Data;
    }
}
```

Branch on `IsSuccess` / `IsNotFound` / `IsConflict` rather than throwing inside the client. The consuming service translates non-success into the appropriate domain exception.

## Testing

`MX.Api.Abstractions` itself does **not** ship a `*.Testing` package — the result envelope types are simple enough to construct directly in tests. Each domain-specific typed-client NuGet (e.g. `MX.InvisionCommunity.Api.Client`) provides its own `*.Testing` companion with `FakeXxxApiClient` and a DTO factory.

## When to depend on this package directly

Most consumers depend on a domain-specific typed-client package (which transitively pulls in `MX.Api.Abstractions`). You only depend on `MX.Api.Abstractions` directly when:

- Authoring a new typed-client NuGet (the abstractions package provides the interfaces and result types you implement).
- Writing cross-cutting middleware/handlers that operate on `IApiResult<T>` from multiple clients.

## Cross-references

- `patterns.api-client.instructions.md` — three-package shape (`Abstractions`, `Client`, `Client.Testing`)
- `shared.invision-api-client.instructions.md` — example domain-specific consumer
- `standards.dotnet-project.instructions.md` — project file conventions
