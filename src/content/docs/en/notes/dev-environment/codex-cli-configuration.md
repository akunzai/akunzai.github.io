---
title: "Codex CLI: Shared Profiles and Local Configuration"
description: Share Codex CLI preferences across macOS and Windows with a native profile while keeping plugins and machine state local.
sidebar:
  order: 11
---

My Codex configuration used to mix portable preferences with macOS executables and runtime paths. I now share a native configuration profile and let each machine own its base configuration. Shell setup lives in the [macOS](../herdr-terminal-macos/) and [Windows](../herdr-terminal-windows/) terminal notes; [Claude Code](../claude-code-configuration/) has its own configuration note.

## Configuration sources

| Gist | Contents |
| --- | --- |
| [Shared Codex profile](https://gist.github.com/akunzai/d8931f45ad333e1dbc54e18c62f7cf7c) | `shared.config.toml` and installation/limitation notes |
| [Unix shortcuts](https://gist.github.com/akunzai/c3aca93fbe7f715c0c3b1a220e25b4f9) | `cx` and `cx.yolo` aliases in `.profile.local` |
| [PowerShell profile](https://gist.github.com/akunzai/3af259df54dcdd6073293e6f8efe8dbf) | Matching functions in `profile.ps1` |

Install the CLI using the [official CLI guide](https://learn.chatgpt.com/docs/cli), then check `codex --version`. The profile gist configures an installed CLI.

## Share preferences, keep machine state local

| Location | Contents |
| --- | --- |
| `shared.config.toml` | Model, reasoning effort, verbosity, permission policy, TUI preferences, feature flags, and memory preferences |
| Machine-local `config.toml` | Plugin enablement, all marketplace sources, MCP executables/environment, notification commands, hook trust state, trusted projects, and desktop/runtime state |

`--profile shared` overlays `$CODEX_HOME/shared.config.toml` on the base user configuration; `CODEX_HOME` defaults to `~/.codex`. The filename must be `shared.config.toml`, not `config.shared.toml`. Current profiles use separate files, not legacy `[profiles.shared]` tables. Project configuration and CLI overrides can take precedence ([official profiles](https://learn.chatgpt.com/docs/config-file/config-advanced#profiles)).

Model and reasoning effort are shared workflow preferences, not OS paths. Override them for a run when needed; different accounts may have different available models. Install and review local plugins and hooks separately. Do not copy the entire Codex home or replace a machine's base config with another machine's file.

## Install or update the profile

The following commands back up an existing profile and replace only that file. They retain the base `config.toml`.

### macOS / Unix

```sh
codex_dir="${CODEX_HOME:-$HOME/.codex}"
mkdir -p "$codex_dir" &&
if [ -f "$codex_dir/shared.config.toml" ]; then
  cp -p "$codex_dir/shared.config.toml" "$codex_dir/shared.config.toml.backup-$(date +%Y%m%d-%H%M%S)"
fi &&
curl -fsSL https://gist.githubusercontent.com/akunzai/d8931f45ad333e1dbc54e18c62f7cf7c/raw/shared.config.toml \
  -o "$codex_dir/shared.config.toml.download" &&
chmod 600 "$codex_dir/shared.config.toml.download" &&
mv "$codex_dir/shared.config.toml.download" "$codex_dir/shared.config.toml"
```

### Windows PowerShell

```powershell
$codexDir = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME '.codex' }
New-Item -ItemType Directory -Path $codexDir -Force -ErrorAction Stop | Out-Null
$target = Join-Path $codexDir 'shared.config.toml'
if (Test-Path -LiteralPath $target) {
    Copy-Item -LiteralPath $target -Destination "$target.backup-$(Get-Date -Format yyyyMMdd-HHmmss)" -ErrorAction Stop
}
Invoke-WebRequest -Uri 'https://gist.githubusercontent.com/akunzai/d8931f45ad333e1dbc54e18c62f7cf7c/raw/shared.config.toml' -OutFile "$target.download" -ErrorAction Stop
Move-Item -LiteralPath "$target.download" -Destination $target -Force -ErrorAction Stop
```

Installing the profile retains the base config. On Windows, review any base config previously copied from macOS: the profile does not erase inherited notification, MCP, or marketplace paths.

## Shortcuts and permissions

Unix aliases:

```sh
alias cx='codex --profile shared'
alias cx.yolo='codex --profile shared --yolo'
```

PowerShell functions:

```powershell
function cx { codex --profile shared @args }
function cx.yolo { codex --profile shared --yolo @args }
```

My `.zshrc` loads `~/.profile.local`; PowerShell loads `profile.ps1`. Reload the relevant profile or open a new terminal.

| Command | Behavior |
| --- | --- |
| `cx` | Shared profile with sandboxing and automatic approval review |
| `cx -a never` | No approval prompts; sandbox-blocked commands fail rather than requesting escalation |
| `cx.yolo` | Shared preferences, with approvals and sandboxing disabled |
| `codex` | Original machine-local configuration without this profile |

`--yolo` aliases `--dangerously-bypass-approvals-and-sandbox`; it does not preserve the profile's filesystem or network sandbox restrictions ([CLI reference](https://learn.chatgpt.com/docs/cli/reference)). Claude Code's explicit deny rules in bypass mode are a different mechanism. OS permissions and external isolation still apply.

The shared file declares `default_permissions` and `[permissions]`. These beta permission profiles do not compose with legacy `sandbox_mode` / `sandbox_workspace_write`: a `sandbox_mode` in any loaded file makes Codex use the legacy settings instead. Audit the retained base config before relying on the profile's deny rules ([permission-profile documentation](https://learn.chatgpt.com/docs/permissions)). For Windows/WSL/Linux, this gist sets `glob_scan_max_depth = 10`; review deeper repositories and startup scanning costs.

## Shared background server limitation

On macOS with Codex CLI `0.162.1`, selecting this profile produced:

```text
Running without the shared background server: --profile requires embedded mode.
```

The profile still loads, but that invocation uses its own embedded server. This applies to both shortcuts, independently of YOLO. `cx --no-daemon` or `cx.yolo --no-daemon` makes the mode explicit and avoids the fallback notice; it does not restore shared-daemon support.

If your workflow needs centralized live sessions through `codex agents` or the shared daemon's remote-control setup, apply shared preferences to each machine's `config.toml` instead. This is separate from Herdr keeping pane processes alive. Windows runtime behavior has not been tested; see the Gist README and recheck after upgrading Codex.

## Recommended configuration: automatic review

For everyday work, keep the sandbox and let a reviewer agent handle eligible approval requests:

```toml
approval_policy = "on-request"
approvals_reviewer = "auto_review"
default_permissions = "secure-workspace"
```

This selects the existing `[permissions.secure-workspace]` policy in the shared gist. Remove legacy `sandbox_mode` and `[sandbox_workspace_write]` from every active configuration layer so they do not override it. Keep filesystem denies and grant only the directories, caches, and network destinations the task requires. If enabling command networking with domain rules, also enable `features.network_proxy`; a domain table alone does not enforce filtering. See [Permissions](https://learn.chatgpt.com/docs/permissions).

`cx` deliberately has no `-a never`: [Auto-review](https://learn.chatgpt.com/docs/sandboxing/auto-review) needs an approval request to review. Routine work inside the sandbox proceeds directly; eligible escalation requests go to a separate agent. Approved escalations may run outside the sandbox, so review is an authorization judgment, not an absolute resource-denial boundary. Some surfaces, including Computer Use app approvals, still ask the user. Automatic review also consumes extra model calls.

Use `cx -a never` when blocked actions must fail without escalation. Use `cx.yolo` only when an external boundary provides the isolation you need. Permission profiles govern local sandboxed commands; MCP, connectors, browser, and Computer Use require separate controls. Avoid mounting the full home directory or privileged sockets into an isolated harness, and supply only scoped credentials.

## Does switching YOLO affect prompt caching?

The [OpenAI API caching guide](https://developers.openai.com/api/docs/guides/prompt-caching) recommends keeping conversation history and tool definitions stable. It does not establish a Codex CLI/subscription guarantee for toggling approval or sandbox modes. If a mode switch changes model-visible instructions, tools, or earlier context, cache reuse can change; this is an inference from the caching model, not a measured YOLO result.

Do not infer that switching YOLO always clears the cache, or that it is always cache-safe. Compare individual requests while holding the model, effort, tools, conversation, timing, and client version stable. The [existing session/cache observations](/en/blog/cache-session-habits/) concern effort changes, not permission-mode changes, and do not prove YOLO behavior. No new paid inference experiment was run for this note.

## Where CLI edits are saved

Profiles are configuration overlays, not two-way synchronization. Selecting `shared` does not delete values already present in the base `config.toml` or copy all profile settings back into it.

With Codex CLI `0.162.1` on macOS, I started `--profile shared`, changed the order in `/statusline`, and saved. Codex wrote `tui.status_line` to `shared.config.toml`, where the key was defined; the base `config.toml` was unchanged. The resulting order is:

```toml
[tui]
status_line = ["model-with-reasoning", "five-hour-limit", "weekly-limit", "context-remaining", "run-state", "project-name", "git-branch"]
```

This confirms the selected profile is updated by that editor in this setup. Other commands can target another layer: [`codex features enable/disable`](https://learn.chatgpt.com/docs/developer-commands#codex-features) writes the base `config.toml` and does not accept `--profile`. Check the relevant file after other CLI changes. Local changes do not automatically upload to the gist or propagate to another machine.

## Verify and switch back

Start with `codex --profile shared --strict-config`, then inspect `/status` and `/permissions`. Use disposable fixtures to check file denies, and test outside YOLO mode. Confirm local plugins and hooks separately; parsing successfully does not prove a sandbox rule applies.

Use `cx resume` to resume with the profile. To use only the machine-local base configuration, run plain `codex`.
