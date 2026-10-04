---
title: "Herdr on macOS: Ghostty, Zsh, and Homebrew"
description: Terminal, shell, prompt, and package-manager choices that matter when you run Claude Code, Codex, and other Coding Agents side by side in Herdr on a Mac.
sidebar:
  order: 8
---

This note covers the macOS layers underneath Herdr. For the Herdr model, keys, and plugins, start with [Herdr Basics](../herdr-getting-started/). Windows users should read [Herdr on Windows](../herdr-terminal-windows/).

---

## 1. Outer Terminal: Ghostty

### Use a Nerd Font, and the Mono variant

A Starship prompt draws icons from the Private Use Area, and Herdr's symbol status indicators and sidebar depend on clean glyph rendering too. Without a [Nerd Font](https://www.nerdfonts.com/), the icons render as tofu boxes. Prefer the **Mono** variant (`JetBrainsMono Nerd Font Mono`): it forces icons into a single cell, so pane borders and the sidebar grid never shift.

### Let Option reach the shell as Alt

Herdr, your shell, and your editor all use `Alt` chords. macOS terminals must be told to treat Option as Alt, otherwise Option+Arrow prints `;3D` instead of moving by word (a case [Herdr documents](https://herdr.dev/docs/troubleshooting/)).

```text
# Treat the left Option key as Alt; keep the right one for composing special characters
macos-option-as-alt = left
```

### Keep terminal shortcuts out of Herdr's way

Herdr's prefix is `ctrl+b`, and prefix-free chords are most reliable on `ctrl+alt`, so the terminal itself should not claim those. My Ghostty Gist moves split navigation to `super+ctrl+arrows`. If Herdr is your multiplexer you rarely need the terminal's own splits, but you still want the chords conflict-free.

Other small settings that earn their keep with Agents:

- **Large scrollback** (`scrollback-limit = 100000`): Agent output is long, and you read it after the fact.
- **Copy on select** (`copy-on-select = true`).
- **Kitty graphics**: Ghostty supports it, so you can enable `[experimental] kitty_graphics = true` in Herdr's `config.toml`.

Reference Gist: [Ghostty config](https://gist.github.com/akunzai/34b4531b686a2dbf79ba8abc419e7492) (`config.ghostty`).

---

## 2. Shell: Make Non-Interactive Shells Work

The most expensive mistake is configuring only the shell *you* type into. Agents run commands through **non-interactive** shells that never read `.zshrc`, so a `PATH` that works in your pane fails inside the Agent's tool call.

Split responsibilities by when the file is read:

| File | Read by | Put here |
| :--- | :--- | :--- |
| `~/.zshenv` | Every zsh, including Agent tool shells | `PATH`, `XDG_BIN_HOME`, env vars, mise activation for non-interactive use |
| `~/.zprofile` | Login shells | Homebrew `shellenv` |
| `~/.zshrc` | Interactive shells only | Prompt, completions, aliases, plugins |

The pattern from my `.zshenv` Gist that does the heavy lifting:

```bash
# Non-interactive shells (Coding Agents) never reach ~/.zshrc, so load mise here.
if [[ $- != *i* ]]; then
  [[ -d /opt/homebrew/bin ]] && export PATH="/opt/homebrew/bin:$PATH"
  command -v mise &>/dev/null && eval "$(mise hook-env -s zsh)"
fi
```

Interactive shells get `mise activate zsh` in `.zshrc` instead. It hooks the prompt, which would be wasted work for an Agent.

### Pin `SSH_AUTH_SOCK` for long-lived Sessions

A Herdr Session outlives your SSH logins and terminal windows. If `SSH_AUTH_SOCK` points at a per-login forwarded socket, it dies with that login and commit signing breaks inside panes that are still alive. Pinning one socket path (`~/.ssh/agent.sock`) and self-healing it at shell startup fixes this. The full reasoning is in [SSH Keys & Security](../ssh-keys-security/); the Gist's `.zshenv` has the Keychain-aware version.

> [!WARNING]
> A Herdr server first started from an SSH login cannot reach the Keychain. If that happens, run `herdr server stop` and start Herdr again from a normal GUI terminal ([troubleshooting](https://herdr.dev/docs/troubleshooting/)).

Reference Gist: [Zsh profile](https://gist.github.com/akunzai/616796de59282c8bfdae3005511c588e) (`.zshenv`, `.zprofile`, `.zshrc`).

---

## 3. Prompt: Starship

[Starship](https://starship.rs/) is a single binary with one `starship.toml`. Two choices matter for Agent work:

- **Show the host only over SSH** (`ssh_only = true`), so a prompt tells you instantly whether a pane is local or remote.
- **Keep it fast** (`command_timeout`, and disable modules you do not use such as `nodejs` and `package`). The prompt redraws after every Agent command.

My config uses the Catppuccin palette to match the Herdr theme: [Starship Gist](https://gist.github.com/akunzai/f9e354c30162c396cf0a08915d876bc5). Initialize Starship **last** in `.zshrc`, after completions and plugins, so it does not delay everything else.

---

## 4. Install Everything with Homebrew and mise

Do not download installers by hand.

- **GUI software and fonts**: Homebrew.
- **Developer CLIs**: [mise](https://mise.jdx.dev/), so the *same* global `config.toml` also works on Windows.

```bash
brew install --cask ghostty font-jetbrains-mono-nerd-font
brew install mise zsh-autosuggestions zsh-fast-syntax-highlighting
```

```toml
# ~/.config/mise/config.toml
[tools]
herdr = "latest"
starship = "latest"
fzf = "latest"
zoxide = "latest"
ripgrep = "latest"
fd = "latest"
neovim = "latest"
```

```bash
mise install
```

> [!TIP]
> Herdr is also available as `brew install herdr`. Pick one source, as explained in [Herdr Basics](../herdr-getting-started/#install).

---

## Checklist

| Check | Command / Inspection | Expected |
| :--- | :--- | :--- |
| Font | Open Herdr, look at sidebar and Starship prompt | No tofu boxes, aligned borders |
| Alt keys | Press Option+Left at a shell prompt | Moves one word, no `;3D` |
| Agent tool shell | `zsh -c 'command -v mise'` | Resolves without opening `.zshrc` |
| Agent environment | Ask an Agent to run `which node` | Matches the version mise selects |
| Signing in a pane | `ssh-add -l` in a Herdr pane | Lists your key after reconnecting |
| Reattach | Close the terminal, run `herdr` | Session and Agents are still there |

---

## References

- [Herdr: Troubleshooting](https://herdr.dev/docs/troubleshooting/) — Option-as-Alt, Keychain, and server restart issues
- [Herdr: Keyboard](https://herdr.dev/docs/keyboard/) — Default shortcut conflicts per terminal
- [Ghostty configuration](https://ghostty.org/docs/config) — Option reference for the terminal settings above
- [Starship Configuration](https://starship.rs/config/) — Prompt modules, palettes, and performance options
- [mise documentation](https://mise.jdx.dev/) — Global tool configuration and shell activation
- [Homebrew](https://brew.sh/) — Package manager for macOS
- [Nerd Fonts](https://www.nerdfonts.com/) — Patched fonts with developer glyphs
