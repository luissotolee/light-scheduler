---
name: typescript-domain-modeling
description: Model shared domain types and keep the strict TypeScript codebase type-safe. Use when adding or changing domain types (TeamMember, Shift, WeekSchedule) in src/types.ts, designing discriminated unions, or introducing new data shapes.
---

# TypeScript Domain Modeling

Read `workspace.md` first for the module map and where files belong.

## 1. Single source of truth

All shared domain shapes live in `src/types.ts`. Do not declare inline interfaces for shared shapes in stores, components, or utilities. Types used by only one module may live in `src/modules/<module>/types.ts`.

- Use `interface` for entities (`TeamMember`, `Shift`, `WeekSchedule`).
- Use `type` for unions and aliases (`Duty`, `Contract`, `Weekday`, `WeekKey`, `Result<T>`).
- Keep input types separate from persisted entities: `NewTeamMember` vs `TeamMember`, `NewShift` vs `Shift`.

```ts
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface Shift {
  id: string
  memberId: string
  weekday: Weekday
  startMinute: number
  endMinute: number
}

export interface NewShift {
  memberId: string
  weekday: Weekday
  start: string // 'HH:mm' input
  end: string   // 'HH:mm' input
}
```

## 2. `verbatimModuleSyntax` / `import type`

`verbatimModuleSyntax` is enabled. Type-only imports must use `import type`; value imports stay separate:

```ts
import type { NewShift, Shift } from '@/types'
import { createId } from '@/shared/utils/id'
```

Do not mix a type and a value in a single import when the type is erased. Avoid `import { type Foo }` unless the project already uses it; the established style is a separate `import type` line.

## 3. Strict flags

These are already enforced in `tsconfig.json`:

- `strict`
- `noUnusedLocals`
- `noUnusedParameters`
- `noFallthroughCasesInSwitch`
- `isolatedModules`
- `verbatimModuleSyntax`

Never use `any`. Use `unknown` plus narrowing/type guards, and avoid `as` casts when a guard works:

```ts
import type { Duty } from '@/types'

function isDuty(value: unknown): value is Duty {
  return value === 'manager' || value === 'employee' || value === 'assistant' || value === 'head_manager'
}

function parseDuty(value: unknown): Duty | null {
  return isDuty(value) ? value : null
}
```

Return `null` for invalid user input at boundaries; do not throw for expected validation failures. The existing guards live in `src/shared/utils/employee.ts` (`isDuty`, `isContract`, `parseDuty`, `parseContract`).

## 4. Discriminated unions

Model parse/validation outcomes as discriminated unions. These already live in `src/types.ts`:

```ts
export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export type Validated<T> = { ok: true; data: T[] } | { ok: false; errors: RowError[] }
```

Narrow with the boolean discriminant:

```ts
const result = validateEmployeeForm(input)
if (result.ok) {
  use(result.value)
} else {
  showError(result.message)
}
```

Do not add a redundant `success` boolean or use exceptions for control flow.

Error and message fields that are shown to the user are `MessageKey` (from `@/shared/i18n/messages/en`), not localized literals — `RowError.message`, `BackupParseResult.error`, `EmployeeFormErrors`, and store `error` refs all use it. The view translates the key via `t()`. Add any new `errors.*` key to **both** `en.ts` and `es.ts` (see the `i18n` skill).

## 5. `TeamMember` domain model

```ts
export interface TeamMember {
  id: string
  name: string
  duty: Duty
  contract: Contract
  weeklyHours: number
  holidays: HolidayWeek[]
  email?: string
  phone?: string
  active: boolean
  startDate: string
  endDate?: string
}

export interface NewTeamMember {
  name: string
  duty: Duty
  contract: Contract
  weeklyHours: number
  holidays?: HolidayWeek[]
  email?: string
  phone?: string
  startDate?: string
}
```

Persisted members always have `id` and `active`; creators accept `NewTeamMember` and the store adds `id` + `active`. Optional fields are omitted rather than set to `undefined` when possible.

## 6. Dates and times

- Store instants as epoch milliseconds (`number`) or ISO-8601 strings — never locale display strings.
- Format for display in the component layer (`new Intl.DateTimeFormat(...)` or a small helper).
- Shift hour ranges use minutes since midnight as the canonical representation; see `.kilo/skills/scheduling-calendar/SKILL.md`. `'HH:mm'` is input/display only.
- Do not persist `Date` objects in domain entities; they do not serialize cleanly.
