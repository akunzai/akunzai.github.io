---
title: "Token Value Maxxing: A 98.5% Cache Hit Rate, and I Was Still Wasting Money"
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "cost"]
description: "Burning more tokens is not a KPI; output is. Using 120 days of my own AgentsView data, I take apart five common misconceptions about AI coding agent costs."
---

:::note[Token Value Maxxing series]
0. **Overview: five misconceptions and four levers** (this post)
1. [INPUT: Twice the Knowledge, a Quarter of the Resident Load, Same Compliance](/en/blog/agents-md-instruction-budget/)
2. [CACHE: Come Back After an Hour and That Turn Costs 80×](/en/blog/cache-session-habits/)
3. [MODEL: The Rule Was Written, but Absent When the Decision Was Made](/en/blog/subagent-model-selection/)
4. [REWORK: Stop Asking "How Do We Keep This From Happening Again?"](/en/blog/prevent-recurrence/)
5. [Distribution: An SOP Not Written as a Skill Makes Every Agent Hit the Wall](/en/blog/skills-distribution/)

Further reading: [Beyond the Amnesiac Salted Fish: My Hierarchical Global AGENTS.md Architecture](/en/blog/global-agents-architecture/)
:::

In Stephen Chow's *A Chinese Odyssey*, the Monkey King laments: "**Once, a true love was laid before me, and I did not cherish it.**"

My version: once, a cheap model was laid before me, and I did not pick it.

---

## The data first: I thought I was frugal

