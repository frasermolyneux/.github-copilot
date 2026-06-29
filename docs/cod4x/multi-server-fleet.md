# CoD4x — Multi-Server Fleet Topology

Running many CoD4X18 servers from one shared base game, and how that maps to portal config and secrets. Self-contained.

---

## 1. Shared base + per-server homes
A fleet shares one **base game** (`fs_basepath`) and gives each server its own **home** (`fs_homepath`). This saves disk and centralises assets. Each home holds configs, `plugins/`, ban lists, logs, and any mod under `fs_game` (`mods/<name>`).

```
CoD4X/
  BaseGame/   <- fs_basepath: main/*.iwd, zone/__lang__/*.ff, cod4x18_dedrun
  Server1/    <- fs_homepath: main/, mods/test/, plugins/, configs
  Server2/    <- fs_homepath
```

## 2. Launch model
Each server is one process distinguished by **port** and **homepath**:
```
cod4x18_dedrun +set fs_basepath "BaseGame" +set fs_homepath "Server1" \
  +set net_ip 192.168.1.30 +set net_port 28960 +set sv_hostname "Server 1" \
  +set fs_game "mods\test" +map mp_backlot
cod4x18_dedrun +set fs_basepath "BaseGame" +set fs_homepath "Server2" \
  +set net_port 28961 +set sv_hostname "Server 2" +map mp_backlot
```
First launch self-updates the binary and downloads libs. Ports typically increment (28960, 28961, …).

## 3. Per-server identity for portal
A server is uniquely addressed by **`net_ip:net_port`**; distinguished operationally by `sv_hostname` and `fs_game`. Each has its own `rcon_password`, ban list, and `plugins/`. The portal keys servers on host:port and stores per-server RCON credentials.

## 4. Secrets & config
- `rcon_password` per server → store in portal secret store (e.g. Key Vault), never in source/configs committed to repos.
- Plugins differ per home (`plugins/`); load via `loadplugin <name>` in that home's config.
- Shared `globalconfig.cfg` defines master/update server URLs.

## 5. Portal mapping
- Catalogue each server (host, port, hostname, gametype, RCON secret ref).
- Drive each over its own RCON connection (see [rcon-developer-guide.md](rcon-developer-guide.md)); fleet-wide actions iterate servers.
- A `portal-cod4x-plugin` deployed per home reports identity + events so the portal auto-discovers the fleet.
