# akunzai.github.io Developer Guidelines

Personal blog and technical notes for Charley Wu, built with Astro and Starlight.

This project uses Node.js and [aube](https://aube.jdx.dev/) managed via `mise.toml`. Always use `aube` / `aubr` / `aubx` — never npm, pnpm, or yarn. Run `mise install` once to set up the toolchain.

## Commands

- Dev: `aubr dev` (http://localhost:4321)
- Build: `aubr build` → `dist/`
- Preview: `aubr preview`
- Check: `aubr check`
- CI install: `aube ci` (frozen `pnpm-lock.yaml`)
- Add dep: `aube add <pkg>`

## Content & Localization Guidelines

- **Bilingual Requirement**: All articles and notes must be written in both Traditional Chinese (`zh-tw`) and English (`en`), unless the user explicitly requests restricting the language.
- **English Default for Repository Content**: Except for Traditional Chinese articles (`src/content/docs/zh-tw/...`) and language configurations (e.g. `src/content/i18n/zh-TW.json`, locale metadata in `astro.config.mjs`), all repository content—including code, CSS/configuration comments, agent instructions/skills, documentation, pull requests, and commit messages—must be written in English.
- **Taiwan Terminology**: CI runs [zhtw-mcp](https://github.com/sysprog21/zhtw-mcp) against `src/content/docs/zh-tw/` to catch Mainland-Chinese wording drift (e.g. 軟件/軟體, 回車/Enter); known pre-existing findings are suppressed via `.zhtw-mcp/baseline.json`, so it only fails on new occurrences. Run `mise run zhtw:lint` locally before committing zh-tw prose to avoid a CI surprise; after deliberately accepting a new term, run `mise run zhtw:baseline` to update the baseline.

## Pointers

- Site & blog configuration: @astro.config.mjs
- Content collections schema: @src/content.config.ts
- Blog post sample: @src/content/docs/zh-tw/blog/global-agents-architecture.md / @src/content/docs/en/blog/global-agents-architecture.md
- Notes sample: @src/content/docs/zh-tw/notes/dev-environment/index.md / @src/content/docs/en/notes/dev-environment/index.md
- Deployment workflow: @.github/workflows/deploy.yml
- Toolchain configuration: @mise.toml

## Self-Reflection

- **Candidate**: Distill a non-obvious gotcha into ≤ 2 context-tagged bullets. Propose it before writing.
- **Promote**: On confirmation, put it where whoever would break it must already pass — enforce it (assert/type/test) when the fix is in hand, else a comment at that site, else an agent-facing doc (`docs/agents/<topic>.md`, else `docs/agents/lessons-learned.md`) with one `@path` line under Pointers. Never both.
- **Prune**: When Promote reaches the doc tier, read that file in full and propose deletions alongside the addition. Drop entries once stale (obsolete version, now enforced, duplicated, or a transcript) — not by a fixed count or "periodically".

## Claude Code Compatibility

`CLAUDE.md` is a symbolic link pointing to `AGENTS.md`. Edit `AGENTS.md` directly.
