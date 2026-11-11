---
description: Review changes to be pushed and generate a commit message in `(type) summary` format
---

Load the `commit` skill via the `skill` tool and follow it to inspect the pending changes and generate a commit message in `(type) summary` format. Do not commit or push unless the user asks. When a follow-up push targets a branch with an open PR, load the `pull-request` skill to refresh that PR's description into the required `## Summary` / `### Core Implementation` / `### Impact` structure.
