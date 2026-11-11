# Light Scheduler

Light Scheduler is a light, modern weekly shift scheduler for creating daily shifts across a week for many employees. It is a frontend-only application: there is no backend, and all data lives in browser state and round-trips through a compressed JSON backup file so work can resume where it was left off. Built with Vue 3, Vite, TypeScript, Pinia, PrimeVue, and Vitest, with CI/CD automated by GitHub Actions.

## Features

The product scope covers the scheduling pages plus an Archive page for import/export:

| Page      | Purpose                                                           | Status      |
| --------- | ----------------------------------------------------------------- | ----------- |
| Scheduler | Create and manage daily shifts at a weekly cadence for employees. | Implemented |
| Employees | Manage employee records used when building schedules.             | Implemented |
| Summary   | Review the weekly schedule and print it or save it as PDF.        | Implemented |
| Archive   | Download or restore a compressed JSON backup of the workspace.    | Implemented |

The Archive page downloads a single `backup-<timestamp>.json.gz` file containing every employee plus the years, weeks, and shifts that have data. Weeks without shifts are omitted. Restoring a backup replaces the current employees, shifts, and days off.

Backups are gzip-compressed with the browser's native `CompressionStream`/`DecompressionStream`, so no additional runtime dependency is required.

There is no backend. Backup encoding, downloads, and all other application behavior run in the browser.

## Current status

All four feature pages are implemented, with a shared Spanish/English localization layer and an in-app guided demo:

- **Scheduler** — weekly shift grid with shift creation, editing, and removal; a configurable day time window and slot size; holiday weeks with disabled rows excluded from weekly hours; week picker and active-employee filter; a per-day weekly-hours table; and optional hourly headcount chips.
- **Employees** — employee create/edit/delete, search, holiday-week selection, and per-employee comments.
- **Summary** — read-only weekly schedule review with print and PDF export.
- **Archive** — gzip-compressed `.json.gz` backup download and restore, with backward-compatible parsing so older backups still restore and unknown fields are ignored.
- **Guided demo** — a real-time, narrated walkthrough of the scheduler, employees, summary, and archive flows that snapshots and restores the current workspace.
- **Localization** — every user-facing string ships in English and Spanish.

A shared workspace store owns members, schedules, days off, and the current week, while each module keeps its own page state in a module store. The pure calendar, shift, settings, backup, and download utilities are unit-tested, and CI enforces lint, type-check, coverage thresholds, and a production build.

## Stack

| Concern     | Tool                                      | Why                                                                  |
| ----------- | ----------------------------------------- | -------------------------------------------------------------------- |
| Framework   | Vue 3 (Composition API, `<script setup>`) | Small runtime, excellent TS inference, current ecosystem target      |
| Build       | Vite                                      | Instant dev server, Rollup production build, first-class Vue support |
| Language    | TypeScript                                | Compile-time safety and safe refactors                               |
| State       | Pinia                                     | Simple, typed, trivially testable stores                             |
| Routing     | Vue Router (hash history)                 | Hash routing works on GitHub Pages without server rewrites           |
| UI          | PrimeVue                                  | Accessible, themeable components and icons                           |
| Styling     | Plain CSS + custom properties             | No runtime cost, design tokens via CSS variables                     |
| Tests       | Vitest + @vue/test-utils + jsdom          | Vite-native, fast, same pipeline as the app                          |
| Lint/format | ESLint 9 (flat config) + Prettier         | Consistent code, cheap CI failures                                   |
| CI/CD       | GitHub Actions                            | Native, free for public repos, deploys to Pages                      |

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script                  | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | Start the Vite dev server with HMR              |
| `npm run build`         | Type-check with `vue-tsc` then build to `dist/` |
| `npm run preview`       | Serve the production build locally              |
| `npm run typecheck`     | Run `vue-tsc --noEmit` only                     |
| `npm test`              | Run unit tests once                             |
| `npm run test:watch`    | Run unit tests in watch mode                    |
| `npm run test:coverage` | Unit tests with coverage thresholds enforced    |
| `npm run lint`          | ESLint over the repo                            |
| `npm run lint:fix`      | ESLint with automatic fixes                     |
| `npm run format`        | Prettier write                                  |
| `npm run format:check`  | Prettier check (CI-friendly)                    |

## Project structure

