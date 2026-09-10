# Issue tracker: GitHub

**This file is English throughout**, sample blocks included, so it reads
one way to every model.

Issues live as GitHub issues on `akunzai/akunzai.github.io`. Use the `gh`
CLI for all operations; it infers the repo when run inside a clone.

Write issue titles and descriptions in **English**, per the English
Default for Repository Content rule in `AGENTS.md`. Traditional Chinese
belongs in `src/content/docs/zh-tw/` and the locale configuration, not in
tracker metadata.

## Conventions

- **Create**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read**: `gh issue view <number> --comments`
- **List**: `gh issue list --state open --json number,title,labels`
- **Comment**: `gh issue comment <number> --body "..."`
- **Label**: `gh issue edit <number> --add-label "..."`
- **Close**: `gh issue close <number>`

Use a concise descriptive title with no Conventional Commit prefix. That
prefix belongs on pull request titles and commit subjects instead.

## Description shape

1. Open with what a reader who did not find the problem would observe:
   the symptom or the request, in plain language. For this site that is
   usually a page, a locale, and what looked wrong on it. Skip file paths
   unless the reader cannot otherwise locate the issue.
2. Add a visual GitHub renders inline — a screenshot for a layout,
   typography, or navigation bug, a Mermaid diagram for a build or
   content pipeline problem. Skip formats the description editor cannot
   render, such as a link to an external artifact or a raw HTML or SVG
   file. Upload it with the repeatable `--attach` flag
   (`gh issue create --attach './bug.png#The broken sidebar'`); alt text
   follows the path after `#`. Only when capture is genuinely impossible,
   leave `<!-- screenshot pending: <what it should show> -->` rather than
   omitting it silently.
3. Close with a collapsed technical section, so it does not push the
   human summary below the fold:

```markdown
<details>
<summary>Technical details</summary>

suspected cause, related code paths, repro commands, log excerpts

</details>
```

**No personally identifiable information in any attachment**; use test
data, masking, or cropping. A screenshot of this site taken in a real
browser carries bookmarks, profile names, and open tabs, so crop to the
page content.

## Spec issues

An issue an agent will implement from carries a different shape, because
its reader is building rather than triaging. Acceptance criteria stay
above the fold; only background goes into `<details>`.

```markdown
<one paragraph: the observable outcome, in English>

## Acceptance criteria

- [ ] <checkable statement about observable behaviour>
- [ ] <one per criterion; a reviewer can tick these without reading code>
- [ ] <for content work, name both locales: zh-tw and en>

## Scope

- In: <paths or areas>
- Out: <what this issue deliberately does not change>

## Verification

<how to prove it works, per docs/agents/verification.md>

<details>
<summary>Technical details</summary>

related code paths, prior art, log excerpts, open questions

</details>
```

Content issues inherit the Bilingual Requirement from `AGENTS.md`: an
article or note lands in both `zh-tw` and `en` unless the issue says
otherwise in its Scope section.

An issue with unanswered open questions is not ready to implement. Say
so in the issue rather than letting an agent guess.

## Labels

This repo's own labels, read from `gh label list --limit 100`. The CLI
defaults to 30 and reports that page as the whole set, so a label past
the first page reads as absent. Nothing here invents a vocabulary; when a
label really is missing, that is a conversation with the maintainer, not
a label to create.

- **Required on every issue**: none.
- **Applied when it applies**:
  - `bug` — the published site behaves or renders wrong.
  - `enhancement` — a new feature, article, or note.
  - `documentation` — `AGENTS.md`, `README.md`, or anything under `docs/`.
  - `question` — further information is needed before work can start.
- **Maintainer's to apply, not an agent's**: `good first issue`,
  `help wanted`, `duplicate`, `invalid`, `wontfix`.
- **Dependabot's, never applied by hand**: `dependencies`, `javascript`,
  `github_actions`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
