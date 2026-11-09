---
description: Push the current branch and open a GitHub PR with a generated summary if none exists
---

Load the `pull-request` skill via the `skill` tool and follow it to push the current branch and create a pull request. Derive the title and description from the branch diff against the default base branch, skip creation when an open PR already exists, and never commit source changes. Use a draft PR only when the user asks for one.
