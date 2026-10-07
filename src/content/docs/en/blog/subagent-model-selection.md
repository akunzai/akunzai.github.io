---
title: "Token Value Maxxing (3) MODEL: The Rule Was Written, but Absent When the Decision Was Made"
date: 2026-09-28
tags: ["ai-agent", "token-value-maxxing", "subagents"]
description: "I wrote tech-lead and cheap-dev-workers to make the main model pick the cheapest capable model before dispatching, yet four in ten delegations still inherited Opus. Digging in, I found the rule was almost never read."
---

:::note[Token Value Maxxing series]
0. [Overview: five misconceptions and four levers](/en/blog/token-value-maxxing/)
1. [INPUT: Twice the Knowledge, a Quarter of the Resident Load, Same Compliance](/en/blog/agents-md-instruction-budget/)
2. [CACHE: Come Back After an Hour and That Turn Costs 80×](/en/blog/cache-session-habits/)
3. **MODEL: use the right model** (this post)
4. [REWORK: Stop Asking "How Do We Keep This From Happening Again?"](/en/blog/prevent-recurrence/)
5. [Distribution: An SOP Not Written as a Skill Makes Every Agent Hit the Wall](/en/blog/skills-distribution/)

Further reading: [Beyond the Amnesiac Salted Fish: My Hierarchical Global AGENTS.md Architecture](/en/blog/global-agents-architecture/)
:::

Stephen Chow's *The God of Cookery* has the line: "**Anyone can be the God of Cookery, as long as they put their heart into it.**"

Models are the same: Haiku, Sonnet, and Opus can all do good work, provided they're given the right work. The catch is that **someone actually has to make the dispatch decision.**

---

## From 98% to 42%, and then stuck

The overview gave this figure: before I started using my own `tech-lead` skill, **98%** of subagent delegations specified no model and inherited the main conversation's Opus; afterwards it fell to 46%.

This post digs deeper. I only invoke `/tech-lead` for large or parallelizable tasks, so I look only at the **20 sessions since 9/15 that explicitly invoked it**, 166 delegations in total:

| Task type | Inherited main model | Specified Sonnet | Specified Haiku |
|---|---|---|---|
| Review (spec/standards) | 7 | 5 | 0 |
| Implementation slice | 29 | 35 | 1 |
| Tests/e2e | 9 | 10 | 0 |
| Investigation/other | 9 | 12 | 14 |
| **cheap-dev-workers roles** | **13** | 13 | 5 |
| Built-in Explore/claude-code-guide | 3 | 1 | 0 |
| **Total** | **70 (42%)** | 76 | 20 |

Inheriting isn't necessarily wrong. Reviews need judgment, so inheriting Opus is reasonable; some implementation slices involve security fixes, where deliberately inheriting makes sense too. But two things don't add up:

- **Worker roles designed for cheap models ran on Opus four times in ten.**
- **Of the 70 inherited delegations, only 2 briefs stated why.** The rest look less like "assessed and chose to inherit" and more like "never assessed."

---

## The harness won't pick a cheap model for you

