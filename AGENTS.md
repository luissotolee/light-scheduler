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

## Guided demo parity

The in-app guided demo covers four modules: **employees**, **scheduler**, **summary**, and **archive**. Any change to their behavior or layout must update the matching scenario in `src/modules/demo/scenarios/` in the same change — the demo is part of the feature, not an afterthought.

| Module change | Scenario to update |
| ------------- | ------------------ |
| `employees/`  | `employeesDemo.ts` |
| `scheduler/`  | `schedulerDemo.ts` |
| `summary/`    | `summaryDemo.ts`   |
| `archive/`    | `archiveDemo.ts`   |

- **New functionality or changed behavior** (new action, renamed/removed control, different flow or state) → add, edit, or remove the affected `DemoStep` and its narration key in **both** `en.ts` and `es.ts`.
- **Layout or visual change** (element moved, reordered, resized, replaced, or wrapped) → verify the step resolves to the intended element and update its `target` (`testId`, `within`, `index`) so the cursor and ring always point at the right place. A step that still runs but highlights the wrong spot is a defect.
- **New demoed module behavior** → add a step demonstrating it; keep the scenario's step order and narration coherent.
- **`data-test` is the targeting contract.** Renaming or removing a `data-test` requires updating every scenario step and its spec that references it.
- Run the scenario specs (`employeesDemo`, `schedulerDemo`, `summaryDemo`, `archiveDemo`); they assert unique step IDs, translated narration keys, and known `data-test` targets/routes.

Details: `.kilo/skills/guided-demo/SKILL.md`.

## Verification

`npm run lint` · `npm run typecheck` · `npm test` · `npm run test:coverage` · `npm run build`

- Commit messages use `(type) summary`; see `.kilo/skills/commit/SKILL.md` and `/commit`.
- Pushing a branch and opening a GitHub PR is a separate step; use `.kilo/skills/pull-request/SKILL.md` and `/pr`.
- The PR skill requires a clean tracked working tree, pushes the current branch, creates a PR when none is open, and refreshes the description of an existing open PR from `git diff origin/<base>...HEAD`. A push to a branch with an open PR must leave its description updated.
- Every PR description follows `.github/pull_request_template.md`: `## Summary` with exactly two main sections, `### Core Implementation` and `### Impact`. Keep this structure when creating or modifying a description; do not add other sections.
- Use the workspace **GitHub MCP server** for GitHub operations (branches, PRs, issues, reviews, etc.). Do **not** use `gh`. Never print tokens or remote URLs that contain credentials.
