---
title: "Herdr on Windows: Windows Terminal, PowerShell 7, and Scoop"
description: Terminal, shell, prompt, and package-manager choices that matter when you run Claude Code, Codex, and other Coding Agents side by side in Herdr on native Windows.
sidebar:
  order: 9
---

This note covers the Windows layers underneath Herdr. For the Herdr model, keys, and plugins, start with [Herdr Basics](../herdr-getting-started/). Mac users should read [Herdr on macOS](../herdr-terminal-macos/).

Herdr's native Windows support is generally available and uses ConPTY. For the current list of supported and partial capabilities, see [Herdr: Windows support](https://herdr.dev/docs/windows-beta/).

> [!NOTE]
> Plugin support on Windows is in preview, kitty graphics rendering depends on the terminal, and CJK IME composition anchoring is only partial. The Windows list of Agent integrations is also narrower than on macOS and Linux.

---

## Outer Terminal: Windows Terminal

### Use a Nerd Font, and the Mono variant

A Starship prompt configured with Nerd Font icons needs a compatible font; Herdr's ordinary Unicode status symbols do not themselves require a Nerd Font. Prefer the **Mono** variant so icons stay one cell wide and pane borders do not shift. In Windows Terminal's `settings.json`:

```json
{
  "profiles": {
    "defaults": {
      "font": { "face": "JetBrainsMono Nerd Font Mono", "size": 16 }
    }
  }
}
```

Merge this fragment into your existing settings; retain the other profiles and settings.

### Copy and paste without breaking Ctrl+C

My Gist binds `ctrl+c` to copy and `ctrl+v` to paste, and turns on `copyOnSelect`. When Windows Terminal owns a text selection, `ctrl+c` copies it; without a selection, the key sends an interrupt. Dragging over a Herdr pane uses Herdr's own text copy. Use Windows Terminal's `ctrl+shift+v` to paste text into Herdr. Hold `Shift` while dragging when you need a Windows Terminal selection.

### Keep terminal shortcuts out of Herdr's way

Herdr's prefix is `ctrl+b`, and prefix-free chords are most reliable on `ctrl+alt`. My Windows Terminal Gist uses `alt+shift+z` and `alt+shift+d` for zoom and duplicate pane, which stay clear of both. Check the [keyboard guide](https://herdr.dev/docs/keyboard/) before binding more.

