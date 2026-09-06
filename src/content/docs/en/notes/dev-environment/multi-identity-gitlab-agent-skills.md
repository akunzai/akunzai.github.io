---
title: "Clean Separation: Multi-Identity Governance with GitHub/GitLab & Agent Skills"
description: Master Git includeIf for automatic identity switching, and equip AI agents with official GitLab CLI skills via Skills Manager to prevent command hallucinations.
sidebar:
  order: 5
---

One of the most common friction points for developers joining a new team is **identity collision**:

- Committing fifty changes into your enterprise company repo using your middle-school gaming email (such as `xx_dark_dragon_xx@gmail.com`), leaving the entire architecture committee wondering who this mysterious dragon master is.
- Accidentally pushing to an open-source GitHub repository with your internal corporate email or bastion host IP addresses, triggering an immediate security audit.
- Banging your keyboard in frustration over repeated `Permission denied (publickey)` errors caused by key collisions.

The classical advice was: *"Remember to manually run `git config user.email ...` inside every cloned repository."* But as long as developers are human beings trying to make it home for dinner, they will forget. 

This guide demonstrates how to achieve automatic identity isolation using Git's **conditional includes (`includeIf`)** and credential helper routing. It also covers how to equip AI coding agents with official GitLab skills to prevent command hallucinations.

---

## 1. Dynamic Identity Switching with Git `includeIf`

Introduced in Git 2.13 and expanded in Git 2.26, `includeIf` can conditionally load configuration files **based on the remote repository URL**.

Regardless of where a repository is located on your disk, **if its remote URL points to your company's Git server, Git automatically overrides your identity configuration**.

### Step 1: Base Configuration (`~/.gitconfig`)
Use your personal or default identity in your global configuration:

```ini
# ~/.gitconfig
[user]
	name = Your Name
	email = user@example.com
	signingkey = ~/.ssh/id_ed25519.pub

# Automatically load corporate config when remote URL matches company domain
[includeIf "hasconfig:remote.*.url:https://git.company.example.com/**"]
	path = ~/.config/git/company.ini

# Alternatively: Match by directory path (e.g. all repos under ~/work/)
[includeIf "gitdir:~/work/"]
	path = ~/.config/git/company.ini
```

### Step 2: Corporate Configuration (`~/.config/git/company.ini`)
In the dedicated corporate file, define only the fields that need overriding:

```ini
# ~/.config/git/company.ini
[user]
	email = employee@company.example.com
	signingkey = ~/.ssh/id_ed25519_company.pub
```

### Verification
In any repository connected to the corporate GitLab server, verify the active email:
```bash
git config user.email
```
It will output `employee@company.example.com`. In personal or open-source repositories, it reverts automatically to `user@example.com`.

---

## 2. Multi-Host Credential Helper Routing

When accessing repositories over HTTPS, credentials for different hosts can conflict if managed by a single default helper.

Git allows scoped credential helper definitions per domain:

```ini
# ~/.gitconfig

# Global default: Microsoft Git Credential Manager (GCM)
[credential]
	helper = 
	helper = /usr/local/share/gcm-core/git-credential-manager

# GitHub: Handled by GitHub CLI (gh)
[credential "https://github.com"]
	helper = 
	helper = !gh auth git-credential

# Corporate GitLab: Handled by GitLab CLI (glab)
[credential "https://git.company.example.com"]
	helper = 
	helper = !glab auth git-credential
```

> 💡 **Tip**: The empty `helper =` line resets any previously registered helpers for that scope, ensuring the custom helper takes precedence without credential cache poisoning.

---

## 3. Human-Agent Collaboration: Taming the GitLab CLI
 
When modern software workflows enter human-agent collaboration, a new brand of comedy appears: **You ask an autonomous AI agent to "check the current CI/CD status", and with 120% confidence, it invents a completely fictional command like `glab ci fire-missiles --force` in your terminal.**

Or worse, the agent attempts to write an 80-line nested `curl` script to hammer GitLab's internal REST API, which promptly explodes with unescaped backticks and `$` variables inside the merge request description.

