---
name: typescript-domain-modeling
description: Model shared domain types and keep the strict TypeScript codebase type-safe. Use when adding or changing domain types (TeamMember, Task, Shift, Calendar) in src/types.ts, designing discriminated unions, or introducing new data shapes.
---

# TypeScript Domain Modeling

Read `workspace.md` first for the module map and where files belong.

## 1. Single source of truth

All shared domain shapes live in `src/types.ts`. Do not declare inline interfaces for shared shapes in stores, components, or utilities. Types used by only one module may live in `src/modules/<module>/types.ts`.

- Use `interface` for entities (`Task`, `TeamMember`, `Shift`).
- Use `type` for unions and aliases (`Priority`, `Weekday`, `Result<T>`).
- Keep input types separate from persisted entities: `NewTask` vs `Task`, `NewTeamMember` vs `TeamMember`, `NewShift` vs `Shift`.

```ts
export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  priority: Priority
  done: boolean
  createdAt: number
}

export interface NewTask {
  title: string
  priority: Priority
}
```

## 2. `verbatimModuleSyntax` / `import type`

`verbatimModuleSyntax` is enabled. Type-only imports must use `import type`; value imports stay separate:

```ts
import type { NewTask, Task } from '@/types'
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
function isPriority(value: unknown): value is Priority {
  return value === 'low' || value === 'medium' || value === 'high'
}

function parsePriority(value: unknown): Priority | null {
  return isPriority(value) ? value : null
}
```

Return `null` for invalid user input at boundaries; do not throw for expected validation failures.

## 4. Discriminated unions

Model parse/validation outcomes as discriminated unions:

```ts
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }
```

Narrow with the boolean discriminant:

```ts
const result = parseSomething(input)
if (result.ok) {
  use(result.value)
} else {
  showError(result.error)
}
```

Do not add a redundant `success` boolean or use exceptions for control flow.

## 5. `TeamMember` domain model

```ts
export interface TeamMember {
  id: string
  name: string
  email?: string
}

export interface NewTeamMember {
  name: string
  email?: string
}
```

Persisted members always have `id`; creators accept `NewTeamMember` and add the id in the store. Optional fields are omitted rather than set to `undefined` when possible.

## 6. Dates and times

- Store instants as epoch milliseconds (`number`) or ISO-8601 strings — never locale display strings.
- Format for display in the component layer (`new Intl.DateTimeFormat(...)` or a small helper).
- Shift hour ranges use minutes since midnight as the canonical representation; see `.kilo/skills/scheduling-calendar/SKILL.md`. `'HH:mm'` is input/display only.
- Do not persist `Date` objects in domain entities; they do not serialize cleanly.

## 7. Verification

`npm run typecheck` is the gate. Run it after every type change:

```bash
npm run typecheck
```
