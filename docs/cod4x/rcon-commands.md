# CoD4x — RCON Command Reference

The full command set exposed by a **CoD4X18** dedicated server, captured directly from a live server with `cmdlist` (74 commands). This document normalises that raw dump into a consistent reference: each command's **inputs**, **output / behaviour**, and the **output parsing regex** where the output is structured.

> Source capture: `cmdlist` (74 commands). Cross-referenced with [rcon-system.md](rcon-system.md) (canonical wire protocol + regexes), [admin-system.md](admin-system.md) (power levels + ban system), and the community [zeroy RCON wiki](https://wiki.zeroy.com/index.php/Call_of_Duty:_Rcon_Commands).

## How to read this

- **Transport** — over RCON, prefix the command with `rcon <password>` (Quake3 UDP) or send via an authenticated Source/HL2 RCON session. Connecting via the RCON password runs every command at **power 100**. See [rcon-system.md](rcon-system.md).
- **Inputs** — `<required>`, `[optional]`. Player targets accept a **slot/client id** (from `status`) or a **playerid**; offline ban targets require a `playerid`.
- **Output regex** — a `—` means the output is free-form / unstructured (human text only) or the command produces no parseable response. Canonical structured regexes live in [rcon-system.md](rcon-system.md) and are reproduced in [§ Parsing regexes](#parsing-regexes).
- Strip colour codes (`\^\d`) from names before matching. Bad input prints a `Usage:` line; with no map loaded, server-state commands print `Server is not running.`

---

## Server lifecycle & info

| Command       | Inputs       | Output / behaviour                                                                                 | Output regex                              |
| ------------- | ------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `status`      | —            | Connected-player table: slot, score, ping, playerid, steamid, name, lastmsg, address, qport, rate. | see [§ Parsing regexes](#parsing-regexes) |
| `ministatus`  | —            | Compact player list (power 1; any player).                                                         | —                                         |
| `serverinfo`  | —            | Serverinfo cvars (`\key\value\…`) — hostname, mapname, gametype, sv_maxclients, etc.               | `\\(?P<key>[^\\]+)\\(?P<value>[^\\]*)`    |
| `systeminfo`  | —            | Systeminfo cvars (engine/system dvars).                                                            | `\\(?P<key>[^\\]+)\\(?P<value>[^\\]*)`    |
| `meminfo`     | —            | Memory allocation summary.                                                                         | —                                         |
| `zonememinfo` | —            | Zone (asset) memory usage summary.                                                                 | —                                         |
| `XAssetUsage` | —            | Per-type loaded asset counts/usage.                                                                | —                                         |
| `scriptUsage` | —            | GSC script memory usage.                                                                           | —                                         |
| `stringUsage` | —            | String table / configstring memory usage.                                                          | —                                         |
| `gametype`    | `[gametype]` | Print or set the current gametype (e.g. `war`, `dm`, `sd`).                                        | —                                         |
| `downloadmap` | `<map>`      | Trigger server-side fast-download fetch of a map.                                                  | —                                         |
| `heartbeat`   | —            | Force a heartbeat to the master server list.                                                       | —                                         |
| `net_restart` | —            | Reinitialise the network subsystem.                                                                | —                                         |
| `killserver`  | —            | Disconnect all clients and stop the server (stays in process).                                     | —                                         |
| `quit`        | —            | Shut the server process down.                                                                      | —                                         |

## Map control

| Command        | Inputs  | Output / behaviour                                            | Output regex |
| -------------- | ------- | ------------------------------------------------------------- | ------------ |
| `map`          | `<map>` | Load the given map (full reload).                             | —            |
| `map_restart`  | —       | Restart the current map (full reload).                        | —            |
| `fast_restart` | —       | Restart the current round without reloading the map (faster). | —            |
| `map_rotate`   | —       | Advance to the next map per `sv_maprotation`.                 | —            |
| `readbrushbsp` | `[map]` | Collision-map (BSP) debug read.                               | —            |
| `cm_printall`  | —       | Dump collision-model data (debug).                            | —            |

## Player moderation & bans

| Command       | Inputs                         | Output / behaviour                                                   | Output regex                              |
| ------------- | ------------------------------ | -------------------------------------------------------------------- | ----------------------------------------- |
| `kick`        | `<name>` \| `all`              | Kick by player name; `all` kicks everyone.                           | —                                         |
| `onlykick`    | `<name>`                       | Kick by name without recording a ban.                                | —                                         |
| `clientkick`  | `<slot>`                       | Kick by client slot/id (safer with colour-coded names).              | —                                         |
| `banClient`   | `<slot>`                       | Permanent ban by client slot (console alias of `permban`).           | see ban regexes                           |
| `banUser`     | `<name>`                       | Permanent ban by name.                                               | see ban regexes                           |
| `permban`     | `<player> <reason>`            | Permanent ban (power 80); reason ≤ 126 chars, avoid `" ; % / \`.     | see [§ Parsing regexes](#parsing-regexes) |
| `tempban`     | `<player> <N>m\|h\|d <reason>` | Temporary ban (power 50), max 30 days.                               | see [§ Parsing regexes](#parsing-regexes) |
| `unban`       | `<playerid>`                   | Remove the ban record **and** the short-lived IP ban (power 80).     | see [§ Parsing regexes](#parsing-regexes) |
| `unbanUser`   | `<name>`                       | Unban by name (legacy alias).                                        | —                                         |
| `dumpbanlist` | —                              | List all active bans (index, playerid, nick, admin, expire, reason). | see [§ Parsing regexes](#parsing-regexes) |
| `dumpuser`    | `<name>`                       | Dump a player's userinfo cvars.                                      | `^(?P<key>\S+)\s+(?P<value>.*)$`          |

## Messaging

| Command      | Inputs             | Output / behaviour                           | Output regex |
| ------------ | ------------------ | -------------------------------------------- | ------------ |
| `say`        | `<message>`        | Broadcast a chat message to all players.     | —            |
| `tell`       | `<slot> <message>` | Private chat message to one player.          | —            |
| `screensay`  | `<message>`        | Broadcast an on-screen (HUD) message to all. | —            |
| `screentell` | `<slot> <message>` | On-screen (HUD) message to one player.       | —            |
| `consay`     | `<message>`        | Print a message to all players' consoles.    | —            |
| `contell`    | `<slot> <message>` | Print a message to one player's console.     | —            |

## Anti-cheat & inspection

| Command      | Inputs   | Output / behaviour                                        | Output regex |
| ------------ | -------- | --------------------------------------------------------- | ------------ |
| `getss`      | `<slot>` | Request an in-game screenshot from a client (anti-cheat). | —            |
| `getmodules` | `<slot>` | Request the client's loaded module list (anti-cheat).     | —            |

See [anticheat-data-flow.md](anticheat-data-flow.md) for the screenshot/module data flow.

## Admin management (Auth store)

| Command                   | Inputs                                    | Output / behaviour                                   | Output regex                          |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------- | ------------------------------------- |
| `AdminListCommands`       | —                                         | List each command and its required power level.      | `^(?P<command>\S+)\s+(?P<power>\d+)$` |
| `AdminListAdmins`         | —                                         | List registered admins (username / steamid / power). | —                                     |
| `AdminAddAdmin`           | `<steamid> <username> <password> <power>` | Add an admin to the Auth store.                      | —                                     |
| `AdminRemoveAdmin`        | `<steamid>`                               | Remove an admin from the Auth store.                 | —                                     |
| `AdminChangeCommandPower` | `<command> <power>`                       | Retune the minimum power for a command.              | —                                     |
| `AdminChangePassword`     | `<username> <password>`                   | Change another admin's password.                     | —                                     |
| `ChangePassword`          | `<password>`                              | Change the invoking admin's own password.            | —                                     |
| `undercover`              | —                                         | Toggle hiding the admin's elevated power.            | —                                     |

## Plugins

| Command        | Inputs   | Output / behaviour                              | Output regex |
| -------------- | -------- | ----------------------------------------------- | ------------ |
| `plugins`      | —        | List currently loaded plugins.                  | —            |
| `loadPlugin`   | `<name>` | Load a plugin by name.                          | —            |
| `unloadPlugin` | `<name>` | Unload a loaded plugin.                         | —            |
| `pluginInfo`   | `<name>` | Print metadata for a plugin (version, summary). | —            |

See [plugin-system.md](plugin-system.md).

## Demo recording (server-side)

| Command      | Inputs   | Output / behaviour                      | Output regex |
| ------------ | -------- | --------------------------------------- | ------------ |
| `record`     | `[name]` | Start a server-side demo recording.     | —            |
| `stoprecord` | —        | Stop the current server-side recording. | —            |

## Cvars, config & engine

| Command         | Inputs            | Output / behaviour                                        | Output regex                                            |
| --------------- | ----------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| `set`           | `<var> <value>`   | Set a cvar.                                               | —                                                       |
| `seta`          | `<var> <value>`   | Set a cvar and archive it (persisted to config).          | —                                                       |
| `sets`          | `<var> <value>`   | Set a cvar flagged as serverinfo (shown in `serverinfo`). | —                                                       |
| `setu`          | `<var> <value>`   | Set a cvar flagged as userinfo.                           | —                                                       |
| `setcvartotime` | `<var>`           | Set a cvar to the current server time.                    | —                                                       |
| `setfromcvar`   | `<dest> <src>`    | Set one cvar's value from another cvar.                   | —                                                       |
| `reset`         | `<var>`           | Reset a cvar to its default value.                        | —                                                       |
| `toggle`        | `<var> [values…]` | Toggle a cvar between 0/1 or a list of values.            | —                                                       |
| `vstr`          | `<var>`           | Execute the contents of a string cvar as a command.       | —                                                       |
| `wait`          | `[frames]`        | Delay subsequent buffered commands by N frames.           | —                                                       |
| `exec`          | `<file>`          | Execute a config file.                                    | —                                                       |
| `writeconfig`   | `<file>`          | Write the current archived cvars/binds to a config file.  | —                                                       |
| `writenvcfg`    | —                 | Write the network-variable config.                        | —                                                       |
| `cvarlist`      | `[filter]`        | List all cvars (optionally filtered).                     | `^(?P<flags>[\w-]+)\s+(?P<name>\S+)\s+"(?P<value>.*)"$` |
| `which`         | `<command\|cvar>` | Report which plugin/module registered a command or cvar.  | —                                                       |
| `path`          | —                 | Print the filesystem search paths.                        | —                                                       |
| `echo`          | `<text>`          | Echo text back to the console.                            | `^(?P<text>.*)$`                                        |
| `addCommand`    | `<name> <power>`  | Register/whitelist a command at a power level.            | —                                                       |
| `setPerk`       | `<slot> <perk>`   | Debug: grant a perk to a player.                          | —                                                       |

---

## Parsing regexes

These are the canonical structured-output regexes (reproduced from [rcon-system.md](rcon-system.md)). Combined ID token: `(?P<id>\d{6,20}|\[U:\d+:\d+\]|STEAM_\d:\d:\d+)`.

### `status` — player rows

```regex
^\s*(?P<num>\d+)\s+(?P<score>-?\d+)\s+(?P<ping>CNCT|ZMBI|PRIM|\d+)\s+(?P<playerid>\d{6,20}|\[U:\d+:\d+\])\s+(?P<steamid>\d{1,20}|\[U:\d+:\d+\])\s+(?P<name>.+?)\s+(?P<lastmsg>\d+)\s+(?P<address>\[?[0-9a-fA-F:.]+\]?:\d+)\s+(?P<qport>\d+)\s+(?P<rate>\d+)\s*$
```

### `dumpbanlist` — ban rows + trailer

```regex
^(?P<index>\d+) playerid: (?P<playerid>\d{6,20}|\[U:\d+:\d+\]); nick: (?P<nick>.*?); adminsteamid: (?P<admin>System/Rcon|\d{1,20}|\[U:\d+:\d+\]); expire: (?P<expire>Never|.+?); reason: (?P<reason>.*)$
^(?P<count>\d+) Active bans$
```

### `permban <playerid> <reason>`

- online: `^attempting to add Banrecord for player: (?P<name>.+) id: (?P<id>\d{6,20}|\[U:\d+:\d+\])$`
- offline: `^Banrecord added for id: (?P<id>\d{6,20}|\[U:\d+:\d+\])$`

### `tempban <playerid> <N>m|h|d <reason>`

- online: `^Banrecord added for player: (?P<name>.+) id: (?P<id>\d{6,20}|\[U:\d+:\d+\])$` (offline form same as `permban`). Max 30 days.

### `unban <playerid>`

```regex
^Removing ban for Nick: (?P<nick>.*), PlayerID: (?P<id>\d{6,20}|\[U:\d+:\d+\]), Banreason: (?P<reason>.*)$
```

(silent if no matching record).

### Generic error

```regex
^Error: (?P<error>.+)$
```

---

## Behavioural notes

- IDs print numeric or `[U:..]` depending on `sv_usesteam64id`; both forms are accepted as input.
- Don't trust ban confirmation lines for perm-vs-temp — reconcile with `dumpbanlist` `expire`.
- Outputs may be split across multiple packets; reassemble before applying regex.
- You cannot ban an admin whose power is higher than the invoker.

See also: [rcon-system.md](rcon-system.md), [rcon-developer-guide.md](rcon-developer-guide.md), [admin-system.md](admin-system.md).
