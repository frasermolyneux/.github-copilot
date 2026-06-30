# CoD4 — RCON Command Reference

The full command set exposed by a stock **Call of Duty 4: Modern Warfare** dedicated server (idTech3 engine), captured directly from a live server with `cmdlist` (68 commands). This document normalises that raw dump into a consistent reference: each command's **inputs**, **output / behaviour**, and the **output parsing regex** where the output is structured.

> Source capture: `cmdlist` (68 commands). Cross-referenced with the [BigBrotherBot (B3) CoD4 parser](https://github.com/BigBrotherBot/big-brother-bot/blob/master/b3/parsers/cod4.py) (status regex + command syntax) and the community [zeroy RCON wiki](https://wiki.zeroy.com/index.php/Call_of_Duty:_Rcon_Commands). The richer CoD4**x** variant (extra ban/admin/plugin commands and confirmed output regexes) is documented in [../cod4x/rcon-commands.md](../cod4x/rcon-commands.md).

## How to read this

- **Transport** — over RCON, prefix the command with `rcon <password>` (Quake3 UDP out-of-band packet). The response is one or more connectionless `print` packets; concatenate before parsing.
- **Inputs** — `<required>`, `[optional]`. Player targets accept a **slot/client id** (from `status`) or a **name**.
- **Output regex** — a `—` means the output is free-form / unstructured text or there is no parseable response. The `status` regex is sourced from the BigBrotherBot (B3) parsers; the `serverinfo`/`dvarlist`/`bindlist` patterns are engine-standard templates worth validating against a real capture.
- Strip colour codes (`\^\d`) from names before matching. Bad input prints a `Usage:` line; with no map loaded, server-state commands print `Server is not running.`

---

## Server lifecycle & info

| Command              | Inputs | Output / behaviour                                                                    | Output regex                              |
| -------------------- | ------ | ------------------------------------------------------------------------------------- | ----------------------------------------- |
| `status`             | —      | Connected-player table: slot, score, ping, guid, name, lastmsg, address, qport, rate. | see [§ Parsing regexes](#parsing-regexes) |
| `serverinfo`         | —      | Serverinfo cvars (`\key\value\…`).                                                    | `\\(?P<key>[^\\]+)\\(?P<value>[^\\]*)`    |
| `systeminfo`         | —      | Systeminfo (engine/system dvars).                                                     | `\\(?P<key>[^\\]+)\\(?P<value>[^\\]*)`    |
| `meminfo`            | —      | Memory allocation summary.                                                            | —                                         |
| `gameCompleteStatus` | —      | Report end-of-game completion status.                                                 | —                                         |
| `heartbeat`          | —      | Force a heartbeat to the master server list.                                          | —                                         |
| `net_restart`        | —      | Reinitialise the network subsystem.                                                   | —                                         |
| `net_dumpprofile`    | —      | Dump network profiling data.                                                          | —                                         |
| `in_restart`         | —      | Reinitialise the input subsystem.                                                     | —                                         |
| `killserver`         | —      | Disconnect all clients and stop the server (stays in process).                        | —                                         |
| `quit`               | —      | Shut the server process down.                                                         | —                                         |

## Map control

| Command        | Inputs  | Output / behaviour                                   | Output regex |
| -------------- | ------- | ---------------------------------------------------- | ------------ |
| `map`          | `<map>` | Load the given map (full reload).                    | —            |
| `devmap`       | `<map>` | Load a map in developer mode (cheats enabled).       | —            |
| `map_restart`  | —       | Restart the current map (full reload).               | —            |
| `fast_restart` | —       | Restart the current round without reloading the map. | —            |
| `map_rotate`   | —       | Advance to the next map per `sv_maprotation`.        | —            |

## Player moderation & bans

| Command         | Inputs            | Output / behaviour                                     | Output regex                     |
| --------------- | ----------------- | ------------------------------------------------------ | -------------------------------- |
| `kick`          | `<name>` \| `all` | Kick by player name; `all` kicks everyone.             | —                                |
| `onlykick`      | `<name>`          | Kick by name without recording a ban.                  | —                                |
| `clientkick`    | `<slot>`          | Kick by client slot/id.                                | —                                |
| `banClient`     | `<slot>`          | Permanent ban by client slot; GUID added to `ban.txt`. | —                                |
| `banUser`       | `<name>`          | Permanent ban by name.                                 | —                                |
| `tempBanClient` | `<slot>`          | Temporary ban by client slot.                          | —                                |
| `tempBanUser`   | `<name>`          | Temporary ban by name.                                 | —                                |
| `unbanUser`     | `<name>`          | Remove a ban by name (edit `ban.txt` for duplicates).  | —                                |
| `dumpuser`      | `<name>`          | Dump a player's userinfo cvars.                        | `^(?P<key>\S+)\s+(?P<value>.*)$` |

## Messaging

| Command | Inputs             | Output / behaviour                       | Output regex |
| ------- | ------------------ | ---------------------------------------- | ------------ |
| `say`   | `<message>`        | Broadcast a chat message to all players. | —            |
| `tell`  | `<slot> <message>` | Private chat message to one player.      | —            |

## Filesystem

| Command     | Inputs        | Output / behaviour                                   | Output regex |
| ----------- | ------------- | ---------------------------------------------------- | ------------ |
| `path`      | —             | Print the filesystem search paths.                   | —            |
| `fullpath`  | `[file]`      | Print the full OS path of a game file/directory.     | —            |
| `dir`       | `<dir> [ext]` | List files in a directory (optionally by extension). | —            |
| `fdir`      | `<filter>`    | Find files matching a wildcard filter.               | —            |
| `touchFile` | `<file>`      | Touch/load a file to force it into the cache.        | —            |

## Player stats

| Command         | Inputs            | Output / behaviour             | Output regex |
| --------------- | ----------------- | ------------------------------ | ------------ |
| `readStats`     | —                 | Read the player stats blob.    | —            |
| `uploadStats`   | —                 | Upload the player stats blob.  | —            |
| `statSet`       | `<index> <value>` | Set a stat value.              | —            |
| `statGetInDvar` | `<index> <dvar>`  | Read a stat value into a dvar. | —            |

## Console channels

| Command                  | Inputs      | Output / behaviour                       | Output regex |
| ------------------------ | ----------- | ---------------------------------------- | ------------ |
| `con_channellist`        | —           | List all console output channels.        | —            |
| `con_visiblechannellist` | —           | List currently visible console channels. | —            |
| `con_showchannel`        | `<channel>` | Show output from a console channel.      | —            |
| `con_hidechannel`        | `<channel>` | Hide output from a console channel.      | —            |

## Key bindings

| Command     | Inputs            | Output / behaviour             | Output regex                             |
| ----------- | ----------------- | ------------------------------ | ---------------------------------------- |
| `bind`      | `<key> <command>` | Bind a key to a command.       | —                                        |
| `unbind`    | `<key>`           | Remove a key binding.          | —                                        |
| `unbindall` | —                 | Remove all key bindings.       | —                                        |
| `bindlist`  | —                 | List all current key bindings. | `^"(?P<key>[^"]+)"\s+"(?P<command>.*)"$` |

## Dvars, config & engine

| Command            | Inputs                      | Output / behaviour                                  | Output regex                                            |
| ------------------ | --------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| `set`              | `<var> <value>`             | Set a dvar.                                         | —                                                       |
| `seta`             | `<var> <value>`             | Set a dvar and archive it (persisted to config).    | —                                                       |
| `sets`             | `<var> <value>`             | Set a dvar flagged as serverinfo.                   | —                                                       |
| `setu`             | `<var> <value>`             | Set a dvar flagged as userinfo.                     | —                                                       |
| `reset`            | `<var>`                     | Reset a dvar to its default value.                  | —                                                       |
| `toggle`           | `<var> [values…]`           | Toggle a dvar between 0/1 or a list of values.      | —                                                       |
| `togglep`          | `<var> [values…]`           | Toggle a dvar and print the new value.              | —                                                       |
| `vstr`             | `<var>`                     | Execute the contents of a string dvar as a command. | —                                                       |
| `wait`             | `[frames]`                  | Delay subsequent buffered commands by N frames.     | —                                                       |
| `exec`             | `<file>`                    | Execute a config file.                              | —                                                       |
| `writeconfig`      | `<file>`                    | Write archived dvars/binds to a config file.        | —                                                       |
| `writedefaults`    | `<file>`                    | Write all default dvar values to a file.            | —                                                       |
| `dvarlist`         | `[filter]`                  | List all dvars (optionally filtered).               | `^(?P<flags>[\w-]+)\s+(?P<name>\S+)\s+"(?P<value>.*)"$` |
| `dvardump`         | `<var>`                     | Dump a dvar's value, default, and flags.            | —                                                       |
| `dvar_float`       | `<var> <value> <min> <max>` | Register/define a float dvar with range.            | —                                                       |
| `dvar_int`         | `<var> <value> <min> <max>` | Register/define an integer dvar with range.         | —                                                       |
| `dvar_bool`        | `<var> <value>`             | Register/define a boolean dvar.                     | —                                                       |
| `setdvartotime`    | `<var>`                     | Set a dvar to the current server time.              | —                                                       |
| `setfromdvar`      | `<dest> <src>`              | Set one dvar's value from another dvar.             | —                                                       |
| `setfromlocString` | `<dest> <locString>`        | Set a dvar from a localized string reference.       | —                                                       |
| `stringUsage`      | —                           | String table / configstring memory usage.           | —                                                       |
| `scriptUsage`      | —                           | GSC script memory usage.                            | —                                                       |
| `setPerk`          | `<slot> <perk>`             | Debug: grant a perk to a player.                    | —                                                       |

---

## Parsing regexes

> The `status` pattern below is taken from the BigBrotherBot (B3) parsers — a widely-used, battle-tested RCON tool — so it is reliable. The `serverinfo`/`dvarlist`/`bindlist` patterns are engine-standard templates; validate them against a real capture.

### `status` — player rows

Authoritative pattern from the BigBrotherBot CoD4 parser (`b3/parsers/cod4.py`, `_regPlayer`). The `guid` column is a **32-char hex** ID (`_guidLength = 32`). Compile with the case-insensitive flag.

```regex
^\s*(?P<slot>\d+)\s+(?P<score>[\d-]+)\s+(?P<ping>\d+)\s+(?P<guid>[0-9a-f]+)\s+(?P<name>.*?)\s+(?P<last>\d+)\s*(?P<ip>(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)):?(?P<port>-?\d{1,5})\s*(?P<qport>-?\d{1,5})\s+(?P<rate>\d+)$
```

> The numeric `ping` group does not match connecting players (`CNCT`/`ZMBI`); filter those rows separately.

### `serverinfo` / `systeminfo` — cvar pairs

```regex
\\(?P<key>[^\\]+)\\(?P<value>[^\\]*)
```

---

## Behavioural notes

- Stock CoD4 keys bans in `ban.txt` by GUID; prefer `clientkick`/`banClient` (slot id) over the name-based variants because colour-coded names are hard to type.
- BigBrotherBot (B3) drives the common moderation commands as `clientkick <slot>` (kick), `banclient <slot>` (ban), `unbanuser <name>` (unban), `tell <slot> <msg>`, `say <msg>`, and `set <name> "<value>"`.
- Outputs may be split across multiple packets; reassemble before applying regex.
- For confirmed ban/unban output formats and additional admin/plugin commands, use the CoD4x reference: [../cod4x/rcon-commands.md](../cod4x/rcon-commands.md).

