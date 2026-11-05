# AGENTS.md

Project conventions for **light-scheduler** — Vue 3 + TypeScript + Pinia + PrimeVue, built with Vite and tested with Vitest.

## Hard rules

- **Path alias**: `@` maps to `./src`. Use `@/types`, `@/utils/id`, `@/stores/scheduler`; never deep relative imports across folders.
- **TypeScript**: `verbatimModuleSyntax` is on. Use `import type { ... }` for type-only imports and keep value imports separate. Never use `any`; prefer `unknown` plus narrowing/type guards. Avoid `as` casts when a guard works.
- **Components**: every SFC uses `<script setup lang="ts">`. No Options API and no `export default`. Use typed `defineProps<{...}>()` and tuple `defineEmits<{ submit: [task: NewTask] }>()`; event names are present tense.
- **Pinia**: composition/setup stores only — `defineStore('id', () => { ... return { ... } })`. `ref` state, `computed` getters, plain function actions. The store id matches the filename (`'scheduler'`, `'members'`).
- **Views vs components**: components are presentational (props in, events out, no store, no router). Views own stores via `useXxxStore()` + `storeToRefs(store)`, call actions directly, and never destructure actions. Register routed views in `src/router/index.ts` (hash history); lazy-load new routes with `component: () => import('@/views/...')`.
- **Styling**: scoped CSS with BEM-ish class names. Use design tokens as CSS custom properties from `src/assets/main.css` `:root` (`--color-*`, `--radius-*`, `--color-accent`, `--color-muted`, `--color-text`, `--color-surface`, `--color-border`). Do not hardcode colors; add reusable tokens to `:root`. Use `:deep()` only for PrimeVue internals.
- **Domain types**: shared domain types live in `src/types.ts`. Keep input types separate from persisted entities (`NewTask` vs `Task`, `NewTeamMember` vs `TeamMember`, `NewShift` vs `Shift`). No inline interfaces for shared shapes.
- **Tests**: co-located `__tests__/*.spec.ts`, matching the `src/**/*.spec.ts` glob. Store tests reset state with `beforeEach(() => setActivePinia(createPinia()))`. Component tests assert rendered output and `wrapper.emitted()`. Coverage thresholds in `vite.config.ts`: statements/functions/lines >= 80, branches >= 75; excludes `src/main.ts`, `*.d.ts`, `src/router/**`.
- **Data I/O**: pure CSV parsing/serialization belongs in `src/utils/csv.ts` (no DOM); downloads belong in `src/utils/download.ts`. Shift times use minutes since midnight as canonical; `'HH:mm'` is input/display only.

## Verification

Run before reporting work complete:

`npm run lint` · `npm run typecheck` · `npm test` · `npm run test:coverage` · `npm run build`

## Skills

Load the matching skill before changing these areas:

- `.kilo/skills/csv-import-export/SKILL.md` — CSV parsing/serialization, BOM handling, delimiter inference, safe Blob downloads, timestamped filenames.
- `.kilo/skills/pinia-store/SKILL.md` — setup stores, typed state/getters/actions, `storeToRefs`, store tests.
- `.kilo/skills/vue-component/SKILL.md` — SFCs, typed props/emits, views vs components, scoped tokens, accessibility, PrimeVue.
- `.kilo/skills/typescript-domain-modeling/SKILL.md` — `src/types.ts`, strict flags, discriminated unions, date/time representation.
- `.kilo/skills/scheduling-calendar/SKILL.md` — shifts, hour-range validation, ISO weeks, timezone-safe calendar views.
- `.kilo/skills/testing/SKILL.md` — Vitest placement, jsdom stubs, coverage thresholds.
- `.kilo/skills/commit/SKILL.md` — inspect changes and generate a `(type) summary` commit message.
