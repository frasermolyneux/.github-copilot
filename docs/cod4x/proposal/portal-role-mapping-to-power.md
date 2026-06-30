# Portal Role Mapping to Power

How a portal admin's role (HeadAdmin, GameAdmin, Moderator, …) becomes an in-game **power level**, applied when they connect — accurately, and offline-tolerantly.

## Two power mechanisms — we use the transient one

CoD4x has two ways to grant power (see [`../admin-system.md`](../admin-system.md), [`../player-authentication.md`](../player-authentication.md)):

| Mechanism                                                                                   | SteamID required?                | Keyed on           | Chosen?                                           |
| ------------------------------------------------------------------------------------------- | -------------------------------- | ------------------ | ------------------------------------------------- |
| Native **persistent admin store** (`Auth_AddAdminToList`)                                   | **Yes** — rejects `steamid == 0` | steamid            | ❌ excludes non-Steam players; needs schema change |
| **Transient** `cl->power` (`Auth_GetClPower` returns `cl->power` before any steamid lookup) | **No**                           | slot / `cl->power` | ✅                                                 |

We use **transient power keyed on `playerid`** — no SteamID requirement, covers non-Steam players, and the **plugin owns enforcement** (consistent with it owning [bans](bans-portal-authority.md)). The per-client **command whitelist** (also slot-keyed) is available for fine-grained grants without the admin store.

## The model: cached roster (Option B)

Rather than a per-connect HTTP lookup, the plugin holds a compact **admin roster** synced periodically via the [settings/cache](settings-and-offline-cache.md) channel:

```
roster: playerid -> { power, tags }     // admins only, scoped to this server's game type
```

Power is derived from the **`cod4xPower`** namespace (role tag → power band):

```jsonc
// namespace: cod4xPower
{
  "schemaVersion": 1,
  "roleBands": {
    "SeniorAdmin": 90,
    "HeadAdmin":   80,
    "GameAdmin":   50,
    "Moderator":   35
  }
  // reserve 100 for console / RCON automation
}
```

The roster carries **`tags` as well as `power`**, because the plugin also needs the player's tags to authorize portal [chat commands](chat-commands-portal.md) (`RequiredTags`) — one sync feeds both gating mechanisms.

## Applying power on connect

1. At `OnClientAuthorized`, read `Plugin_GetPlayerID(slot)`.
2. **O(1) lookup** in the cached roster → set `cl->power` and record tags.
3. No round-trip; the player is correctly powered the instant they're authorized.

## Accuracy: re-apply on every sync

When the roster refreshes, **reconcile already-connected players too** — so a portal-side **revocation demotes a live admin mid-session** (reset to power 1), not only promotes on next connect. Handle demotion, not just promotion.

## The gate: portal account link

The portal can map `playerid → role` only when the game identity is **linked** to a portal user via `ConnectedPlayerProfiles` (see [identity model](identity-model.md)):

- Linked **and** has a role claim → power granted.
- Unlinked, or linked with no role → **power 1** (default).

Account linking is therefore the deliberate prerequisite for in-game admin. Because it is playerid-based, **non-Steam admins are covered**.

## Offline behaviour

- Apply from **last-known-good** roster during a portal outage (bounded staleness, fail-closed).
- A **failed** sync keeps the previous roster; only an explicitly empty roster clears admins (see [settings](settings-and-offline-cache.md)).

## Composition with native command tuning

`cod4xPower` (role → power) composes with [`cod4xCommands`](chat-commands-native.md) (command → required power) so the portal expresses **who can do what** entirely in config — e.g. a HeadAdmin (→80) can run `kick` (req 35) but not a console-only action — with no per-server console fiddling.

## Backing endpoint

One new portal **read endpoint** — "admin roster for `(serverId / gameType)`" — projecting the existing claims model. **No schema change.**

## Related

- [Identity model](identity-model.md)
- [Chat commands — native server](chat-commands-native.md)
- [Settings and offline cache](settings-and-offline-cache.md)
- [`../admin-system.md`](../admin-system.md)
