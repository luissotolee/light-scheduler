---
name: vue-component
description: Build Vue 3 single-file components and views with <script setup lang="ts">, typed defineProps/defineEmits, scoped styles using CSS custom-property design tokens, and accessibility best practices. Use when creating or editing presentational components in src/shared/components/ + src/modules/*/components/ or routed views in src/modules/*/views/.
---

# Vue Component

Read `workspace.md` first for the module map and where files belong.

## 1. SFC boilerplate

Block order in every SFC: `<template>` first, then `<script setup lang="ts">`, then `<style scoped>`.

Every component and view uses `<script setup lang="ts">`. There is no Options API and no `export default`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { TeamMember } from '@/types'

const props = defineProps<{
  member: TeamMember
  selected?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
  remove: [id: string]
}>()

const initials = computed(() =>
  props.member.name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

function handleSelect(): void {
  emit('select', props.member.id)
}
</script>
```

## 2. Props and emits

Use the typed macro syntax:

```ts
const props = defineProps<{
  members: TeamMember[]
}>()

const emit = defineEmits<{
  edit: [id: string]
  remove: [id: string]
  details: [id: string]
}>()
```

- Emit tuple payloads, not loose rest arguments.
- Event names are present tense (`edit`, `remove`, `details`, `deactivate`, `reactivate`, `submit`), matching `EmployeeTable.vue` and `EmployeeFormDialog.vue`.
- Keep payloads minimal: pass an id when the parent already owns the entity; pass a full input object only for creation (`NewTeamMember`, `NewShift`).
- Props are read-only; never mutate them. Derive display values with `computed`.

## 3. Component vs view

| | Components (`src/shared/components/`, `src/modules/*/components/`) | Views (`src/modules/*/views/`) |
|---|---|---|
| Responsibility | Presentational: props in, events out | Owns store/router state and composes components |
| Pinia | Never | `useXxxStore()` + `storeToRefs` |
| Router | Never | Route target |
| Example | `EmployeeTable.vue`, `EmployeeFormDialog.vue`, `PageHeader.vue`, `EmptyState.vue` | `EmployeesView.vue`, `SchedulerView.vue` |

Views wire the store:

```ts
import { storeToRefs } from 'pinia'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'

const store = useSchedulerStore()
const { currentWeekShifts, shiftCount } = storeToRefs(store)
```

Only views are registered in `src/router/index.ts`, which uses `createWebHashHistory`. New routes are lazily loaded:

```ts
{ path: '/employees', name: 'employees', component: () => import('@/modules/employees/views/EmployeesView.vue') }
```

## 4. Styling

- Use `<style scoped>`.
- Use BEM-ish names: `.employee-table`, `.employee-table__actions`, `.employee-table__name--inactive`.
- Use design tokens only from `src/assets/main.css` `:root`: `--color-*`, `--radius-*`, plus `--color-accent`, `--color-muted`, `--color-text`, `--color-surface`, `--color-border`.
- Add reusable tokens to `:root`; never hardcode colors except one-off `rgba(...)` accent chips.
- Use `:deep()` only to reach PrimeVue internal elements.

```vue
<style scoped>
.employee-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.employee-table__name--inactive {
  color: var(--color-danger);
  text-decoration: line-through;
}

.employee-table__actions button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
```

## 5. Accessibility

- Prefer semantic elements: `<form>`, `<ul>`, `<li>`, `<label>`, `<button type="button">`.
- Give every icon-only or label-less control an `aria-label` (for example, a remove button).
- Associate labels with inputs; wire form submission through `<form @submit.prevent="...">`.
- Progress indicators use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.
- Keep a visible `:focus-visible` outline.
- Disabled states reflect validation (for example, submit disabled while a required field is blank).
- Do not use `div`/`span` click handlers when a native button will do.

```vue
<button type="button" aria-label="Remove Ada" @click="emit('remove', member.id)">
  <i class="pi pi-trash" aria-hidden="true" />
</button>
```

## 6. Text and labels (i18n)

All user-facing text — headings, labels, placeholders, buttons, `aria-label`, `title`, tooltips, empty states, and messages — must come from `useI18n()`, never hardcoded literals:

```vue
<script setup lang="ts">
import { useI18n } from '@/shared/i18n'
const { t } = useI18n()
</script>

<template>
  <button type="button" :aria-label="t('employees.removeAria', { name })">
    <i class="pi pi-trash" aria-hidden="true" />
  </button>
</template>
```

The app ships two languages (English and Spanish). Every string must be added or edited in **both** `src/shared/i18n/messages/en.ts` and `src/shared/i18n/messages/es.ts` in the same change. Load the `i18n` skill when touching any label or text.

## 7. PrimeVue

- Import components from their package paths, e.g. `import Button from 'primevue/button'`.
- Register global plugins (`PrimeVue`, `ToastService`) in `src/main.ts`.
- In tests, provide the same plugins through `global.plugins` and directives through `global.directives` (e.g. the `tooltip` directive on `EmployeeTable`).
- Stub `window.matchMedia` in tests because PrimeVue may access it under jsdom:

```ts
vi.stubGlobal('matchMedia', () => ({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))
```

## 8. Testing

Mount with explicit props and assert user-visible output:

```ts
const wrapper = mount(EmptyState, {
  props: { title: 'No shifts', description: 'Add a shift to get started.' },
})

expect(wrapper.text()).toContain('No shifts')
expect(wrapper.text()).toContain('Add a shift to get started.')
```

- Assert rendered text/attributes and `wrapper.emitted()`; never assert component internal state.
- For components that emit (e.g. `EmployeeTable`), trigger the control and assert the emitted payload: `await wrapper.find('[data-test="remove-member-1"]').trigger('click')` → `expect(wrapper.emitted('remove')).toEqual([['member-1']])`.
- Use `Partial<T>` factory helpers to keep fixtures short and readable.
- Use `mount(Component, { props })`; use `shallowMount` only when a child is irrelevant to the assertion.
