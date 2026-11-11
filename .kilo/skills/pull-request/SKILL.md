---
name: pull-request
description: Push the current branch and create a GitHub pull request, or refresh an existing open PR's description, using the required Summary structure. Use when the user asks to push changes, open/create a PR, update a PR description, publish the branch for review, or check whether a PR already exists.
---

# Pull Request Skill

Take the commits already on the current branch, push them, and either create a GitHub pull request or refresh the description of the existing open one. The description is derived from the branch diff and always follows the required structure below. This skill never commits source changes, never force-pushes, and never prints credentials.

Use the `commit` skill first if there are uncommitted tracked changes.

## Required PR description structure

Every PR body this skill creates or modifies uses exactly this structure:

```markdown
## Summary

<One or two sentences describing what this PR does and why.>

### Core Implementation

- <Main code changes: modules, files, types, stores, utilities, architecture.>
- <Data/model changes and how they are implemented.>

### Impact

- <User-visible behavior and workflow changes.>
- <Persistence/backup/schema compatibility and migration notes.>
- <Verification results (lint, typecheck, test, coverage, build).>
```

Rules:

- Always keep the `## Summary` heading with exactly two main subsections: `### Core Implementation` and `### Impact`.
- `Core Implementation` explains what changed in the code and how. Reference concrete paths and symbols where useful.
- `Impact` explains the consequences: user-visible behavior, persisted data/backup compatibility, performance, and verification.
- Do not add other top-level or sibling sections such as "Changes Summary", "Test Coverage", "Supporting Features", "Files Changed", or "Verification". Fold that content into the two sections.
- When modifying an existing description, rewrite it into this structure from the current branch diff. Never append to a stale description or leave old-format sections in place.
- Keep bullets concise and factual. Never fabricate changes or verification results.
- The same structure is mirrored in `.github/pull_request_template.md`; keep the two in sync if the structure changes.

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
- Remember whether this step pushed any commits (`ahead > 0` or a new upstream push). That determines whether an existing PR's description must be refreshed.
- Never use `--force` or `--force-with-lease` unless the user explicitly requests it and the branch is not shared. Default to stopping on divergence.

## Step 3 — Find an existing PR

Use the GitHub MCP server tool `github_list_pull_requests` directly (it is a tool call, not a shell command). Resolve `owner`/`repo` from the `origin` remote, then call it with:

- `owner`: repository owner (e.g. `luissotolee`)
- `repo`: repository name (e.g. `light-scheduler`)
- `state`: `open`
- `head`: `<owner>:<current branch>` (e.g. `luissotolee:feat/improvements`)
- `fields`: `["number", "title", "body", "html_url", "state", "draft", "base", "head"]`

- If an open PR exists:
  - Record its number, URL, title, body, base branch, and draft state.
  - **Do not create a duplicate.**
  - Continue to Step 4 so the description can be refreshed from the current diff. Refresh is required when Step 2 pushed new commits, and also when the existing body does not match the required structure above.
- Optionally repeat with `state: merged` / `state: closed`; if the branch previously had a closed or merged PR, note it but allow a new PR.
- If the tool reports the repository is not found or access is denied, stop and report the MCP error.

## Step 4 — Evaluate the branch changes

Use three-dot diffs so only the branch's changes are summarized:

```bash
git log --oneline --no-decorate "origin/$BASE"..HEAD
git diff --stat "origin/$BASE"...HEAD
git diff --name-status "origin/$BASE"...HEAD
```

- If `git log "origin/$BASE"..HEAD` is empty, stop: there is nothing to open or update a PR for.
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

Run the repo verification commands from `AGENTS.md`:

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

Record which commands passed. If any fail, **stop** and report the failures instead of creating or updating the PR, unless the user explicitly asks to proceed anyway. Never claim a check passed if it was not run.

## Step 6 — Compose the PR title and body

### Title

- For a new PR: derive a concise title from the dominant change and follow the repo's `(type) summary` convention, using the same `type` rules as the `commit` skill.
- For an existing PR: keep the current title unless it clearly no longer describes the branch.

### Body

Build the body from the diff using the required structure:

- `## Summary` — one or two sentences on what the PR does and why.
- `### Core Implementation` — the main code changes and how they implement it, grouped by area (modules, shared code, types/stores/utils, i18n, config).
- `### Impact` — what changes for users and stored data: behavior, workflow, persistence/backup and schema compatibility, performance, and the verification commands that passed.

Return the body with the headings and order shown above. Do not add extra sections.

## Step 7 — Create or update the PR

- If Step 3 found an open PR:
  - If Step 2 pushed commits, or the existing body does not follow the required structure, update it:
    - Call `github_update_pull_request` directly (it is a tool call, not a shell command) with:
      - `owner`, `repo`, `pullNumber`
      - `body`: the composed body from Step 6
      - `title`: only when the title should change
    - Report that the existing PR description was refreshed to include all branch commits.
  - If nothing was pushed and the body already matches the required structure, report the PR and stop without writing.
- If no open PR exists:
  - Call `github_create_pull_request` directly with:
    - `owner`, `repo`, `base`, `head`, `title`, `body`
    - `draft`: `true` only when the user asks for a draft
  - If the MCP server reports that a PR already exists, return to Step 3 instead of retrying.
- Do not ask the MCP server to fill the description for you; the description must come from the evaluated diff.
- Do not merge, approve, or close the PR.

## Step 8 — Report

Report concisely:

- PR number, URL, base branch, and draft state.
- Whether the PR was created or its description was updated.
- Which commits the description covers (`origin/$BASE..HEAD`).
- Verification commands that passed, or explicitly state which were not run.

## Updating an existing PR after a commit and push

When commits are pushed to a branch with an open PR, the PR description must reflect the complete branch diff, not just the newest commit. Run the normal flow: find the open PR (Step 3), re-evaluate `origin/$BASE...HEAD` (Step 4), re-run verification (Step 5), rewrite the body into the required structure (Step 6), and update the PR with `github_update_pull_request` (Step 7). Rewrite old-format descriptions into the required structure rather than appending to them.

## Edge cases

| Situation | Action |
|---|---|
| Uncommitted tracked changes | Stop; use the `commit` skill first |
| Detached HEAD | Stop; create or check out a branch |
| Current branch is the base branch | Stop; no self-PR |
| No upstream branch | `git push -u origin HEAD` |
| Local behind upstream | Stop; rebase/merge instead of force-push |
| Open PR already exists | Refresh its description from the current diff; never duplicate |
| Open PR exists and its description already matches the required structure | Report it and stop |
| New commits pushed to an open PR | Update the PR body to the required structure |
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
- Never leave an open PR's description stale after pushing new commits.
- Never drop the `## Summary` / `### Core Implementation` / `### Impact` structure when creating or modifying a description.
- Never print a remote URL containing credentials, or raw MCP server output.
- Never fabricate verification results or diff summaries.

## Note about MCP

This skill relies on the **GitHub MCP server** configured in `kilo.json` (project) and authenticated in the global Kilo config. GitHub's remote MCP server (`https://api.githubcopilot.com/mcp/`) does not support dynamic client registration, so Kilo cannot complete OAuth on its own:

- The authenticated setup uses an `Authorization: Bearer <token>` header supplied from the global config (`~/.config/kilo/kilo.jsonc`). Keep that token out of the repository.
- Alternatively, register a GitHub OAuth App and set `clientId` (and `clientSecret` if required) under `mcp.github.oauth`, then run `kilo mcp auth github`.

Call the `github_*` tools directly; there is no `mcp` CLI command. If the tools are missing from the session, the MCP connection was not established — report that instead of using `gh` or `curl`.
