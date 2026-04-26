---
description: Repository pattern for data access — interfaces, DI registration, cache-first reads.
applyTo: '**/*.cs'
---
# Pattern — Repository

Data access in .NET projects across the org goes through repository interfaces with DI-registered implementations. Direct ADO.NET / `DbContext` / SDK use in controllers or business services is avoided.

## Shape

For each persisted entity / aggregate:

1. **`I<Entity>Repository`** interface in the domain or abstractions assembly.
2. **`<Entity>Repository`** implementation in the data assembly, taking the underlying SDK client (`TableClient`, `IDbContext`, `BlobContainerClient`, etc.) via constructor.
3. **DI registration** via an `Add<Area>Repositories(this IServiceCollection)` extension.

```csharp
public interface IPlayerRepository
{
    Task<Player?> GetAsync(string id, CancellationToken ct = default);
    Task UpsertAsync(Player player, CancellationToken ct = default);
}

public class PlayerRepository(TableClient table, IMemoryCache cache) : IPlayerRepository
{
    public async Task<Player?> GetAsync(string id, CancellationToken ct = default)
    {
        if (cache.TryGetValue(CacheKey(id), out Player? cached)) return cached;
        // ... fetch from table, populate cache, return
    }
    // ...
}
```

## Cache-first reads

Reads should:

1. Check the in-memory cache (`IMemoryCache`) first.
2. On miss, fetch from the backing store.
3. Populate the cache with a sensible TTL (typically 5–15 minutes for reference data; shorter for mutable data).

Writes invalidate the cache entry for the affected key. For collection invalidation, prefer key-versioning over enumerating-and-evicting.

## Backing stores

Common combinations:

| Store | Client | Notes |
|---|---|---|
| Azure Table Storage | `TableClient` | Most common for low-volume / config-style data |
| Azure SQL | `IDbContext` (EF Core) or Dapper | Used by portal-* repos via `portal-core` SQL Server |
| Azure Blob Storage | `BlobContainerClient` | For binary / serialized state |
| MaxMind GeoIP | Custom client | `geo-location` repo's IP-to-country lookups |

## When NOT to use repository

- One-off reads from a third-party API → use a typed API client (`patterns.api-client`) instead.
- Direct event handling that happens to write to storage as a side effect — handler may write directly if the unit of work is small and isolated.

## Cross-references

- `patterns.api-client.instructions.md` — for HTTP-backed data
- `standards.dotnet-project.instructions.md` — project file conventions
