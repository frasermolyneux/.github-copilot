# Identity Model

Cross-cutting reference for how players and admins are identified across the plugin and the portal. The authoritative CoD4x identity rules are in [`../player-authentication.md`](../player-authentication.md); this file records the **portal-side** facts and the attribution decisions for the integration.

## The three CoD4x identifiers

| ID                                            | Stable across reconnect | Steam required | Use                                       |
| --------------------------------------------- | ----------------------- | -------------- | ----------------------------------------- |
| **playerid** (~19 digits, non-Steam universe) | Yes (per machine)       | No             | **Primary key** for bans and admin power  |
| **steamid** (~17 digits or `0`)               | Yes (per person)        | Yes            | Person-level correlation when present     |
| **legacy GUID** (32-char hex)                 | Legacy                  | No             | Input only — auto-converted to `playerid` |

A player without Steam has `steamid == 0` but always a non-zero `playerid`. The plugin reads identity via `Plugin_GetPlayerID(slot)` / `Plugin_GetPlayerSteamID(slot)` at `OnClientAuthorized` (not at raw connect).

## Portal schema today (relevant facts)

- **`Players.Guid`** (nullable `NVARCHAR(50)`) stores the 19-digit **playerid**. There is **no dedicated SteamId column** anywhere. `portal-sync` deliberately writes `asteamid\0` in ban-file lines.
- **`UserProfile`** is the portal/forum/AAD identity. It links to a game `Player` via **`ConnectedPlayerProfiles`** (`Player ⇄ UserProfile`, with `LinkMethod`, `IsActive`).
- **`AdminActions`** is the ban/action record: `PlayerId` (target), `UserProfileId` (admin), `Type` (Observation/Warning/Kick/TempBan/Ban).

## Attribution decisions for the integration

- **Bans and admin power key on `playerid`.** This avoids any schema change and, crucially, **covers non-Steam players** (whom the CoD4x native admin store — which requires `steamid != 0` — cannot represent). See [role mapping](portal-role-mapping-to-power.md) and [bans](bans-portal-authority.md).
- **Admin gating requires a portal account link.** The portal can only map `playerid → role` when the game identity is linked via `ConnectedPlayerProfiles`. Unlinked (or linked-but-no-role) → default power. This is the deliberate gate.
- **Captured artifacts attribute to the captured player.** Screenshot/demo arrival callbacks carry the `client_t*`, so artifacts are tagged with the subject player's `playerid`/`steamid`, even when an admin or the portal triggered the capture. The existing `Demos` table keys on the *uploader* (`UserProfileId`); server captures need an added player association ([demos](demos.md)).

## SteamID: when it is and isn't required

- **Not required** for the chosen design — power and bans are playerid-keyed and the plugin owns enforcement.
- **Would be required** only if we used the CoD4x **native persistent admin store** (`Auth_AddAdminToList` rejects `steamid == 0`). We deliberately avoid that path; transient `cl->power` is keyed on slot/playerid and needs no SteamID.

Capturing `steamid` where non-zero is still worthwhile for person-level correlation, but it is **not** a hard prerequisite and does not block non-Steam players.
