---
title: "Token Value Maxxing (4) REWORK: Stop Asking \"How Do We Keep This From Happening Again?\""
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "verification"]
description: "It took me four months to see it: asking an agent to write down a lesson isn't enough; the problem has to be blocked at its source. Add agents that verify and record their own work, and broken implementations get stopped before a human ever reviews them."
---

:::note[Token Value Maxxing series]
0. [Overview: five misconceptions and four levers](/en/blog/token-value-maxxing/)
1. [INPUT: Twice the Knowledge, a Quarter of the Resident Load, Same Compliance](/en/blog/agents-md-instruction-budget/)
2. [CACHE: Come Back After an Hour and That Turn Costs 80×](/en/blog/cache-session-habits/)
3. [MODEL: The Rule Was Written, but Absent When the Decision Was Made](/en/blog/subagent-model-selection/)
4. **REWORK: redo less** (this post)
5. [Distribution: An SOP Not Written as a Skill Makes Every Agent Hit the Wall](/en/blog/skills-distribution/)

Further reading: [Beyond the Amnesiac Salted Fish: My Hierarchical Global AGENTS.md Architecture](/en/blog/global-agents-architecture/)
:::

In Stephen Chow's *A Chinese Odyssey*, the Monkey King cries "**Prajnaparamita!**" again and again, using the Moonlight Box to go back in time and rewrite the ending.

When working with agents, rework is that Moonlight Box: stepping into the same pitfall over and over, paying a fresh round of tokens with every rewind. The previous three parts cut the unit price; this one cuts **the number of times**.

---

## Where should a lesson live? Four steps

Every time an agent and I solve a thorny problem, I want the next time to need no solving. I changed how I do that four times:

| When | Approach | Problem |
|---|---|---|
| May | Ask the agent to write what it learned into `AGENTS.md` | `AGENTS.md` kept growing (part 1 covered the cost) |
| August | Split into topic files under `docs/lessons-learned/` | Content for humans and content for agents weren't separated |
| Early September | Separate by reader, moving to `docs/agents/lessons-learned.md` | The lesson was recorded, **yet the same problem kept happening** |
| **September 8** | **Prevent Recurrence: ask how to prevent it before asking how to record it** | — |

After the third step, I found myself following up every solved problem with "how do we keep this from happening again?" The agent's first instinct was always "write a note," because the first question the rule asked was "what did you learn?" The [commit message](https://github.com/akunzai/agent-skills/commit/6681be9) for that change says:

> Self-Reflection asked "distil a rule" first, so after solving a problem the agent proposed a doc entry and the user had to follow up every time with "how do we stop this happening again?".

**Recording a lesson doesn't mean it won't happen again.** A note only helps if it gets read, and [part 3](/en/blog/subagent-model-selection/) just showed that an on-demand doc goes unread when its trigger misses. A test is different: it runs every time.

---

## Prevent Recurrence: three steps

