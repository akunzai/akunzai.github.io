# Coding Agents Guideline

## Tech Stack

- **Framework:** Astro + Starlight docs theme
- **Blog plugin:** starlight-blog (tags, RSS, pagination)
- **Toolchain:** [mise](https://mise.jdx.dev/) manages Node.js + [aube](https://aube.jdx.dev/) versions (`mise.toml`)
- **Package manager:** [aube](https://aube.jdx.dev/) — NEVER use npm, pnpm, or yarn
- **Language:** TypeScript

## Commands

Run `mise install` once to set up the toolchain (Node.js + aube) from `mise.toml`.

| Command | Action |
|---------|--------|
| `aubr dev` | Start dev server at http://localhost:4321 |
| `aubr build` | Build to `dist/` |
| `aubr preview` | Preview production build |
| `aube ci` | Clean install from the frozen `pnpm-lock.yaml` (used in CI) |

## Package Manager Rules

Always use `aube`. Never run `npm`, `pnpm`, or `yarn`. Use `aube add` to add a dependency, `aube install` to install, `aubr <script>` (shim for `aube run`) to run package scripts, and `aubx` (shim for `aube dlx`) for one-off tools.

## Content Directories

| Path | Content type |
|------|-------------|
| `src/content/docs/zh-tw/blog/` | Blog posts (managed by starlight-blog) |
| `src/content/docs/zh-tw/notes/` | Public technical notes |

## Blog Post Front Matter

```markdown
---
title: "Post Title"
date: YYYY-MM-DD
tags: ["tag1", "tag2"]
authors: ["charley"]
---
```

## Notes Front Matter

```markdown
---
title: "Topic Name"
description: "Optional one-liner"
---
```

## Branch Strategy

| Pattern | Purpose |
|---------|---------|
| `main` | Stable; GitHub Actions deploys from here |
| `post/<slug>` | One branch per blog post |
| `notes/<topic>` | One branch per public note |
| `feat/<name>` | Config, theme, structure changes |

## Commit Conventions

- `content:` new blog post
- `notes:` adding/updating a public note
- `feat:` new feature or config change
- `fix:` bug fix
- `ci:` CI/CD workflow changes
- `chore:` maintenance (deps, gitignore, etc.)

## Key Files

- `mise.toml` — pins the Node.js + aube toolchain managed by mise
- `astro.config.mjs` — Starlight + starlight-blog configuration
- `src/content.config.ts` — extends docs schema with blogSchema
- `.github/workflows/deploy.yml` — GitHub Actions CI/CD
