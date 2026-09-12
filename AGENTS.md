# akunzai.github.io Developer Guidelines

Personal blog and technical notes for Charley Wu, built with Astro and Starlight.

This project uses Node.js and [aube](https://aube.jdx.dev/) managed via `mise.toml`. Always use `aube` — never npm, pnpm, or yarn. Run `mise install` once to set up the toolchain, and reach `aube` through `mise` (`mise run <task>`, `mise exec -- aube <args>`): the bare `aubr` shim fails in a shell where mise is not activated.

## Commands

- Gate before review: `mise run verify` (type-check plus build; see the Verification pointer for the servers, ports, and evidence rules)
- Add dep: `mise exec -- aube add <pkg>`
- Task list: `mise tasks`

## Content & Localization Guidelines

- **Bilingual Requirement**: All articles and notes must be written in both Traditional Chinese (`zh-tw`) and English (`en`), unless the user explicitly requests restricting the language.
- **English Default for Repository Content**: Except for Traditional Chinese articles (`src/content/docs/zh-tw/...`) and language configurations (e.g. `src/content/i18n/zh-TW.json`, locale metadata in `astro.config.mjs`), all repository content—including code, CSS/configuration comments, agent instructions/skills, documentation, pull requests, and commit messages—must be written in English.
- **Taiwan Terminology**: CI runs [zhtw-mcp](https://github.com/sysprog21/zhtw-mcp) against `src/content/docs/zh-tw/` to catch Mainland-Chinese wording drift (e.g. 軟件/軟體, 回車/Enter); known pre-existing findings are suppressed via `.zhtw-mcp/baseline.json`, so it only fails on new occurrences. Run `mise run zhtw:lint` locally before committing zh-tw prose to avoid a CI surprise; after deliberately accepting a new term, run `mise run zhtw:baseline` to update the baseline.

## Pointers

- Site & blog configuration: `astro.config.mjs`
- Content collections schema: `src/content.config.ts`
- Blog post sample: `src/content/docs/zh-tw/blog/global-agents-architecture.md` / `src/content/docs/en/blog/global-agents-architecture.md`
- Notes sample: `src/content/docs/zh-tw/notes/dev-environment/index.md` / `src/content/docs/en/notes/dev-environment/index.md`
- Deployment workflow: `.github/workflows/deploy.yml`
- Toolchain configuration: `mise.toml`
- When filing or triaging an issue, read `docs/agents/issue-tracker.md`
- When opening a pull or merge request, read `docs/agents/pull-request.md`
- Before running or reporting verification, read `docs/agents/verification.md`

## Prevent Recurrence

- **Candidate**: Name who hits this again, in which file, on what change. No such scenario, nothing to propose.
- **Promote**: Offer the first tier that reaches them and only that one, pending confirmation — enforce it (assert/type/test) with its size quoted so one word can authorize it, else a comment at that site, else an agent-facing doc (`docs/agents/<topic>.md`, else `docs/agents/lessons-learned.md`) with one backtick-path line under Pointers and one sentence on why the tiers above cannot hold it. Never two places at once.
- **Prune**: When adding to a file, audit the rest of it in the same pass. Drop entries once stale (obsolete version, now enforced, duplicated, or a transcript) — not by a fixed count.

## Claude Code Compatibility

`CLAUDE.md` is a symbolic link pointing to `AGENTS.md`. Edit `AGENTS.md` directly.
