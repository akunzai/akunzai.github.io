---
title: "Herdr on Windows: Windows Terminal, PowerShell 7, and Scoop"
description: Terminal, shell, prompt, and package-manager choices that matter when you run Claude Code, Codex, and other Coding Agents side by side in Herdr on native Windows.
sidebar:
  order: 9
---

This note covers the Windows layers underneath Herdr. For the Herdr model, keys, and plugins, start with [Herdr Basics](../herdr-getting-started/). Mac users should read [Herdr on macOS](../herdr-terminal-macos/).

Herdr supports native Windows through ConPTY. For the current list of supported and partial capabilities, see [Herdr: Windows support](https://herdr.dev/docs/windows-beta/).

> [!NOTE]
> Plugin support on Windows is in preview, kitty graphics rendering depends on the terminal, and CJK IME composition anchoring is only partial. The Windows list of Agent integrations is also narrower than on macOS and Linux.

---

## 1. Outer Terminal: Windows Terminal

### Use a Nerd Font, and the Mono variant

A Starship prompt draws icons from the Private Use Area, and Herdr's symbol status indicators and sidebar depend on clean glyph rendering too. Prefer the **Mono** variant so icons stay one cell wide and pane borders do not shift. In Windows Terminal's `settings.json`:

```json
"profiles": {
  "defaults": {
    "font": { "face": "JetBrainsMono Nerd Font Mono", "size": 16 }
  }
}
```

### Copy and paste without breaking Ctrl+C

My Gist binds `ctrl+c` to copy and `ctrl+v` to paste, and turns on `copyOnSelect`. Windows Terminal copies when text is selected and still sends the interrupt otherwise, so it is safe for Agent work where you often need to cancel a long run.

### Keep terminal shortcuts out of Herdr's way

Herdr's prefix is `ctrl+b`, and prefix-free chords are most reliable on `ctrl+alt`. My Windows Terminal Gist uses `alt+shift+z` and `alt+shift+d` for zoom and duplicate pane, which stay clear of both. Check the [keyboard guide](https://herdr.dev/docs/keyboard/) before binding more.

Reference Gist: [Windows Terminal settings](https://gist.github.com/akunzai/b4b1f394db3ceb399ba1976a30e540fa) (`settings.json`).

---

## 2. Shell: PowerShell 7

Use PowerShell 7 (`pwsh`) rather than Windows PowerShell 5.1.

Windows has no `.zshenv` equivalent, so the environment Agents see comes from your persistent **User** `PATH` and environment variables. Make sure tools are on that persistent `PATH`, not just added in a session. My profile provides `Add-Path`, `Remove-Path`, and `Get-Path` for this:

```powershell
Add-Path "C:\Tools"   # persistent, and applied to the current session too
Get-Path              # numbered list, marks entries that do not exist
```

Keep the profile split: `Microsoft.PowerShell_profile.ps1` for interactive behavior and `profile.ps1` for personal helpers. Worth copying from my profile Gist:

- PSReadLine with history-based inline prediction and Emacs-style `Ctrl+a/e/w` keys, so line editing matches macOS.
- `rgit` (run a Git command across child repositories), `ln`, and a UNIX-style `ls`, so muscle memory and Agent-generated commands transfer.
- `up`, which updates PowerShell modules, Scoop, and Winget in one go.

For commit signing inside long-lived panes, use the Windows OpenSSH Agent service described in [SSH Keys & Security](../ssh-keys-security/), so one agent serves every pane.

> [!CAUTION]
> My Gist includes shortcuts such as `cc.yolo` and `cd.yolo` that start Agents with permission prompts disabled. Only use these inside a disposable environment, and read the series [overview](../) on guardrails before copying them.

Reference Gist: [PowerShell profile](https://gist.github.com/akunzai/3af259df54dcdd6073293e6f8efe8dbf).

---

## 3. Prompt: Starship

The same `starship.toml` as on macOS works here, so a prompt looks identical on both. Initialize it near the end of the profile:

```powershell
if (Get-Command starship -ErrorAction SilentlyContinue) {
  Invoke-Expression (&starship init powershell)
}
```

Show the host only over SSH (`ssh_only = true`) and disable modules you do not use. Prompt redraws happen after every Agent command. See the [Starship Gist](https://gist.github.com/akunzai/f9e354c30162c396cf0a08915d876bc5).

---

## 4. Install Everything with Scoop and mise

Do not download installers by hand.

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

> [!TIP]
> Herdr is also available as `scoop install herdr` (the `main` bucket) and through Herdr's PowerShell installer. Pick one source, as explained in [Herdr Basics](../herdr-getting-started/#install).

---

## Checklist

| Check | Command / Inspection | Expected |
| :--- | :--- | :--- |
| Font | Open Herdr, look at sidebar and Starship prompt | No tofu boxes, aligned borders |
| Ctrl+C | Select text and press `ctrl+c`, then press it with no selection | Copies, then interrupts |
| Persistent PATH | Open a new terminal, run `Get-Path` | Tool directories listed and marked OK |
| Agent environment | Ask an Agent to run `where.exe node` | Matches the version mise selects |
| Signing in a pane | `ssh-add -l` in a Herdr pane | Lists your key |
| Reattach | Close the terminal, run `herdr` | Session and Agents are still there |

---

## References

- [Herdr: Windows support](https://herdr.dev/docs/windows-beta/) — Supported and partial capabilities on native Windows
- [Herdr: Install](https://herdr.dev/docs/install/) — PowerShell installer, mise, and update behavior
- [Herdr: Keyboard](https://herdr.dev/docs/keyboard/) — Default shortcut conflicts per terminal, including Windows Terminal
- [Windows Terminal documentation](https://learn.microsoft.com/en-us/windows/terminal/) — Settings, keybindings, and color schemes
- [PowerShell documentation](https://learn.microsoft.com/en-us/powershell/) — PowerShell 7 profiles and PSReadLine
- [Starship Configuration](https://starship.rs/config/) — Prompt modules, palettes, and performance options
- [mise documentation](https://mise.jdx.dev/) — Global tool configuration and shell activation
- [Scoop](https://scoop.sh/) — Command-line installer for Windows, including the `nerd-fonts` bucket
- [Nerd Fonts](https://www.nerdfonts.com/) — Patched fonts with developer glyphs
