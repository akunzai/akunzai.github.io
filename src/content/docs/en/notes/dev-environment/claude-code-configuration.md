---
title: "Claude Code: Gists and Cross-Platform Configuration"
description: Set up Claude Code user settings, the statusline helper, and CLI shortcuts on macOS and Windows without copying machine state.
sidebar:
  order: 10
---

I keep harness configuration separate from terminal setup. For the shell and tool PATH, start with the [macOS](../herdr-terminal-macos/) or [Windows](../herdr-terminal-windows/) terminal note. This page collects my Claude Code configuration; [Codex CLI](../codex-cli-configuration/) has different configuration and permission semantics.

## Configuration sources

| Gist | Contents |
| --- | --- |
| [Claude Code settings](https://gist.github.com/akunzai/b1151ff86099c4a12935a71dda2bd380) | `settings.json`, `statusline.sh`, and installation notes |
| [Unix shortcuts](https://gist.github.com/akunzai/c3aca93fbe7f715c0c3b1a220e25b4f9) | `.profile.local`, loaded by my interactive `.zshrc` |
| [PowerShell profile](https://gist.github.com/akunzai/3af259df54dcdd6073293e6f8efe8dbf) | Personal functions in `profile.ps1` |

Install the CLI using the [official setup guide](https://code.claude.com/docs/en/setup), then check it with `claude --version` and `claude doctor`. The settings gist configures an installed CLI; it does not install Claude Code.

## Choose the configuration scope

| File | Scope |
| --- | --- |
| `~/.claude/settings.json` | Your defaults across projects on this machine |
| `.claude/settings.json` | Shared project settings |
| `.claude/settings.local.json` | Personal overrides in a project |

On Windows, the home directory is normally `%USERPROFILE%`; `CLAUDE_CONFIG_DIR` changes the user configuration directory. See [settings files and precedence](https://code.claude.com/docs/en/settings) before deciding which file owns a preference.

Download the gist as a reference and merge the keys you want after backing up your current settings. It contains personal plugin choices and risk choices, including `sandbox.enabled: false`; copying the file does not enable a sandbox. Keep authentication, session history, and machine state out of the gist.

Language and model preferences can be shared. Review plugin dependencies, hook commands, the statusline command, Unix socket paths, and platform-specific tools on each machine. A home-relative path removes a username dependency, not a platform dependency.

## Install the statusline helper

The gist's helper displays model/context/cache usage, remaining quotas, and sandbox/directory/Git information. It needs Bash, `jq`, and Git on PATH; Windows can use Git Bash/MSYS2. Download and review `statusline.sh` using the gist's installation instructions, then configure the command in your user settings:

```json
{
  "language": "zh-TW",
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh"
  }
}
```

On macOS, make the helper executable; the command above invokes it directly.

### Windows: select Git for Windows explicitly

In my Windows setup, direct script invocation resolved `bash` to WSL rather than Git Bash. Override `statusLine.command` in the Windows user settings with an explicit `sh` invocation:

```json
{
  "statusLine": {
    "type": "command",
    "command": "sh ~/.claude/statusline.sh"
  }
}
```

In PowerShell, check which executables the PATH resolves:

```powershell
where.exe sh
where.exe bash
```

Confirm `sh` comes from Git for Windows. If it resolves elsewhere, use the intended `sh.exe`'s explicit path instead. This is a workaround for the observed Windows shell resolution, not a claim that every Windows installation selects WSL. The [official statusline guide](https://code.claude.com/docs/en/statusline#windows-configuration) also shows PowerShell alternatives. If you relocate the configuration directory, update the helper path as well.

## Shortcuts and permission modes

Unix aliases:

```sh
alias cc='claude'
alias cc.yolo='claude --dangerously-skip-permissions'
```

For PowerShell, `cc` and `cc.yolo` are functions that forward arguments:

```powershell
function cc { claude @args }
function cc.yolo { claude --dangerously-skip-permissions @args }
```

Use `cc` for normal sessions on either platform, or run `claude` directly. Reload the shell profile or open a new terminal after changing shortcuts.

`cc.yolo` selects `bypassPermissions`. Claude Code's [permission-mode documentation](https://code.claude.com/docs/en/permission-modes) says explicit deny rules still apply in this mode. This differs from Codex's `--yolo`, which disables its sandbox too. A tool rule such as `Read(...)` is not a general OS-level file-access boundary for every shell command; distinguish tool checks from process isolation.

For unattended work that must reject actions needing approval, consider `claude --permission-mode dontAsk` instead. Inspect `/permissions` and `/status` in a fresh session. Verify rules using disposable fixtures rather than real credential files.

## Recommended configuration for fewer prompts

Keep `permissions.defaultMode = "auto"` for normal sessions. Add a separate `~/.claude/sandbox.settings.json` containing the following overlay, then start with `cc --settings ~/.claude/sandbox.settings.json` on either platform:

```json
{
  "sandbox": {
    "enabled": true,
    "failIfUnavailable": true,
    "allowUnsandboxedCommands": false,
    "autoAllowBashIfSandboxed": true,
    "enableWeakerNetworkIsolation": false,
    "network": {
      "strictAllowlist": true,
      "allowedDomains": ["github.com", "*.npmjs.org"]
    },
    "filesystem": {
      "denyRead": ["~/.aws", "~/.azure", "~/.ssh", "~/.gnupg", "~/.env.local", "~/.config/gcloud", "~/.config/rclone"]
    }
  }
}
```

This is an example boundary, not a replacement for the existing user settings. Retain explicit tool deny rules and credential/environment filtering; adjust destinations and cache write paths to the project's needs. Remove unnecessary `excludedCommands` and socket allowances from their original settings sources. An empty array in an overlay does not clear inherited arrays: Claude merges lists.

The `--settings` strict-sandbox overlay prevents a repository from loosening the sandbox through the settings described in the [sandbox guide](https://code.claude.com/docs/en/sandboxing). Auto mode reviews actions; auto-allow runs eligible sandboxed Bash commands without manual approval. On native Windows, this sandbox cannot run and `failIfUnavailable` refuses startup; use WSL2 or external isolation.

If you deliberately need bypass mode, `cc.yolo --settings ~/.claude/sandbox.settings.json` retains this shell sandbox and tool deny rules, provided excluded commands have been removed. The boundary covers shell commands, not hooks, MCP servers, file tools, or browser capabilities. To isolate all of those, put the entire harness behind an external process/container/VM boundary with scoped mounts and credentials.

## Does switching YOLO affect prompt caching?

Claude Code's [cache documentation](https://code.claude.com/docs/en/prompt-caching#changing-permission-mode) states that permission-mode changes do not alter the system prompt or tool definitions, so changing the mode alone keeps the cache. The `opusplan` model-switch exception still applies. This does not mean a fresh conversation, expired cache, upgrade, model change, or tool/plugin change is free. Resume the same conversation with otherwise stable settings when comparing modes; no new YOLO cache experiment was performed here. More context is in [the session and cache note](/en/blog/cache-session-habits/).

## References

- [PowerShell Profile](https://gist.github.com/akunzai/3af259df54dcdd6073293e6f8efe8dbf) — Personal PowerShell functions and cross-platform shortcuts
- [Claude Code settings](https://code.claude.com/docs/en/settings) — Configuration scopes and precedence