### Why Does This Happen?
While frontier LLMs have absorbed trillions of tokens of source code, they possess zero innate grounding regarding the latest CLI subcommands or security boundaries of enterprise GitLab installations. In short: **they hallucinate with supreme, unyielding confidence**.

### The Solution: Bundled Agent Skills
The cure for AI hallucinations is not writing an 800-word prompt begging the agent "please do not guess CLI commands." The cure is giving the agent **an official, verified instruction manual**.

GitLab now includes official **Agent Skills** directly in the `glab` CLI:

```bash
# List available bundled agent skills
glab skills list

# Install the glab skill globally for all AI agents
glab skills install glab --global --force
```

Installing this skill equips AI assistants with precise, verified command patterns:
- **Accurate CI/CD Inspection**: Agents use `glab ci status --output json` and `glab ci get --merge-request <iid> --with-job-details` instead of guessing syntax.
- **Eliminating Shell Escaping Bugs**: When submitting multi-line notes or MR bodies, agents pipe through standard input (`glab mr note create <iid> < /tmp/body.md`) or use quoted heredocs (`<< 'EOF'`), preventing variable expansions of `$` and backticks.
- **Proper Resource Referencing**: Enforces full URLs rather than project-relative shorthands, ensuring cross-group epic and issue references resolve properly.

---

## 4. Enterprise Skill Governance: Skills Manager & agent-skills

To standardize tools and agent behaviors across an entire engineering team, consider using:

### 1. [Skills Manager](https://github.com/akunzai/skills-manager)
[Skills Manager](https://github.com/akunzai/skills-manager) is a CLI designed to manage AI coding agent skills declaratively. It maintains installed skills in `~/.agents/skills.json`:

```json
{
  "local": {
    "glab": {
      "type": "command",
      "command": "glab skills install glab --global --force",
      "check": "which glab",
      "description": "GitLab CLI (glab) core agent skill"
    }
  }
}
```
Using `skills ls` and `skills add`, engineering teams can version-control required agent skills, enabling new hires to bootstrap compliant AI environments with a single command.

### 2. [akunzai/agent-skills](https://github.com/akunzai/agent-skills)
Beyond CLI wrappers, teams benefit from standardized workflow skills:
- `gitlab-epic`: Guides AI agents to structure GitLab Epics and Work Items hierarchically.
- `pr-workflow`: Enforces thorough checklist verification and pull/merge request documentation.
- `tidy-commits`: Standardizes atomic commit splitting and message hygiene.

---

## Summary

Modern engineering literacy extends beyond manual configuration—it includes **defining guardrails and precise tooling for the AI agents collaborating alongside you**:

1. **Clean Identity Separation**: Use `includeIf` to automate personal vs. corporate context switching.
2. **Dedicated Credential Routing**: Delegate host credentials cleanly between `gh` and `glab`.
3. **Eliminate Agent Hallucinations**: Standardize AI agent skills via [Skills Manager](https://github.com/akunzai/skills-manager), official `glab` skills, and curated workflows from [agent-skills](https://github.com/akunzai/agent-skills).

Proceed to [Cross-Platform Implementation Guide: macOS & Windows Best Practices](./cross-platform-macos-windows/).

---

## References

- [Git Documentation: Conditional Includes (includeIf)](https://git-scm.com/docs/git-config#_conditional_includes) — Dynamic configuration switching based on filesystem path and remote URL (`hasconfig:remote.*.url`)
- [GitHub CLI Manual](https://cli.github.com/manual/) — `gh auth` credential isolation and enterprise host management
- [GitLab CLI (glab) Documentation](https://docs.gitlab.com/ee/editor_extensions/gitlab_cli/) — GitLab CLI command syntax, MR automation, and pipeline interactions
- [Git Credential Manager Documentation](https://github.com/git-ecosystem/git-credential-manager) — Cross-platform secure storage and multi-account credential routing
- [GitHub: akunzai/skills-manager](https://github.com/akunzai/skills-manager) — Declarative skill package management for autonomous AI agents
- [GitHub: akunzai/agent-skills](https://github.com/akunzai/agent-skills) — Curated engineering workflows for AI agents (`gitlab-epic`, `pr-workflow`, `tidy-commits`)
