---
title: "Token Value Maxxing (5) Distribution: An SOP Not Written as a Skill Makes Every Agent Hit the Wall"
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "skills"]
description: "I use several AI coding agents at once, and any repeated SOP not written as a skill makes each agent burn tokens hitting the wall on its own. How I extract skills from conversation history, and why I wrote my own skills manager with signature verification."
---

:::note[Token Value Maxxing series]
0. [Overview: five misconceptions and four levers](/en/blog/token-value-maxxing/)
1. [INPUT: Twice the Knowledge, a Quarter of the Resident Load, Same Compliance](/en/blog/agents-md-instruction-budget/)
2. [CACHE: Come Back After an Hour and That Turn Costs 80×](/en/blog/cache-session-habits/)
3. [MODEL: The Rule Was Written, but Absent When the Decision Was Made](/en/blog/subagent-model-selection/)
4. [REWORK: Stop Asking "How Do We Keep This From Happening Again?"](/en/blog/prevent-recurrence/)
5. **Distribution: turning practices into skills** (this post)

Further reading: [Beyond the Amnesiac Salted Fish: My Hierarchical Global AGENTS.md Architecture](/en/blog/global-agents-architecture/)
:::

In Stephen Chow's *Kung Fu Hustle*, a beggar presses the *Buddha's Palm* manual on young Sing and tells him: "**Keeping the world at peace is up to you!**" At the end of the film, he still holds a whole stack of manuals, ready to sell to the next kid.

A skill is a manual written for an agent. Unlike that beggar's, I want every copy to be genuine and verified, and every agent to get the same one.

---

## Why write it as a skill

I rotate between several harnesses: Claude Code, Codex, grok-build, Cursor, muse-code, and Antigravity CLI. Whenever a repeated workflow isn't written down, **every agent hits the wall on its own**, and every hit burns tokens.

The wall I hit most is GitLab's `glab` CLI: flags, output formats, how to reply in a discussion thread; agents almost always needed several rounds of trial and error. Then I found that `glab` ships its own skills (`glab skills install glab`), and once installed, the trial and error nearly vanished. **If you use GitLab, this is the first skill I'd recommend.**

Skills are cheap to have. Per the [Claude Code docs](https://code.claude.com/docs/en/skills), only each skill's name and description stay resident in context; the full content loads only when the skill is invoked. That's the progressive disclosure from [part 1](/en/blog/agents-md-instruction-budget/): **install a hundred skills and you normally pay only for a hundred lines of descriptions.** And skills follow the [Agent Skills](https://agentskills.io) open standard, so the same skill works across agents.

---

## Extracting skills from conversation history

The question is which workflows deserve a skill. I didn't want to judge from memory, so I wrote [`agentsview-extract`](https://github.com/akunzai/agent-skills/tree/main/skills/agentsview-extract).

It uses [AgentsView](https://github.com/kenn-io/agentsview) to search the conversations I've left across harnesses, finds requests that keep coming back, and routes them by kind:

- **A pitfall or a personal preference** → into `AGENTS.md` (whether and at which tier follows the Prevent Recurrence judgment from [part 4](/en/blog/prevent-recurrence/))
- **A repeated workflow** → into a new `SKILL.md`

Because AgentsView indexes several harnesses at once, something I kept explaining in Codex can become a skill that Claude Code uses too.

## The skills I wrote

My [agent-skills](https://github.com/akunzai/agent-skills) fall roughly into three groups:

- **Git**: engineering work revolves around git, so this group is the largest, such as `tidy-commits` for cleaning up commit history, `pr-workflow` for pre-PR checks, and `github-epic` and `gitlab-epic` for managing epics.
- **Toolchain**: such as `mise`. I love using mise to manage tool versions at the project level, but at the time I couldn't find a mise skill written for users, so I wrote one.
- **Memory and workflow**: the ones this series has covered, such as `agents-md`, `agents-memory`, `tech-lead`, `agentsview-resume`, and `setup-agent-ready-repo`.

---

## Distribution: why I wrote my own skills-manager

I started out managing skills with [`npx skills`](https://github.com/vercel-labs/skills), but soon had three needs it couldn't meet at the time:

1. **Cross-device sync**: I switch between several machines and want to set things up once and restore the same state everywhere else.
2. **Tool-bundled skills**: local tools like `glab` and `playwright-cli` install their skill through the tool's own command, versioned with the tool, rather than from a git repository.
3. **Local symlinks**: for a skill under development, I want to symlink my working directory directly so changes take effect immediately.

So I wrote [skills-manager](https://github.com/akunzai/skills-manager). It declares every skill's source, and which agents can see it, in a single `skills.json`:

- **Three kinds of source**: a remote git repository, a local directory (symlinked), and a **command**, such as `glab skills install glab --global` or `playwright-cli install --global --skills=agents`.
- **Availability is persistent policy**: `--agent claude` isn't a one-time link; every later `skills sync` restores the same availability.
- **Across devices**: I keep `skills.json` in cloud storage, so a new machine only needs `skills sync`.

### Signature verification: making sure the manual didn't come from the beggar

A skill is essentially instructions an agent will follow, so a skill of unknown origin carries the same risk as code of unknown origin. That's why I recently added [signature verification](https://github.com/akunzai/skills-manager/blob/main/docs/SIGNING.md) to skills-manager:

- It supports [OpenSSF Model Signing](https://github.com/sigstore/model-transparency) signatures (`skill.oms.sig`), which both [NVIDIA/skills](https://github.com/NVIDIA/skills) and my agent-skills use.
- It checks before installing: every file must match what was signed, and no unsigned file may be added.
- With Sigstore keyless signatures, the first signer seen is recorded in `skills.json`; a later skill signed by anyone else is refused.
- A skill that fails verification isn't written, and the existing copy stays untouched.

---

## Series recap

All five parts answer the same question: **can the same token get more real work done?**

| Lever | In one sentence |
|---|---|
| INPUT | Knowledge can double; the resident part should be an index |
| CACHE | Don't switch models mid-conversation; after an hour away, start a new conversation |
| MODEL | Put the "which model" rule at the moment of decision |
| REWORK | Don't just record the lesson, block it at the source; let the agent verify itself |
| Distribution | Turn repeated SOPs into skills so every agent gets the same manual |

---

## One thing you can do today

**Find the thing you explain most often and turn it into a skill.** If nothing comes to mind, check whether the CLIs you use ship their own skills: `glab` and `playwright-cli` both do, and installing them saves a lot of wall-hitting.

---

## References

- [Claude Code: Skills](https://code.claude.com/docs/en/skills) — how skills load
- [Agent Skills](https://agentskills.io) — the cross-tool open standard for skills
- [akunzai/agent-skills](https://github.com/akunzai/agent-skills) — my skills
- [akunzai/agent-skills: agentsview-extract](https://github.com/akunzai/agent-skills/tree/main/skills/agentsview-extract) — extract AGENTS.md rules and skills from conversation history
- [akunzai/skills-manager](https://github.com/akunzai/skills-manager) — declarative, signature-verified skill management across agents
- [vercel-labs/skills](https://github.com/vercel-labs/skills) — `npx skills`
- [OpenSSF Model Signing](https://github.com/sigstore/model-transparency) — the signature format used for skills
