---
name: code-review
description: Audit code for correctness, security, TypeScript strictness, Vue/Pinia conventions, i18n parity (both languages), guided-demo step parity, dead code, and accessibility. Use when asked to review code, validate implementation quality, or find bugs before merging.
---

# Code Review

Read `workspace.md` for the module map. The conventions this checklist checks live in the area skills (`vue-component`, `pinia-store`, `typescript-domain-modeling`, `testing`, `backup-import-export`, `scheduling-calendar`, `backup-compatibility`, `i18n`).

## Review checklist

### 1. Correctness
- Logic errors, off-by-one, wrong types, missing/incorrect validation.
- Unhandled promise rejections, missing `await`, fire-and-forget promises that may race.
- State inconsistency: store state mutated in place when it should be replaced, stale closures, watchers that don't fire on the right trigger.
- Missing edge cases: empty inputs, unknown ids, null/undefined propagation, boundary values (0, max, min).

### 2. Security
- Secrets, tokens, or keys hardcoded or logged anywhere in the source tree.
- Unsanitized input reaching DOM (`v-html`), eval, `Function()`, or shell.
- Unsafe dependencies (check `package.json` for known-vulnerable versions if relevant).
- `.json.gz` backup downloads: verify `download.ts` uses a safe Blob + object URL and revokes it, and that backups are gzip-compressed through `gzipJson` before `downloadBlob`.

### 3. TypeScript strictness (`verbatimModuleSyntax` is on)
- `any` — forbidden; prefer `unknown` + narrowing or a type guard.
- `as` casts that bypass a guard — avoid; use a real type guard first.
- Missing explicit return types on public functions/actions.
- Type-only imports mixed with value imports in one statement — split them:
  ```ts
  import type { Foo } from '@/types'
  import { bar } from '@/shared/utils/bar'
  ```
- Unnarrowed `unknown` used as if it were a concrete type.

### 4. Vue 3 conventions
- Every SFC uses `<script setup lang="ts">`. No Options API, no `export default`.
- Block order: `<template>` → `<script setup lang="ts">` → `<style scoped>`.
- Props: typed `defineProps<{...}>()`. Emits: tuple `defineEmits<{ submit: [payload: NewTeamMember] }>()`, present-tense event names.
- Components are presentational: props in, events out. No `useXxxStore()`, no `useRouter()`.
- Views own stores: `useXxxStore()` + `storeToRefs(store)`, call actions directly, never destructure actions.
- Routes lazily loaded with `component: () => import('@/modules/<module>/views/<Name>View.vue')`, hash history.

### 5. Pinia
- Setup stores only: `defineStore('id', () => { ... return { ... } })`.
- Store id matches filename (`'workspace'`, `'scheduler'`, `'employees'`).
- `ref` state, `computed` getters, plain function actions with explicit return types.
- Cross-module stores in `src/shared/stores/`; module stores in `src/modules/<module>/stores/`.
- Immutability: replace arrays for removals/bulk changes; in-place mutation only for single-item updates.
- Failable creators return `T | null`; unknown ids do nothing, do not throw.

### 6. Styling
- `<style scoped>` only.
- BEM-ish class names (`.foo`, `.foo__bar`, `.foo--baz`).
- Design tokens only from `src/assets/main.css` `:root`: `--color-*`, `--radius-*`, `--color-accent`, `--color-muted`, `--color-text`, `--color-surface`, `--color-border`.
- No hardcoded colors except one-off `rgba(...)` accent chips.
- `:deep()` only for PrimeVue internals.

### 7. Domain types
- Shared types in `src/types.ts`; module-local types in `src/modules/<module>/types.ts`.
- Input vs entity types separated (`NewTeamMember` vs `TeamMember`, `NewShift` vs `Shift`).
- No inline interfaces for shared shapes.

