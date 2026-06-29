# CoD5 (World at War) — RCON / Command Reference

The full command set exposed by a **Call of Duty: World at War** server, captured directly with `cmdlist` (225 commands). Unlike the CoD2/CoD4 server dumps, this list contains the **full client + server command set** — most entries are client-side console/input commands that are **not usable over RCON**. This document normalises the raw dump into a consistent reference and clearly separates the server/admin subset (the part relevant to `portal-servers-integration`) from client-only commands.

> Source capture: `cmdlist` (225 commands). Cross-referenced with the community [zeroy RCON wiki](https://wiki.zeroy.com/index.php/Call_of_Duty:_Rcon_Commands). For confirmed output regexes from the same engine family, see [../cod4x/rcon-commands.md](../cod4x/rcon-commands.md).

## How to read this

- **Transport** — server commands run over RCON by prefixing `rcon <password>` (Quake3 UDP out-of-band packet). Client-only commands (movement binds, menus, demo playback, matchmaking) cannot be driven over RCON and are listed for completeness.
- **Inputs** — `<required>`, `[optional]`. Player targets accept a **slot/client id** (from `status`) or a **name**.
- **Output regex** — a `—` means the output is free-form / unstructured text or there is no parseable response. Status/dvar regexes below are **engine-standard but unverified against a confirmed capture** — validate before relying on them.
- Strip colour codes (`\^\d`) from names before matching. Bad input prints a `Usage:` line; with no map loaded, server-state commands print `Server is not running.`

---

# Server / admin commands (RCON-usable)

## Server lifecycle & info

| Command              | Inputs | Output / behaviour                                                                    | Output regex                              |
| -------------------- | ------ | ------------------------------------------------------------------------------------- | ----------------------------------------- |
| `status`             | —      | Connected-player table: slot, score, ping, guid, name, lastmsg, address, qport, rate. | see [§ Parsing regexes](#parsing-regexes) |
| `teamstatus`         | —      | Player status grouped by team.                                                        | —                                         |
| `serverinfo`         | —      | Serverinfo cvars (`\key\value\…`).                                                    | `\\(?P<key>[^\\]+)\\(?P<value>[^\\]*)`    |
| `systeminfo`         | —      | Systeminfo (engine/system dvars).                                                     | `\\(?P<key>[^\\]+)\\(?P<value>[^\\]*)`    |
| `meminfo`            | —      | Memory allocation summary.                                                            | —                                         |
| `pmeminfo`           | —      | Physical memory usage summary.                                                        | —                                         |
| `gameCompleteStatus` | —      | Report end-of-game completion status.                                                 | —                                         |
| `heartbeat`          | —      | Force a heartbeat to the master server list.                                          | —                                         |
| `net_restart`        | —      | Reinitialise the network subsystem.                                                   | —                                         |
| `net_dumpprofile`    | —      | Dump network profiling data.                                                          | —                                         |
| `in_restart`         | —      | Reinitialise the input subsystem.                                                     | —                                         |
| `killserver`         | —      | Disconnect all clients and stop the server (stays in process).                        | —                                         |
| `quit`               | —      | Shut the server/game process down.                                                    | —                                         |

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

## Player stats

| Command         | Inputs    | Output / behaviour              | Output regex |
| --------------- | --------- | ------------------------------- | ------------ |
| `readStats`     | —         | Read the player stats blob.     | —            |
| `uploadStats`   | —         | Upload the player stats blob.   | —            |
| `statGet`       | `<index>` | Read a stat value.              | —            |
| `resetStats`    | —         | Reset the local player's stats. | —            |
| `prestigeReset` | —         | Reset prestige progression.     | —            |

## Config & engine (server-side)

| Command                        | Inputs                       | Output / behaviour                           | Output regex |
| ------------------------------ | ---------------------------- | -------------------------------------------- | ------------ |
| `writeconfig`                  | `<file>`                     | Write archived dvars/binds to a config file. | —            |
| `writedefaults`                | `<file>`                     | Write all default dvar values to a file.     | —            |
| `setPerk`                      | `<slot> <perk>`              | Debug: grant a perk to a player.             | —            |
| `stringUsage`                  | —                            | String table / configstring memory usage.    | —            |
| `scriptUsage`                  | —                            | GSC script memory usage.                     | —            |
| `selectStringTableEntryInDvar` | `<table> <row> <col> <dvar>` | Read a string-table cell into a dvar.        | —            |

---

# Shared engine commands (dvars, binds, files, console)

These exist on both client and server; only meaningful over RCON for server-side dvar/config management.

## Dvars

| Command            | Inputs                      | Output / behaviour                                  | Output regex                                            |
| ------------------ | --------------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| `set`              | `<var> <value>`             | Set a dvar.                                         | —                                                       |
| `seta`             | `<var> <value>`             | Set a dvar and archive it (persisted to config).    | —                                                       |
| `sets`             | `<var> <value>`             | Set a dvar flagged as serverinfo.                   | —                                                       |
| `setu`             | `<var> <value>`             | Set a dvar flagged as userinfo.                     | —                                                       |
| `reset`            | `<var>`                     | Reset a dvar to its default value.                  | —                                                       |
| `restoreDvars`     | —                           | Restore dvars to saved/default state.               | —                                                       |
| `toggle`           | `<var> [values…]`           | Toggle a dvar between 0/1 or a list of values.      | —                                                       |
| `togglep`          | `<var> [values…]`           | Toggle a dvar and print the new value.              | —                                                       |
| `vstr`             | `<var>`                     | Execute the contents of a string dvar as a command. | —                                                       |
| `dvarlist`         | `[filter]`                  | List all dvars (optionally filtered).               | `^(?P<flags>[\w-]+)\s+(?P<name>\S+)\s+"(?P<value>.*)"$` |
| `dvardump`         | `<var>`                     | Dump a dvar's value, default, and flags.            | —                                                       |
| `dvar_float`       | `<var> <value> <min> <max>` | Register/define a float dvar with range.            | —                                                       |
| `dvar_int`         | `<var> <value> <min> <max>` | Register/define an integer dvar with range.         | —                                                       |
| `dvar_bool`        | `<var> <value>`             | Register/define a boolean dvar.                     | —                                                       |
| `setdvartotime`    | `<var>`                     | Set a dvar to the current server time.              | —                                                       |
| `setfromdvar`      | `<dest> <src>`              | Set one dvar's value from another dvar.             | —                                                       |
| `setfromlocString` | `<dest> <locString>`        | Set a dvar from a localized string reference.       | —                                                       |

## Config & flow control

| Command | Inputs      | Output / behaviour                              | Output regex |
| ------- | ----------- | ----------------------------------------------- | ------------ |
| `exec`  | `<file>`    | Execute a config file.                          | —            |
| `wait`  | `[frames]`  | Delay subsequent buffered commands by N frames. | —            |
| `cmd`   | `<command>` | Forward a command to the server.                | —            |
| `clear` | —           | Clear the console buffer.                       | —            |

## Filesystem

| Command             | Inputs        | Output / behaviour                                   | Output regex |
| ------------------- | ------------- | ---------------------------------------------------- | ------------ |
| `path`              | —             | Print the filesystem search paths.                   | —            |
| `fullpath`          | `[file]`      | Print the full OS path of a game file/directory.     | —            |
| `dir`               | `<dir> [ext]` | List files in a directory (optionally by extension). | —            |
| `fdir`              | `<filter>`    | Find files matching a wildcard filter.               | —            |
| `touchFile`         | `<file>`      | Touch/load a file to force it into the cache.        | —            |
| `fs_openedList`     | —             | List currently opened files.                         | —            |
| `fs_referencedList` | —             | List referenced (pure) files.                        | —            |
| `updatehunkusage`   | —             | Recompute/print hunk memory usage.                   | —            |

## Console channels

| Command                  | Inputs      | Output / behaviour                       | Output regex |
| ------------------------ | ----------- | ---------------------------------------- | ------------ |
| `con_channellist`        | —           | List all console output channels.        | —            |
| `con_visiblechannellist` | —           | List currently visible console channels. | —            |
| `con_showchannel`        | `<channel>` | Show output from a console channel.      | —            |
| `con_hidechannel`        | `<channel>` | Hide output from a console channel.      | —            |

## Key & input bindings

| Command                | Inputs            | Output / behaviour                        | Output regex                             |
| ---------------------- | ----------------- | ----------------------------------------- | ---------------------------------------- |
| `bind`                 | `<key> <command>` | Bind a key to a command.                  | —                                        |
| `bind2`                | `<key> <command>` | Bind a key with a secondary binding slot. | —                                        |
| `unbind`               | `<key>`           | Remove a key binding.                     | —                                        |
| `unbind2`              | `<key>`           | Remove a secondary key binding.           | —                                        |
| `unbindall`            | —                 | Remove all key bindings.                  | —                                        |
| `bindlist`             | —                 | List all current key bindings.            | `^"(?P<key>[^"]+)"\s+"(?P<command>.*)"$` |
| `bindaxis`             | `<axis> <action>` | Bind a controller/joystick axis.          | —                                        |
| `unbindallaxis`        | —                 | Remove all axis bindings.                 | —                                        |
| `bindgpbuttonsconfigs` | —                 | Apply gamepad button binding config.      | —                                        |
| `bindgpsticksconfigs`  | —                 | Apply gamepad stick binding config.       | —                                        |

---

# Client-only commands (not RCON-usable)

Listed for completeness — these run on the game client and cannot be driven through RCON.

## Networking & client connection

| Command                      | Inputs          | Description                                     |
| ---------------------------- | --------------- | ----------------------------------------------- |
| `connect`                    | `<address>`     | Connect to a server.                            |
| `reconnect`                  | —               | Reconnect to the last server.                   |
| `disconnect`                 | —               | Disconnect from the current server.             |
| `serverstatus`               | `[address]`     | Query a server's status + player list.          |
| `ping`                       | `<address>`     | Ping a server.                                  |
| `globalservers`              | —               | Query the master server list.                   |
| `localservers`               | —               | Scan the LAN for servers.                       |
| `showip`                     | —               | Print the local IP address.                     |
| `setenv`                     | `<var> <value>` | Set an environment variable.                    |
| `rcon`                       | `<command>`     | Send an RCON command to the connected server.   |
| `cmd`                        | `<command>`     | Forward a command to the server.                |
| `clientinfo`                 | —               | Print local client info.                        |
| `configstrings`              | —               | Dump the configstrings table.                   |
| `dwconnect` / `dwdisconnect` | —               | Demonware (online services) connect/disconnect. |
| `acceptInvitation`           | —               | Accept a game invitation.                       |

## Menus & UI

| Command                                                       | Inputs         | Description                    |
| ------------------------------------------------------------- | -------------- | ------------------------------ |
| `openmenu` / `closemenu`                                      | `<menu>`       | Open / close a UI menu.        |
| `toggleMenu`                                                  | —              | Toggle the in-game menu.       |
| `openScriptMenu`                                              | `<menu> <arg>` | Open a script-defined menu.    |
| `startSingleplayer`                                           | —              | Start a single-player session. |
| `AcceptInputFromAllControls` / `AcceptInputFromActiveControl` | —              | UI input-routing toggles.      |

## Squad / matchmaking

| Command                                                                      | Description                |
| ---------------------------------------------------------------------------- | -------------------------- |
| `selectSquad`, `joinSelectedSquad`, `PrintSquadStatus`                       | Squad selection / status.  |
| `inviteFriendsToSquad`, `clearAllInvites`                                    | Squad invitations.         |
| `setSquadNameAction`, `setSquadMemberAction`, `setHighlightedToCurrentSquad` | Squad edit actions.        |
| `setNewCustomName`, `getOldCustomName`                                       | Custom squad name editing. |

## Demos, video & audio (client)

| Command                                               | Inputs   | Description                           |
| ----------------------------------------------------- | -------- | ------------------------------------- |
| `record` / `stoprecord`                               | `[name]` | Start / stop client demo recording.   |
| `demo`                                                | `<name>` | Play back a demo.                     |
| `timedemo`                                            | `<name>` | Benchmark playback of a demo.         |
| `cinematic` / `ui_cinematic` / `unskippablecinematic` | `<file>` | Play a cinematic video.               |
| `logo`                                                | —        | Play the intro logo sequence.         |
| `vid_restart`                                         | —        | Restart the renderer.                 |
| `snd_restart`                                         | —        | Restart the sound system.             |
| `localizeSoundAliasFiles`                             | —        | (Re)load localized sound alias files. |
| `cubemapShot`                                         | —        | Capture a cubemap (dev/render tool).  |

## Ragdoll (debug/dev)

| Command                                                                      | Description                  |
| ---------------------------------------------------------------------------- | ---------------------------- |
| `ragdoll_clear`, `ragdoll_limit`, `ragdoll_selfpair`                         | Ragdoll simulation controls. |
| `ragdoll_baselerp_bone`, `ragdoll_bone`, `ragdoll_joint`, `ragdoll_pin_bone` | Ragdoll bone/joint debug.    |

## Client input actions (`+`/`-` binds)

These are **hold/release input commands** bound to keys — `+x` starts the action, `-x` ends it. They are client-side and not RCON-usable.

| Group     | Commands                                                                                                                                                                                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Movement  | `+forward`/`-forward`, `+back`/`-back`, `+left`/`-left`, `+right`/`-right`, `+moveleft`/`-moveleft`, `+moveright`/`-moveright`, `+moveup`/`-moveup`, `+movedown`/`-movedown`, `+strafe`/`-strafe`, `+speed`/`-speed`                                                                                 |
| Look      | `+lookup`/`-lookup`, `+lookdown`/`-lookdown`, `+mlook`/`-mlook`, `centerview`, `toggleView`                                                                                                                                                                                                          |
| Stance    | `+stance`/`-stance`, `+prone`/`-prone`, `+gostand`/`-gostand`, `gocrouch`, `goprone`, `togglecrouch`, `toggleprone`, `raisestance`, `lowerstance`, `+leanleft`/`-leanleft`, `+leanright`/`-leanright`                                                                                                |
| Combat    | `+attack`/`-attack`, `+melee`/`-melee`, `+melee_breath`/`-melee_breath`, `+reload`/`-reload`, `+usereload`/`-usereload`, `+activate`/`-activate`, `+sprint`/`-sprint`, `+breath_sprint`/`-breath_sprint`, `+holdbreath`/`-holdbreath`, `toggleads`, `leaveads`, `+toggleads_throw`/`-togleads_throw` |
| Grenades  | `+frag`/`-frag`, `+smoke`/`-smoke`, `+throw`/`-throw`, `+speed_throw`/`-speed_throw`                                                                                                                                                                                                                 |
| Vehicle   | `+gas`/`-gas`, `+reverse`/`-reverse`, `+handbrake`/`-handbrake`                                                                                                                                                                                                                                      |
| Spectator | `+toggleSpec`/`-toggleSpec`, `+specNext`/`-specNext`, `+specPrev`/`-specPrev`                                                                                                                                                                                                                        |
| Chat      | `chatmodepublic`, `chatmodeteam`, `+talk`/`-talk`                                                                                                                                                                                                                                                    |

> Engine typo (faithful to the dump): the release form of the ADS-throw toggle is spelled `-togleads_throw` while the press form is `+toggleads_throw`.

---

## Parsing regexes

> ⚠️ Unlike the CoD4x regexes (confirmed against captures in [../cod4x/rcon-system.md](../cod4x/rcon-system.md)), the patterns below are engine-standard templates and should be validated against a real capture before use.

### `status` — player rows (approximate)

```regex
^\s*(?P<num>\d+)\s+(?P<score>-?\d+)\s+(?P<ping>CNCT|ZMBI|\d+)\s+(?P<guid>[0-9a-fA-F]+)\s+(?P<name>.+?)\s+(?P<lastmsg>\d+)\s+(?P<address>(?:[0-9.]+|loopback|bot):?\d*)\s+(?P<qport>\d+)\s+(?P<rate>\d+)\s*$
```

### `serverinfo` / `systeminfo` — cvar pairs

```regex
\\(?P<key>[^\\]+)\\(?P<value>[^\\]*)
```

---

## Behavioural notes

- Only the **Server / admin** and server-side **Shared engine** commands above are usable over RCON; the client-only sections are informational.
- Stock CoD5 keys bans in `ban.txt` by GUID; prefer `clientkick`/`banClient` (slot id) over name-based variants because colour-coded names are hard to type.
- Outputs may be split across multiple packets; reassemble before applying regex.
- For confirmed ban/unban output formats, use the CoD4x reference: [../cod4x/rcon-commands.md](../cod4x/rcon-commands.md).
