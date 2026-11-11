# AGENTS.md

**light-scheduler** — Vue 3 + TypeScript + Pinia + PrimeVue frontend, built with Vite and tested with Vitest. No backend; state lives in the browser and round-trips via a single gzip-compressed JSON backup (`.json.gz`).

## Before working

1. Read `workspace.md` for the module map and where each file belongs.
2. Load the matching skill from `.kilo/skills/<area>/SKILL.md` before changing code in that area — skills hold the project conventions ("how we behave") for that area.
3. Run verification before reporting work complete.

## Languages (i18n)

The app ships two languages: **English (`en`)** and **Spanish (`es`)**. Any label, message, error, `aria-label`, or other user-visible text must be added or updated in **both** `src/shared/i18n/messages/en.ts` and `src/shared/i18n/messages/es.ts` in the same change. Load the `i18n` skill when touching any text; never hardcode user-facing strings in components, stores, or utils.

## Backup & persisted-data compatibility

Backups are long-lived user files. Any new employee field, schedule structure, or stored setting must keep **older backups restoring successfully**.

- **Read tolerant, write complete.** Missing fields must fall back to an exported default constant, never fail parsing. When the data is stored/exported again, the new field is written normally.
- **Unknown fields are ignored**, not rejected, so a newer backup does not break an older parser.
- **Additive changes do not bump** `BACKUP_VERSION` / `WORKSPACE_SCHEMA_VERSION` / `USER_SETTINGS_SCHEMA_VERSION`. A breaking change bumps the version **and** adds a migration that still restores previous versions.
- **Partial settings restore does not reset** values that are absent from the backup; apply only the settings the file contains.
- **Every such change adds a legacy-fixture test**: an older backup (without the new field) restores with the default and a re-export includes the field.

Load the `backup-import-export` skill for the `.json.gz` build/parse/compress/download/restore mechanics, and the `backup-compatibility` skill before changing backup parsing/building, persisted workspace state, user settings, or restore flows. Details: `.kilo/skills/backup-import-export/SKILL.md` and `.kilo/skills/backup-compatibility/SKILL.md`.

## Verification

`npm run lint` · `npm run typecheck` · `npm test` · `npm run test:coverage` · `npm run build`

- Commit messages use `(type) summary`; see `.kilo/skills/commit/SKILL.md` and `/commit`.
- Pushing a branch and opening a GitHub PR is a separate step; use `.kilo/skills/pull-request/SKILL.md` and `/pr`.
- The PR skill requires a clean tracked working tree, pushes the current branch, creates a PR when none is open, and refreshes the description of an existing open PR from `git diff origin/<base>...HEAD`. A push to a branch with an open PR must leave its description updated.
- Every PR description follows `.github/pull_request_template.md`: `## Summary` with exactly two main sections, `### Core Implementation` and `### Impact`. Keep this structure when creating or modifying a description; do not add other sections.
- Use the workspace **GitHub MCP server** for GitHub operations (branches, PRs, issues, reviews, etc.). Do **not** use `gh`. Never print tokens or remote URLs that contain credentials.
