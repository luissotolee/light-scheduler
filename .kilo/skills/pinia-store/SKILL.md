---
name: pinia-store
description: Create and extend Pinia stores using the Composition API setup-store style with typed state, getters, and actions. Use when adding or modifying state management in src/shared/stores/ or src/modules/<module>/stores/ (workspace, employees, scheduler), wiring a view to a store with storeToRefs, or testing stores.
---

# Pinia Store

Read `workspace.md` first for the module map and where files belong.

## 1. Setup-store style only

Every store in `src/shared/stores/` or `src/modules/<module>/stores/` uses a composition/setup store:

```ts
import { defineStore } from 'pinia'

export const useWorkspaceStore = defineStore('workspace', () => {
  // ref state, computed getters, plain function actions
  return { members, schedules, setMembers, upsertMember, removeMember }
})
```

Never use the Options API form (`state`, `getters`, `actions` as object keys). The store id string matches the filename: `src/shared/stores/workspace.ts` → `defineStore('workspace', ...)`, `src/modules/scheduler/stores/scheduler.ts` → `defineStore('scheduler', ...)`, `src/modules/employees/stores/employees.ts` → `defineStore('employees', ...)`. Cross-module stores live in `src/shared/stores/`.

## 2. Structure and typing

- State: `ref<T>(...)`.
- Getters: `computed(...)`.
- Actions: plain functions with explicit return types.
- Annotate all public action signatures; do not rely on inference for the store contract.

```ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { TeamMember } from '@/types'

export const useWorkspaceStore = defineStore('workspace', () => {
  const members = ref<TeamMember[]>([])

  const memberCount = computed(() => members.value.length)

  function upsertMember(member: TeamMember): void {
    const index = members.value.findIndex((item) => item.id === member.id)
    if (index === -1) {
      members.value = [...members.value, member]
      return
    }
    members.value = members.value.map((item) => (item.id === member.id ? member : item))
  }

  function removeMember(id: string): void {
    members.value = members.value.filter((member) => member.id !== id)
  }

  function setMembers(loaded: TeamMember[]): void {
    members.value = loaded
  }

  return { members, memberCount, upsertMember, removeMember, setMembers }
})
```

## 3. Conventions from the existing stores

Match `src/shared/stores/workspace.ts`, `src/modules/scheduler/stores/scheduler.ts`, and `src/modules/employees/stores/employees.ts`:

- Failable creators return `T | null` (`addShift(payload): Shift | null`, `addMember(payload): TeamMember | null`).
- Input normalization and validation (`.trim()`, guards, form validation) live in the store, not in components or tests.
- Type-only imports use `import type { NewShift, Shift } from '@/types'`; value imports are separate, e.g. `import { createId } from '@/shared/utils/id'`.
- Immutability: replace arrays for removals (`filter`) and bulk changes (`map`); in-place mutation is only for a single-item update.
- Derived values are `computed`, never duplicated state. Do not store a count as a `ref` when it can be derived.
- Actions that target an unknown id do nothing; do not throw for missing records.
- The shared `workspace` store is the single source of truth for `members` and `schedules`; module stores read/write it through `useWorkspaceStore()` rather than duplicating state.

## 4. Wiring views

Views use `storeToRefs` for state and getters, and call actions directly:

```ts
import { storeToRefs } from 'pinia'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import type { NewShift } from '@/types'

const store = useSchedulerStore()
const { currentWeekShifts, shiftCount } = storeToRefs(store)

function handleAdd(payload: NewShift): void {
  store.addShift(payload)
}
```

Never destructure actions (`const { addShift } = store`) — it loses reactivity and store context. Never destructure state without `storeToRefs`.

Components stay presentational: pass state down as props and emit events up; only views call the store.

## 5. Testing

Reset Pinia before each test so every test gets a fresh store:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'

describe('scheduler store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a shift using canonical minutes', () => {
    const store = useSchedulerStore()

    const shift = store.addShift({ memberId: 'm1', weekday: 'monday', start: '09:00', end: '17:00' })

    expect(shift?.startMinute).toBe(540)
    expect(store.currentWeekShifts).toHaveLength(1)
    expect(store.shiftCount).toBe(1)
  })
})
```

Assert state, getters, and action side effects. Include negative paths: invalid input returns `null`, unknown ids do not change state, and failed creators do not mutate the list.
