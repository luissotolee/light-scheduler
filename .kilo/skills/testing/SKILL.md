---
name: testing
description: Write Vitest unit tests for stores, components, and views with fresh Pinia state per test, the jsdom environment, coverage thresholds, and *.spec.ts naming. Use when adding or updating tests or when coverage drops below the configured thresholds.
---

# Testing

Read `workspace.md` first for the module map and where files belong.

## 1. Placement and naming

Co-locate specs next to the source in `__tests__/`:

- `src/modules/<module>/__tests__/*.spec.ts`
- `src/shared/components/__tests__/*.spec.ts`
- `src/shared/stores/__tests__/*.spec.ts`
- `src/shared/utils/__tests__/*.spec.ts`

The Vitest glob is `src/**/*.spec.ts`. The root `src/__tests__/App.spec.ts` and `routes.spec.ts` cover `App.vue` and routing.

## 2. Imports

Import Vitest APIs explicitly and app modules through `@/`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import EmployeeTable from '@/modules/employees/components/EmployeeTable.vue'
```

## 3. Store tests

Reset Pinia before each test:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import type { NewShift } from '@/types'

const baseShift: NewShift = { memberId: 'member-1', weekday: 'monday', start: '09:00', end: '12:00' }

describe('scheduler store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a shift using canonical minutes', () => {
    const store = useSchedulerStore()

    const shift = store.addShift(baseShift)

    expect(shift?.startMinute).toBe(540)
    expect(shift?.endMinute).toBe(720)
    expect(store.shiftCount).toBe(1)
  })

  it('rejects invalid times', () => {
    const store = useSchedulerStore()

    expect(store.addShift({ ...baseShift, start: '9:00' })).toBeNull()
    expect(store.addShift({ ...baseShift, start: '12:00', end: '09:00' })).toBeNull()
    expect(store.shiftCount).toBe(0)
  })
})
```

Assert state, getters, and action side effects. Include negative paths: invalid input, unknown ids, and empty-store computations.

## 4. Component tests

Mount with props and assert rendered output plus emitted events:

```ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '@/shared/components/EmptyState.vue'

describe('EmptyState', () => {
  it('renders title and description', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No shifts', description: 'Add a shift to get started.' },
    })

    expect(wrapper.text()).toContain('No shifts')
    expect(wrapper.text()).toContain('Add a shift to get started.')
  })
})
```

- Trigger interactions with `await wrapper.find('...').trigger('...')`.
- Assert `wrapper.text()`, attributes/classes, and `wrapper.emitted()`; never assert internal component state.
- For components with PrimeVue deps (e.g. `EmployeeTable`), provide plugins and directives in `global` and stub `matchMedia` — see its spec for the exact setup.
- Use `Partial<T>` factory helpers to keep fixtures short.
- Re-emit tests: call `item.vm.$emit('remove', id)` on a child wrapper, then assert the parent emitted the event.

## 5. View tests

Views mount with the same Pinia instance that seeds the store, then assert the rendered output:

```ts
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import SchedulerView from '@/modules/scheduler/views/SchedulerView.vue'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'

describe('SchedulerView', () => {
  it('renders shifts from the store', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useSchedulerStore()
    store.addShift({ memberId: 'member-1', weekday: 'monday', start: '09:00', end: '12:00' })

    const wrapper = mount(SchedulerView, { global: { plugins: [pinia] } })

    expect(wrapper.text()).toContain('monday')
    expect(wrapper.text()).toContain('09:00')
  })
})
```

Use `global: { plugins: [pinia] }` with the same `pinia` instance so child components resolve the active store. Mutate the store and re-assert to verify wiring.

## 6. jsdom stubs

Use stubs where jsdom or PrimeVue needs browser APIs:

```ts
vi.stubGlobal('matchMedia', () => ({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))

vi.stubGlobal('URL', {
  ...URL,
  createObjectURL: vi.fn(() => 'blob:test'),
  revokeObjectURL: vi.fn(),
})

vi.useFakeTimers()
vi.setSystemTime(new Date('2026-11-05T20:57:00Z'))
```

Clean up after each test:

```ts
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
```

## 7. Coverage thresholds

Configured in `vite.config.ts`:

- statements >= 80
- functions >= 80
- lines >= 80
- branches >= 75

Excluded from coverage: `src/main.ts`, `*.d.ts`, `src/router/**`. Keep `npm run test:coverage` green; add focused tests rather than lowering thresholds.
