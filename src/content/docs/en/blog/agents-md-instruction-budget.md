---
title: "Token Value Maxxing (1) INPUT: Twice the Knowledge, a Quarter of the Resident Load, Same Compliance"
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "agents-md"]
description: "I slimmed the AGENTS.md of a large project and ran a controlled experiment: rule compliance was 18/18 on both sides, and the real saving was the cache write every new session pays. Plus why I gave up on automatic memory."
---

:::note[Token Value Maxxing series]
0. [Overview: five misconceptions and four levers](/en/blog/token-value-maxxing/)
1. **INPUT: send less** (this post)
2. [CACHE: Come Back After an Hour and That Turn Costs 80×](/en/blog/cache-session-habits/)
3. [MODEL: The Rule Was Written, but Absent When the Decision Was Made](/en/blog/subagent-model-selection/)
4. [REWORK: Stop Asking "How Do We Keep This From Happening Again?"](/en/blog/prevent-recurrence/)
5. Distribution: turning practices into skills (coming soon)

Further reading: [Beyond the Amnesiac Salted Fish: My Hierarchical Global AGENTS.md Architecture](/en/blog/global-agents-architecture/)
:::

In Stephen Chow's *Kung Fu Hustle*, the Beast says: "**Every martial art has a counter, except speed.**"

Anyone who writes `AGENTS.md` has probably heard a similar maxim: the shorter the instructions, the better; keep them under 100 lines or the agent will miss rules. I believed it too, and even wrote it into my own skill. Until I actually measured it.

---

## One slimming, one counterintuitive result