First, the defaults. Per the [Claude Code docs](https://code.claude.com/docs/en/sub-agents), a subagent's model is resolved in this order:

1. The per-invocation `model` parameter
2. The subagent definition's `model` field (`inherit` means the main model)
3. The `CLAUDE_CODE_SUBAGENT_MODEL` environment variable
4. The main conversation's model

With none of the first three set, you get the fourth: **the main model**. Even the built-in Explore agent now inherits the main model (capped at Opus) instead of always running on Haiku.

In other words, **the harness won't downgrade by difficulty for you**. "When to delegate, to whom, and with which model and effort" has to be written down, and the caller has to actually follow it.

Effort selection also has cache implications: changing GPT-6.1 Sol effort through the Codex subscription UI reduced the next request's hit rate in my test, before subsequent requests recovered. Do not assume effort changes always avoid additional cache writes. See [the Codex section in part 2](/en/blog/cache-session-habits/#gpt-6-in-codex-effort-and-cache-lifetime) for the single-session results and limitations.

---

## My approach: tech-lead and cheap-dev-workers

### tech-lead: the main model acts only as tech lead

[`tech-lead`](https://github.com/akunzai/agent-skills/tree/main/skills/tech-lead) has the main conversation play tech lead:

1. **Slice**: split the task into slices that can be finished independently, marking the files each may touch and whether it can run in parallel.
2. **Pick a model**: for each slice, choose "the cheapest model and effort that can finish it." **Omitting the model parameter means inheriting the main model, which only high-judgment slices should do**; mechanical slices always get an explicit cheaper pick.
3. **Isolate and accept**: parallel slices run in their own git worktrees; the main conversation only accepts the results, and review skills stay with it.

For the model choice, [Haiku 5.5, released on October 7](https://www.anthropic.com/claude-haiku-5-5), adds a cheaper candidate for extraction, summaries, and narrowly scoped subagent work, with adjustable effort. Start with a bounded task and explicit acceptance criteria, then compare completed-task cost including retries. Prompts over 100K tokens use a higher price tier; a long inherited context can therefore change the economics. Anthropic still recommends Sonnet 5.5 or Opus 5.5 for complex agentic coding. The delegation counts above predate this release and do not measure Haiku 5.5 performance.

### An unexpected bonus: two brains checking each other

`tech-lead` requires each brief to mark "facts I verified from source" separately from "my own guesses for the implementer to check." That design brought a benefit I didn't anticipate: **implementers correct the tech lead's assumptions.**

Those 20 sessions produced 167 implementer reports, and at least 5 explicitly flagged a wrong assumption in the brief. For example, the brief assumed a service didn't use some component, or that some data had to be rebuilt; the implementer checked, overturned it, and explained why in the report. That's a keyword-filtered lower bound; the real count may be higher.

It works like having an actual tech lead and an implementing engineer: the lead decomposes and judges, the engineer verifies on the front line, and **a wrong assumption from one side has a chance of being caught by the other.** The key is labeling assumptions as assumptions; unlabeled, the implementer just executes the whole brief as fact.

### cheap-dev-workers: outsource the chores that would flood the context

[cheap-dev-workers](https://github.com/akunzai/agent-skills/tree/main/plugins/cheap-dev-workers) is a set of permission-bounded workers:

- **repo-explorer**: read-only; answers one bounded code question with file-and-line evidence.
- **evidence-collector**: captures screenshots, recordings, or terminal output of a running app from a scenario you write.
- **log-summarizer**: reduces a large build or CI log to its root causes.

I **deliberately don't hardcode a model** in the definitions, nor tie them to a harness or effort: each role's description only reminds the caller to pick the cheapest capable model, and the caller decides which one at run time. That way, a new harness or a new model needs no change to the definitions.

The price is the 13 in the table above: **whenever the caller forgets to pass `model`, the worker inherits Opus.**

---

## Root cause: the rule existed, but wasn't there

The rule "specify the cheapest model before dispatching" was already in my global rules, `~/.agents/rules/subagents.md`. That file is **loaded on demand**, as described in [part 1](/en/blog/agents-md-instruction-budget/): the global `AGENTS.md` keeps only a one-line trigger and the file is read when needed.

The problem was the trigger. It read:

> when the platform provides subagents and a task is bounded and context-heavy

That sentence describes "the nature of a task," not "the moment of decision." The result: **only 1 of those 20 sessions ever read `subagents.md`.** The rule was written, but absent at the moment the agent was about to delegate.

This is a failure mode of progressive disclosure: **the trigger for an on-demand rule must target the moment of decision, not describe a situation.**

I changed the trigger to:

> before delegating to any subagent, or when a bounded, context-heavy task might warrant one: what to delegate, which model to request, what stays in the primary.

The cost is reading about 2.4 KB of rules before each delegation; the benefit is that the rule finally shows up when the decision is made.

### Other ways to close the gap

If you care less about portability than I do, there are two firmer options:

- **Set `CLAUDE_CODE_SUBAGENT_MODEL`**: subagents without a specified model use this model instead of the main one. The downside is that review slices deliberately inheriting Opus get downgraded too.
- **Add a `PreToolUse` hook**: block a worker call that has no `model`, forcing the caller to decide first. It doesn't pick a model for you, only makes you pick one; the downside is that it works in Claude Code only.

---

## A positive example: write the delegation into the skill

`agentsview-resume`, mentioned in [part 2](/en/blog/cache-session-habits/), is an example of delegation written out more fully. The skill states explicitly that when the harness supports subagents, transcript reading goes to "the cheapest capable setting," because it's summarization, not judgment.

**Writing down why a cheap model is fine works better than just writing "use a cheap model."** When the caller knows the reason, it's less likely to forget.

---

## One thing you can do today

**Count how many of your delegations specify no model.** Claude Code keeps transcripts under `~/.claude/projects/`, and one command tallies them:

```bash
cat ~/.claude/projects/*/*.jsonl | jq -r 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and (.name=="Agent" or .name=="Task")) | if .input.model then "explicit: \(.input.model)" else "inherit" end' | sort | uniq -c
```

The `inherit` line is the number of times nobody decided and the main model was used by default.

---

## Appendix: data method and limitations

- **Scope**: the 20 Claude Code sessions from 2026-09-15 to 2026-09-28 in which the user explicitly invoked `/tech-lead`, excluding forks.
- **Classification**: by each delegation's short description, judged by me; the raw descriptions involve work content and aren't published.
- **"Read `subagents.md`"**: determined by whether any tool call in the session read that file.
- **Limitations**: the logs can't show whether inheriting was a considered choice; it can only be inferred from whether the brief gave a reason.

---

## References

- [Claude Code: Subagents](https://code.claude.com/docs/en/sub-agents) — how a subagent's model is resolved
- [akunzai/agent-skills: tech-lead](https://github.com/akunzai/agent-skills/tree/main/skills/tech-lead) — slicing, model choice, isolation, and acceptance
- [akunzai/agent-skills: cheap-dev-workers](https://github.com/akunzai/agent-skills/tree/main/plugins/cheap-dev-workers) — permission-bounded cheap workers
- [My Global Agent Instructions (GitHub Gist)](https://gist.github.com/akunzai/c6c90c01a07eba50d26514ce676eaa40) — includes `subagents.md` and the revised trigger
- [AgentsView](https://github.com/kenn-io/agentsview) — local AI agent session browser and cost analytics
- [Anthropic: Introducing Claude Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5) — model positioning, tiered pricing, Sonnet cache-read reduction, and monthly API credits
