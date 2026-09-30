---
title: "Token Value Maxxing (2) CACHE: Come Back After an Hour and That Turn Costs 80×"
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "prompt-caching"]
description: "I analyzed 120 days and more than thirty thousand conversation turns: an ordinary turn misses the cache only 0.7% of the time, but a turn resumed after an hour writes 80 times as much. Three habits that keep the cache hitting."
---

:::note[Token Value Maxxing series]
0. [Overview: five misconceptions and four levers](/en/blog/token-value-maxxing/)
1. [INPUT: Twice the Knowledge, a Quarter of the Resident Load, Same Compliance](/en/blog/agents-md-instruction-budget/)
2. **CACHE: hit the cache more** (this post)
3. [MODEL: The Rule Was Written, but Absent When the Decision Was Made](/en/blog/subagent-model-selection/)
4. [REWORK: Stop Asking "How Do We Keep This From Happening Again?"](/en/blog/prevent-recurrence/)
5. [Distribution: An SOP Not Written as a Skill Makes Every Agent Hit the Wall](/en/blog/skills-distribution/)

Further reading: [Beyond the Amnesiac Salted Fish: My Hierarchical Global AGENTS.md Architecture](/en/blog/global-agents-architecture/)
:::

In Stephen Chow's *A Chinese Odyssey*, the Monkey King says: "**If I must put a time limit on this love, I hope it is ten thousand years.**"

The cache doesn't get ten thousand years. Claude's prompt cache lives for 5 minutes or 1 hour, and when time runs out, everything you and the agent have built up has to be paid for again.

---

## The data first: which turns cost the most