I used [AgentsView](https://github.com/kenn-io/agentsview) to audit my last 120 days (since 2026-06-01) of AI coding agent sessions. All amounts below are in US dollars (USD) and are **estimates at API list prices**. I'm on a subscription plan, so what I actually pay is far lower; but list prices best reflect the real cost of each habit.

| Metric | Value |
|---|---|
| Claude cache hit rate | **98.5%** (195 of 229 sessions above 95%) |
| Spend at list price | About $3,924 |
| Saved by caching | About $23,458; without caching the bill would be roughly **7×** |

Looks great. Now dig one level deeper:

| Metric | Value |
|---|---|
| Peak context per session | Mean about 192k; 139 of 371 sessions **exceeded 200k** |

Then look at the calls that delegate work to subagents. On September 15 I started using my own `tech-lead` skill, which requires the main model to assess "the cheapest model that can finish the task" before dispatching:

| Period | Subagent calls | **No model specified**, inheriting the main model |
|---|---|---|
| Sep 7–14 (before) | 96 | 95 (**98%**) |
| Sep 15 onward (after) | 182 | 85 (**46%**) |

Before, almost no delegation involved anyone deciding which model to use. It wasn't "assessed and picked Opus"; it was **never assessed, so Opus by default**. After, things improved noticeably, yet nearly half of all delegations still skipped that step.

A 98.5% hit rate only means "most of what I sent got a discount." It doesn't mean "everything I sent needed sending."

---

## "Use more tokens" is not a KPI; output is

Last year's common instruction was "try more models, run more agents." Usage looked impressive, and so did the bill.

This year's question is: **can the same token get more real work done?** I look at four dimensions together:

> **Success rate × Speed × Cost × Repeatability**

Optimize cost alone and you'll hand everything to the cheapest model, then redo it three times. Optimize success rate alone and you'll run everything at full power. Only by weighing all four can you see where money is well spent.

### Every AI bill has three payers

| Item | What it covers | Characteristic |
|---|---|---|
| **Input** | History, instructions, tool definitions | The longer the conversation, the more gets resent each turn |
| **Output** | Replies and reasoning | Highest unit price; save the big guns for hard problems |
| **Cache** | Reusing an identical prefix on a hit | Don't re-brew the same soup every day |

Taking Claude as the example ([official pricing](https://platform.claude.com/docs/en/about-claude/pricing), verified 2026-09-29, USD per million tokens):

| Model | Input | Cache read | Output |
|---|---|---|---|
| Fable 5.1 | $10 | $0.25 (2.5%) | $50 |
| Opus 5.5 | $4 | $0.20 (5%) | $20 |
| Sonnet 5.5 | $2 | $0.20 (10%) | $10 |
| Haiku 4.5 | $1 | $0.10 (10%) | $5 |

Two things worth remembering: **a cache hit costs at most 10% of input**, and even less on flagship models; **Haiku costs about 1/4 of Opus 5.5**. Those two ratios are the source of leverage for every technique that follows.

---

## Five common misconceptions

### Misconception 1: Switching models mid-conversation only affects later replies?

The cache is per model. Switch models mid-conversation and the entire history is reread by the new model at full price. Changing effort or thinking settings, or an MCP server dropping out and changing the tool definitions, also invalidates the cache from that point on. The [official docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) are explicit: the cache is built in `tools → system → messages` order, and **a change early on invalidates everything after it**.

→ More in part 2: [CACHE: Come Back After an Hour and That Turn Costs 80×](/en/blog/cache-session-habits/), in its MCP sidebar.

### Misconception 2: Keeping one conversation going all day is cheaper?

The cache lives only 5 minutes to 1 hour. Pick up the thread the next day and the whole history is reread at full price. Even while the cache is warm, every turn resends the full history, so later questions cost more; and irrelevant old context dilutes attention and degrades answer quality.

139 of my own sessions peaked above 200k tokens of context. Most weren't "the task really was that big"; they were "I couldn't be bothered to start a new conversation."

→ More in part 2: [CACHE: Come Back After an Hour and That Turn Costs 80×](/en/blog/cache-session-habits/): one conversation per task, with handoffs instead of marathons.

### Misconception 3: The more you put in AGENTS.md and memory, the smarter the AI?

`AGENTS.md` and memory files are resent every turn. With caching, that resend is actually cheap; the real cost is that **every new session writes them to the cache again**. In my measurements Claude Code writes to the 1-hour cache, priced at **2×** base input, and every cache invalidation rereads them at full price. Only "facts needed every single time" deserve to stay resident; everything else belongs in a nested `AGENTS.md` or an on-demand skill.

→ More in part 1: [INPUT: Twice the Knowledge, a Quarter of the Resident Load, Same Compliance](/en/blog/agents-md-instruction-budget/). For governance at the global layer, see [Beyond the Amnesiac Salted Fish: My Hierarchical Global AGENTS.md Architecture](/en/blog/global-agents-architecture/).

### Misconception 4: The harness judges difficulty and dispatches a cheaper model on its own?

It doesn't. Most harnesses let the main model do everything by default, and a subagent without an explicit model usually inherits the main conversation's model. That's exactly where my 98% before `tech-lead` came from: **not deciding means choosing the most expensive option**.

"When to delegate, to whom, and with which model and effort" must be written explicitly into a skill or agent definition, and the caller has to actually pass that choice through.

→ More in part 3: [MODEL: The Rule Was Written, but Absent When the Decision Was Made](/en/blog/subagent-model-selection/): the design of `tech-lead` and cheap-dev-workers, and how the remaining 46% slipped through.

### Misconception 5: Leaving verification to humans is cheaper?

When a human finds the problem only after the agent delivers, the round of rework that follows is the most expensive token of all. Stepping into the same pitfall twice is pure waste. Let the agent verify locally with a single command, turn pitfalls into tests rather than resident instructions, and hand screenshots and recordings to a cheap worker, so the main conversation only reviews results and makes judgments.

→ More in part 4: [REWORK: Stop Asking "How Do We Keep This From Happening Again?"](/en/blog/prevent-recurrence/): Prevent Recurrence and agent-ready repositories.

---

## Four levers

Flip the five misconceptions around and you get four levers for saving tokens, which form the backbone of this series:

| Lever | Goal | Means | Series |
|---|---|---|---|
| **INPUT** | Send less | Lean, layered `AGENTS.md`; on-demand skills; handoffs carry only summaries | Part 1 |
| **CACHE** | Hit the cache more | No mid-conversation model switches; a stable tool surface; one conversation per task | Part 2 |
| **MODEL** | Use the right model | Explicit models for delegation; the main conversation only judges | Part 3 |
| **REWORK** | Redo less | Pitfalls become tests; verify locally before delivery; attach evidence to pass review first time | Part 4 |

The final part, [Distribution: An SOP Not Written as a Skill Makes Every Agent Hit the Wall](/en/blog/skills-distribution/), covers turning these repeated practices into skills and syncing them across agents with [skills-manager](https://github.com/akunzai/skills-manager).

---

## One thing you can do today

**Put the hit rate where you can see it.** Without a dashboard, you're driving with only a fuel gauge.

- Show the model and effort, context usage, and cache hit rate in your statusline (see [my Claude Code statusline script](https://gist.github.com/akunzai/b1151ff86099c4a12935a71dda2bd380)): if the hit rate is **high and steady**, keep going; on a **sudden drop**, check whether the model, effort, or MCP changed; if it's **persistently low**, start a new conversation without hesitation.
- Install [AgentsView](https://github.com/kenn-io/agentsview) and look back at which conversations grew expensive and which subagents ran without a specified model.

You don't have to believe my five misconceptions up front. Measure first, and the data will speak for itself, just as it did for me.

---

## References

- [Claude model pricing](https://platform.claude.com/docs/en/about-claude/pricing) — input, output, and cache prices per model
- [Claude prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — cache build order and invalidation rules
- [AgentsView](https://github.com/kenn-io/agentsview) — local AI agent session browser and cost analytics
- [My Claude Code statusline script (GitHub Gist)](https://gist.github.com/akunzai/b1151ff86099c4a12935a71dda2bd380) — shows model, effort, context usage, and cache hit rate
- [GitHub: akunzai/agent-skills](https://github.com/akunzai/agent-skills) — `tech-lead`, cheap-dev-workers, and other skills
- [GitHub: akunzai/skills-manager](https://github.com/akunzai/skills-manager) — declarative skill management across agents
