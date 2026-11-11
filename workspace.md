# Workspace context — light-scheduler

Frontend-only weekly shift scheduler (Vue 3 + TypeScript + Pinia + PrimeVue, Vite/Vitest). No backend; state lives in the browser and round-trips via a single gzip-compressed JSON backup (`.json.gz`). Use this file to locate code quickly; load the matching skill from `.kilo/skills/` for the conventions that apply to each area.

## Architecture pattern

Lightweight feature-module / vertical-slice layout:

- `src/modules/<feature>/` owns that feature: `views/` (route owners), `components/` (module-private presentational), `stores/` (module Pinia stores), `utils/`, `types.ts` (optional).
- `src/shared/` holds cross-cutting code: `components/`, `stores/`, `utils/` used by 2+ modules or generic infrastructure.
- `src/router/` composes routes across modules (hash history, lazy loads).
- `src/types.ts` is the single source of truth for shared domain types.

## Module map

- `home/` — landing page (store-free).
- `scheduler/` — weekly shift view + shift actions (`scheduler` store: `addShift`, `removeShift`, `updateShift`, week navigation). Hourly employee counts for the optional headcount chips are computed in `utils/headcount.ts` (peak concurrent employees per hour).
- `employees/` — employee CRUD + holiday dialogs (`employees` store + `EmployeeTable`/`EmployeeFormDialog`). The domain entity is `TeamMember` (see `src/types.ts`).
- `summary/` — read-only weekly summary (`summary` store).
- `archive/` — `.json.gz` backup export/restore (`archive` store). Backup format helpers live in `shared/utils/archiveBackup.ts`; backups key schedules by ISO year → week → `empId`, omit empty weeks, and carry locale + scheduler settings. Backup mechanics: `.kilo/skills/backup-import-export/SKILL.md`. Backup and persisted-state shapes are backward compatible: missing fields restore with defaults and unknown fields are ignored; see `.kilo/skills/backup-compatibility/SKILL.md`.
- `demo/` — in-app real-time guided demo (mock data, localStorage snapshot/restore, step scenarios, visual cursor/ring/ripple, narration overlay). Vertical slice: `scenarios/`, `fixtures/`, `utils/`, `player/`, `stores/`, `components/`. See `.kilo/skills/guided-demo/SKILL.md`.
- `shared/` — `workspace` store (source of truth for `members` + `schedules` + `dayOffs`); utils `calendar`/`shifts`/`employee`/`archiveBackup`/`download`/`id`/`schedulerSettings`/`userSettings` (single versioned `light-scheduler.user-settings` entry for locale + scheduler settings, with legacy-key migration); components `AppNav`/`PageHeader`/`EmptyState`/`ConfirmActionDialog`/`EmployeeDetailsDialog`/`HolidayWeeksDialog` (holiday-week selection and week picker modes)/`LanguageSwitcher`/`LocaleFlag`; `fixtures/employees.ts` (mock data reused by demo).
- `shared/i18n/` — localization: `messages/en.ts` + `messages/es.ts` (two languages, both must stay in sync), `index.ts` (`useI18n`, `t`, `tc`), `types.ts` (`Locale`/`LOCALE_META`), `primevue.ts` (PrimeVue locale options); plus the `locale` store in `shared/stores/locale.ts`.

## Where to find each kind of file

| Kind                              | Location                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| Routed view                       | `src/modules/<module>/views/`                                                                     |
| Presentational component (shared) | `src/shared/components/`                                                                          |
| Presentational component (module) | `src/modules/<module>/components/`                                                                |
| Pinia store (shared)              | `src/shared/stores/`                                                                              |
| Pinia store (module)              | `src/modules/<module>/stores/`                                                                    |
| Pure util / adapter (shared)      | `src/shared/utils/`                                                                               |
| Module-local util                 | `src/modules/<module>/utils/`                                                                     |
| Shared domain type                | `src/types.ts`                                                                                    |
| Module-local type                 | `src/modules/<module>/types.ts`                                                                   |
| Test                              | sibling `__tests__/` folder (`src/modules/<module>/__tests__/` or `src/shared/<area>/__tests__/`) |
| Message catalog (text/labels)     | `src/shared/i18n/messages/en.ts` + `src/shared/i18n/messages/es.ts` (update **both**)             |

## Languages (i18n)

All user-facing text is localized in two languages. Add or change a label, message, error, or `aria-label` in **both** `src/shared/i18n/messages/en.ts` and `src/shared/i18n/messages/es.ts` in the same change; never hardcode strings in components/stores/utils. See `.kilo/skills/i18n/SKILL.md`.

## How to add a module

1. Create `src/modules/<name>/views/` (and `components/`, `stores/`, `utils/`, `types.ts` only if needed).
2. Add a lazy route in `src/router/index.ts`: `() => import('@/modules/<name>/views/<Name>View.vue')`.
3. Add a `NAV_ITEMS` entry in `src/router/nav.ts`.
4. Co-locate tests in `src/modules/<name>/__tests__/`.
5. Put any cross-module pieces in `src/shared/` instead.
6. Verify with the commands in `AGENTS.md`.

## How to add a component / store / util / test

- Shared component -> `src/shared/components/` + `__tests__/`.
- Module component -> `src/modules/<module>/components/`.
- Shared store -> `src/shared/stores/` (`defineStore` id == filename); module store -> `src/modules/<module>/stores/`.
- Cross-module pure util -> `src/shared/utils/`; single-module util -> `src/modules/<module>/utils/`.
- Test -> `__tests__/` beside the owning folder.

## Import alias

`@` maps to `./src`. Always import via `@/`; never `../` or `./` across folders (module-internal included).