I have a large work project: a .NET Framework backend plus a React Native app. On September 11, 2026, I restructured its agent instructions with my own [`agents-md`](https://github.com/akunzai/agent-skills/tree/main/skills/agents-md) skill:

| Scope | Before | After |
|---|---|---|
| Root `AGENTS.md` (loaded by every session) | 10.4 KB | 5.9 KB (−43%) |
| Resident instructions when working in the app directory (root plus nested) | 35.1 KB | 8.8 KB (**−75%**) |
| All agent docs (including on-demand `docs/agents/*.md`) | 40.1 KB | 80.9 KB (**about 2×**, as of 9/23) |

No knowledge was deleted; it actually doubled. It just moved from "read every turn" to "read when needed."

Then I ran a controlled experiment: the same code, with only the agent docs swapped between the pre- and post-slimming versions. Six probes, each targeting a rule that is **resident** in both versions, such as "the customer entity is `PersonAccount`, not `Account`," "shadows only via `theme.shadow`," and "never create an `index.ts` barrel." Three runs per probe, Sonnet 5, read-only tools.

| Metric | Before | After |
|---|---|---|
| Rules followed | **18/18** | **18/18** |
| Project instructions written to cache on the first turn | About 18.5k tokens | About 8.8k tokens (**−53%**) |
| Total cost of 36 runs (list price, USD) | $1.54 | $0.84 (−46%) |
| Mean turns | 2.5 | 2.2 |

**Compliance didn't change at all.** At the 35 KB scale, a modern model doesn't start missing rules because there are more of them. The maxim I believed wasn't borne out, at least at this scale.

In hindsight, this doesn't contradict [A Complete Guide To AGENTS.md](https://www.aihero.dev/a-complete-guide-to-agents-md), which I drew on when writing `agents-md`. It cites HumanLayer's observation that frontier thinking models can follow roughly 150 to 200 instructions with reasonable consistency. My pre-slimming resident instructions held about 140 list items, still within that range; it was I who condensed the advice into a stricter "100 lines" limit than it meant.

So what did slimming actually save?

---

## The real cost of resident instructions

As the overview noted, a cache read costs at most 10% of input. So resending resident instructions every turn is actually cheap on a cache hit. The real bill sits in two places:

1. **Every new session writes them to the cache again.** In my measurements Claude Code writes to the 1-hour cache, priced at **2×** base input ($4 per million tokens for Sonnet 5, $8 for Opus 5.5, per the [official pricing](https://platform.claude.com/docs/en/about-claude/pricing)).
2. **Every cache invalidation rereads them at full price.** Switching models, changing effort, or resuming the next day all trigger it.

With the roughly 9.7k tokens this slimming saved, each new session saves about $0.04 on Sonnet 5 and about $0.08 on Opus 5.5. Not much once, but I opened hundreds of sessions in 120 days, and that's for one project.

The other saving is **turns**: with fewer instructions, the agent spends less effort "reading every rule before starting."

So I corrected what `agents-md` says: the instruction budget is justified by **write cost** and **maintenance cost**, not compliance, and "100 lines" is a heuristic, not a gate. This project's root is now 144 lines; the extra lines are a Pointers table, which is itself an index.

---

## Write an index, not a manual

The core rule of `agents-md` is one sentence: **a line stays resident only if every task needs it, or if looking it up in the environment is expensive.**

The root `AGENTS.md` holds only:

- A one-sentence description of the project
- The package manager, when it isn't the ecosystem default
- Build and test commands, only the non-standard or hard-to-discover ones
- Pointers to domain docs, schemas, gold-standard tests, and skills
- The Prevent Recurrence rule

Everything else sits behind a pointer. In this project, the slimmed root opens with "**Never guess these three**": the .NET side builds only on Windows, `Account` is not a customer, and never open a merge request unless asked. Guessing any of those wrong ruins the whole task, so they stay resident; the rest is a table of "about to do X, read this doc."

In one experiment run, the agent followed the Pointers on its own to the matching testing guide. On-demand reading isn't theory; agents really use it.

A few details that are easy to get wrong:

- **Write pointers as backtick paths**, not `@path` or Markdown links. Claude Code and Copilot CLI expand `@path` straight into resident content, undoing the slimming.
- **Point rather than copy.** `package.json`, config files, and the directory tree are the live sources; only facts that are expensive to look up deserve a cached copy in `AGENTS.md`.
- **Claude Code now reads `AGENTS.md` directly.** I measured it: adding a `CLAUDE.md` symlink to it still loads the content once, with no double charge.

## Nested AGENTS.md: only at autonomous boundaries

A large repository can place a nested `AGENTS.md` in a subdirectory so rules load close to where they apply. But not every directory needs one:

- **Add one only at an autonomous boundary**, such as an app that builds independently with its own toolchain. `src/` and `tests/` don't each need one.
- **It's an adapter, not a second manual.** This project's app directory had a 24.8 KB nested file; after slimming it's 2.9 KB: a block of "guess wrong and the task is ruined" constraints, a block of "ask before doing," and the rest all pointers.
- **Delete it when its decision disappears.**

---

## Memory needs a threshold: why I gave up on automatic memory

The other source of INPUT is memory. Here I took the long way around.

In May 2026 I tried several memory systems:

- **[MemPalace](https://github.com/MemPalace/mempalace)**: at the time it automatically stored irrelevant memories, and I couldn't find a way to explicitly delete one.
- **[context-mode](https://github.com/mksglu/context-mode)**: at the time I ran into abnormal tool calls.
- **[episodic-memory](https://github.com/obra/episodic-memory)**: I wanted it in Antigravity CLI, which it didn't support. It has since added Codex, Cursor, opencode, and others, but as of 2026-09-28 Antigravity CLI is still not on its supported list.

They all set out to fix agent amnesia, but they were all too heavy for me. So in June I wrote my own `mem-auto`, still built around automatic capture, and kept adding a cross-agent bridge and "capture noise guards."

The turning point came in August. On August 4, I strengthened the self-reflection mechanism in `agents-md` (later renamed Prevent Recurrence) into "record each pitfall in exactly one place": block it in code first; failing that, leave a comment where the next edit must pass; only failing both, write it into a topic doc. **The next day**, I merged the entire `mem-*` family into a single skill that writes only on explicit request: today's [`agents-memory`](https://github.com/akunzai/agent-skills/tree/main/skills/agents-memory).

The reason is simple: lessons worth keeping are already placed at their lowest tier by Prevent Recurrence at the moment the problem is solved. What's left to "remember" is only what the user explicitly asks to remember. The gap automatic capture filled no longer existed; all it left behind was noise, and every piece of noise consumes context.

Today `agents-memory` makes only two decisions:

- **Scope**: global, or this project only.
- **Tier**: a **short-term** candidate is a standalone dated file that never stays resident; a **long-term** rule goes straight into the relevant `AGENTS.md`, must first pass three bars (verified, reusable, stable), and needs human confirmation before it's written.

I've also turned off Claude Code's built-in auto memory (`"autoMemoryEnabled": false`), for the same reason: I want memory with a threshold, not memory that accumulates on its own.

---

## One thing you can do today

**Measure your project's resident cost.** Run this once in your project directory and once in an empty directory; the difference is how much every new session in that project has to write:

```bash
claude -p "Reply with just OK." --output-format json | jq '.usage | .cache_creation_input_tokens + .cache_read_input_tokens'
```

If the difference runs to tens of thousands of tokens, don't rush to delete rules: move them behind pointers so the agent reads them when needed. Your knowledge can double while the resident part shrinks by three quarters.

---

## Appendix: method and limitations

- **Setup**: two worktrees of the same repository with identical code (only doc commits separate the versions), differing only in agent docs; both had a `CLAUDE.md → AGENTS.md` symlink.
- **Probes**: six, each tied to a rule resident in both versions. Rules added during slimming (such as "builds only on Windows") would be unfair to the pre-slimming version, so they were excluded.
- **Execution**: `claude -p`, Sonnet 5, only Read/Grep/Glob, `--no-session-persistence`, three runs per probe, six in parallel.
- **Limitations**: small sample (18 runs per group); one model only; compliance judged by me; parallel runs share part of the cache, so total cost only shows the direction, while the first-turn write is the clean comparison.

---

## References

- [akunzai/agent-skills: agents-md](https://github.com/akunzai/agent-skills/tree/main/skills/agents-md) — instruction budget and progressive disclosure
- [akunzai/agent-skills: agents-memory](https://github.com/akunzai/agent-skills/tree/main/skills/agents-memory) — explicit memory with short-term and long-term tiers
- [AGENTS.md](https://agents.md/) — the cross-tool agent instruction format
- [A Complete Guide To AGENTS.md](https://www.aihero.dev/a-complete-guide-to-agents-md) — the main reference behind `agents-md`, including the instruction budget and progressive disclosure
- [Claude model pricing](https://platform.claude.com/docs/en/about-claude/pricing) — cache write and read prices
- [MemPalace](https://github.com/MemPalace/mempalace), [context-mode](https://github.com/mksglu/context-mode), [episodic-memory](https://github.com/obra/episodic-memory) — memory systems I tried