Today the Prevent Recurrence rule in [`agents-md`](https://github.com/akunzai/agent-skills/tree/main/skills/agents-md) has just three steps:

1. **Candidate: name who hits it again.** You must be able to say "who, in which file, on what change" runs into it again. No scenario, nothing to propose.
2. **Promote: offer one tier only, the first one from the top that can hold it.**
   - **Block it in code**: an assert, a type, or a test, with the size of the change quoted so one word can authorize it.
   - If that can't hold it, **leave a comment at the site the next person must edit**.
   - Only if neither works, write it into a topic doc, with one sentence on why the tiers above can't hold it.
3. **Prune: clean up while writing.** When adding an entry, delete entries in the same file that are stale, now enforced in code, or duplicated.

### Example 1: turn it into a test

Claude Code decides whether to update a plugin by the version in `plugin.json`, not by git SHA. Change a plugin but forget to bump its version, and users never get the update.

That pitfall went into no note; it became a [test](https://github.com/akunzai/agent-skills/blob/main/tests/plugin-version-bump.sh): whenever a plugin's files change without a version change, CI fails.

### Example 2: design it out of existence

My [skills-manager](https://github.com/akunzai/skills-manager) used to carry a line in `lessons-learned.md`: the CLI framework's flag state leaks into the next execution, so remember to reset it between tests.

Later I [changed it to build a brand-new command tree for every execution](https://github.com/akunzai/skills-manager/commit/2fd8e76), so flag state can no longer leak. The lesson and all the reset code were deleted together.

**The best lesson is one you no longer need to remember.**

---

## Let the agent verify before a human sees it

Another kind of rework comes from "the agent says it's done, then a human finds it broken."

It started with a work project: the PM and new teammates said they couldn't understand the merge requests agents opened. So I added three requirements to its agent docs:

1. **The first half of an MR is written for humans**: plain language on what changed and why.
2. **Verify locally before delivery**, and put the verification results in the description.
3. **Attach visual evidence matched to the kind of change**: a flow diagram for a flow change, before/after screenshots for a UI change, a recording for a multi-step interaction.

I only meant to make MRs readable, but found that **these three rules often stopped broken implementations before any human review.** To attach evidence, the agent has to actually run it first; once it runs, the problem surfaces.

Later I read the same argument in Anthropic Academy's [Give Claude a feedback loop](https://academy.claude.com/courses/ai-native-sdlc-playbook/give-claude-a-feedback-loop): always give Claude a way to verify its own work, whether tests, a build, or a screenshot diff; it iterates until the check passes, so what reaches the engineer has already passed it.

### setup-agent-ready-repo: make it standard for every repo

I extracted this into [`setup-agent-ready-repo`](https://github.com/akunzai/agent-skills/tree/main/skills/setup-agent-ready-repo). It interviews once, then produces:

- Conventions for filing issues and opening PRs/MRs
- `docs/agents/verification.md`: wraps however the project already starts into **one non-interactive verification command**, runs it, and records **what it could not verify** rather than claiming a pass
- Pointers in `AGENTS.md` saying when to read them

The blog you're reading is set up this way. While writing this series, `mise run verify` caught, before anyone saw it, that a frontmatter field I'd used made RSS generation fail; the Traditional Chinese terminology check that CI also runs caught several words that don't match Taiwan usage. **None of those errors reached review.**

### record-walkthrough: hand recording to the agent too

The product team records a feature video for every release, and reviewers of web changes had to pull the branch, build it, and click through themselves. So I wrote [`record-walkthrough`](https://github.com/akunzai/agent-skills/tree/main/skills/record-walkthrough): the agent runs the site itself, follows a scenario, and records a video that auto-zooms on clicks, attached to the PR or MR.

It costs extra tokens, but I think it's well worth it: a reviewer can tell from the video whether the behavior is right, and compared with manual verification, or asking the agent to redo everything after a mistake, those tokens are cheap.

**Capturing evidence can go to a cheap model too.** My recently revised cheap-dev-workers include an evidence-collector: the main conversation writes the scenario, the worker executes it and reports step by step whether what it observed matched what was expected, and judgment stays with the main conversation. The role only just shipped, so I have no data to share yet.

---

## One thing you can do today

**Next time you and an agent fix a bug, don't ask "how do we keep this from happening again?" Ask instead:**

> Who hits this again, in which file, on what change? Can we write a test that fails the moment it happens again?

If the answer is yes, no note is needed at all.

---

## References

- [akunzai/agent-skills: agents-md](https://github.com/akunzai/agent-skills/tree/main/skills/agents-md) — the Prevent Recurrence rule
- [akunzai/agent-skills: setup-agent-ready-repo](https://github.com/akunzai/agent-skills/tree/main/skills/setup-agent-ready-repo) — lets agents file tickets, open PRs, and verify their own changes
- [akunzai/agent-skills: record-walkthrough](https://github.com/akunzai/agent-skills/tree/main/skills/record-walkthrough) — automated website walkthrough recordings
- [akunzai/agent-skills: cheap-dev-workers](https://github.com/akunzai/agent-skills/tree/main/plugins/cheap-dev-workers) — includes evidence-collector
- [Anthropic Academy: Give Claude a feedback loop](https://academy.claude.com/courses/ai-native-sdlc-playbook/give-claude-a-feedback-loop) — letting Claude verify its own work
