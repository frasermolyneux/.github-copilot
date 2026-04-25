# VS Code User Settings

To pick up the shared prompts, instructions, and agents from this repo when opening **any single repo** directly (not via a `.code-workspace`), add the following to your VS Code **User `settings.json`**.

Open via: `Ctrl+Shift+P` → **Preferences: Open User Settings (JSON)**

```jsonc
{
  "chat.promptFiles": true,
  "chat.agent.enabled": true,

  "chat.promptFilesLocations": {
    "../.github-copilot/.github/prompts": true
  },
  "chat.instructionsFilesLocations": {
    "../.github-copilot/.github/instructions": true,
    "../.github-copilot/.github": true
  },
  "chat.agentFilesLocations": {
    "../.github-copilot/.github/agents": true
  }
}
```

## How it works

Paths are **relative to each opened workspace folder**. When you open any repo that lives as a sibling of a `.github-copilot` clone, `..` resolves to the parent org folder and the shared content loads automatically.

| Open this folder | Resolves `.github-copilot` from |
| --- | --- |
| `C:\Git\gh-frasermolyneux\portal-repository` | `C:\Git\gh-frasermolyneux\.github-copilot` ✓ |
| `C:\Git\some-other-org\repo` (no sibling `.github-copilot`) | nothing → defaults only ✓ |

Missing locations are silently ignored — orgs without a `.github-copilot` repo just fall back to default Copilot behaviour.

## Multi-device

Enable **Settings Sync** (`Ctrl+Shift+P` → **Settings Sync: Turn On**) to replicate these settings across all your devices. The only convention to maintain on each device is:

> Clone `.github-copilot` as a sibling of the org's other repos (e.g. `C:\Git\<org>\.github-copilot`).

## When you don't need user settings

If you open one of the committed `.code-workspace` files in this repo (`portal.code-workspace`, `platform.code-workspace`, `gh-frasermolyneux.code-workspace`), the workspace already provides its own paths and user settings aren't required for that session.
