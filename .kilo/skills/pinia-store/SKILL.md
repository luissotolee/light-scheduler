---
name: pinia-store
description: Create and extend Pinia stores using the Composition API setup-store style with typed state, getters, and actions. Use when adding or modifying state management in src/shared/stores/ or src/modules/<module>/stores/ (team members, schedule, settings), wiring a view to a store with storeToRefs, or testing stores.
---

# Pinia Store

Read `workspace.md` first for the module map and where files belong.

## 1. Setup-store style only

Every store in `src/shared/stores/` or `src/modules/<module>/stores/` uses a composition/setup store:

```ts
import { defineStore } from 'pinia'

export const useMembersStore = defineStore('members', () => {
  // ref state, computed getters, plain function actions
  return { members, count, addMember, removeMember, updateMember, loadMembers }
})
```

Never use the Options API form (`state`, `getters`, `actions` as object keys). The store id string matches the filename: `src/modules/scheduler/stores/scheduler.ts` → `defineStore('scheduler', ...)`, `src/modules/members/stores/members.ts` → `defineStore('members', ...)`. Cross-module stores live in `src/shared/stores/`.

## 2. Structure and typing

- State: `ref<T>(...)`.
- Getters: `computed(...)`.
- Actions: plain functions with explicit return types.
- Annotate all public action signatures; do not rely on inference for the store contract.

```ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { NewTeamMember, TeamMember } from '@/types'
import { createId } from '@/shared/utils/id'

export const useMembersStore = defineStore('members', () => {
  const members = ref<TeamMember[]>([])

  const count = computed(() => members.value.length)

  function addMember(payload: NewTeamMember): TeamMember | null {
    const name = payload.name.trim()
    if (!name) return null

    const email = payload.email?.trim()
    const member: TeamMember = {
      id: createId(),
      name,
      ...(email ? { email } : {}),
    }
    members.value.push(member)
    return member
  }

  function removeMember(id: string): void {
    members.value = members.value.filter((member) => member.id !== id)
  }

  function updateMember(id: string, patch: Partial<TeamMember>): void {
    const member = members.value.find((item) => item.id === id)
    if (!member) return

    if (patch.name !== undefined) {
      const name = patch.name.trim()
      if (!name) return
      patch = { ...patch, name }
    }
    Object.assign(member, patch)
  }

  function loadMembers(loaded: TeamMember[]): void {
    members.value = loaded
  }

  return { members, count, addMember, removeMember, updateMember, loadMembers }
})
```

## 3. Conventions from `src/modules/scheduler/stores/scheduler.ts`

Match the existing scheduler store:

- Failable creators return `T | null` (`addTask(payload): Task | null`, `addMember(payload): TeamMember | null`).
- Input normalization (`.trim()`) lives in the store, not in components or tests.
- Type-only imports use `import type { NewTask, Priority, Task } from '@/types'`; value imports are separate, e.g. `import { createId } from '@/shared/utils/id'`.
- Immutability: replace arrays for removals (`filter`) and bulk changes (`map`); in-place mutation is only for a single-item update such as `toggleTask` or `updateMember`.
- Derived values are `computed`, never duplicated state. Do not store `count` as a `ref` when it can be derived.
- Actions that target an unknown id do nothing; do not throw for missing records.

## 4. Wiring views

Views use `storeToRefs` for state and getters, and call actions directly:

```ts
import { storeToRefs } from 'pinia'
import { useMembersStore } from '@/modules/members/stores/members'
import type { NewTeamMember } from '@/types'

const store = useMembersStore()
const { members, count } = storeToRefs(store)

function handleAdd(payload: NewTeamMember): void {
  store.addMember(payload)
}
```

Never destructure actions (`const { addMember } = store`) — it loses reactivity and `this`/store context. Never destructure state without `storeToRefs`.

Components stay presentational: pass state down as props and emit events up; only views call the store.

## 5. Testing

Reset Pinia before each test so every test gets a fresh store:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useMembersStore } from '@/modules/members/stores/members'

describe('members store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a trimmed member', () => {
    const store = useMembersStore()

    const member = store.addMember({ name: '  Ada  ' })

    expect(member?.name).toBe('Ada')
    expect(store.members).toHaveLength(1)
    expect(store.count).toBe(1)
  })
})
```

Assert state, getters, and action side effects. Include negative paths: blank input returns `null`, unknown ids do not change state, and failed creators do not mutate the list.

## 6. Verification

```bash
npm run typecheck
npm test
npm run lint
```
