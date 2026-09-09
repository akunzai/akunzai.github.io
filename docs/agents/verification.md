# Verification

How an agent exercises a change in this repo before it reaches review.
`README.md` is a one-line description and holds no setup narrative;
toolchain commands live in `AGENTS.md`. This file holds what an agent
needs to prove a change works.

## Starting the environment

```sh
mise run verify
```

<!-- drift:forge github -->
<!-- drift:entrypoint-cmd mise run verify -->

That task runs `aube run check` then `aube run build`, the same two steps
CI's Check & Build job runs. It never prompts.

**Always reach `aube` through `mise`.** The bare `aubr` shim fails in a
shell where mise is not activated, with `No version is set for shim:
aubr` — which reads like a broken toolchain and is not one. Use
`mise run <task>`, or `mise exec -- aube run <script>` for a script that
has no task.

**Proof it ran**: the task exits zero and `dist/index.html` exists. A
build that printed pages is not proof on its own; check the exit status.

Visual entry point: `mise exec -- aube run preview` serves `dist/` at
<http://localhost:4321>. `mise exec -- aube run dev` serves `src/` with
hot reload. No accounts, no credentials, no database.

## Checks

`mise tasks` lists this repo's tasks with their own descriptions; none of
them are copied here.

| What | Command |
| --- | --- |
| The gate | `mise run verify` |
| Type and syntax only | `mise exec -- aube run check` |
| Static build only | `mise exec -- aube run build` |
| zh-TW terminology, when `src/content/docs/zh-tw/` changed | `mise run zhtw:lint` |
| Dependencies, when `node_modules` is missing | `mise exec -- aube ci` |

`mise run zhtw:lint` builds and runs a container, so Docker must be
running. It has been run against the current `.zhtw-mcp/baseline.json`
and exits 0, reporting only suppressed baseline findings, so a non-zero
exit means new drift and not a broken check. Skipping it is a gap to
declare, not a silent omission: CI runs the same check and fails the
pull request.

## Human prerequisites

Run once, by a person. `mise run verify` fails until they are done.

- [ ] `mise install` — installs Node.js and aube per `mise.toml`.
- [ ] Start Docker, needed only for `mise run zhtw:lint`.

## Ports

The dev and preview servers are reached by port, and Astro allocates
around a busy one: with preview holding 4321, a second server takes 4322
and prints the URL it chose. Read that printed URL rather than assuming
4321, and several agents can then work the repo at once.

<!-- drift:port 4321 -->

Both servers detach and outlive the shell that started them. Stop them
with `mise exec -- aube run astro -- preview stop` and
`... dev stop`; `preview status` and `dev status` report what is running.
Killing the calling shell leaves the server up and the port taken.

## Changes that need a deployed environment

There is no pre-merge environment. GitHub Pages deploys from `main` after
merge, and the local build produces the same `dist/` that CI uploads, so
local verification is authoritative for every change here.

The one thing only production shows is how the deployed site behaves
under its real origin — absolute URLs in the RSS feed and sitemap, and
the search index. Spot-check <https://akunzai.github.io> after the deploy
workflow finishes, and cite the workflow run id and commit SHA in any
evidence taken there.

Agent may deploy to it: **no**. Deployment is the `deploy.yml` workflow's,
triggered by a merge to `main`.

## Capturing evidence

- Recording: the `to-walkthrough-video` skill for a browser flow; `tcut`
  for terminal output.
- Screenshots: the `playwright-cli` or `terminal-browser` skill against
  the preview server, so the frame holds the page and not the developer's
  browser chrome.

**This document is where the capture rules live**, and `pull-request.md`
points here rather than restating them. A capture taken on the
developer's own machine carries their account's data, username, and home
paths as readily as a shared environment does. Assert on the frame, a
marker, or fixture data, and crop or mask what the tool happened to be
showing.

An appearance change is captured at desktop and phone width, and in both
light and dark themes, because the site ships all four and a regression
usually appears in only one.

## Not verified

- Prose accuracy and tone in `src/content/docs/`: the build proves a page
  renders, never that it says the right thing. That stays a human read.
- Live-site behaviour before merge: no pre-merge environment exists, per
  the section above.

A gap you could have closed is not a gap. Run the check whose dependency
you have already seen running, and report a check you skipped as untried,
rather than recording it here as one this repo cannot run.

<!-- drift:file .zhtw-mcp/baseline.json -->
<!-- drift:file .zhtw-mcp/Dockerfile -->
