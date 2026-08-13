# Coding Agents Guideline

## Quick Commands

Run `mise install` once to set up Node.js + [aube](https://aube.jdx.dev/) from `mise.toml`. Always use `aube` / `aubr` / `aubx` — never npm, pnpm, or yarn.

- Dev: `aubr dev` (http://localhost:4321)
- Build: `aubr build` → `dist/`
- Preview: `aubr preview`
- CI install: `aube ci` (frozen `pnpm-lock.yaml`)
- Add dep: `aube add <pkg>`

## Rich References & Core Schemas

- Site + Starlight / starlight-blog config: @astro.config.mjs
- Content collections (docs + `blogSchema`): @src/content.config.ts
- Blog post example: @src/content/docs/zh-tw/blog/hello-world.md
- Notes example: @src/content/docs/zh-tw/notes/index.md
- Deploy (GitHub Pages): @.github/workflows/deploy.yml
- Toolchain pins: @mise.toml

## Architecture Overview

- `src/content/docs/zh-tw/blog/` — blog posts (starlight-blog)
- `src/content/docs/zh-tw/notes/` — public technical notes
- `src/pages/` — Astro pages
- `.github/workflows/` — CI/CD

## Self-Reflection

- **Candidate**: Distill non-obvious gotchas, hidden configurations, or project patterns into concise, non-derivable rules (≤ 2 bullets, context-tagged, no drifting metrics). Propose the candidate to the user before writing anything.
- **Promote**: On confirmation, write it to a dedicated file — never inline in `AGENTS.md` itself. Merge into an existing topic doc if one covers the subject, otherwise create `docs/<topic>.md`; fall back to `docs/lessons-learned.md` for miscellaneous items. Add or update a single `@path` reference line per file under Rich References.
- **Prune**: Drop entries once stale (obsolete version, now enforced by a linter/type/test, duplicated elsewhere, or a debugging transcript) — not by a fixed entry count.

## Claude Code Compatibility

`CLAUDE.md` is a symbolic link pointing to `AGENTS.md`. Edit `AGENTS.md` directly.
