---
name: pull-request
description: Push the current branch and open a GitHub pull request with a generated summary when no open PR exists. Use when the user asks to push changes, open/create a PR, publish the branch for review, or check whether a PR already exists.
---

# Pull Request Skill

Take the commits already on the current branch, push them, and create a GitHub pull request against the default base branch with a description derived from the branch diff. This skill never commits source changes, never force-pushes, and never prints credentials.

Use the `commit` skill first if there are uncommitted tracked changes.

## Step 0 — Preconditions

Run these before touching the remote:

- `git rev-parse --is-inside-work-tree` — must be inside a git repository.
- `git status --porcelain --untracked-files=no` — if non-empty, **stop** and tell the user to load the `commit` skill and commit first. Untracked files are ignored because a PR only contains commits.
- `git rev-parse --abbrev-ref --symbolic-full-name @{u}` — if empty, branch has no upstream.
- Security guard: check for credentials embedded in the remote without printing it:
  ```bash
  git remote get-url origin | grep -q '@' && echo "remote contains credentials"
  ```
  If credentials are present, warn the user and recommend the one-time cleanup below, but do not rewrite the remote from this skill:
  ```bash
  git remote set-url origin https://github.com/<owner>/<repo>.git
  ```
- `git fetch origin --prune` — refresh the base branch and detect divergence.

## Step 1 — Resolve branch and base

- `git branch --show-current` — if empty, stop: detached HEAD cannot be pushed as a PR branch.
- Base branch: use the user-supplied base if given; otherwise get from remote origin HEAD:
  ```bash
  git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'
  ```
- If the current branch equals the base branch, **stop**: do not open a PR from `main` into `main`.
- Verify `origin/<base>` exists after the fetch; if not, stop and report the missing base branch.

## Step 2 — Push the branch

- If the branch has no upstream (from Step 0), push with tracking:
  ```bash
  git push -u origin HEAD
  ```
- If an upstream exists, compare local and remote:
  ```bash
  git rev-list --left-right --count @{u}...HEAD
  ```
  The output is `<behind> <ahead>`.
  - `behind > 0`: **stop**. Do not force-push; ask the user to rebase or merge.
  - `ahead > 0`: run `git push`.
  - `ahead == 0`: nothing to push.
- Never use `--force` or `--force-with-lease` unless the user explicitly requests it and the branch is not shared. Default to stopping on divergence.

## Step 3 — Check for an existing PR

Use the GitHub MCP server tool `github_list_pull_requests` directly (it is a tool call, not a shell command). Resolve `owner`/`repo` from the `origin` remote, then call it with:

- `owner`: repository owner (e.g. `luissotolee`)
- `repo`: repository name (e.g. `light-scheduler`)
- `state`: `open`
- `head`: `<owner>:<current branch>` (e.g. `luissotolee:feat/improvements`)
- `fields`: `["number", "title", "html_url", "state", "draft", "base", "head"]`

- If an open PR exists:
  - Report its number, URL, base branch, and draft state.
  - If commits were pushed in Step 2, say the PR was updated.
  - **Stop.** Do not create a duplicate.
- Optionally repeat with `state: merged` / `state: closed`; if the branch previously had a closed or merged PR, note it but allow a new PR.
- If the tool reports the repository is not found or access is denied, stop and report the MCP error.

## Step 4 — Evaluate the branch changes

Same as Step 4 in original version:

Use three-dot diffs so only the branch's changes are summarized:

```bash
git log --oneline --no-decorate "origin/$BASE"..HEAD
git diff --stat "origin/$BASE"...HEAD
git diff --name-status "origin/$BASE"...HEAD
```

- If `git log "origin/$BASE"..HEAD` is empty, stop: there is nothing to open a PR for.
- Group changed paths by area using `workspace.md`:
  - `src/modules/<module>/` — feature behavior
  - `src/shared/` — cross-cutting code, components, stores, utils
  - `src/shared/i18n/messages/{en,es}.ts` — localized text
  - `src/router/`, `src/types.ts`, config, `.kilo/`, tests
- Read the important hunks, not just the stat line, to identify:
  - user-visible behavior changes
  - data/model or persistence changes
  - test coverage changes
  - migration or compatibility concerns
- Do not invent intent; describe only what the diff and commit messages support.

## Step 5 — Verify

Same as Step 5 in original version:

Run the repo verification commands from `AGENTS.md`:

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

Record which commands passed. If any fail, **stop** and report the failures instead of opening the PR, unless the user explicitly asks to open it anyway. Never claim a check passed if it was not run.

## Step 6 — Compose the PR title and body

Same as Step 6 in original version.

## Step 7 — Create the PR

Use the GitHub MCP server tool `github_create_pull_request` directly (it is a tool call, not a shell command) with:

- `owner`: repository owner
- `repo`: repository name
- `base`: `$BASE`
- `head`: current branch name
- `title`: `$TITLE`
- `body`: `$BODY`
- `draft`: `true` only when the user asks for a draft

- If the MCP server reports that a PR already exists, return to Step 3 and report the existing PR instead of retrying.
- Do not ask the MCP server to fill the description for you; the description must come from the evaluated diff.
- Do not merge, approve, or close the PR.

## Step 8 — Report

Same as Step 8 in original version.

## Edge cases

| Situation | Action |
|---|---|
| Uncommitted tracked changes | Stop; use the `commit` skill first |
| Detached HEAD | Stop; create or check out a branch |
| Current branch is the base branch | Stop; no self-PR |
| No upstream branch | `git push -u origin HEAD` |
| Local behind upstream | Stop; rebase/merge instead of force-push |
| Open PR already exists | Report it and stop; do not duplicate |
| Closed/merged PR exists | Note it; a new PR is allowed |
| No commits vs base | Stop; nothing to review |
| GitHub MCP server not configured | Stop with setup guidance |
| Remote contains embedded credentials | Warn; recommend removing them; never print the URL |
| Non-GitHub remote or fork workflow | Stop and explain this skill targets `origin` on GitHub |
| Push rejected by branch protection | Stop and report the remote error |

## Never

- Never stage, commit, amend, or rewrite history.
- Never force-push by default.
- Never create a PR when an open PR already exists.
- Never print a remote URL containing credentials, or raw MCP server output.
- Never fabricate verification results or diff summaries.

## Note about MCP

This skill relies on the **GitHub MCP server** configured in `kilo.json` (project) and authenticated in the global Kilo config. GitHub's remote MCP server (`https://api.githubcopilot.com/mcp/`) does not support dynamic client registration, so Kilo cannot complete OAuth on its own:

- The authenticated setup uses an `Authorization: Bearer <token>` header supplied from the global config (`~/.config/kilo/kilo.jsonc`). Keep that token out of the repository.
- Alternatively, register a GitHub OAuth App and set `clientId` (and `clientSecret` if required) under `mcp.github.oauth`, then run `kilo mcp auth github`.

Call the `github_*` tools directly; there is no `mcp` CLI command. If the tools are missing from the session, the MCP connection was not established — report that instead of using `gh` or `curl`.