### 8. Data I/O and backup compatibility
- The workspace backup is a single `.json.gz` file (`src/shared/utils/archiveBackup.ts`). Verify gzip build/parse via `buildBackup`/`parseBackup`, `gzipJson`/`gunzipJson`, and that restore goes through the archive store.
- Downloads use `src/shared/utils/download.ts` (`downloadBlob` + `timestampedName`); keep the browser side effect out of `archiveBackup.ts`.
- Shift times as minutes since midnight canonical; `'HH:mm'` is input/display only.
- Backup/persisted-data changes are backward compatible (see `backup-compatibility`):
  - New fields have an exported default and parse as missing → default, not an error.
  - Unknown fields are ignored, not rejected.
  - `buildBackup`/serializers write the complete current shape.
  - Additive changes leave `BACKUP_VERSION` / `WORKSPACE_SCHEMA_VERSION` / `USER_SETTINGS_SCHEMA_VERSION` unchanged; breaking changes bump the version and add a migration that still restores older versions.
  - Missing or partial settings do not reset unrelated preferences.
  - A legacy fixture (older shape without the new field) restores with defaults, and a re-export includes the field.

### 9. Dead code
- Unused imports, unused variables/params (prefix unused params with `_` or remove).
- Unreachable branches, commented-out code, duplicate logic, leftover console logs.

### 10. Performance
- Unnecessary re-renders; wrap expensive derivations in `computed`.
- Large reactive objects spread with `{ ...form }` inside a computed that depends on many refs — verify the dependency granularity is acceptable.
- Lists without `v-memo` or `v-if` when they are large.

### 11. Accessibility
- Icon-only or label-less controls have `aria-label`.
- Form controls associated with `<label for="...">`.
- Semantic elements (`<form>`, `<ul>`, `<li>`, `<button type="button">`) instead of `div`/`span` click handlers.
- Visible `:focus-visible` outline.

### 12. i18n (two languages)

- Every user-facing string is translated via `t()`/`tc()` from `@/shared/i18n` — no hardcoded labels, placeholders, empty states, toast messages, `title`, or `aria-label` literals in components/views.
- Domain code (utils, stores, validators) returns a `MessageKey`, never a localized literal; the view translates at the boundary.
- Any new/edited/removed key is mirrored in **both** `src/shared/i18n/messages/en.ts` and `src/shared/i18n/messages/es.ts` in the same change.
- The `es` catalog stays key-for-key in sync with `en` (`Object.keys(es))` equals `Object.keys(en)`; the sync test covers this).
- New error conditions add an `errors.*` key to both catalogs.
- New locale-aware PrimeVue strings are added to both entries in `src/shared/i18n/primevue.ts`.

### 13. Tests
- Co-located `__tests__/*.spec.ts` next to the owning folder.
- Store tests reset Pinia: `beforeEach(() => setActivePinia(createPinia()))`.
- Component tests assert rendered output and `wrapper.emitted()`; never assert internal state.
- Coverage thresholds: statements/functions/lines >= 80, branches >= 75; excludes `src/main.ts`, `*.d.ts`, `src/router/**`.

### 14. Guided demo parity
- The demoed modules are `employees`, `scheduler`, `calendar`, and `summary`; each maps to a scenario in `src/modules/demo/scenarios/` (`employeesDemo.ts`, `schedulerDemo.ts`, `calendarDemo.ts`, `summaryDemo.ts`).
- Any behavior or functionality change in those modules updates the matching scenario in the same change: steps added/edited/removed, narration under `demo.scenario.*` in both `en.ts` and `es.ts`.
- Any layout/visual change re-validates each affected step's `target` (`testId`, `within`, `index`); a step that resolves but highlights the wrong element is a finding.
- `data-test` renames/removals are reflected in every scenario step and spec.
- The scenario specs exist and pass (unique step IDs, translated narration keys, known targets/routes).

## Severity scale
- **Blocker** — breaks functionality, crashes, data loss, security vulnerability.
- **Major** — violates a hard project rule, likely to cause bugs or maintenance pain, or fails a coverage threshold.
- **Minor** — style/naming inconsistency, cosmetic, marginal improvement.

## Output
Return a Markdown report: one-line summary, then each finding (severity, file:line, title, evidence quote, concrete fix), then a Verdict section. Do not praise working code; focus on what needs attention. If clean, say so plainly.