```
src/
  App.vue                 app shell: brand, nav, footer, demo banner/overlay
  main.ts                 application entry point (boot recovery for interrupted demo)
  types.ts                shared domain types (members, shifts, weeks, results)
  assets/
    main.css              global CSS and design tokens
  router/
    index.ts              createAppRouter factory and hash-history routes
    nav.ts                NAV_ITEMS navigation metadata
  shared/
    components/           AppNav, PageHeader, EmptyState, ConfirmActionDialog,
                          EmployeeDetailsDialog, HolidayWeeksDialog,
                          LanguageSwitcher, LocaleFlag
    stores/
      workspace.ts        cross-page data (members, schedules, days off, week)
      locale.ts           active language
    utils/
      calendar.ts         timezone-safe local ISO week helpers
      shifts.ts           HH:mm parsing and half-open overlap helpers
      archiveBackup.ts    gzip JSON backup build, validation, encode, decode
      download.ts         Blob download and timestamped filename helpers
      persistence.ts      browser-persisted workspace state
      userSettings.ts     versioned user settings (locale + scheduler settings)
      schedulerSettings.ts, employee.ts, csv.ts, csvFile.ts, scheduleCsv.ts, id.ts
    i18n/
      messages/en.ts      English catalog
      messages/es.ts      Spanish catalog (kept in sync with en)
      index.ts            useI18n, t, tc
      primevue.ts         PrimeVue locale options
    fixtures/employees.ts mock employee data shared with the demo
  modules/
    home/views/HomeView.vue     store-free landing page
    scheduler/
      views/SchedulerView.vue   weekly shift grid
      stores/scheduler.ts       week navigation and shift actions
      components/               ShiftGrid, ShiftRow, ShiftBar, WeekdayTabs,
                                TimePickerField, SchedulerSettingsDialog,
                                WeeklyHoursTable
      utils/                    settings, off, hours, grid, headcount
    employees/
      views/EmployeesView.vue   employee search and list
      stores/employees.ts       employee CRUD and holiday actions
      components/               EmployeeTable, EmployeeFormDialog
    summary/
      views/SummaryView.vue     weekly review with print and PDF export
      stores/summary.ts         read-only weekly summary getters
      components/               SummaryTable, SummaryCell
    archive/
      views/ArchiveView.vue     backup export/import page
      stores/archive.ts         restore wiring
    demo/                       in-app guided demo (see .kilo/skills/guided-demo/SKILL.md)
      scenarios/                scheduler, employees, summary, archive walkthroughs
      fixtures/                 buildDemoWorkspace
      utils/                    storage snapshot, DOM targeting, session lifecycle
      player/engine.ts          cancellable player (pause/resume/next/prev)
      stores/demo.ts            demo UI state
      components/               DemoModeButton, DemoBanner, DemoPickerDialog, DemoOverlay
  __tests__/                    app shell and route tests
```

The four feature pages are lazy-loaded chunks, so their code mounts only after the matching navigation item is selected. Home stays eager for the first paint.

## Testing strategy

- **Placement** — tests are co-located in a sibling `__tests__/` folder next to the code they cover.
- **Stores** are tested directly with a fresh `createPinia()` per test.
- **Components** receive props/emits and are tested for rendered output and emitted events, not internals.
- **Views** are mounted with Pinia to verify wiring between UI and store.
- Coverage thresholds live in `vite.config.ts` (`statements/functions/lines >= 80`, `branches >= 75`).

## CI/CD

- `.github/workflows/ci.yml` runs on every push to `main` and every pull request:
  lint → type-check → unit tests with coverage → build. Coverage is uploaded as an artifact.
- `.github/workflows/deploy.yml` runs on pushes to `main`: it re-runs lint/tests/build, then publishes `dist/` to GitHub Pages.

### One-time setup

1. In the GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Protect `main` and require the `CI / Lint`, `CI / Type-check`, `CI / Test with coverage`, and `CI / Build` checks before merging.
3. The site deploys at `https://<owner>.github.io/light-scheduler/`.

The Vite `base` is `/light-scheduler/` in `vite.config.ts`. If you rename the repository or use a custom domain, update `base` accordingly.

## License

All rights reserved. This repository is proprietary: the source code, documentation, configuration, and AI agent and skill definitions may not be used, copied, modified, or distributed without prior written permission. Viewing it for informational or evaluation purposes is permitted. See [LICENSE](LICENSE).
