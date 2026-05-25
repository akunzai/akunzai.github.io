# Coding Agents Guideline

## Tech Stack

- **Framework:** Astro + Starlight docs theme
- **Blog plugin:** starlight-blog (tags, RSS, pagination)
- **Package manager:** pnpm — NEVER use npm or yarn
- **Language:** TypeScript

## Commands

| Command | Action |
|---------|--------|
| `pnpm dev` | Start dev server at http://localhost:4321 |
| `pnpm build` | Build to `dist/` |
| `pnpm preview` | Preview production build |

## Package Manager Rules

Always use `pnpm`. Never run `npm install`, `npm add`, `yarn add`, or `npx`. Use `pnpm add`, `pnpm install`, `pnpm dlx` instead.

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

- `astro.config.mjs` — Starlight + starlight-blog configuration
- `src/content.config.ts` — extends docs schema with blogSchema
- `.github/workflows/deploy.yml` — GitHub Actions CI/CD
