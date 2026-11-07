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

The Vitest glob is `src/**/*.spec.ts`. The root `src/__tests__/App.spec.ts` tests `App.vue`.

## 2. Imports

Import Vitest APIs explicitly and app modules through `@/`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import TaskForm from '@/shared/components/TaskForm.vue'
```

## 3. Store tests

Reset Pinia before each test:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'

describe('scheduler store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('rejects blank titles', () => {
    const store = useSchedulerStore()

    expect(store.addTask({ title: '   ', priority: 'low' })).toBeNull()
    expect(store.tasks).toHaveLength(0)
  })
})
```

Assert state, getters, and action side effects. Include negative paths: invalid input, unknown ids, and empty-store computations.

## 4. Component tests

Mount with props and assert rendered output plus emitted events:

```ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskForm from '@/shared/components/TaskForm.vue'

describe('TaskForm', () => {
  it('emits a trimmed task on submit', async () => {
    const wrapper = mount(TaskForm)

    await wrapper.find('input').setValue('  plan sprint  ')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([[{ title: 'plan sprint', priority: 'medium' }]])
  })
})
```

- Trigger interactions with `await wrapper.find('...').trigger('...')`.
- Assert `wrapper.text()`, attributes/classes, and `wrapper.emitted()`; never assert internal component state.
- Use `Partial<T>` factory helpers to keep fixtures short.
- Re-emit tests: call `item.vm.$emit('toggle', id)` on a child wrapper, then assert the parent emitted the event.

## 5. View tests

Views mount with a Pinia instance, then mutate the store and wait for reactivity:

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import HomeView from '@/modules/home/views/HomeView.vue'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'

describe('HomeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders store tasks', async () => {
    const store = useSchedulerStore()
    store.addTask({ title: 'ship it', priority: 'high' })

    const wrapper = mount(HomeView, { global: { plugins: [createPinia()] } })
    store.addTask({ title: 'second', priority: 'low' })
    await nextTick()

    expect(wrapper.text()).toContain('second')
  })
})
```

Use `global: { plugins: [pinia] }` so child components resolve the active store. Mutate the store and `await nextTick()` to verify wiring.

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

vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000')

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

## 8. Verification

```bash
npm test
npm run test:watch
npm run test:coverage
```
