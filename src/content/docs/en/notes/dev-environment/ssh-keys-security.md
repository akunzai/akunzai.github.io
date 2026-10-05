---
title: "The Developer's Identity Foundation: Modern SSH Keys & Security Practices"
description: Ditch RSA in favor of Ed25519. An in-depth guide to key generation, passphrase protection, multi-key management, and SSH Agent security boundaries.
sidebar:
  order: 2
---

In an era where AI agents can write substantial amounts of code, authentication and access control remain non-negotiable engineering foundations. Every remote interaction—pushing code to GitHub or GitLab, accessing jump hosts, or deploying services—begins with your **SSH keys**.

If your keys are lost, leaked, or carelessly managed, an entire repository or production environment could be compromised, while the audit logs point directly to your name.

This article starts with modern cryptography and guides you through setting up a hardened, multi-key SSH environment that is seamless in daily development.

---

## 1. Moving Past Legacy: Why Ed25519 is the Modern Standard

For two decades, RSA was synonymous with SSH. In modern software engineering, however, **RSA is no longer the recommended choice**:

- **Security Rating**: RSA keys under 2048 bits are considered insecure. Even at 3072 or 4096 bits, their resistance to brute-force attacks is far less cost-effective than modern elliptic-curve cryptography.
- **Performance & Key Size**: A 4096-bit RSA key is bulky and computationally heavier. By contrast, **Ed25519** (based on Edwards-curve 25519) produces compact 68-character public keys, provides ultra-fast signature operations, and is designed to resist timing side-channel attacks.
- **Universal Support**: OpenSSH has supported Ed25519 since version 6.5 (2014). Today, GitHub, GitLab, modern Linux distributions, and macOS support it natively.

> 💡 **Rule of Thumb**: Unless you are connecting to a decade-old legacy server or unmaintained embedded device, **generate only Ed25519 keys for new environments**.

---

## 2. Generating Your Key: Essential Parameters & Passphrase

Open your terminal and run the following command:

```bash
ssh-keygen -a 100 -t ed25519 -C "your_email@example.com"
```

### Parameter Breakdown
- `-t ed25519`: Specifies the Ed25519 signature algorithm.
- `-C "your_email@example.com"`: Attaches a comment to the public key. Use your personal or corporate email so key ownership can be easily identified in `authorized_keys` or platform web UIs.
- `-a 100`: Specifies 100 rounds of bcrypt KDF. Ed25519 private keys already use the new OpenSSH format, so the legacy `-o` flag is a no-op. Extra KDF rounds raise the cost of brute-forcing a stolen passphrase while remaining imperceptible during daily logins.

### Why You Must Set a Passphrase
During execution, `ssh-keygen` prompts for a passphrase:

```text
Enter passphrase (empty for no passphrase):
```

Many newcomers see `empty for no passphrase` and immediately hit Enter twice without hesitation, whispering to themselves: *"I'll just leave it empty for local development, and add a passphrase once it goes to production."* That sentence holds about as much truth in software engineering as *"I'll definitely start going to the gym every morning starting next Monday."*

**An unencrypted private key is the digital equivalent of a postcard taped to the lid of your laptop with your root privileges printed on it**:
- If your laptop is swiped at a coffee shop, an unencrypted disk image leaks onto a public S3 bucket, or a rogue npm package slips an infostealer onto your machine, anyone with read access to `~/.ssh/id_ed25519` instantly assumes your identity.
- A passphrase-protected private key is a robust cryptographic container encrypted with bcrypt; even if an attacker steals the raw file, they will be calculating brute-force hashes until the heat death of the universe.

---

## 3. Frictionless Experience: Let ssh-agent Handle Passphrases

"Do I really have to type a long passphrase every single time I run `git push`?"

No. Modern operating systems provide an authentication agent (`ssh-agent`) that securely caches decrypted private keys in memory. When paired with native system credential stores, you only need to authenticate once:

### macOS: Keychain Integration
On macOS, OpenSSH integrates directly with the macOS Keychain.

Add the following to `~/.ssh/config`:

```ssh-config
# Place Host * defaults at the end of ~/.ssh/config (first obtained value wins).
# Do not put IdentityFile here: it is additive and would leak into later IdentitiesOnly hosts.
Host *
  AddKeysToAgent yes
  UseKeychain yes
  IgnoreUnknown UseKeychain
```

Run this command once to store your passphrase in the Keychain:

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

