---
title: "Cryptographic Non-Repudiation: SSH-Based Git Commit Signing"
description: Ditch the complexity of GPG. Use native SSH keys in Git 2.34+ to cryptographically sign commits and establish verifiable trust chains.
sidebar:
  order: 4
---

Have you ever encountered a Git commit where the author name and avatar belonged to someone else?

In Git's fundamental architecture, **the commit author field is completely unprotected plain text**. If you don't believe it, open your terminal and run:
```bash
git commit --amend --author="Linus Torvalds <torvalds@linux-foundation.org>"
```
Git will not flinch. It will gladly record the creator of Linux into your project's commit history. Substitute that with a high-profile Silicon Valley founder, and an unsuspecting observer might genuinely believe they moonlit on your repository last night.

In an era where AI coding agents assist in writing large codebases before human review, how do we guarantee that a commit was genuinely audited and approved by the declared engineer? The industry standard is **cryptographic commit signing**.

---

## 1. Why SSH Signing Over GPG?

For years, GPG (GNU Privacy Guard) was the undisputed standard for commit signing. In practice, however, 90% of engineering teams experience collective dread when GPG is mandated:

- **Heavy Tooling**: Requires installing `gnupg` and `pinentry`; `gpg-agent` daemons randomly lock up or crash across OS updates.
- **Key Lifecycle Friction**: Managing subkeys, passphrases, and expiration dates feels like **assembling flat-pack IKEA furniture blindfolded during a windstorm with a missing hex key**.
- **Maintenance Overhead**: Onboarding engineers frequently lose half a day wrestling with the soul-crushing `error: gpg failed to sign the data`.

### The Modern Breakthrough: Native SSH Signing in Git
Starting with **Git 2.34** (late 2021), Git introduced native support for **signing commits with standard SSH keys**!

This means: **The exact same `id_ed25519` key you configured in [SSH Key Generation and Hardening](./ssh-keys-security/) can sign your Git commits directly.** No extra software, no secondary keyrings, and zero daemon friction.

---

## 2. Three Steps to Enable SSH Commit Signing

Execute these three commands to configure Git globally:

```bash
# 1. Switch the signing format from openpgp to ssh
git config --global gpg.format ssh

# 2. Point to your public key file (Note: Provide the .pub public key path)
git config --global user.signingkey ~/.ssh/id_ed25519.pub

# 3. Require signing by default for all commits
git config --global commit.gpgsign true
```

> 💡 **Why does `signingkey` point to the `.pub` public key?**  
> This is a key design detail of OpenSSH signing. Git uses the public key to identify the key fingerprint, and requests the local `ssh-agent` or matching private key to perform the cryptographic signing. Your private key remains protected by its passphrase and in-memory security.

### Best Practice: Sign Git Tags as Well
Release tags represent critical milestones in software supply chain security:
```bash
git config --global tag.gpgsign true
```

---

## 3. Displaying the "Verified" Badge on GitHub & GitLab

To show the green "Verified" badge, hosting platforms must associate your signing public key with your account.

### GitHub Setup
1. Copy your public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
2. Navigate to **Settings** → **SSH and GPG keys**.
3. Click **New SSH Key**:
   - **Key type**: Select **Signing Key** from the dropdown.
   - Paste the public key and save.

### GitLab Setup
1. Navigate to **Preferences** → **SSH Keys**.
2. Paste the public key:
   - In **Usage type**, select **Authentication & Signing** (or Signing).
   - Click **Add key**.

Subsequent commits pushed to GitHub or GitLab will display the green **Verified** badge alongside your author profile.

---

## 4. Local Verification: Establishing `allowed_signers`

Remote platforms verify signatures against account profiles. Locally, running `git log --show-signature` will display:
```text
Good "ssh" signature for user@example.com with ED25519 key ...
No signature found in allowed signers list.
```

### Configuring Local Trust
To verify signatures locally, define an allowed signers file:

```bash
touch ~/.config/git/allowed_signers
git config --global gpg.ssh.allowedSignersFile ~/.config/git/allowed_signers
```

### Adding Trusted Keys
The format follows OpenSSH specification (`<identity> <key-type> <base64-key>`):

```text
# ~/.config/git/allowed_signers
user@example.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...
alice@company.example.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...
bob@company.example.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...
```

Now, running `git log --show-signature` confirms signature authenticity:
```text
Good "ssh" signature with ED25519 key SHA256:...
Verified that the code came from user@example.com
```

---

## 5. Engineering Literacy: The Meaning of a Signature

Adopting commit signing requires a conscious mindset shift:

> **A cryptographic signature carries the same weight as a legal signature.**

- Signing a commit indicates that you **assume engineering and architectural responsibility** for the code.
- If an AI agent generated the implementation, signing the commit affirms that you have thoroughly audited the logic, checked for security flaws and credential leaks, and endorsed the change under your professional reputation.

Proceed to [Multi-Identity Governance with GitHub/GitLab & Agent Skills](./multi-identity-gitlab-agent-skills/) to explore automated identity switching and AI agent CLI governance.

---

## References

- [Git Documentation: Git Tools - Signing Your Work](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work) — Native SSH key commit signing and verification introduced in Git 2.34+
- [GitHub Docs: About commit signature verification](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification) — Architecture of commit signatures, trust chains, and the "Verified" badge
- [GitHub Docs: Telling Git about your signing key](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key) — Configuring SSH signing keys and `allowed_signers` local verification databases
- [GitLab Docs: Sign commits with SSH keys](https://docs.gitlab.com/ee/user/project/repository/signed_commits/ssh.html) — Server-side SSH signature verification and compliance policies in GitLab
