# CoD4x — Player Authentication & Identity

Canonical identity model for the CoD4X18 server. This is the foundation for ban management, admin assignment, and portal player records. Get this model right and everything downstream (`portal-repository`, `portal-web`, `portal-servers-integration`) keys correctly.

> **Bottom line for portal:** key person/machine records on **`playerid`**, capture **`steamid`** where non-zero, treat **legacy GUID** as input-only/compatibility, and never trust a name or slot as a stable identity.

---

## 1. The three identifiers

| ID              | Type                         | Size              | Stable across reconnect? | Steam required? | Use for                                   |
| --------------- | ---------------------------- | ----------------- | ------------------------ | --------------- | ----------------------------------------- |
| **playerid**    | 64-bit (custom universe ≥32) | ~19 digits        | Yes (per machine)        | No              | The primary ban/identity key              |
| **steamid**     | 64-bit (universe 1)          | ~17 digits or `0` | Yes (per person)         | Yes             | Person-level identity when present        |
| **legacy GUID** | 32-char hex                  | 32 chars          | Legacy                   | No              | Input only — auto-converted to `playerid` |

- A player **without Steam** has `steamid == 0` but always has a non-zero `playerid`. Always store `playerid`.
- `playerid` is a per-**machine** identity; the same person on another device/OS reinstall may present a different `playerid`. Store `steamid` alongside (when non-zero) to correlate person-level.

## 2. The 64-bit SteamID universe scheme

Both `playerid` and `steamid` are packed 64-bit values (`sapi.c`):

```
steamid = (universe << 56) | (accounttype << 52) | (instance << 32) | accountid
```

- **`steamid`** uses **universe 1** → ~17-digit value (e.g. `76561197960287930`).
- **`playerid`** uses a **non-Steam universe (≥32)** → ~19-digit value (e.g. `2310346615308413814`).

That universe split is why the two numbers have different digit lengths and why you can tell them apart at a glance. `Plugin_SteamIDIsIndividual` / `IsIndividualAndSteamAccount` test universe + account type to distinguish a real Steam account from a generated player id.

## 3. Display format — `sv_usesteam64id`

The server cvar `sv_usesteam64id` controls how IDs **print** (e.g. in `status`, `dumpbanlist`):

- `sv_usesteam64id 1` (default) → numeric 64-bit (`2310346615308413814`, `76561197960287930`, `0`).
- `sv_usesteam64id 0` → `[U:1:accountid]` compact form.

Input parsers accept **all** forms — numeric 64-bit, `[U:V:W]`, and legacy `STEAM_0:Y:Z` — so you can ban regardless of display. Combined ID token for parsing:

```regex
(?P<id>\d{6,20}|\[U:\d+:\d+\]|STEAM_\d:\d:\d+)
```

`sapi.c` provides the parsers/formatters: `ParseSteam64ID`, `ParseLegacySteamID` (`STEAM_…`), `SV_SApiSteamIDToString` (`[U:..]`), `SV_SApiSteamIDTo64String` (numeric). Plugins expose the same via `Plugin_StringToSteamID`, `Plugin_SteamIDToString`, `Plugin_SteamIDTo64String`, `Plugin_GUID2PlayerID`.

## 4. Reading identity in GSC and plugins

| Context    | playerid                   | steamid                         | name                         |
| ---------- | -------------------------- | ------------------------------- | ---------------------------- |
| GSC method | `player getplayerid64()`   | `player getsteamid64()`         | `player.name`                |
| Plugin C   | `Plugin_GetPlayerID(slot)` | `Plugin_GetPlayerSteamID(slot)` | `Plugin_GetPlayerName(slot)` |
| RCON       | `status` row               | `status` row                    | `status` row (color-coded)   |

`uid` is a legacy concept (`getUid`/`setUid`, default `-1`) — do **not** use for new portal work; prefer `playerid`/`steamid`.

## 5. Admin identity

Admins are keyed on **`steamid`** in the auth store (`sv_auth.h` `authData_admin_t`: username, salt, sha256, sessionid, power, steamid). See [admin-system.md](admin-system.md). RCON-issued actions record the admin as `System/Rcon` (admin id `0`).

## 6. Portal guidance

- Persist `(playerid, steamid, lastName, lastIp)`; ban on `playerid`.
- `steamid == 0` ⇒ no Steam; never block on missing steamid.
- Strip color codes (`\^\d`) from names before storing/matching.
- Names and slots are connection-scoped — only valid for currently connected players.

See also: [rcon-system.md](rcon-system.md) for `status`/`dumpbanlist` parsing, [admin-system.md](admin-system.md) for power/bans.
