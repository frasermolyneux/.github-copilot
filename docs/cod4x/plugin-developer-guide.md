# CoD4x — Plugin Developer Guide

End-to-end guide for building a CoD4X18 plugin — the basis for **portal-cod4x-plugin**. Read [plugin-system.md](plugin-system.md) (API/events) and [player-authentication.md](player-authentication.md) (identity) first; this guide is the build-it walkthrough.

---

## 1. Choose a language
- **C++** — the chosen language for `portal-cod4x-plugin`: native C-ABI match, SonarCloud + CodeQL coverage, clean static-linked x86 build. Include `pinc.h` once.
- **C** — also canonical; same SDK/build.
- **D** — supported but avoid (no SonarCloud/CodeQL coverage, ships a runtime): declare C functions `extern(C)`, init with `Runtime.initialize()`.

## 2. Minimum viable plugin
```c
#include "../pinc.h"
PCL void OnInfoRequest(pluginInfo_t* i){
    i->handlerVersion.major = PLUGIN_HANDLER_VERSION_MAJOR;
    i->handlerVersion.minor = PLUGIN_HANDLER_VERSION_MINOR;
    strncpy(i->fullName,"portal-cod4x",sizeof(i->fullName));
}
PCL int OnInit(){ Plugin_Printf("portal plugin up\n"); return 0; }
```
Subscribe to events by exporting matching callbacks: `OnPlayerConnect`, `OnClientAuthorized`, `OnFrame`, etc. (full list/signatures in [plugin-system.md](plugin-system.md)). Names + signatures must match exactly; only `OnInit`/`OnInfoRequest` are mandatory.

## 3. Add a chat/console command
```c
void Cmd_Portal(){ int p=Plugin_Cmd_GetInvokerPower();
    Plugin_ChatPrintf(Plugin_Cmd_GetInvokerSlot(), "hi, power=%d", p); }
// in OnInit: Plugin_AddCommand("portal", Cmd_Portal, 1);
```
Read args (`Plugin_Cmd_Argv/Argc`), invoker (`Plugin_Cmd_GetInvoker*`), gate by power, optional whitelist.

## 4. Add a GSC function
```c
Plugin_ScrAddFunction("portalReport", &Scr_PortalReport); // in OnInit
// handler: read params Plugin_Scr_Get*, return via Plugin_Scr_AddString etc.
```
Pair with `addScriptCommand` for in-game chat commands. Call back into scripts with `Plugin_Scr_ExecEntThread`.

## 5. Talk to the portal over HTTP (non-blocking)
Pump in `OnFrame`: `Plugin_HTTP_MakeHttpRequest(url, "POST", body, len, "Content-Type: application/json\r\n")` → `Plugin_HTTP_SendReceiveData` (1=done, -1=fail) → read `recvmsg.data+headerLength` → `Plugin_HTTP_FreeObj`. Keep an array of in-flight requests and advance them each frame. Push connect/spawn/kill events as JSON to portal-repository.

## 6. Identity, bans, stats
- `Plugin_GetPlayerID/SteamID/Name`, key on `playerid`.
- `Plugin_BanClient(slot, minutes, invoker, reason)` (minutes `-1` = permanent; invoker `0` if none; reason may be NULL), IP bans, `Plugin_FormatBanMessage`.
- `Plugin_SetStat/GetStat` for HUD/scoreboard enhancements.

## 7. Threads, FS, cvars
- `Plugin_CreateNewThread` + critical sections (`Plugin_EnterCriticalSection`), check `Plugin_IsMainThread`. Limits: 50 mallocs, 4 sockets/plugin.
- Config via `Plugin_Cvar_Register*`; persist via `Plugin_FS_*`.

## 8. Build, distribute, load
- C++ (Windows): `g++ -m32 -O1 -c *.cpp` then `g++ -m32 -shared -static-libgcc -static-libstdc++ -o name.dll *.o -L.. -lcom_plugin`.
- C++ (Linux): `g++ -m32 -fvisibility=hidden -c *.cpp` then `g++ -m32 -shared -o name.so *.o`.
- CI: wrap the compile in the SonarCloud build-wrapper (C/C++ has no automatic analysis); CodeQL covers C++ too.
- Drop in `fs_homepath/plugins/`; `loadplugin <name>` (config) or `+loadplugin <name>`; ABI v4.000 gates load. Return 0 from `OnInit`.

## 9. portal-cod4x-plugin checklist
- Push player/connect/kill events to portal (HTTP, non-blocking, `OnFrame`).
- Provide portal-controlled chat commands; gate by power.
- Enrich HUD via stats; report bans bidirectionally; emit structured logs (`Plugin_PrintAdministrativeLog`).
- Keep secrets in cvars/env, not source; x86 release builds; honour 16-plugin/limit caps.
- Language is **C++** (SonarCloud + CodeQL covered; native ABI; static-linked x86).