Using [AgentsView](https://github.com/kenn-io/agentsview), I analyzed every turn in my Claude main conversations (subagents excluded) since 2026-06-01, classified by how long after the previous turn it came and whether the model changed:

| Turn type | Turns | Cache miss rate (median) | Mean write per turn | At Opus 5 prices |
|---|---|---|---|---|
| Ordinary turn (within 5 minutes, same model) | 34,108 | 0.7% | 2.7k tokens | About $0.03 |
| First turn of a session | 1,362 | 44% | 18k tokens | About $0.18 |
| Gap of 5–60 minutes | 542 | 0.2% | 15k tokens | About $0.15 |
| **Model switched mid-conversation** | 38 | **57%** | **69k tokens** | **About $0.69** |
| **Resumed after more than 1 hour** | 13 | **88%** | **224k tokens** | **About $2.24** |

Costs use Opus 5's 1-hour cache write price of $10 per million tokens ([official pricing](https://platform.claude.com/docs/en/about-claude/pricing); all amounts in USD).

Two things stand out:

- **Come back after more than an hour and the write jumps about 80×.** The cache has expired, so the entire history is written again.
- **Switching models mid-conversation rewrites about 69k tokens in that turn**, the equivalent of 25 ordinary turns.

I had only 51 such turns in total, yet they account for 4% of all cache writes. I mostly stick to "one conversation per task," so they're rare; which is exactly why **the occasional lapse stands out so clearly**.

---

## How the cache works

Three Claude cache rules make the habits below easy to follow:

1. **The cache only matches from the start.** Per the [official docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), it's built in `tools → system → messages` order; change any earlier part and everything after it is invalidated.
2. **The cache is per model.** A different model means a different cache, and the whole history is written from scratch for the new model. Changing thinking settings also invalidates the message part of the cache; on Opus 5.5, Sonnet 5.5, and Fable 5.1, Claude Code keeps the cache when you change effort mid-session ([docs](https://code.claude.com/docs/en/prompt-caching#changing-effort-level)); on other Claude models it still resets.
3. **The cache expires.** 5 minutes or 1 hour, and every hit resets the clock. In my measurements Claude Code writes to the 1-hour cache, whose write price is 2× base input.

In other words: **as long as the start stays the same and you're within the time limit, the cache keeps giving you a discount; change it or let it expire and you pay an expensive write.**

---

## Sonnet 5.5 in Claude Code: changing effort mid-session

Per the [docs](https://code.claude.com/docs/en/prompt-caching#changing-effort-level), changing effort mid-session keeps the cache on Sonnet 5.5. On 2026-09-30 I ran one `medium → low → medium` round with `/effort` in a single Claude Code session, staying on Sonnet 5.5. I took each model request's usage from the transcript and computed the hit rate as `cache_read ÷ (input + cache_creation + cache_read)`:

| Request | Effort | Input | Cache write | Cache read | Hit rate |
|---|---|---:|---:|---:|---:|
| Last before switching to low | medium | 2 | 615 | 54,903 | 98.89% |
| First after switching to low | low | 2 | 234 | 55,817 | 99.58% |
| Next request on low | low | 2 | 71 | 56,085 | 99.87% |
| First after switching back to medium | medium | 2 | 234 | 56,191 | 99.58% |

The first request after each switch showed no drop in hit rate and wrote only a few hundred new tokens, matching the docs. This is one round in one session. Codex's docs don't say that changing effort leaves the cache intact, so the drops in the next section are not surprising.

## GPT-6 in Codex: effort and cache lifetime

For Codex subscription use, my question is practical: after changing effort through the UI in the same conversation, does the next request still reuse the cache? That depends on the model and client in use; Claude Code results do not establish Codex behavior.

On 2026-09-30, I used the same Codex conversation with GPT-6.1 Sol throughout and ran two rounds of UI effort changes: `medium → low → medium`. I extracted per-request counts from the session records' `last_token_usage`, calculating hit rate as `cached_input_tokens ÷ input_tokens`. No compaction was recorded during the switches:

| Round | Request | Effort | Input tokens | Cached tokens | Hit rate |
|---|---|---|---:|---:|---:|
| 1 | Last request before switching to low | medium | 191,625 | 190,336 | 99.33% |
| 1 | First request after switching to low | low | 191,979 | 0 | 0% |
| 1 | Next request at low | low | 192,961 | 191,744 | 99.37% |
| 1 | Last request before returning to medium | low | 194,395 | 193,408 | 99.49% |
| 1 | First request after returning to medium | medium | 194,634 | 161,280 | 82.86% |
| 1 | Next request at medium | medium | 195,444 | 194,432 | 99.48% |
| 2 | Last request before switching to low | medium | 203,149 | 201,856 | 99.36% |
| 2 | First request after switching to low | low | 203,384 | 194,176 | 95.47% |
| 2 | Next request at low | low | 204,178 | 203,264 | 99.55% |
| 2 | Last request before returning to medium | low | 205,807 | 204,800 | 99.51% |
| 2 | First request after returning to medium | medium | 206,049 | 198,784 | 96.47% |
| 2 | Next request at medium | medium | 206,887 | 205,824 | 99.49% |

**All four UI switches across two rounds reduced the next request's hit rate, with varying severity.** The first missed entirely; the other three retained partial hits, and the following request always recovered to roughly 99%. In round two, switching to low and returning to medium followed the preceding requests by only about 53 and 45 seconds. Uncached input rose from 1,293 to 9,208 tokens and from 1,007 to 7,265 tokens, respectively, then fell back to 914 and 1,063 tokens.

These are two rounds in one session, without captured outbound requests or controlled cache routing. They do not establish whether effort-update handling, routing, or another factor caused the drops, nor whether every Codex version resets the cache. Repetition makes the observed drop-and-recovery pattern more consistent, but does not establish causation. These are individual model requests, not totals for complete user turns.

As for how long the Codex subscription keeps the cache, the subscription documentation gives no explicit period, so I looked at my local records. I took `gpt-5.6-sol`, the most-used older model in `~/.codex/sessions` (GPT-6.1 Sol is too new to have enough data), and compared each request with the previous one in the same session, 7,453 requests in all. I excluded the first request after a model or effort change, the first after compaction, and any request whose input tokens fell more than 10% below the previous one:

| Gap since previous request | Requests | Median hit rate | Hit rate below 50% |
|---|---:|---:|---:|
| Under 10 s | 4,323 | 98.5% | 0.7% |
| 10–60 s | 2,666 | 98.6% | 0.7% |
| 1–5 min | 355 | 98.5% | 0.3% |
| 5–10 min | 53 | 98.4% | 1.9% |
| 10–15 min | 26 | 97.8% | 0% |
| 15–30 min | 21 | 98.5% | 0% |
| 30–60 min | 8 | 64.3% | 50% |
| Over 60 min | 1 | 8.1% | 100% |

Every bucket up to 30 minutes has a median around 98%. Only 9 requests came after more than 30 minutes, and they are erratic: 95%–99% at 26–33 minutes, 99% at 36.6, just 4% at 36.9, 31% at 39.7, back to 99% at 44.7, and under 10% at 54 minutes and beyond. A third party saw something similar: one user analysing their own 474 Codex sessions reported about 30 minutes for Sol and Astra, with Sol occasionally lasting about an hour ([volt-hq/Volt #458](https://github.com/volt-hq/Volt/issues/458); I only saw a summary and did not verify their raw data). OpenAI's API documentation likewise describes extended retention as "typically around 30 minutes, up to 24 hours" ([Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)), but that describes the API and does not mention subscriptions.

So I treat this only as an observation from this machine: stable hits within about 30 minutes, unreliable afterwards. Nine samples, gaps that include my own waiting time, and a single model mean it is not a TTL.

That is why the "start a new conversation after an hour away" rule below is my Claude Code habit. On Codex, the cache may be gone after about 30 minutes away but that isn't guaranteed; check the cache usage you can see, then decide whether to switch to a compact handoff.

---

## Habit 1: Pick the model before you start, and don't switch mid-way

The usual reasons for switching mid-conversation are "this is getting hard, bring in the big one" or "this part is easy, switch to a small one to save money." Both rewrite the entire history at full price for the new model.

- **Decide up front.** A task's difficulty is usually visible at the start.
- **Send a hard subtask to a subagent instead of switching the main model.** A subagent has its own context and cache, so the main conversation's cache is untouched. Dispatching cheaply and correctly is the subject of part 3: [MODEL: The Rule Was Written, but Absent When the Decision Was Made](/en/blog/subagent-model-selection/).
- **Effort is the exception on newer models.** On Opus 5.5, Sonnet 5.5, and Fable 5.1, changing effort keeps the cache ([docs](https://code.claude.com/docs/en/prompt-caching#changing-effort-level); [announcement](https://claude.com/blog/claude-opus-5-5-built-for-coding-sessions-that-use-more-context)). It doesn't apply on Bedrock, Google Cloud's Agent Platform, or a Claude apps gateway, and the [changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) dates the Fable 5.1 fix to v2.1.260. Opus 5.5 first shipped in Claude Code v2.1.280 and Sonnet 5.5 in v2.1.284, both later, so on those models the version rarely matters. I checked this myself: on Sonnet 5.5, switching effort medium → low → medium didn't drop the cache hit rate in my statusline; on Opus 5.5, switching low → medium → low, the transcript showed each turn still reading the whole history from cache and writing only a few hundred new tokens (one session each). On any other case, set effort up front, as [Anthropic advises](https://claude.com/blog/maximizing-the-value-of-your-claude-code-sessions).

## Habit 2: One conversation per task, and don't resume the next day

139 of my sessions peaked above 200k tokens of context. Most weren't "the task really was that big"; they were "I couldn't be bothered to start a new conversation." Long conversations cost you three ways:

- **Every turn gets pricier.** Even on a cache hit, every turn resends the full history.
- **Expiry hurts more.** The longer the conversation, the more expensive the rewrite after the cache expires; the 224k tokens in the table above are exactly what a long conversation plus an hour's gap produces.
- **Attention gets diluted.** Irrelevant old context mixed in lowers answer quality.

What I do: **different tasks get different conversations; in Claude Code, if I've been away for more than an hour, I come back to a new conversation instead of picking up the old one.**

## Habit 3: A new conversation doesn't mean amnesia

Many people avoid new conversations for fear of losing the earlier context. There are three ways to carry it over:

| Situation | Approach | Cost |
|---|---|---|
| Same tool, same machine | Native resume: `claude --resume`, `codex resume` | Restores the full context, but after cache expiry the whole history is rewritten at full price |
| Across tools or machines, or the original conversation is too long | My [`agentsview-resume`](https://github.com/akunzai/agent-skills/tree/main/skills/agentsview-resume) skill | Carries only a handoff summary of at most 40 lines |
| You already know you'll stop: finishing another day, or quota running low | Write the handoff to short-term memory with [`agents-memory`](https://github.com/akunzai/agent-skills/tree/main/skills/agents-memory) | Carries only the handoff, available next time on any machine |

`agentsview-resume` rebuilds a handoff from the AgentsView transcript in six fixed parts: goal, surface, done, open, stopping point, and warnings. When the harness supports subagents, the transcript reading is delegated to the cheapest capable model: it's summarization, not judgment, and the raw transcript never enters the main conversation. It then **verifies the handoff against the current repository**: it confirms the branch, inspects the diff, rereads the files mentioned, and calls out every mismatch with the current state. Finally it **stops and waits for you to decide** the next step, instead of acting on an old transcript.

If the original conversation has grown to 200k tokens and some time has passed, native resume means rewriting 200k tokens; a 40-line handoff costs a few hundred. **Carry the conclusions, not the whole history.**

When I know in advance that I'll stop, I ask the agent to write the handoff as a short-term memory with `agents-memory`: a standalone dated file that never stays resident. I sync the files under `~/.agents` through Google Drive, so another machine can pick it up. For running low on quota, I automate it with [`codexbar-quota-handoff`](https://github.com/akunzai/agent-skills/tree/main/plugins/codexbar-quota-handoff): when [CodexBar](https://github.com/steipete/CodexBar) reports 90% of the quota used, it reminds the agent to wrap up and, after asking me, writes the handoff into the same short-term memory directory.

---

## Keep the hit rate in view

These habits only stick if **you can see the state of the cache**. My Claude Code statusline shows the model, effort, context usage, and cache hit rate ([script here](https://gist.github.com/akunzai/b1151ff86099c4a12935a71dda2bd380)):

- **High and steady**: keep going.
- **Sudden drop**: check whether the model, effort, or tool list changed.
- **Persistently low**: start a new conversation without hesitation.

---

## Sidebar: if you rely heavily on MCP

My own workflow barely uses MCP, but this matters a lot for heavy MCP users: **tool definitions sit at the very start of the prompt, so any change to the tool list invalidates the entire cache.** An MCP server dropping out or reconnecting can change the tool list.

Most mainstream harnesses already defer loading tool definitions, on by default, so there's usually nothing to configure:

| Harness | Built-in mechanism | Notes |
|---|---|---|
| Claude Code | [Tool search](https://code.claude.com/docs/en/mcp), on by default | Dropped remote servers reconnect automatically, up to five attempts; **stdio servers do not** |
| GitHub Copilot CLI | [Tool search](https://docs.github.com/en/copilot/concepts/agents/copilot-cli/tool-search), on by default | Activates only with roughly 30 or more tools on a supported model; configurable per server via `deferTools` |
| Codex | MCP tools [use tool search by default](https://github.com/openai/codex/pull/29486) (since June 2026) | Known issue: a server's tool-list-changed notification doesn't trigger a refresh ([#33266](https://github.com/openai/codex/issues/33266), still open as of 9/28) |
| Antigravity CLI | Not described in the [official docs](https://antigravity.google/docs/mcp/) | Community reports suggest lazy loading, but I couldn't confirm it from an official source |

- **Consider a gateway only when the built-in mechanism falls short**, such as with flaky stdio servers. [1MCP](https://github.com/1mcp-app/agent) (Apache-2.0) offers opt-in lazy loading that exposes only three fixed tools, `tool_list`, `tool_schema`, and `tool_invoke`, and can automatically recover stdio backends.
- **Mind the license and the effect.** Another frequently mentioned option, [mcp-gateway](https://github.com/MikkoParkkola/mcp-gateway), is under the PolyForm Noncommercial license, so **using it at work requires buying a commercial license**; its own benchmark also notes that the extra search hop didn't reduce tokens on completed tasks. The value of these tools is keeping the tool list stable, not directly saving tokens. I haven't benchmarked either of them myself.

---

## One thing you can do today

**Set yourself one Claude Code rule: if you've been away for more than an hour, come back to a new conversation.** When you need the earlier context, bring it over with resume or a handoff summary rather than forcing your way back into a long conversation whose cache expired long ago.

---

## Appendix: data method and limitations

- **Scope**: 2026-06-01 to 2026-09-28, Claude Code main conversations, excluding subagents and sidechains; only assistant turns with recorded cache usage.
- **Classification**: compared with the previous assistant turn in the same session; a different model counts as "model switched," otherwise the turn is classified by the time gap.
- **Miss rate**: the turn's cache write ÷ (cache write + cache read).
- **Limitations**: AgentsView's records don't capture effort changes, so "effort changed mid-conversation" can't be measured; the 5–60 minute group has almost no misses at the median but a high mean write, presumably from a few turns that hit a 5-minute cache expiry; costs are list-price estimates, while I actually use a subscription plan.

---

## References

- [Claude prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — cache build order, lifetime, and invalidation rules
- [Claude model pricing](https://platform.claude.com/docs/en/about-claude/pricing) — cache write and read prices
- [Anthropic: Maximizing the value of your Claude Code sessions](https://claude.com/blog/maximizing-the-value-of-your-claude-code-sessions) — official session habits: `/clear`, `/compact`, model and effort up front
- [Anthropic: Claude Opus 5.5 is built for coding sessions that use more context](https://claude.com/blog/claude-opus-5-5-built-for-coding-sessions-that-use-more-context) — cache-read price cut, mid-session effort changes, 1-hour cache
- [Claude Code: How Claude Code uses prompt caching](https://code.claude.com/docs/en/prompt-caching) — what invalidates the cache, including the effort-change rules
- [Claude Code: MCP](https://code.claude.com/docs/en/mcp) — tool search and reconnection
- [akunzai/agent-skills: agentsview-resume](https://github.com/akunzai/agent-skills/tree/main/skills/agentsview-resume) — cross-tool, cross-machine handoff skill
- [AgentsView](https://github.com/kenn-io/agentsview) — local AI agent session browser and cost analytics
- [My Claude Code statusline script (GitHub Gist)](https://gist.github.com/akunzai/b1151ff86099c4a12935a71dda2bd380) — shows model, effort, context usage, and cache hit rate
- [1MCP](https://github.com/1mcp-app/agent), [mcp-gateway](https://github.com/MikkoParkkola/mcp-gateway) — MCP gateways
