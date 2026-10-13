---
title: "Herdr Basics: A Multiplexer for Running Coding Agents Side by Side"
description: What Herdr is, how its workspace, tab, and pane model works, the shared configuration and plugins worth keeping, and where macOS and Windows differ.
sidebar:
  order: 7
---

Herdr is a terminal multiplexer built for Coding Agents. Every Agent (Claude Code, Codex, GitHub Copilot CLI, and others) lives in a real terminal pane. Herdr tracks whether each one is working, blocked, or done, and the whole Session survives closing your terminal window.

This note covers the part that is identical on every machine: the mental model, daily keys, configuration, and plugins. Platform setup is split out:

- [Herdr on macOS: Ghostty, Zsh, and Homebrew](../herdr-terminal-macos/)
- [Herdr on Windows: Windows Terminal, PowerShell 7, and Scoop](../herdr-terminal-windows/)

My real configuration lives in a few Gists that I keep changing, so these notes record **what matters and why**, and link to the Gist for the current details.

---

## Where Herdr Sits

**Herdr does not replace your terminal setup, it sits on top of it.** A weak font, a swallowed shortcut, or a shell that only works when you open it by hand shows up in every pane, multiplied by the number of Agents you run.

```mermaid
flowchart TD
    A["◆ Outer terminal<br/>Ghostty · Windows Terminal"] --> B["◆ Herdr<br/>client · server · plugins"]
    B --> C["◆ Shell<br/>zsh · PowerShell 7"]
    C --> D["◆ Coding Agent<br/>claude · codex · copilot"]
    E["◈ Package manager<br/>Homebrew · Scoop · mise"] -.installs.-> A
    E -.installs.-> B
    E -.installs.-> C
```

| Layer | Job | What goes wrong when neglected |
| :--- | :--- | :--- |
| Outer terminal | Fonts, key delivery, graphics | Broken glyphs, `;3D` garbage, swallowed shortcuts |
| Herdr | Panes, Agent state, Session persistence | Hard to read sidebar, no state restore |
| Shell | Environment, `PATH`, prompt | Agent cannot find tools you can |
| Package manager | Reproducible installs | Every machine drifts differently |

Most "Herdr is flaky" reports trace back to the layer below the one being blamed. The two platform notes cover those lower layers.

---

## Install

Install it with the package manager you already use, and pick **one** source per machine:

```bash
brew install herdr      # macOS (Homebrew)
scoop install herdr     # Windows (Scoop, main bucket)
mise use -g herdr       # any platform (mise)
```

