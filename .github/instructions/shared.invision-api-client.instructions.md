---
description: Consumption contract for invision-api-client — typed API client for Invision Community.
applyTo: '**/*.cs,**/*.csproj'
---
# invision-api-client — Consumer Contract

Provides typed API client for **Invision Community** REST API. Two NuGet packages following the canonical typed-client shape (see `patterns.api-client.instructions.md`).

## Packages

| Package | Purpose |
|---|---|
| `MX.InvisionCommunity.Api.Client` | Production client (`IInvisionApiClient`, sub-clients, DI extension) |
| `MX.InvisionCommunity.Api.Client.Testing` | `FakeInvisionApiClient` + `InvisionDtoFactory` for tests |

Targets `net9.0` and `net10.0`.

## Public surface

`IInvisionApiClient` aggregates three sub-API interfaces accessed as properties:

| Property | Interface | Endpoints |
|---|---|---|
| `.Core` | `ICoreApi` | Members, profile, authentication |
| `.Downloads` | `IDownloadsApi` | Downloads catalogue |
| `.Forums` | `IForumsApi` | Forums and topics |

All endpoint methods return `IApiResult<T>` (from `MX.Api.Abstractions`).

## DI registration (production)

```csharp
services.AddInvisionApiClient(options => options
    .WithBaseUrl(Configuration["Invision:BaseUrl"])
    .WithApiKeyAuthentication(Configuration["Invision:ApiKey"]));

// or with Entra ID client credentials:
services.AddInvisionApiClient(options => options
    .WithBaseUrl(Configuration["Invision:BaseUrl"])
    .WithEntraIdAuthentication(Configuration["Invision:Resource"]));
```

`appsettings.json`:

```json
{
  "Invision": {
    "BaseUrl": "https://invision.example.com",
    "ApiKey": "<from-key-vault>"
  }
}
```

## Consumer usage

```csharp
public class MemberService(IInvisionApiClient client)
{
    public async Task<MemberDto?> GetMemberAsync(string id)
    {
        var result = await client.Core.GetMember(id);
        if (result.IsNotFound) return null;
        if (!result.IsSuccess) throw new InvalidOperationException(/* ... */);
        return result.Result.Data;
    }
}
```

## Testing

```csharp
var services = new ServiceCollection();
services.AddFakeInvisionApiClient(fake =>
{
    fake.CoreApi.AddMemberResponse("123",
        InvisionDtoFactory.CreateMember(id: 123, name: "Test"));
});

var client = services.BuildServiceProvider().GetRequiredService<IInvisionApiClient>();
var result = await client.Core.GetMember("123");
Assert.True(result.IsSuccess);
Assert.Equal("Test", result.Result.Data.Name);
```

The fake registers canned responses up-front; unmatched calls return `IsNotFound`. `InvisionDtoFactory` provides `CreateMember`, `CreateDownload`, `CreateTopic` helpers.

## Cross-references

- `patterns.api-client.instructions.md` — canonical typed-client pattern
- `shared.api-client-abstractions.instructions.md` — base result envelope
- `standards.dotnet-project.instructions.md` — project file conventions
