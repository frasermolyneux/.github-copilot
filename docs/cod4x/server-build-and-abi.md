# CoD4x — Server Build & Plugin ABI Versioning

Build the dedicated server, and how plugin ABI versioning gates compatibility. Self-contained, for reproducible portal-managed deployments.

---

## 1. Server build
- Output binary: `cod4x18_dedrun` (`.exe` on Windows). 32-bit **x86**.
- Toolchain: GCC/G++ via a `makefile`. Build types:
  - default — non-official, non-debug.
  - `make DEBUG=true` — debug build.
  - `make release` — official build that always self-updates.
- Version derived from git: `BUILD_NUMBER = git rev-list --count HEAD`, branch/revision baked in; server version from `src/version/version.c`.
- First run self-updates the binary and downloads required libs (master/update URLs in `globalconfig.cfg`).

## 2. Authentication library dependency
- A Steam auth shared library must load (e.g. `steamclient.so`). If C++ runtime deps are missing, auth fails and **all GUIDs read 0**. Install matching 32-bit `libstdc++`/`g++-multilib` on Linux. `sv_noauth 1` starts without client auth (unofficial clients) but loses GUIDs.

## 3. Plugin ABI versioning
- Plugins target the **handler version 4.000** (`PLUGIN_HANDLER_VERSION_MAJOR=4`, `MINOR=000`); declared in `OnInfoRequest`. Mismatch ⇒ refused load.
- Limits: `MAX_PLUGINS` 16; per plugin `PLUGIN_MAX_MALLOCS` 50, `PLUGIN_MAX_SOCKETS` 4.
- Build 32-bit x86 to match the server ABI. C/C++: GCC. D: `dub --arch=x86 --build=release`.

## 4. Install / load
- Put the lib in `fs_homepath/plugins/` (`.dll`/`.so`). Load with `loadplugin <name>` in config or `+loadplugin <name>` on commandline (omit extension). See [plugin-system.md](plugin-system.md), [plugin-developer-guide.md](plugin-developer-guide.md).

## 5. Portal deployment notes
- Pin server build + plugin handler version per environment for reproducibility.
- A `portal-cod4x-plugin` must rebuild against handler 4.000 and ship x86; written in C++ (SonarCloud build-wrapper + CodeQL in CI), and deployment drops into each server home (see [multi-server-fleet.md](multi-server-fleet.md)).
