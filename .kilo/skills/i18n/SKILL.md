---
name: i18n
description: Internationalize user-facing text across the app's two languages (English and Spanish). Use whenever adding, changing, or removing any label, message, error, aria-label, or other user-visible string, when adding a new locale, or when touching src/shared/i18n/, src/shared/stores/locale.ts, or PrimeVue locale options.
---

# i18n

Read `workspace.md` first for the module map and where files belong.

## The golden rule

The app ships two languages: **English (`en`)** and **Spanish (`es`)**. Every user-facing string must exist in **both** catalogs. When you add, change, or remove any label, message, error, tooltip, or `aria-label`, update **`en.ts` and `es.ts` in the same change** — never one without the other.

## 1. Source of truth

- `src/shared/i18n/messages/en.ts` — the **source of truth**. It is a `const` object declared `as const`; it derives `MessageKey` and `Messages`:
  ```ts
  export const en = { 'nav.home': 'Home' } as const
  export type MessageKey = keyof typeof en
  export type Messages = Record<MessageKey, string>
  ```
- `src/shared/i18n/messages/es.ts` — typed as `Messages`, so TypeScript fails if it misses any key from `en`. It must stay **key-for-key in sync** with `en` (a test enforces this: `Object.keys(es)).toEqual(Object.keys(en))`).
- `src/shared/i18n/index.ts` — `useI18n()` composable, `t`, `tc`, and `translate`.
- `src/shared/i18n/types.ts` — `Locale`, `LOCALE_META`, `AVAILABLE_LOCALES`.
- `src/shared/i18n/primevue.ts` — PrimeVue locale options per locale.
- `src/shared/stores/locale.ts` — the `locale` store (persists to `localStorage`, sets `document.documentElement.lang`).

Add a new key by adding it to `en.ts` first (it defines the type), then add the matching entry to `es.ts`.

## 2. Key naming

Dot-namespaced by area, grouped and alphabetized within each area. Existing namespaces:

- `common.*`, `app.*`, `nav.*`, `languageSwitcher.*`
- `weekday.*`, `duty.*`, `contract.*`
- `scheduler.*`, `shiftGrid.*`, `shiftBar.*`, `shiftRow.*`, `weeklyHours.*`, `hours.group.*`
- `employees.*`, `holidays.*`, `calendar.*`
- `summary.*`, `csv.*`
- `errors.*` — all validation/error messages

Keep keys under the module they belong to; reuse `common.*` keys for shared button/label text.

## 3. Using `t` in components and views

Import `useI18n` and call `t(key)`. Never hardcode user-facing strings in templates, scripts, or attributes:

```vue
<script setup lang="ts">
import { useI18n } from '@/shared/i18n'
const { t } = useI18n()
</script>

<template>
  <h1>{{ t('employees.title') }}</h1>
  <button type="button" :aria-label="t('employees.add')">{{ t('employees.add') }}</button>
</template>
```

This applies to **everything** a user sees or a screen reader reads: headings, labels, placeholders, buttons, `aria-label`, `title`, tooltips, empty states, and messages. `aria-label` values must be translated too — they are user-visible text.

## 4. Interpolation

Named placeholders with `{name}`; pass a params object to `t`:

```ts
t('employees.count', { count })
t('employees.confirm.removeMessage', { name })
```

Missing params leave the placeholder intact; extra params are ignored.

## 5. Pluralization

Use `tc(oneKey, otherKey, count, params)` for the two-form contract (singular at exactly 1, plural otherwise):

```ts
tc('csv.importedOne', 'csv.importedMany', count, { count })
```

Only the two-form contract is supported; a locale with zero/few/many rules would need `Intl.PluralRules`.

## 6. Errors and validation messages are keys, not text

Domain code (utils, stores, validators) returns a `MessageKey`, **never** a localized literal. The view translates at the boundary:

```ts
// src/shared/utils/csv.ts — returns a key
export type CsvParseResult =
  | { ok: true; headers: string[]; rows: string[][] }
  | { ok: false; error: MessageKey }

// view — translates the key
const errorMessage = computed(() => (status.value.error ? t(status.value.error) : ''))
```

`RowError.message`, `CsvParseResult.error`, `EmployeeFormErrors`, and store `error` refs are all `MessageKey`. When you add an error condition, add its `errors.*` key to **both** catalogs.

## 7. PrimeVue locale

Locale-aware PrimeVue strings (day/month names, `today`, `clear`, `emptyMessage`, `aria.*`, date format) live in `src/shared/i18n/primevue.ts` under `primevueLocales[locale]`. When adding a PrimeVue component that surfaces locale-aware text, add the entries to **both** `en` and `es` objects there. `src/main.ts` syncs the PrimeVue config to the locale store via `watchEffect`.

## 8. Adding a new locale

1. Add a `LOCALE_META` entry in `src/shared/i18n/types.ts`.
2. Add `src/shared/i18n/messages/<locale>.ts` typed as `Messages` (every key).
3. Add a `primevueLocales[locale]` entry in `src/shared/i18n/primevue.ts`.
4. Register it in `messages` in `src/shared/i18n/index.ts`.
5. Add tests covering the new locale (see below).

## 9. Testing

- Keep the sync test green: `Object.keys(es)` must equal `Object.keys(en)` (asserted in `src/shared/i18n/__tests__/i18n.spec.ts`).
- Assert rendered output through the catalog (`en['nav.home']`), not a hardcoded English literal, so renames stay green.
- When a feature has language-dependent behavior, cover both locales: `localeStore.setLocale('es')` then assert the Spanish string.
- PrimeVue locale options have their own spec (`primevue.spec.ts`) — extend it when adding locale fields.
- Translation helpers are pure and unit-tested in `i18n.spec.ts` (interpolation, fallback, `tc`).
