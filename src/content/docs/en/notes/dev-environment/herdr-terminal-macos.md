---
title: "Herdr on macOS: Ghostty, Zsh, and Homebrew"
description: Terminal, shell, prompt, and package-manager choices that matter when you run Claude Code, Codex, and other Coding Agents side by side in Herdr on a Mac.
sidebar:
  order: 8
---

This note covers the macOS layers underneath Herdr. For the Herdr model, keys, and plugins, start with [Herdr Basics](../herdr-getting-started/). Windows users should read [Herdr on Windows](../herdr-terminal-windows/).

---

## Outer Terminal: Ghostty

### Use a Nerd Font, and the Mono variant

A Starship prompt configured with Nerd Font icons needs a [Nerd Font](https://www.nerdfonts.com/) or a compatible fallback. Prefer the **Mono** variant (`JetBrainsMono Nerd Font Mono`) for single-cell icons. Herdr's ordinary Unicode status symbols do not themselves require a Nerd Font; check both the prompt icons and pane alignment in your chosen font.

### Let Option reach the shell as Alt

Herdr, your shell, and your editor all use `Alt` chords. Configure Ghostty to send the left Option key as Alt:

```text
# Treat the left Option key as Alt; keep the right one for composing special characters
macos-option-as-alt = left
```

If Option+Arrow still prints `;3D` or `;3C`, add these bindings to `.zshrc`, after any `bindkey -e` or `bindkey -v` selection. Herdr preserves modified-arrow sequences; the shell must know what to do with them ([troubleshooting](https://herdr.dev/docs/troubleshooting/)).

```sh
bindkey $'\e[1;3D' backward-word
bindkey $'\e[1;3C' forward-word
```

### Keep terminal shortcuts out of Herdr's way

Herdr's prefix is `ctrl+b`, and prefix-free chords are most reliable on `ctrl+alt`, so the terminal itself should not claim those. My Ghostty Gist moves split navigation to `super+ctrl+arrows`. If Herdr is your multiplexer you rarely need the terminal's own splits, but you still want the chords conflict-free.

Other small settings that earn their keep with Agents:

- **Scrollback measured in bytes**: Ghostty's `scrollback-limit = 100000` is about 100 KB, not 100,000 lines. For example, `10000000` gives about 10 MB per terminal surface. Herdr retains its own pane history with `[advanced] scrollback_limit_bytes`.
- **Copy on select** (`copy-on-select = true`).
- **Kitty graphics**: Ghostty supports it, so you can use `[terminal] kitty_graphics = true` (enabled by default; `[experimental]` is a legacy compatibility key) in Herdr's `config.toml`.

Reference Gist: [Ghostty config](https://gist.github.com/akunzai/34b4531b686a2dbf79ba8abc419e7492) (`config.ghostty`).

---

## Shell: Make Non-Interactive Shells Work

The most expensive mistake is configuring only the shell *you* type into. Agent tools often run commands through **non-interactive** shells. A non-interactive zsh does not read `.zshrc`, so interactive-only tool setup may be missing. A child also inherits its parent's environment; the exact startup files depend on whether the harness launches a login shell, an interactive shell, or another shell entirely.

Split responsibilities by when the file is read:

| File | Read by | Put here |
| :--- | :--- | :--- |
| `~/.zshenv` | Every zsh, including Agent tool shells | `PATH`, `XDG_BIN_HOME`, env vars, mise activation for non-interactive use |
| `~/.zprofile` | Login shells | Homebrew `shellenv` |
| `~/.zshrc` | Interactive shells only | Prompt, completions, aliases, plugins |

The pattern from my `.zshenv` Gist that does the heavy lifting:

```bash
# Non-interactive zsh does not read ~/.zshrc; load the startup mise context here.
if [[ $- != *i* ]]; then
  # Prepend both Homebrew locations, with Apple silicon taking precedence.
  for brew_bin in /usr/local/bin /opt/homebrew/bin; do
    [[ -d "$brew_bin" ]] && path=("$brew_bin" $path)
  done
  typeset -U path
  command -v mise &>/dev/null && eval "$(mise hook-env -s zsh)"
fi
```

Interactive shells evaluate the activation script in `.zshrc`:

```sh
eval "$(mise activate zsh)"
```

The `.zshenv` hook above selects tools once, for the startup directory. If an Agent changes directories within the same shell, use `mise exec -- <command>` or `mise run <task>` to reload the target project's tools and environment. Keep `.zshenv` quiet and small: it runs for scripts too.

### Pin `SSH_AUTH_SOCK` for long-lived Sessions

A Herdr Session outlives your SSH logins and terminal windows. If `SSH_AUTH_SOCK` points at a per-login forwarded socket, it dies with that login and commit signing breaks inside panes that are still alive. For local signing, a stable local-agent socket (`~/.ssh/agent.sock`) with a startup health check avoids that per-login dependency. Preserve a forwarded socket when forwarding is intentional; replacing it changes which keys are available. The full reasoning is in [SSH Keys & Security](../ssh-keys-security/); the Gist's `.zshenv` has the Keychain-aware version.

GUI Git tools do not read `.zshenv`. For login-time key loading into both the fixed local Agent and the built-in macOS Agent, see [the SSH Agent + Keychain setup](../ssh-keys-security/#macos-gui-git-tools-load-keys-into-the-agent-the-app-actually-uses).

> [!WARNING]
> A server started through SSH or a background job may lack interactive Keychain access. If Keychain-backed tools fail, finish or save running work before `herdr server stop`, which terminates all pane processes, then start Herdr again from a GUI terminal ([troubleshooting](https://herdr.dev/docs/troubleshooting/)).

Reference Gist: [Zsh profile](https://gist.github.com/akunzai/616796de59282c8bfdae3005511c588e) (`.zshenv`, `.zprofile`, `.zshrc`).

---

## Prompt: Starship

[Starship](https://starship.rs/) is a single binary with one `starship.toml`. Two choices matter for Agent work:

- **Show the host only over SSH** (`ssh_only = true`), so a prompt tells you instantly whether a pane is local or remote.
- **Keep it fast** (`command_timeout`, and disable modules you do not use such as `nodejs` and `package`). This helps interactive panes; non-interactive Agent tool calls normally do not render Starship.

My config uses the Catppuccin palette to match the Herdr theme: [Starship Gist](https://gist.github.com/akunzai/f9e354c30162c396cf0a08915d876bc5). Initialize Starship **last** in `.zshrc`, after completions and plugins, so prompt initialization follows the rest of the interactive shell setup.

---

## Install Everything with Homebrew and mise

On a managed Mac, first confirm that Homebrew is available and your account can write to its prefix. Initial provisioning may require administrator rights. In some enterprise environments, elevation may require a separate request. Afterward, the prefix owner can install and update ordinary formulae. If the prefix is unwritable, do not run `sudo brew`; some casks may also require elevation.

- **GUI software and fonts**: Homebrew.
- **Developer CLIs**: [mise](https://mise.jdx.dev/), so the *same* global `config.toml` also works on Windows.

```bash
export HOMEBREW_NO_SUDO=1
brew install --cask --appdir="$HOME/Applications" ghostty
brew install --cask font-jetbrains-mono-nerd-font
brew install mise zsh-autosuggestions zsh-fast-syntax-highlighting
```

`HOMEBREW_NO_SUDO=1` makes Homebrew fail when it needs elevation. `--appdir="$HOME/Applications"` puts Ghostty in the user directory; the font cask writes to `~/Library/Fonts` by default. Casks that require sudo are rejected with this setting; follow the software installation rules for your environment if a tool needs system access.

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
| Agent environment | In the same project, compare `zsh -c 'node --version'` and `mise exec -- node --version` | Versions match; use `mise exec` if startup context differs |
| Signing in a pane | `ssh-add -l` in a Herdr pane | Lists your key after reconnecting |
| Reattach | Close the terminal, run `herdr` | Session and Agents are still there |

---

## References

- [Herdr: Troubleshooting](https://herdr.dev/docs/troubleshooting/) — Option-as-Alt, Keychain, and server restart issues
- [Herdr: Keyboard](https://herdr.dev/docs/keyboard/) — Default shortcut conflicts per terminal
- [Ghostty option reference](https://ghostty.org/docs/config/reference) — Option reference for the terminal settings above
- [Starship Configuration](https://starship.rs/config/) — Prompt modules, palettes, and performance options
- [mise shims and activation](https://mise.jdx.dev/dev-tools/shims.html) — Interactive activation and explicit execution for scripts
- [Zsh startup files](https://zsh.sourceforge.io/Doc/Release/Files.html) — Login and interactive startup order
- [Herdr config reference](https://herdr.dev/docs/config-reference/) — Kitty graphics and per-pane scrollback limits
- [Homebrew](https://brew.sh/) — Package manager for macOS
- [Nerd Fonts](https://www.nerdfonts.com/) — Patched fonts with developer glyphs
- [Homebrew Installation](https://docs.brew.sh/Installation) — Non-admin accounts, casks, and writable install locations
