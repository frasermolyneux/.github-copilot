# CoD4x — Plugin System

The CoD4X18 plugin handler loads native shared libraries (`.dll`/`.so`) and dispatches lifecycle/runtime events to them. Plugins extend the server with new commands, GSC script functions, HTTP I/O, bans, telemetry, and more. This is the foundation for a future **portal-cod4x-plugin**.

> SDK header: `pinc.h` (include **once**). Function catalog: `plugins/function_declarations.h`. Events: `src/plugin_events.h`. Both C/C++ and D are supported.

---

## 1. ABI & limits
- Handler version **4.000** (`PLUGIN_HANDLER_VERSION_MAJOR/MINOR`). A plugin reports the handler version it targets in `OnInfoRequest`; mismatch = refused load.
- `MAX_PLUGINS` 16; per-plugin `PLUGIN_MAX_MALLOCS` 50, `PLUGIN_MAX_SOCKETS` 4.
- Architecture: **x86** (32-bit). Exports use `__cdecl`; the `PCL` macro handles cross-platform export.

## 2. Mandatory shape
```c
#include "../pinc.h"
PCL void OnInfoRequest(pluginInfo_t* info){       // mandatory
    info->handlerVersion.major = PLUGIN_HANDLER_VERSION_MAJOR;
    info->handlerVersion.minor = PLUGIN_HANDLER_VERSION_MINOR;
    info->pluginVersion.major = 1; info->pluginVersion.minor = 0;
    strncpy(info->fullName, "...", sizeof(info->fullName));
}
PCL int OnInit(){ /* register cmds/scr funcs */ return 0; } // 0 = success
```
`pluginInfo_t`: handlerVersion (mandatory), pluginVersion, fullName[64], shortDescription[128], longDescription[1024].

## 3. Event catalog (`enum PluginEvents`)
Export a callback whose **name and signature exactly match** the handler table to subscribe (resolved by symbol name at load). Names are case-exact. Key events:

- Lifecycle: `OnInfoRequest`, `OnInit`, `OnTerminate`, `OnModuleLoaded`, `OnFilesystemStarted`.
- Player: `OnPlayerConnect`, `OnPlayerDC`, `OnClientAuthorized`, `OnClientSpawn`, `OnClientEnterWorld`, `OnClientUserinfoChanged`, `OnClientCommand`, `OnClientMoveCommand`, `OnPlayerKilled`, `OnPlayerWantReservedSlot`, `OnPlayerGotAuthInfo`.
- Bans: `OnPlayerAddBan`, `OnPlayerGetBanStatus`, `OnPlayerRemoveBan`.
- Timing: `OnFrame`, `OnOneSecond`, `OnTenSeconds`.
- Level: `OnSpawnServer`, `OnExitLevel`, `OnPreFastRestart`, `OnPostFastRestart`, `OnPreGameRestart`, `OnPostGameRestart`.
- Net: `OnTcpServerPacket`, `OnUdpNetEvent`, `OnUdpNetSend`, `OnMessageSent`.
- Script: `OnScrUsercallFunction`, `OnScrUsercallMethod`. Anti-cheat: `OnScreenshotArrived`, `OnDemoArrived`.

Signatures vary: only `OnInit`/`OnInfoRequest` are mandatory. Some are zero-arg (`OnFrame`, `OnExitLevel`); others are not slot-only — e.g. `OnPlayerConnect(int clientnum, netadr_t* addr, char* pbguid, char* userinfo, int authstatus, char* deniedmsg, int len)`, `OnMessageSent(char* msg, int slot, qboolean* show, int mode)`. Match the prototype in `callback_declarations`.

`OnFrame` is the async pump — advance non-blocking HTTP/IO there.

## 4. Exported features (`Plugin_*`)
~150 functions. Highlights:
- **Output:** `Plugin_Printf/DPrintf/PrintWarning/PrintError`, `Plugin_ChatPrintf`, `Plugin_BoldPrintf`, `Plugin_G_LogPrintf`.
- **Cvars:** `Plugin_Cvar_Register{String,Bool,Int,Float}`, get/set; thread-safe getters.
- **Commands:** `Plugin_AddCommand(name, fn, defaultPower)`, `Plugin_RemoveCommand`, invoker context `Plugin_Cmd_GetInvoker{Slot,Clnum,Power,SteamID,Name}`.
- **Players:** `Plugin_GetPlayerID`, `Plugin_GetPlayerSteamID`, `Plugin_GetPlayerName`, `Plugin_DropClient`, `Plugin_BanClient`, `Plugin_SetStat/GetStat`.
- **Identity:** `Plugin_SteamIDToString/To64String`, `Plugin_StringToSteamID`, `Plugin_GUID2PlayerID`.
- **GSC bridge:** `Plugin_ScrAddFunction/Method`, `Plugin_Scr_Get*`, `Plugin_Scr_Add*`, `Plugin_Scr_ExecThread/ExecEntThread`, `Plugin_Scr_AllocString`.
- **HTTP:** blocking `Plugin_HTTP_GET/Request`; non-blocking `Plugin_HTTP_MakeHttpRequest` + `Plugin_HTTP_SendReceiveData` + `Plugin_HTTP_FreeObj`; pass extra header lines like `Content-Type: application/json\r\n`; form encoding helpers.
- **Net/TCP/UDP, FS, threads (`Plugin_CreateNewThread`, critical sections), timers.**

## 5. Commands & GSC
- Console/RCON command: `Plugin_AddCommand("name", handler, power)` then read args via `Plugin_Cmd_Argv/Argc`.
- New GSC function: `Plugin_ScrAddFunction("httpGet", &handler)` (e.g. `httpGet/httpGetJson/httpPostJson/json*`). Bridge into scripts via `Scr_ExecThread`; bind `addScriptCommand` chat commands (see [gsc-scripting.md](gsc-scripting.md)).

## 6. Build / distribute / load
- **C/C++:** GCC/G++ 32-bit (`-m32`), `-shared`; Windows links the import lib `-L.. -lcom_plugin -static-libgcc -static-libstdc++` → `.dll`; Linux `-fvisibility=hidden` → `.so`.
- **D:** `dub --arch=x86 --build=release`; call `Runtime.initialize()` in `OnInit`.
- Place built lib in `fs_homepath/plugins/`; load via `loadplugin <name>` (config or `+loadplugin`, omit extension); ABI version gates load.

Next: [plugin-developer-guide.md](plugin-developer-guide.md).
