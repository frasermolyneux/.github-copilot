# CoD4x — Admin System

How the CoD4X18 in-game admin system works: **power levels**, the **`Auth` admin store**, in-game/RCON command gating, and the **ban system**. This drives portal-web role mapping and portal-servers-integration moderation calls.

> Power levels and ban command inputs/outputs are summarised here; full RCON command shapes and parsing regexes are in [rcon-system.md](rcon-system.md).

---

## 1. Power levels (1–100)

Every command has a **minimum power**. A player/admin may run a command only if their power ≥ the command's required power.

- **1** — default for any connected player (e.g. `ministatus`, `serverinfo`).
- **35–80** — graduated admin actions (kick 35, getss 45, tempban 50, say 70, permban/unban 80).
- **100 / "console"** — full RCON / console only; not assignable to a normal admin.

When you connect with the **RCON password you act at full power (100)** — every command is available. Listed powers matter for the **in-game** admin system and for changing a command's required power.

Admins are stored with a power value; a player's power comes from `Auth_GetClPower` / GSC `getPower()` (default 1) and may be set via `setPower()`.

## 2. The auth admin store (`Auth`)

`sv_auth.h` holds up to `MAX_AUTH_ADMINS` (512) records:

```c
authData_admin_t { username[32]; salt[129]; sha256[65]; sessionid[65]; power; steamid; undercover; }
```

- Keyed on **`steamid`**; persisted to the admin config and reloaded on start.
- `undercover` lets an admin hide elevated power. Passwords are salted SHA-256; sessions are tokenized.
- Helpers: `Auth_GetClPowerBySteamID`, `Auth_AddAdminToList`, `Auth_ChangeAdminPassword`, `Auth_GetSessionId`, `Auth_CanPlayerUseCommand`.

### Managing admins (console/RCON, aliased)
- `authSetAdmin` → `AdminAddAdminWithPassword`
- `authUnsetAdmin` → `AdminRemoveAdmin`
- `authListAdmins` → `adminListAdmins`
- `authChangePassword` → `changePassword`
- `cmdpowerlist` → `AdminListCommands` (list each command's required power)
- `setCmdMinPower` → `AdminChangeCommandPower <cmd> <power>` (retune a command's power)

Command whitelisting: `Auth_AddCommandForClientToWhitelist` / `Plugin_AddCommandForClientToWhitelist` grant a specific client one command regardless of power.

## 3. Command gating flow

1. Invoker resolved (RCON = power 100, admin id 0; in-game = looked-up power).
2. `Auth_CanPlayerUseCommand` checks power ≥ command min (or whitelist).
3. Bad input prints a `Usage:` line; no map ⇒ `Server is not running.`
4. Plugins can read invoker context: `Plugin_Cmd_GetInvokerPower/SteamID/Slot/Name`, `Plugin_CanPlayerUseCommand`.

## 4. Ban system

**The running server is the single source of truth** — bans live in memory, are persisted by the server, decided from memory. Never edit the ban file on a live server.

- **Key bans on `playerid`** (offline targets require it; names/slots match online only). Offline records use placeholder name `Offline Ban`.
- **Permanent:** `permban <player> <reason>` (power 80) / `banUser`/`banClient` (console).
- **Temporary:** `tempban <player> <N>m|h|d <reason>` (power 50), max 30 days.
- **Remove:** `unban <playerid>` (power 80) — clears the record **and** the short-lived IP ban.
- **List:** `dumpbanlist`. **Reason** ≤ 126 chars, avoid `" ; % / \`.
- A separate IP ban is time-capped (`banlist_maxipbantime`, default 240 min), self-expires/clears on restart; `unban` clears it immediately.
- You can't ban an admin with higher power.

Plugin ban API: `Plugin_BanClient`, `Plugin_PlayerAddBanByip`, `Plugin_PlayerBannedByip`, `Plugin_RemoveBanByip`, `Plugin_FormatBanMessage`. Ban lifecycle events: `OnPlayerAddBan`, `OnPlayerGetBanStatus`, `OnPlayerRemoveBan`.

## 5. Portal mapping

- Map portal roles → CoD4x power levels; reserve 100 for console/RCON automation.
- Issue moderation over RCON; reconcile against `dumpbanlist` rather than trusting confirmation lines (see [rcon-system.md](rcon-system.md)).
- Store the admin `steamid`; RCON bans appear as `System/Rcon`.

See: [rcon-system.md](rcon-system.md), [player-authentication.md](player-authentication.md).
