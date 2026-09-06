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
Avoid downloading `.pkg` or `.dmg` installers directly from websites. Use Homebrew for declarative package management:

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install version control and platform CLIs
brew install git gh glab

# Install GPU-accelerated terminal (e.g. Ghostty) and Nerd Fonts
brew install --cask ghostty font-jetbrains-mono-nerd-font
```

### 1.2 Modern Terminals & Terminfo Compatibility
Modern GPU-accelerated terminal emulators (such as Ghostty, Alacritty, or Kitty) can encounter terminal type errors when connecting to legacy Linux hosts:
```text
xterm-ghostty: unknown terminal type
```
Picture this: you connect using your sleek, GPU-accelerated, butter-smooth modern terminal into an enterprise Linux box that has not rebooted since 2012, and the remote server looks back in utter confusion, protesting that it has never encountered such an alien species. It feels like bringing an iPhone 16 into the Stone Age—all because the remote terminfo database has never heard of modern terminals.

**Best Practice Solution**: In `~/.ssh/config`, normalize terminal emulation to standard 256-color fallback:

```ssh-config
# ~/.ssh/config
Host *
  SetEnv TERM=xterm-256color
```

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

### 2.1 Package Management: Winget
Windows 10/11 includes `winget` as its official package manager:

```powershell
# Install Git, GitHub CLI, and GitLab CLI
winget install --id Git.Git -e --source winget
winget install --id GitHub.cli -e --source winget
winget install --id GitLab.glab -e --source winget

# Install Windows Terminal and PowerShell 7
winget install --id Microsoft.WindowsTerminal -e --source winget
winget install --id Microsoft.PowerShell -e --source winget
```

### 2.2 Enable OpenSSH Authentication Agent
Ensure the background service starts automatically to cache key passphrases:

```powershell
# Run in an elevated (Administrator) PowerShell session
Set-Service ssh-agent -StartupType Automatic
Start-Service ssh-agent
```

### 2.3 Critical WSL 2 Rules of Thumb
If developing within WSL 2 (e.g. Ubuntu on Windows), follow these two essential guidelines:

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
- [PowerShell Official Documentation](https://learn.microsoft.com/en-us/powershell/) — PowerShell 7 cross-platform scripting, configuration, and module management
