# Pull requests

**This file is English throughout**, sample blocks included.

Write PR titles, descriptions, and comments in **English**, per the
English Default for Repository Content rule in `AGENTS.md`.
**Git commit messages are English**, imperative, subject under 72
characters — they live in history and get searched by tooling.

This repo has no `.github/PULL_REQUEST_TEMPLATE.md`; what follows is the
whole convention.

## Preparing

- Work on a feature branch. Never prepare a request from `main`.
- Use a concise descriptive title with no Conventional Commit prefix,
  because one request may carry more than one kind of change. The prefix
  belongs on the commit subjects inside the request, not on the request.
- **Do not open a request, draft included, without the developer asking.**

## Description shape

1. A plain-language opening: what changed and why, as a reviewer who did
   not write it would need it.
2. A visual GitHub renders inline, chosen by what changed:

   | Change | Visual |
   | --- | --- |
   | Flow or state transition | Mermaid `flowchart` / `stateDiagram` |
   | Cross-service or API interaction | Mermaid `sequenceDiagram` |
   | Data model | Mermaid `erDiagram` |
   | Appearance — layout, typography, theme, navigation | Before/after screenshots |
   | Multi-step interaction | Short recording |
   | Config, build, or CI only | None; command output instead |

   Pair before and after. At most one diagram unless it is such a pair.
   An appearance change on this site is checked at both breakpoints and
   in both themes, so a before/after pair covers desktop and phone width.

   Upload the file with the repeatable `--attach` flag —
   `gh pr create --attach './after.png#After'`. Alt text follows the path
   after `#`, and a path the body already references as
   `![alt](./after.png)` is rewritten to point at the uploaded asset.
   Only when capture is genuinely impossible, leave a named placeholder
   comment such as `<!-- screenshot pending: after -->`.
3. A collapsed technical trailer holding affected paths, implementation
   notes, verification commands, and log excerpts.

**No personally identifiable information in any attachment**, whatever
you end up attaching. `verification.md`'s capture rules say what that
means here.

## Tests land with the behaviour

This repo ships no automated test suite: there is no test runner, and
`aube run check` plus `aube run build` are the whole machine-checkable
gate. So the rule takes a different form here, and the gap is named
rather than papered over.

- **Behaviour-bearing paths**: `src/components/`, `src/styles/`,
  `src/pages/`, `astro.config.mjs`, `src/content.config.ts`. A change
  here lands with `mise run verify` output and, where appearance changed,
  a before/after capture in the same request. Describe what you exercised
  in the browser; there is no assertion to point at.
- **Exempt**: `src/content/docs/`, `README.md`, `docs/`, `AGENTS.md`,
  `.github/`, `mise.toml`, and dependency bumps with no behaviour change.
  Prose and configuration changes need the gate, not a capture.
- **Structurally untestable** code is declared in the description, naming
  what covers it instead.

No coverage threshold. The reviewer judges whether the new behaviour is
actually exercised.

## Review readiness

Nothing unverified enters review. Two orders satisfy that:

- **Default**: verify locally per `verification.md`, then open the
  request with the evidence. A static site builds locally exactly as it
  does in CI, so this covers nearly every change.
- **When only a deployed environment can verify** — see the list in
  `verification.md` — open the request as a draft
  (`gh pr create --draft`), let the pipeline deploy, verify against it,
  attach evidence citing the workflow run id and the commit SHA, then
  mark it ready.

State in the description which paths were verified and which were not,
with the reason.
