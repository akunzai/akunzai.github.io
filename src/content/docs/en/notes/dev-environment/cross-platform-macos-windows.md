---
title: "Cross-Platform Implementation Guide: macOS & Windows Best Practices"
description: Package management, terminal ergonomics, and credential pass-through across macOS and Windows (Native PowerShell / WSL 2).
sidebar:
  order: 6
---

In modern software engineering organizations, developer workstations vary—some engineers run **macOS**, while others work on **Windows**.

While the underlying operating system architectures differ, modern developer tooling allows teams to achieve **a consistent, dependable, and high-performance development experience across both platforms**.

This final installment provides platform-specific onboarding playbooks and resolves common cross-platform performance and credential hurdles.

---

## 1. macOS Best Practices

macOS is a Unix-based operating system with an excellent terminal ecosystem out of the box, but requires deliberate configuration to meet team standards.

### 1.1 Package Management: [Homebrew](https://brew.sh/)
On a managed Mac, first confirm that Homebrew is available and your account can write to its prefix. Initial provisioning may require administrator rights; in some enterprise environments, elevation may require a separate request. Afterward, the prefix owner can install ordinary formulae without elevation. If Homebrew is unavailable, do not run the installer script or `sudo brew`: see [Homebrew's non-admin deployment guide](https://docs.brew.sh/Homebrew-for-Mac-Admins).

```bash
export HOMEBREW_NO_SUDO=1
# Install version control and platform CLIs
brew install git gh glab

# Install GPU-accelerated terminal (e.g. Ghostty) and Nerd Fonts
brew install --cask --appdir="$HOME/Applications" ghostty
brew install --cask font-jetbrains-mono-nerd-font
```

`HOMEBREW_NO_SUDO=1` makes Homebrew fail when it needs elevation. The Ghostty command targets `~/Applications`; the font cask uses `~/Library/Fonts` by default. Some casks' own installers still need system access; follow the software installation rules for your environment if an elevation prompt appears.

### 1.2 Modern Terminals & Terminfo Compatibility
Modern GPU-accelerated terminal emulators (such as Ghostty, Alacritty, or Kitty) can encounter terminal type errors when connecting to legacy Linux hosts:
```text
xterm-ghostty: unknown terminal type
```
Picture this: you connect using your sleek, GPU-accelerated, butter-smooth modern terminal into an enterprise Linux box that has not rebooted since 2012, and the remote server looks back in utter confusion, protesting that it has never encountered such an alien species. It feels like bringing an iPhone 16 into the Stone Age—all because the remote terminfo database has never heard of modern terminals.

**Best Practice Solution**: In `~/.ssh/config`, lock `TERM` to a widely compatible 256-color fallback. This value is meant to apply everywhere, so put it in an **early** `Host *` (first obtained value wins). `SetEnv` requires OpenSSH 8.7+.

```ssh-config
# ~/.ssh/config — early Host * locks TERM for every host
Host *
  SetEnv TERM=xterm-256color
```

Overridable security defaults (`ForwardAgent no` and similar) still belong at the **end** of the file; see [SSH Keys & Security Practices](../ssh-keys-security/).

### 1.3 Runtime Version Management: [mise](https://mise.jdx.dev/)
Avoid global installations of Node.js, Python, or Go that cause version conflicts between repositories. Use **mise** for fast polyglot toolchain management (optionally paired with the `mise` skill from [akunzai/agent-skills](https://github.com/akunzai/agent-skills)):

```bash
brew install mise
mise use --global node@lts
```

---

## 2. Windows Best Practices (Native & WSL 2)

Modern Windows development generally takes one of two approaches:
1. **Windows Native (PowerShell 7)**: Well-suited for .NET, cross-platform CLIs, and desktop applications.
2. **WSL 2 (Windows Subsystem for Linux)**: Ideal for container-centric architectures, Docker, and Linux-native toolchains.

### 2.1 Package Management: Prefer User Scope
On a managed device, first check which installation methods are available. If self-installation is allowed, [Scoop](https://scoop.sh/) defaults to the user profile and can install ordinary development CLIs:

```powershell
scoop install git gh glab
```

If Windows Terminal or PowerShell 7 is missing, check the available installation sources. Winget's `--scope user` works only when the package offers a user-scope installer; it cannot guarantee an elevation-free install. Follow the software installation rules for your environment if an installer requests administrator rights.

### 2.2 Enable OpenSSH Authentication Agent
Changing or starting the `ssh-agent` system service requires administrator rights. Check its state as an ordinary user first:

```powershell
Get-Service ssh-agent
```

If it is not running, enabling it requires administrator rights. Until access is available, use an already configured HTTPS credential manager or enter the SSH private key's passphrase when needed; Git identity settings do not require elevation. See [SSH Keys & Security Practices](../ssh-keys-security/).

### 2.3 Critical WSL 2 Rules of Thumb
If developing within WSL 2 (e.g. Ubuntu on Windows), follow these two essential guidelines:

If WSL is not already enabled, `wsl --install` needs administrator rights and a reboot. Use native PowerShell until access is available. The following rules apply only after WSL is available.

#### Rule 1: Store Source Code in the Linux File System
- ❌ **Anti-pattern**: Storing projects under `/mnt/c/Users/...`. Crossing the Windows/Linux boundary through the 9P protocol imposes such massive I/O friction that running `npm install` takes long enough to brew three cups of artisanal pour-over coffee, effectively torturing your blazing-fast NVMe SSD into performing like a 5400 RPM spinning drive!
- ✅ **Best Practice**: Store all repositories inside the native Linux file system (e.g. `~/code/...` or `/home/username/code`). To edit code from Windows, open VS Code directly from within WSL using `code .`.

#### Rule 2: Reuse Windows Git Credential Manager Inside WSL
Avoid managing separate HTTPS credentials within WSL by delegating to the Windows-installed Git Credential Manager:

```bash
# Configure inside your WSL Linux shell
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

---

## 3. Final Onboarding Checklist

Verify your workstation against the comprehensive readiness checklist:

| Verification Item | Command / Inspection | Expected Result |
| :--- | :--- | :--- |
| **SSH Key Type** | `ls ~/.ssh/` | `id_ed25519.pub` present; no deprecated RSA keys |
| **Passphrase Guard** | `ssh-keygen -y -f ~/.ssh/id_ed25519` | Prompts for passphrase; key is encrypted at rest |
| **Host Isolation** | Inspect `~/.ssh/config` | `IdentitiesOnly yes` and `ForwardAgent no` enforced |
| **Line Endings** | `git config core.autocrlf` | Returns `input` (macOS/Linux) or `true` (Windows) |
| **Conflict Memory** | `git config rerere.enabled` | Returns `true` |
| **Commit Signatures** | `git config commit.gpgsign` | Returns `true`; `gpg.format` set to `ssh` |
| **Identity Routing** | `git config user.email` (in work repo) | Resolves to corporate address automatically |
| **AI Agent Guardrails** | `glab skills list` or `skills ls` | Official `glab` skill installed; no CI hallucinations |

---

## Conclusion: Engineering Sovereignty in the AI Age

The software industry is entering an era defined by human-agent collaboration.

As code authoring becomes increasingly automated, engineering discipline does not diminish—**it becomes the defining differentiator. Establishing strict security boundaries, retaining identity sovereignty, and orchestrating AI agents under validated specifications are the hallmarks of modern engineering excellence.**

---

## References

- [Homebrew Official Documentation](https://brew.sh/) — The Missing Package Manager for macOS (and Linux)
- [Microsoft Learn: Set up a WSL development environment](https://learn.microsoft.com/en-us/windows/wsl/setup/environment) — WSL 2 setup, distribution management, and best practices
- [Microsoft Learn: Comparing WSL Versions](https://learn.microsoft.com/en-us/windows/wsl/compare-versions) — Architectural differences and cross-OS 9P filesystem performance implications
- [Microsoft Learn: Windows Package Manager (winget)](https://learn.microsoft.com/en-us/windows/package-manager/winget/) — Comprehensive guide for discovering and managing packages on Windows
- [Microsoft Learn: WinGet install](https://learn.microsoft.com/en-us/windows/package-manager/winget/install) — Conditions for user-scope installation
- [Microsoft Learn: Install WSL](https://learn.microsoft.com/en-us/windows/wsl/install) — Administrator rights for first-time WSL setup
- [PowerShell Official Documentation](https://learn.microsoft.com/en-us/powershell/) — PowerShell 7 cross-platform scripting, configuration, and module management
