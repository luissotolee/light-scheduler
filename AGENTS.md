# AGENTS.md

**light-scheduler** — Vue 3 + TypeScript + Pinia + PrimeVue frontend, built with Vite and tested with Vitest. No backend; state lives in the browser and round-trips via CSV.

## Before working

1. Read `workspace.md` for the module map and where each file belongs.
2. Load the matching skill from `.kilo/skills/<area>/SKILL.md` before changing code in that area — skills hold the project conventions ("how we behave") for that area.
3. Run verification before reporting work complete.

## Languages (i18n)

The app ships two languages: **English (`en`)** and **Spanish (`es`)**. Any label, message, error, `aria-label`, or other user-visible text must be added or updated in **both** `src/shared/i18n/messages/en.ts` and `src/shared/i18n/messages/es.ts` in the same change. Load the `i18n` skill when touching any text; never hardcode user-facing strings in components, stores, or utils.

## Verification

`npm run lint` · `npm run typecheck` · `npm test` · `npm run test:coverage` · `npm run build`
