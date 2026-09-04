# akunzai.github.io Developer Guidelines

Personal blog and technical notes for Charley Wu, built with Astro and Starlight.

This project uses Node.js and [aube](https://aube.jdx.dev/) managed via `mise.toml`. Always use `aube` / `aubr` / `aubx` — never npm, pnpm, or yarn. Run `mise install` once to set up the toolchain.

## Commands

- Dev: `aubr dev` (http://localhost:4321)
- Build: `aubr build` → `dist/`
- Preview: `aubr preview`
- CI install: `aube ci` (frozen `pnpm-lock.yaml`)
- Add dep: `aube add <pkg>`

## Pointers

- Site & blog configuration: @astro.config.mjs
- Content collections schema: @src/content.config.ts
- Blog post sample: @src/content/docs/zh-tw/blog/hello-world.md
- Notes sample: @src/content/docs/zh-tw/notes/index.md
- Deployment workflow: @.github/workflows/deploy.yml
- Toolchain configuration: @mise.toml

## Self-Reflection

- **Candidate**: Distill a non-obvious gotcha into ≤ 2 context-tagged bullets. Propose it before writing.
- **Promote**: On confirmation, put it where whoever would break it must already pass — enforce it (assert/type/test) when the fix is in hand, else a comment at that site, else an agent-facing doc (`docs/agents/<topic>.md`, else `docs/agents/lessons-learned.md`) with one `@path` line under Pointers. Never both.
- **Prune**: Drop entries once stale (obsolete version, now enforced, duplicated, or a transcript) — not by a fixed count.

## Claude Code Compatibility

`CLAUDE.md` is a symbolic link pointing to `AGENTS.md`. Edit `AGENTS.md` directly.
