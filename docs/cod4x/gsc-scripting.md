# CoD4x — GSC Scripting Integration

Server-side GSC scripting is how CoD4X18 customises gameplay, chat commands, HUD, and callbacks. A bespoke portal plugin almost always pairs a native plugin (events, HTTP) with GSC (in-game UI, chat commands). This is the self-contained model.

---

## 1. Loading scripts
- Create a `main_shared/` directory next to `main/`; mirror the stock path structure (`maps/mp/gametypes/...`).
- `.gsx` files take precedence over equally-named `.gsc` — use `.gsx` to override stock scripts or guard CoD4x-only functions, so the same mod also runs on vanilla.
- Scripts run only when invoked; you wire startup via the gametype callbacks.

## 2. Minimal welcome script
```c
init() {
    for(;;) {
        level waittill("connected", player);
        player thread welcome();
    }
}
welcome() {
    self endon("disconnect");
    self waittill("spawned_player");
    self iprintlnbold("Welcome " + self.name);
}
```
Bootstrap from `CodeCallback_StartGameType` (in `maps/mp/gametypes/_callbacksetup.gsc`): `thread welcome::init();`.

## 3. Language essentials
- Types: int (32-bit), float, string, array/dictionary, struct.
- Control: for/while/do-while, break/continue/return, if/else, switch, `wait`, `waittill`, `waittillframeend`.
- Operators incl. `%`, `<<`, `>>`. Context via `self`. Function pointers: `f = ::foo;` then `[[f]]();`; cross-file `ns\file::foo`.
- Events: `ent notify("event", arg)` / `ent waittill("event", arg)` for inter-thread comms.

## 4. Chat commands (`addScriptCommand`)
Register commands and catch them via `CodeCallback_ScriptCommand`:
- `SetDefaultCallbacks`: `level.callbackScriptCommand = maps\mp\gametypes\_globallogic::Callback_ScriptCommand;`
- `Callback_StartGameType`: `addScriptCommand("mycmd", 1);` (1 = min power).
- Handler receives `(command, arguments)`; `self` is the invoker (undefined for RCON). Use to drive portal features (votes, !report, !maps).

## 5. Native-plugin ↔ GSC bridge
A plugin registers new GSC functions and calls back into scripts:
- Register: `Plugin_ScrAddFunction("portalReport", &handler)` / `Plugin_ScrAddMethod`.
- Read params: `Plugin_Scr_GetInt/Float/String/Entity/Func`; return: `Plugin_Scr_AddInt/String/Bool/Array`.
- Call script: `Plugin_Scr_ExecThread` / `Plugin_Scr_ExecEntThread` + `Plugin_Scr_FreeThread`.
- Identity in GSC: `getsteamid64()`, `getplayerid64()`, `getPower()`. See [player-authentication.md](player-authentication.md), [plugin-system.md](plugin-system.md).

## 6. Portal usage
- `!report`/vote chat commands → plugin → portal HTTP; HUD enrichment via `setStat`/scoreboard.
- Keep gameplay logic in GSC, I/O and identity in the plugin.
