---
name: vue-component
description: Build Vue 3 single-file components and views with <script setup lang="ts">, typed defineProps/defineEmits, scoped styles using CSS custom-property design tokens, and accessibility best practices. Use when creating or editing presentational components in src/shared/components/ + src/modules/*/components/ or routed views in src/modules/*/views/.
---

# Vue Component

Read `workspace.md` first for the module map and where files belong.

## 1. SFC boilerplate

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
  tasks: Task[]
}>()

const emit = defineEmits<{
  submit: [task: NewTask]
  toggle: [id: string]
}>()
```

- Emit tuple payloads, not loose rest arguments.
- Event names are present tense (`submit`, `toggle`, `remove`, `select`), matching `TaskForm.vue` and `TaskItem.vue`.
- Keep payloads minimal: pass an id when the parent already owns the entity; pass a full input object only for creation (`NewTask`, `NewTeamMember`).
- Props are read-only; never mutate them. Derive display values with `computed`.

## 3. Component vs view

| | Components (`src/shared/components/`, `src/modules/*/components/`) | Views (`src/modules/*/views/`) |
|---|---|---|
| Responsibility | Presentational: props in, events out | Owns store/router state and composes components |
| Pinia | Never | `useXxxStore()` + `storeToRefs` |
| Router | Never | Route target |
| Example | `TaskForm.vue`, `TaskList.vue` | `HomeView.vue` |

Views wire the store:

```ts
import { storeToRefs } from 'pinia'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'

const store = useSchedulerStore()
const { tasks, completed } = storeToRefs(store)
```

Only views are registered in `src/router/index.ts`, which uses `createWebHashHistory`. New routes are lazily loaded:

```ts
{ path: '/members', name: 'members', component: () => import('@/modules/members/views/MembersView.vue') }
```

## 4. Styling

- Use `<style scoped>`.
- Use BEM-ish names: `.task-form`, `.task-form__input`, `.task-list__item--done`.
- Use design tokens only from `src/assets/main.css` `:root`: `--color-*`, `--radius-*`, plus `--color-accent`, `--color-muted`, `--color-text`, `--color-surface`, `--color-border`.
- Add reusable tokens to `:root`; never hardcode colors except one-off `rgba(...)` accent chips.
- Use `:deep()` only to reach PrimeVue internal elements.

```vue
<style scoped>
.member-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
}

.member-card__email {
  color: var(--color-muted);
}

.member-card__actions button:focus-visible {
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

## 6. PrimeVue

- Import components from their package paths, e.g. `import Button from 'primevue/button'`.
- Register global plugins (`PrimeVue`, `ToastService`) in `src/main.ts`.
- In tests, provide the same plugins through `global.plugins`.
- Stub `window.matchMedia` in tests because PrimeVue may access it under jsdom:

```ts
vi.stubGlobal('matchMedia', () => ({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}))
```

## 7. Testing

Mount with explicit props and assert user-visible output:

```ts
const wrapper = mount(TaskItem, {
  props: { task: { id: '1', title: 'Write tests', priority: 'high', done: false, createdAt: 0 } },
})

expect(wrapper.text()).toContain('Write tests')
expect(wrapper.find('button[aria-label]').exists()).toBe(true)

await wrapper.find('input[type="checkbox"]').trigger('change')
expect(wrapper.emitted('toggle')).toEqual([['1']])
```

- Assert rendered text/attributes and `wrapper.emitted()`; never assert component internal state.
- Use `Partial<T>` factory helpers to keep fixtures short and readable.
- Use `mount(Component, { props })`; use `shallowMount` only when a child is irrelevant to the assertion.

## 8. Verification

```bash
npm run typecheck
npm test
npm run lint
npm run format:check
```
