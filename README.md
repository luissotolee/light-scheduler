# Light Scheduler

A production-grade reference frontend built with Vue 3, Vite, TypeScript, Pinia, and Vitest, with CI/CD fully automated by GitHub Actions.

## Stack

| Concern     | Tool                                      | Why                                                                  |
| ----------- | ----------------------------------------- | -------------------------------------------------------------------- |
| Framework   | Vue 3 (Composition API, `<script setup>`) | Small runtime, excellent TS inference, current ecosystem target      |
| Build       | Vite                                      | Instant dev server, Rollup production build, first-class Vue support |
| Language    | TypeScript                                | Compile-time safety and safe refactors                               |
| State       | Pinia                                     | Simple, typed, trivially testable stores                             |
| Routing     | Vue Router (hash history)                 | Hash routing works on GitHub Pages without server rewrites           |
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
| `npm run format`        | Prettier write                                  |
| `npm run format:check`  | Prettier check (CI-friendly)                    |

## Project structure

```
src/
  assets/          global CSS and design tokens
  components/      presentational components (TaskForm, TaskItem, TaskList, StatsBar)
  router/          route definitions
  stores/          Pinia stores (scheduler)
  utils/           small helpers (id generation)
  views/           routed pages (Home, About)
  __tests__/       tests for App
  components/__tests__/   component tests
  stores/__tests__/       store tests
  views/__tests__/        view tests
```

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
