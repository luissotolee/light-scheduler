# AGENTS.md

**light-scheduler** — Vue 3 + TypeScript + Pinia + PrimeVue frontend, built with Vite and tested with Vitest. No backend; state lives in the browser and round-trips via CSV.

## Before working

1. Read `workspace.md` for the module map and where each file belongs.
2. Load the matching skill from `.kilo/skills/<area>/SKILL.md` before changing code in that area — skills hold the project conventions ("how we behave") for that area.
3. Run verification before reporting work complete.

## Languages (i18n)

The app ships two languages: **English (`en`)** and **Spanish (`es`)**. Any label, message, error, `aria-label`, or other user-visible text must be added or updated in **both** `src/shared/i18n/messages/en.ts` and `src/shared/i18n/messages/es.ts` in the same change. Load the `i18n` skill when touching any text; never hardcode user-facing strings in components, stores, or utils.

## Verification

`npm run lint` · `npm run typecheck` · `npm test` · `npm run test:coverage` · `npm run build`

- Commit messages use `(type) summary`; see `.kilo/skills/commit/SKILL.md` and `/commit`.
- Pushing a branch and opening a GitHub PR is a separate step; use `.kilo/skills/pull-request/SKILL.md` and `/pr`.
- The PR skill requires a clean tracked working tree, pushes the current branch, skips creation when an open PR already exists, and builds the description from `git diff origin/<base>...HEAD`.
- Use the workspace **GitHub MCP server** for GitHub operations (branches, PRs, issues, reviews, etc.). Do **not** use `gh`. Never print tokens or remote URLs that contain credentials.
