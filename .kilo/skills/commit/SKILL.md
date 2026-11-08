---
name: commit
description: Review the current git changes (staged, unstaged, and unpushed commits) and generate a commit message in `(type) summary` format. Use when the user wants to commit, write a commit message, or review changes before pushing.
---

# Commit Skill

Review the changes the user is about to push and generate a single, well-scoped commit message in the format:

```
(type) summary
```

The whole message stays on one line and is concise (imperative mood, ~72 chars max).

## Step 1 — Inspect the changes

Gather the full picture before writing anything:

- `git status` — what is staged, unstaged, or untracked
- `git diff --staged` — the staged changes
- `git diff` — the unstaged changes
- `git log @{u}..HEAD --oneline` (or `git log origin/main..HEAD --oneline`) — commits already made but not yet pushed

If nothing is staged, review the combined working-tree diff and report what will be committed.

## Step 2 — Classify the change

Pick the single most representative `type` from this list. Use the first matching rule:

| type | use when |
|------|----------|
| `feat` | adding a new feature or user-facing capability |
| `fix` | fixing a defect or bug (preferred) |
| `bug` | fixing a bug (alias of `fix`) |
| `chore` | maintenance, tooling, config, dependency, or cleanup with no behavior change |
| `refactor` | restructuring code without changing behavior |
| `docs` | documentation only |
| `style` | formatting, whitespace, lint (no logic change) |
| `test` | adding or changing tests |
| `perf` | performance improvement |
| `ci` | CI/CD or GitHub Actions changes |
| `build` | build system or bundler changes |
| `revert` | reverting a previous change |

Prefer `fix` over `bug` when the change addresses a defect; use the most specific type that applies (e.g. `feat` beats `chore` for a new feature).

## Step 3 — Write the summary

- Start with the lowercase type in parentheses: `(feat)`
- Follow with a space and a short imperative summary: `(feat) add weekly shift scheduler`
- Describe the "what", not the "why"; keep it under ~72 characters total
- No trailing period, no scope beyond the type, no body unless the user asks

## Step 4 — Output

1. Print the proposed message in a single code block, e.g.:

   ```
   (feat) add light scheduler store with persistence
   ```

2. Give a one-line justification for the chosen `type` and the files it covers.

3. Do **not** commit, stage, or push automatically. If the user wants to proceed, ask whether to stage and commit now.