This stores the passphrase and loads the key into the current Agent. After a reboot, keys must be loaded into the new Agent again; Keychain storage alone does not guarantee that they are already available to every app.

### macOS GUI Git tools: load keys into the Agent the app actually uses

`UseKeychain` supplies passphrases to Apple's SSH client; it does not schedule key loading at login. `AddKeysToAgent` applies when that client loads a key. SSH commit signing uses `ssh-keygen -Y sign`, so those connection settings alone do not ensure that a GUI Git tool can sign without prompting. The signing key must be available to the Agent selected by the app's `SSH_AUTH_SOCK`.

My [macOS SSH Agent + Keychain setup](https://gist.github.com/akunzai/402cbbcf61703e6e9c50f2a929e09424) handles both terminal and GUI workflows:

- A user LaunchAgent runs `ssh-agent-wrapper` at GUI login. It starts or reuses a local Agent at `~/.ssh/agent.sock`, loads keys with Apple's `ssh-add --apple-use-keychain`, and publishes that socket with `launchctl setenv`.
- The wrapper also loads keys into the login session's built-in `com.openssh.ssh-agent`. An already running GUI app retains its inherited environment; publishing a different socket does not update that process. Populating the built-in Agent helps apps that still use its socket.

First store each intended key's passphrase from a local GUI terminal. Use Apple's executable explicitly if Homebrew OpenSSH is also installed:

```bash
/usr/bin/ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

The Gist contains the wrapper, LaunchAgent, installation, and diagnostic commands. Adapt the plist's absolute executable path to your own home directory, and merge only the relevant SSH settings into your existing config. The wrapper discovers private keys with matching `~/.ssh/id_*.pub` files; review that selection if only some identities should be loaded.

Check the fixed Agent without printing key fingerprints or comments:

```bash
SSH_AUTH_SOCK="$HOME/.ssh/agent.sock" /usr/bin/ssh-add -l >/dev/null 2>&1
printf 'ssh-add exit status: %s\n' "$?"
```

For this listing command, exit `0` means identities are available. Exit `1` means the command failed, including an Agent with no identities; `2` means the Agent cannot be contacted. If terminal signing works but a GUI app still prompts, check the app's socket and the built-in Agent separately using the Gist's diagnostics. Reload the LaunchAgent after editing its wrapper or plist; changing key contents in the same Agent does not require changing an app's socket.

This setup is for local GUI login. Keep an intentionally forwarded Socket when connecting over SSH; replacing it with the fixed local Socket changes which identities are available. A persistent Herdr Session still needs a reachable Agent and loaded keys, as described in [Herdr on macOS](../herdr-terminal-macos/).

### Windows: Enable OpenSSH Authentication Agent
Windows 10/11 provides OpenSSH Agent as a system service. An ordinary user can first check whether it is enabled:

```powershell
Get-Service ssh-agent
```

If its status is `Running`, add your key to the agent without elevation:

```powershell
ssh-add $HOME\.ssh\id_ed25519
```

If the service is disabled, `Set-Service` and `Start-Service` require administrator rights. In some enterprise environments, elevation may require a separate request. Until access is available, `IdentityFile` in `~/.ssh/config` can use a passphrase-protected private key and prompt on each connection. If an HTTPS credential manager is already available, HTTPS is another option for Git remotes.

---

## 4. Multi-Key Architecture: The `~/.ssh/config` Best Practices

In professional settings, developers typically juggle at least two key pairs:
1. **Personal Key** (`id_ed25519`): For personal GitHub repositories and open-source contributions.
2. **Work Key** (`id_ed25519_company`): For internal GitLab / GitHub Enterprise instances and infrastructure bastions.

Without explicit routing, SSH clients will sequentially offer every available key loaded in your agent. It resembles standing in front of an exclusive nightclub trying twenty different keys in the lock—the server's bouncer gets suspicious and forcibly ejects you from the premises:
```text
Received disconnect from ... port 22: 2: Too many authentication failures
```

### The Fix: `IdentitiesOnly yes`
In `~/.ssh/config`, use `Host` blocks combined with `IdentitiesOnly yes` to force the client to offer **only the designated key**.

OpenSSH uses **first obtained value wins** ([ssh_config(5)](https://man.openbsd.org/ssh_config.5)): put host-specific blocks first, and overridable defaults at the **end** of the file. An early `Host *` is appropriate only when you intend to lock a value globally (for example `SetEnv TERM`).

```ssh-config
# Personal GitHub
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes

# Corporate GitLab Server
Host git.company.example.com
  HostName git.company.example.com
  User git
  IdentityFile ~/.ssh/id_ed25519_company
  IdentitiesOnly yes

# Internal Development Jump Host
Host bastion-dev
  HostName 10.0.1.10
  User alice
  IdentityFile ~/.ssh/id_ed25519_company
  IdentitiesOnly yes

# Global secure baseline (must be last)
Host *
  ForwardAgent no
  StrictHostKeyChecking ask
```

With this configuration:
- `git clone git@github.com:...` will strictly use `~/.ssh/id_ed25519`.
- Connecting to your internal GitLab will exclusively present the corporate key. Keys never cross boundaries or cause authentication limit errors.

---

## 5. Security Boundaries: Guarding SSH Agent Forwarding

When accessing internal servers through a bastion host, developers often resort to **SSH Agent Forwarding** (`ForwardAgent yes`).

Forwarding lets the remote server communicate with your local `ssh-agent` over an encrypted tunnel, allowing you to authenticate to downstream servers without placing private keys on the jump host.

However, keep this cardinal rule in mind:
> ⚠️ **Never set `ForwardAgent yes` globally under `Host *`!**

### The Security Threat (Remember the xz-utils Shockwave)
Ever since the 2024 xz-utils backdoor sent shockwaves across the software supply chain, lateral movement and rogue privileges are taken with utmost seriousness.

If an intermediate server you connect to is compromised, an attacker with root privileges on that machine can hijack your forwarded Unix domain socket. They can prompt your local `ssh-agent` to sign authentication challenges on your behalf, pivoting across your internal networks—equivalent to letting a stranger reach into your pockets and take your car keys.

### Least Privilege, Then `ProxyJump`
If you still need forwarding, opt in on that host only, and keep the block **above** the trailing `Host *` so `ForwardAgent no` does not win first:

```ssh-config
# Opt in only on a trusted jump host (must appear before Host *)
Host bastion-dev
  ForwardAgent yes
  IdentityFile ~/.ssh/id_ed25519_company
```

The modern alternative is OpenSSH **`ProxyJump`**. It forwards TCP through the jump host with end-to-end encryption, so Agent Forwarding is unnecessary:

```ssh-config
# Connect to an internal host through bastion-dev
Host internal-db
  HostName 192.168.10.50
  User dbadmin
  ProxyJump bastion-dev
  IdentityFile ~/.ssh/id_ed25519_company
```

---

## Onboarding Checklist: SSH Foundations

Verify your setup against this checklist:

- [ ] Deprecated RSA keys replaced with `ssh-keygen -t ed25519`
- [ ] Private key protected with a strong passphrase
- [ ] If using an operating-system agent, macOS Keychain or the enabled Windows service works
- [ ] `~/.ssh/config` configured with `IdentitiesOnly yes` for each remote host
- [ ] `ForwardAgent no` lives in a trailing `Host *` block, not an early global lock

With identity and network transport secured, proceed to [Essential Global Git Configurations & Pitfall Prevention](../git-core-configuration/).

---

## References

- [OpenSSH Manual: ssh-keygen(1)](https://man.openbsd.org/ssh-keygen.1) — Key generation, algorithm selection (Ed25519), and KDF round tuning
- [OpenSSH Manual: ssh_config(5)](https://man.openbsd.org/ssh_config.5) — `IdentitiesOnly`, `ProxyJump`, and `AddKeysToAgent` options
- [GitHub Docs: Connecting to GitHub with SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) — SSH key generation, account association, and connection testing
- [GitLab Docs: Use SSH keys to communicate with GitLab](https://docs.gitlab.com/ee/user/ssh.html) — GitLab SSH authentication and credential lifecycle management
- [Microsoft Learn: Key management with OpenSSH on Windows](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement) — Native Windows OpenSSH service and file ACL management
- [OpenSSH Manual: ssh-add(1)](https://man.openbsd.org/ssh-add.1) — Agent checks and exit statuses
- [Apple: Creating Launch Daemons and Agents](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html) — User LaunchAgents and login-time execution
- [macOS SSH Agent + Keychain Gist](https://gist.github.com/akunzai/402cbbcf61703e6e9c50f2a929e09424) — Personal wrapper and GUI Agent diagnostics
- [GitHub Docs: Adding an SSH key to the Agent](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) — Apple ssh-add and Keychain integration
