---
description: Push the current branch and create a GitHub PR, or refresh an existing open PR description
---

Load the `pull-request` skill via the `skill` tool and follow it to push the current branch and create a pull request. If an open PR already exists, refresh its description from the current branch diff instead of creating a duplicate. Derive the title and description from the branch diff against the default base branch, keep the required `## Summary` / `### Core Implementation` / `### Impact` structure, and never commit source changes. Use a draft PR only when the user asks for one.