Reference Gist: [Windows Terminal settings](https://gist.github.com/akunzai/b4b1f394db3ceb399ba1976a30e540fa) (`settings.json`).

---

## Shell: PowerShell 7

Use PowerShell 7 (`pwsh`) rather than Windows PowerShell 5.1.

Child processes inherit the parent process environment. PowerShell has profiles, but a harness can bypass them with `-NoProfile`; do not rely on profile-only setup for every Agent tool call. Keep baseline tool directories on the persistent **User** `PATH`. Existing terminals and Herdr servers retain their old environment until restarted, so validate from a fresh terminal. My profile provides `Add-Path`, `Remove-Path`, and `Get-Path` for this:

```powershell
Add-Path "C:\Tools"   # persistent, and applied to the current session too
Get-Path              # numbered list, marks entries that do not exist
```

Keep the profile split: `Microsoft.PowerShell_profile.ps1` for interactive behavior and `profile.ps1` for personal helpers. Worth copying from my profile Gist:

- PSReadLine with history-based inline prediction and Emacs-style `Ctrl+a/e/w` keys, so line editing matches macOS.
- `rgit` (run a Git command across child repositories), `ln`, and a UNIX-style `ls`, so muscle memory and Agent-generated commands transfer.
- `up`, which updates PowerShell modules, Scoop, and Winget in one go. Its `winget upgrade --all --silent` can touch managed software or request elevation. On a managed device, update only user-scope tools you are allowed to manage instead of running the whole `up` shortcut.

`Add-Path` changes the User `PATH` by default. Without administrator rights, do not pass `-Scope Machine`.

For commit signing inside long-lived panes, you can use the Windows OpenSSH Agent service described in [SSH Keys & Security](../ssh-keys-security/), so one agent serves every pane. Enabling or starting a disabled service requires administrator rights. Until access is available, enter the private key's passphrase for each signature.

> [!CAUTION]
> My Gist includes shortcuts such as `cc.yolo` and `cd.yolo` that start Agents with permission prompts disabled. Only use these inside a disposable environment, and read the series [overview](../) on guardrails before copying them.

Reference Gist: [PowerShell profile](https://gist.github.com/akunzai/3af259df54dcdd6073293e6f8efe8dbf).

---

## Prompt: Starship

The same `starship.toml` as on macOS works here, so a prompt looks identical on both. Initialize it near the end of the profile:

```powershell
if (Get-Command starship -ErrorAction SilentlyContinue) {
  Invoke-Expression (&starship init powershell)
}
```

Show the host only over SSH (`ssh_only = true`) and disable modules you do not use. This helps interactive panes; non-interactive Agent tool calls normally do not render Starship. See the [Starship Gist](https://gist.github.com/akunzai/f9e354c30162c396cf0a08915d876bc5).

---

## Install Everything with Scoop and mise

Scoop, Herdr's official installer, and mise install into the user profile by default and need no elevation. If Windows Terminal or PowerShell 7 is missing, check the available installation sources. Winget's `--scope user` works only when a package offers a user-scope installer. In some enterprise environments, elevation may require a separate request when an installer asks for administrator rights.

- **GUI software and fonts**: Scoop (or Winget).
- **Developer CLIs**: [mise](https://mise.jdx.dev/), so the *same* global `config.toml` also works on macOS.

```powershell
scoop bucket add extras
scoop bucket add nerd-fonts
scoop install windows-terminal JetBrainsMono-NF-Mono mise
```

```toml
# %USERPROFILE%\.config\mise\config.toml
[tools]
herdr = "latest"
starship = "latest"
fzf = "latest"
zoxide = "latest"
ripgrep = "latest"
fd = "latest"
neovim = "latest"
```

```powershell
mise install
```

Scoop exposes `mise` itself, not the tools it installs. Add this to your PowerShell `$PROFILE` before Starship initialization, then reload the profile or open a new terminal:

```powershell
(&mise activate pwsh) | Out-String | Invoke-Expression
```

For Agent commands that bypass profiles, use `mise exec -- <command>` or `mise run <task>` to select tools and load project environment variables explicitly. If plain commands must work without activation, add mise's tool-shims directory (normally `%LOCALAPPDATA%\mise\shims`) to your User `PATH`; shims do not provide all environment features of explicit execution. See [mise on Windows](https://mise.jdx.dev/installing-mise.html#windows-scoop).

> [!TIP]
> Herdr is also available as `scoop install herdr` (the `main` bucket) and through Herdr's PowerShell installer. Pick one source, as explained in [Herdr Basics](../herdr-getting-started/#install).

---

## Checklist

| Check | Command / Inspection | Expected |
| :--- | :--- | :--- |
| Font | Open Herdr, look at sidebar and Starship prompt | No tofu boxes, aligned borders |
| Copy and interrupt | Drag-select text in a Herdr pane, then press `ctrl+c` with no selection | Selection is copied; `ctrl+c` sends an interrupt |
| Paste | Press `ctrl+shift+v` in a Herdr pane | Clipboard text appears in the pane |
| Persistent PATH | Open a new terminal, run `$env:PATH -split ';'` | Tool directories are listed; use `Test-Path <directory>` to check any entry |
| Agent environment | In a project that configures Node.js, compare `node --version` and `mise exec -- node --version` | Versions match; use explicit execution if profiles are bypassed |
| Signing in a pane | `ssh-add -l` in a Herdr pane | Lists your key if the OpenSSH Agent service is enabled |
| Reattach | Close the terminal, run `herdr` | Session and Agents are still there |

---

## References

- [Herdr: Windows support](https://herdr.dev/docs/windows-beta/) — Supported and partial capabilities on native Windows
- [Herdr: Install](https://herdr.dev/docs/install/) — PowerShell installer, mise, and update behavior
- [Herdr: Keyboard](https://herdr.dev/docs/keyboard/) — Default shortcut conflicts per terminal, including Windows Terminal
- [Windows Terminal documentation](https://learn.microsoft.com/en-us/windows/terminal/) — Settings, keybindings, and color schemes
- [PowerShell documentation](https://learn.microsoft.com/en-us/powershell/) — PowerShell 7 profiles and PSReadLine
- [Starship Configuration](https://starship.rs/config/) — Prompt modules, palettes, and performance options
- [mise installation and shell activation](https://mise.jdx.dev/installing-mise.html) — Scoop setup and PowerShell activation
- [mise shims](https://mise.jdx.dev/dev-tools/shims.html) — Tool discovery without interactive activation
- [Scoop](https://scoop.sh/) — Command-line installer for Windows, including the `nerd-fonts` bucket
- [Nerd Fonts](https://www.nerdfonts.com/) — Patched fonts with developer glyphs
- [Windows Terminal Actions](https://learn.microsoft.com/en-us/windows/terminal/customize-settings/actions) — Copy, paste, and `ctrl+c` key behavior
- [WinGet install](https://learn.microsoft.com/en-us/windows/package-manager/winget/install) — `--scope user` and install-scope limits
