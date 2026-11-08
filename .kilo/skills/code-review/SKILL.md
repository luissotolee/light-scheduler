---
name: code-review
description: Audit code for correctness, security, TypeScript strictness, Vue/Pinia conventions, dead code, and accessibility. Use when asked to review code, validate implementation quality, or find bugs before merging.
---

# Code Review

Read `workspace.md` for the module map. The conventions this checklist checks live in the area skills (`vue-component`, `pinia-store`, `typescript-domain-modeling`, `testing`, `csv-import-export`, `scheduling-calendar`).

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
- CSV/blob downloads: verify `download.ts` uses a safe Blob + object URL and revokes it.

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

### 8. Data I/O
- Pure CSV parsing/serialization in `src/shared/utils/csv.ts` (no DOM).
- Downloads in `src/shared/utils/download.ts`.
- Shift times as minutes since midnight canonical; `'HH:mm'` is input/display only.

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

### 12. Tests
- Co-located `__tests__/*.spec.ts` next to the owning folder.
- Store tests reset Pinia: `beforeEach(() => setActivePinia(createPinia()))`.
- Component tests assert rendered output and `wrapper.emitted()`; never assert internal state.
- Coverage thresholds: statements/functions/lines >= 80, branches >= 75; excludes `src/main.ts`, `*.d.ts`, `src/router/**`.

## Severity scale
- **Blocker** — breaks functionality, crashes, data loss, security vulnerability.
- **Major** — violates a hard project rule, likely to cause bugs or maintenance pain, or fails a coverage threshold.
- **Minor** — style/naming inconsistency, cosmetic, marginal improvement.

## Output
Return a Markdown report: one-line summary, then each finding (severity, file:line, title, evidence quote, concrete fix), then a Verdict section. Do not praise working code; focus on what needs attention. If clean, say so plainly.