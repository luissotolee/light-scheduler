---
description: Review changes to be pushed and generate a commit message in `(type) summary` format
---

Review the changes the user is about to push and generate a commit message.

Follow these steps:

1. Run `git status`, `git diff --staged`, `git diff`, and `git log @{u}..HEAD --oneline` to see all pending changes (staged, unstaged, and unpushed).
2. Classify the change and write a commit message in `(type) summary` format, where `type` is one of: feat, fix, bug, chore, refactor, docs, style, test, perf, ci, build, revert.
3. Print the proposed message in a code block with a one-line justification, and do not commit or push unless the user asks.
