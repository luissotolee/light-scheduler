# Light Scheduler

Light Scheduler is a light, modern weekly shift scheduler for creating daily shifts across a week for many employees. It is a frontend-only application: there is no backend, and all data lives in browser state and round-trips through a compressed JSON backup file so work can resume where it was left off. Built with Vue 3, Vite, TypeScript, Pinia, PrimeVue, and Vitest, with CI/CD automated by GitHub Actions.

## Features

The product scope covers the scheduling pages plus an Archive page for import/export:

| Page      | Purpose                                                           | Status  |
| --------- | ----------------------------------------------------------------- | ------- |
| Scheduler | Create and manage daily shifts at a weekly cadence for employees. | Planned |
| Employees | Manage employee records used when building schedules.             | Planned |
| Summary   | Review the weekly schedule and print it or save it as PDF.        | Planned |
| Archive   | Download or restore a compressed JSON backup of the workspace.    | Planned |

The Archive page downloads a single `backup-<timestamp>.json.gz` file containing every employee plus the years, weeks, and shifts that have data. Weeks without shifts are omitted. Restoring a backup replaces the current employees, shifts, and days off. The Scheduler page also keeps CSV import/export for the weekly schedule, so a week can be edited in a spreadsheet and brought back.

Backups are gzip-compressed with the browser's native `CompressionStream`/`DecompressionStream`, so no additional runtime dependency is required.

There is no backend. Backup encoding, CSV parsing, downloads, and all other application behavior run in the browser.

## Current status

Light Scheduler is at the base-structure stage. The app includes the application shell, a top navigation bar, a Home landing page, and lazily loaded skeletons for Scheduler, Employees, Summary, and Archive. A shared workspace store holds employees, weekly shifts, and the current week, while a page store per page holds page-local UI state. The pure calendar, shift, CSV, and download utilities are implemented and tested. Shift editing, employee create/edit forms, schedule review tables, and CSV import parsing are planned and not yet implemented.

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
  App.vue                 app shell, brand, nav, footer, demo banner/overlay
  main.ts                 application entry point (boot recovery for interrupted demo)
  types.ts                shared domain types (members, shifts, weeks, results)
  assets/
    main.css              global CSS and design tokens
  components/
    AppNav.vue            presentational primary navigation
    PageHeader.vue        reusable page header with actions slot
    EmptyState.vue        reusable empty state with action slot
    __tests__/
  router/
    index.ts              createAppRouter factory and hash-history routes
    nav.ts                NAV_ITEMS navigation metadata
  stores/
    workspace.ts          shared cross-page data (members, schedules, week)
    employees.ts          Employees page state and member actions
    scheduler.ts          Scheduler page week navigation and shift actions
    summary.ts            read-only weekly summary getters
    archive.ts            backup export/restore and weekly schedule CSV wiring
    __tests__/
  utils/
    calendar.ts           timezone-safe local ISO week helpers
    shifts.ts             HH:mm parsing and half-open overlap helpers
    archiveBackup.ts      gzip JSON backup build, validation, encode, and decode
    csv.ts                pure RFC 4180 CSV parsing and serialization
    download.ts           Blob download and timestamped filename helpers
    id.ts                 id generation helper
    __tests__/
  views/
    HomeView.vue          store-free landing page
    SchedulerView.vue     weekly shift skeleton
    EmployeesView.vue     employee search/list skeleton
    SummaryView.vue       weekly summary and print skeleton
    ArchiveView.vue       export/import page for workspace information
    __tests__/
  modules/
    demo/                 in-app real-time guided demo (see .kilo/skills/guided-demo/SKILL.md)
      types.ts                    DemoScenario, DemoStep, DemoAction, DemoTarget
      fixtures/demoWorkspace.ts   buildDemoWorkspace(now?) → PersistedWorkspace
      scenarios/                  step scenarios (v1: scheduler→employees→summary→Archive)
      utils/storageSnapshot.ts    localStorage snapshot/restore/backup/recovery
      utils/dom.ts                target resolution, click/pointer/press/fill, reduced motion
      utils/demoSession.ts        startDemo/stopDemo (snapshot → load mock → reset UI → engine)
      player/engine.ts            cancellable player (AbortController, pause/resume/next/prev)
      stores/demo.ts              Pinia store (status, stepIndex, cursor, ring, restored flag)
      components/                 DemoModeButton, DemoBanner, DemoOverlay (lazy)
      overlay/demo-overlay.css    shared CSS custom properties
      __tests__/                  storageSnapshot, demoWorkspace, demoSession, demo, engine, dom, components, schedulerDemo
  __tests__/
    App.spec.ts
    routes.spec.ts        lazy route resolution test
```

All five feature pages are lazy-loaded chunks, so their code mounts only after the matching navigation item is selected. Home stays eager for the first paint.

## Testing strategy

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
2. Protect `main` and require the `CI / Lint, type-check, test, build` check before merging.
3. The site deploys at `https://<owner>.github.io/light-scheduler/`.

The Vite `base` is `/light-scheduler/` in `vite.config.ts`. If you rename the repository or use a custom domain, update `base` accordingly.