There is also a direct installer for each platform on the [install page](https://herdr.dev/docs/install/). `herdr update` only applies to direct installs. Package-managed installs must be upgraded with that package manager, and a compatible running server keeps the old version while the updated client can reconnect. Restart only when you need server-side changes: `herdr server stop` terminates pane processes. Finish or save running work first.

On a managed device, first check which installation methods are available. Scoop and mise normally install under the Windows user profile. On macOS, your account must be able to write to the Homebrew prefix before installing ordinary formulae without elevation. In some enterprise environments, elevation may require a separate request; follow the local installation rules when an installer asks for administrator rights.

---

## The Mental Model

| Concept | Meaning | How I use it |
| :--- | :--- | :--- |
| Workspace | Top-level container for a project | One per repository or task |
| Tab | A layout inside a Workspace | Separate views: agents, logs, server, review |
| Pane | A real terminal | One Agent or one shell per Pane |
| Session | A persistent server namespace | The default one is enough; add named Sessions only for fully separate setups |
| Client / server | The server owns panes, the client is the UI | Detach the client and everything keeps running |

Each Agent reports one of these states in the sidebar:

| State | Meaning |
| :--- | :--- |
| `blocked` | Needs input, approval, or a decision |
| `working` | Actively running |
| `done` | Finished, and you have not looked yet |
| `idle` | Finished or waiting, and already seen |
| `unknown` | Agent detected, but state cannot be classified confidently |

Giving each project its own Workspace is what keeps this sidebar readable. Jump to whatever is `blocked` first.

---

## A First Session

```bash
cd ~/code/my-project
herdr            # starts or attaches to the background session
claude           # run an Agent in the pane; Herdr detects it
```

Close the terminal, or press `prefix+q` to detach. The server and every Agent keep running. Run `herdr` again to reattach. `herdr server stop` terminates the pane processes; the next launch restores the saved layout, rather than keeping those processes alive.

Herdr is mouse-native, so you can start by clicking and dragging. The keyboard layer is optional. The default prefix is `ctrl+b`: press it, release, then press an action key.

| Action | Key |
| :--- | :--- |
| New Tab | `prefix+c` |
| Split right / down | `prefix+v` / `prefix+minus` |
| Move between panes | `prefix+h/j/k/l` |
| Workspace navigation | `prefix+w` |
| Detach | `prefix+q` |
| Show every binding | `prefix+?` |

> [!TIP]
> `prefix+g` opens the Goto picker, which lists every Agent and terminal grouped by Workspace. Press `b` there to filter blocked Agents only.

### Working remotely

- **SSH, then Herdr**: `ssh you@server`, then `herdr`. It behaves like tmux on that machine, and also works from a phone SSH client.
- **`herdr --remote <host>`**: a local UI attached to the remote Session, including local clipboard image paste.
- **Saved machines**: `herdr machine add <host> --label <label>` keeps several machines in one window.

---

## Integrations

Herdr combines process detection, terminal output, and integration reports to recognize Agents and their state. To support resuming the *same* conversation after a server restart, install a current integration for each supported Agent:

```bash
herdr integration install claude
herdr integration install codex
herdr integration status
```

The [Agents page](https://herdr.dev/docs/agents/) lists every supported Agent and which ones report their own state. Windows supports a narrower set of integrations than macOS and Linux.

| What survives | Process keeps running | Layout returns | Agent conversation resumes |
| :--- | :---: | :---: | :---: |
| Detach and reattach | Yes | Yes | Yes |
| Server restart | No | Yes | With a valid native session reference and restore enabled |

Restore also requires a current integration that reports a valid session reference and `[session] resume_agents_on_restore = true` (the default). Installation alone is not a guarantee; unsupported or stale references return as ordinary shells. See [session restore](https://herdr.dev/docs/session-state/#native-agent-session-restore).

---

## Configuration Worth Keeping

My [Herdr settings Gist](https://gist.github.com/akunzai/5fca04af65c7ce705be190135191e8e9) contains the main `config.toml` and the recommended cache-hit plugin configuration. On macOS, the main config lives at `~/.config/herdr/config.toml`. These are the settings I would carry to a new machine:

| Setting | Why |
| :--- | :--- |
| `[theme] name = "catppuccin"` | Matches the prompt; consistent contrast in the sidebar |
| `[ui] status_indicators = "symbols"` | Agent state readable at a glance, no color needed |
| `[ui] show_agent_labels_on_pane_borders = true` | Know which Agent owns a pane when you zoom out |
| `[ui.sound] enabled = true` | Hear when an Agent finishes or blocks, then switch back |
| `[[keys.command]]` entries | Bind plugin actions to `prefix+...` keys |

Prefix-free chords are most reliable on `ctrl+alt`, which terminals and desktops leave almost untouched. Check the [keyboard guide](https://herdr.dev/docs/keyboard/) before binding anything else.

### Gist files and cache-hit display

Gists have a flat layout. Copy each configuration file to its intended location:

| Gist file | Target | Purpose |
| :--- | :--- | :--- |
| [`config.toml`](https://gist.github.com/akunzai/5fca04af65c7ce705be190135191e8e9#file-config-toml) | `~/.config/herdr/config.toml` on macOS | Main settings, keybindings, and Catppuccin colors for the sidebar's `$cache` token |
| [`config.json`](https://gist.github.com/akunzai/5fca04af65c7ce705be190135191e8e9#file-config-json) | `config.json` in cache-hit's configuration directory | Recommended cache display options |
| [`plugins.json`](https://gist.github.com/akunzai/5fca04af65c7ce705be190135191e8e9#file-plugins-json) | Reference only | Machine-specific installed-plugin snapshot; let Herdr generate it locally |

After installing cache-hit, find its configuration directory:

```sh
herdr plugin config-dir cache-hit
```

Copy `config.json` from the Gist directly into that directory (defaulting to `~/.config/herdr/plugins/config/cache-hit/config.json`; verify with the command above).

The suggested configuration applies these options to `agy`, `codex`, `claude`, and `opencode`:

| Option | Value | Why |
| :--- | :--- | :--- |
| `show_percentage` | `true` | Show the cache hit rate for every supported Agent |
| `show_read_tokens` | `false` | Hide the read/cached Token count to keep the sidebar compact |

These JSON options control which values appear; the `$cache` rules in `config.toml` control their colors. Keep the current JSON in the Gist rather than duplicating it here. See the [upstream configuration reference](https://github.com/e-kotov/herdr-cache-hit/blob/main/USERGUIDE.md#configuration-reference) for other options.

### Plugins

Plugins are installed per machine and recorded in `plugins.json`. That file contains absolute paths, so treat it as a reference and not something to copy.

| Plugin | Purpose | macOS | Windows |
| :--- | :--- | :---: | :---: |
| [herdr-sidebar](https://github.com/alexarthurs/herdr-sidebar) | File explorer and source control pane | ✓ | ✓ |
| [herdr-hunk-diff](https://github.com/jhochenbaum/herdr-hunk-diff) | Review Agent diffs, send comments back | ✓ | ✓ |
| [herdr-cache-hit](https://github.com/e-kotov/herdr-cache-hit) | Prompt-cache hit rate per Agent | ✓ | ✓ (Git Bash) |
| [terminal-browser](https://github.com/zenbu-labs/terminal-browser) | Browser inside a pane | ✓ | WSL only |

The platform columns reflect upstream manifests and installation requirements. Hunk provides prebuilt Windows binaries for x64; Windows ARM needs a custom hunk binary. terminal-browser requires WSL on Windows.

### Sidebar waiting for a font install

`Installing JetBrainsMono Nerd Font… / Trying winget…` is herdr-sidebar's first-run font setup, separate from installing the plugin. In the [reviewed implementation](https://github.com/alexarthurs/herdr-sidebar/blob/081ed133f3faa377438b51ce435fe8a87c439593/plugins/herdr-sidebar/src/fontsetup.rs), the Windows installer waits for winget without a timeout and captures its output instead of streaming it. A long wait alone cannot distinguish a slow download from a stuck installer.

Focus the sidebar pane and press `Esc` to stop waiting and use emoji icons. **The background install continues.** Check the existing winget process and its logs before retrying; do not start a second install. Installing a font also does not select it in your terminal: choose `JetBrainsMono Nerd Font Mono` in the active terminal profile afterward. See the [Windows font setup](../herdr-terminal-windows/#use-a-nerd-font-and-the-mono-variant).

For unattended first-launch checks, the reviewed sidebar supports `HERDR_SIDEBAR_FONT_PROMPT=off` and `HERDR_SIDEBAR_ICONS=emoji`. Set them in the environment inherited by Herdr before starting a new server; setting them only in an existing pane does not change the server's environment. Do not stop a working server just to apply them: save or finish pane work first.

### Plugin prerequisites

cache-hit now supports native Windows Herdr through Git for Windows; WSL is not required. It needs Bash and `jq`. Install Python as well for OpenCode, view sorting, and session recovery; Python also improves Codex transcript selection after prompt edits. On macOS, the built-in Bash 3.2 works.

Hunk needs Node.js 22.12+ and its bundled npm during plugin installation, and installs its own hunk binary. Go and Rust are only needed for source builds of cache-hit's AGY helper and herdr-sidebar, respectively; normal installation downloads release binaries.

#### macOS

```sh
brew install git jq mise
mise use -g python@latest
mise use -g node@lts # Only if using hunk
```

If mise is already installed, omit it from the Homebrew command. Alternatively, use `brew install python` for Python or `mise use -g aqua:jqlang/jq@latest` for `jq`.

#### Windows

Run in PowerShell:

```powershell
winget install --id Git.Git --exact --source winget --silent --accept-source-agreements --accept-package-agreements --disable-interactivity
winget install --id jqlang.jq --exact --source winget --silent --accept-source-agreements --accept-package-agreements --disable-interactivity
winget install --id jdx.mise --exact --source winget --silent --accept-source-agreements --accept-package-agreements --disable-interactivity
```

These flags accept source and package agreements and disable prompts; they do not impose a timeout or guarantee that an installer needs no elevation. For a stalled command, inspect the process and [WinGet logs](https://learn.microsoft.com/en-us/windows/package-manager/winget/install#log-files) before retrying.

Open a new PowerShell window, then install the runtimes:

```powershell
mise use -g python@latest
mise use -g node@lts # Only if using hunk
```

Add Git for Windows's `bin` directory (normally `C:\Program Files\Git\bin`; adjust for your installation) to your user `Path`. `Git\cmd` alone does not expose `sh.exe`. cache-hit enters through `sh` and then starts Git Bash, avoiding the WSL `bash.exe` alias.

#### Make tools visible to Herdr

For mise-managed tools, put its shims on the `PATH` inherited by Herdr: `~/.local/share/mise/shims` on macOS, or `%LOCALAPPDATA%\mise\shims` on Windows. Interactive shell activation alone does not configure GUI-launched processes. Restart the terminal and Herdr after updating `PATH`.

On Windows, check from PowerShell that `sh` resolves to Git for Windows and that Git Bash can find the dependencies:

```powershell
where.exe sh
sh -c 'bash --version; jq --version; python3 --version'
```

Install plugins through Herdr to obtain their current manifests rather than copying the Gist's machine-specific `plugins.json` snapshot. The Gist's sidebar binding uses `herdr-sidebar.open-sidebar`; on Windows, change it to `herdr-sidebar.open-sidebar-windows`.

---

## Herdr Skill for Agents

The [`herdr` skill](https://github.com/herdrdev/herdr/tree/main/skills/herdr) teaches an Agent how to drive Herdr itself. Once installed, an Agent running inside a pane can open and control other panes, tabs, and workspaces, which covers cases like these:

- Open a pane that runs `ssh` to a remote host, then send commands and read the output back.
- Run [terminal-browser](https://github.com/zenbu-labs/terminal-browser) in a split pane to operate a web page inside the terminal.
- Start another harness CLI (Claude Code, Codex, and so on) in a new pane, hand it a task, and watch its state.

Install it with the [Skills CLI](https://github.com/akunzai/skills-manager), which records it in `~/.agents/skills.json`:

```sh
skills add herdrdev/herdr --skill herdr
```

The skill instructs the Agent to check `HERDR_ENV=1` before controlling Herdr and to use it only when explicitly requested. Whether it is discovered or loaded depends on the harness and skill installation; the environment variable alone does not load it. For the browser use case, also install the terminal-browser skill alongside the plugin.

---

## On Using Gists as the Source of Truth

I considered embedding the Gists directly into these pages and decided not to:

- An embed loads third-party JavaScript that writes into the page at load time. It renders nothing without it, and it cannot be indexed by the site's search.
- Gists change; an embedded snapshot in an article is still a stale copy in a reader's head.
- A link plus the *reason* for each setting stays true longer than the setting itself.

So use the Gists as the latest implementation and these notes as the reasoning. Gists are personal configurations, not compatibility specifications. If they differ from these notes, check the official documentation for your installed version before copying a setting.

### Installation prompt for an Agent

The Gist's [README](https://gist.github.com/akunzai/5fca04af65c7ce705be190135191e8e9#file-readme-md) provides installation steps and maps files to their destinations. Use it together with each plugin's upstream README. Copy this prompt into your Agent:

```text
Set up Herdr and the compatible recommended plugins from this note on this machine:
https://akunzai.github.io/en/notes/dev-environment/herdr-getting-started/
First read the current README.md and configuration files in this Gist:
https://gist.github.com/akunzai/5fca04af65c7ce705be190135191e8e9
Also read each selected plugin's upstream README and manifest for installation
commands, prerequisites, supported OS/architecture, and minimum Herdr version.

Detect the OS, architecture, existing tools, and installation sources. Reuse
installed tools and install only missing prerequisites for compatible plugins.
Report unsupported plugins; do not set up WSL solely for terminal-browser.
Back up existing settings, merge relevant options, adapt paths and action IDs
to this platform, and preserve unrelated settings. Do not copy plugins.json;
install through Herdr to generate the local registry. Follow the current Gist
README's installation steps and file mapping.

Use non-interactive installation where supported. For winget, use an exact ID,
an explicit source, silent mode, agreement flags, and --disable-interactivity.
Give each installation command a finite wait budget. If it shows no progress
for 120 seconds, capture its process state and logs and diagnose before retrying;
this is a diagnostic threshold, not proof of failure. Do not run duplicate
installers or wait indefinitely on an interactive TUI. If sidebar font setup
is waiting, focus that pane and press Esc when pane control is available;
otherwise report the required keypress. Esc leaves the background install running.
Do not stop an active Herdr server without first arranging to save/finish its work.

Verify installation separately from first launch: report tool versions, plugin
registry entries, dependency visibility in Herdr's environment, and which plugins
actually opened successfully. Report font installation and terminal font selection
separately. List any manual steps, errors, logs, and checks you could not perform.
```

---

## References

- [Herdr: Quick start](https://herdr.dev/docs/quick-start/) — First session, mouse use, and basic keys
- [Herdr: Concepts](https://herdr.dev/docs/concepts/) — Workspace, tab, pane, Agent states, Session, and modes
- [Herdr: How to work with Herdr](https://herdr.dev/docs/how-to-work/) — Local, SSH, phone, and `--remote` workflows
- [Herdr: Session state and restore](https://herdr.dev/docs/session-state/) — What survives detach, restart, and update
- [Herdr: Install](https://herdr.dev/docs/install/) — Homebrew, mise, Nix, and direct installation, plus update behavior
- [Herdr: Keyboard](https://herdr.dev/docs/keyboard/) — Prefix model, default keymap, and safe prefix-free chords
- [Herdr: Agents and Integrations](https://herdr.dev/docs/agents/) — Supported Agents and `herdr integration install`
- [cache-hit: Prerequisites and compatibility](https://github.com/e-kotov/herdr-cache-hit#prerequisites--compatibility) — Bash, jq, Python, and native Windows support
- [cache-hit: Windows support PR](https://github.com/e-kotov/herdr-cache-hit/pull/5) — Git Bash entrypoint and Windows verification
- [Hunk: Requirements](https://github.com/jhochenbaum/herdr-hunk-diff#requirements) — Node.js and Windows architecture requirements
- [herdr-sidebar: Install and develop](https://github.com/alexarthurs/herdr-sidebar#install--develop) — Release binaries and Windows actions
- [herdr-sidebar: First-run font setup](https://github.com/alexarthurs/herdr-sidebar/blob/081ed133f3faa377438b51ce435fe8a87c439593/plugins/herdr-sidebar/src/fontsetup.rs) — Reviewed winget wait and Esc behavior
- [WinGet: Install](https://learn.microsoft.com/en-us/windows/package-manager/winget/install) — Non-interactive flags and installer logs
- [terminal-browser: Installation](https://github.com/zenbu-labs/terminal-browser#installation) — Windows requires WSL
- [mise: Installing mise](https://mise.jdx.dev/installing-mise.html) — Homebrew and winget installation
- [mise: Python](https://mise.jdx.dev/lang/python.html) — Selecting the latest stable Python
- [mise: Shims](https://mise.jdx.dev/dev-tools/shims.html) — Making tools visible outside interactive shells
- [Herdr settings Gist](https://gist.github.com/akunzai/5fca04af65c7ce705be190135191e8e9) — Main configuration, cache-hit display options, and plugin snapshot
