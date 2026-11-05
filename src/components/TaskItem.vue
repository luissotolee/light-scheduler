<script setup lang="ts">
import type { Task } from '@/types'

defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  toggle: [id: string]
  remove: [id: string]
}>()
</script>

<template>
  <li class="task-item" :class="{ 'task-item--done': task.done }">
    <label class="task-item__checkbox">
      <input
        type="checkbox"
        :checked="task.done"
        :aria-label="`Toggle ${task.title}`"
        @change="emit('toggle', task.id)"
      />
      <span class="task-item__title">{{ task.title }}</span>
    </label>

    <span class="task-item__priority" :data-priority="task.priority">{{ task.priority }}</span>

    <button
      class="task-item__remove"
      type="button"
      :aria-label="`Remove ${task.title}`"
      @click="emit('remove', task.id)"
    >
      Remove
    </button>
  </li>
</template>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.task-item--done .task-item__title {
  text-decoration: line-through;
  color: var(--color-muted);
}

.task-item__checkbox {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1;
  cursor: pointer;
}

.task-item__title {
  overflow-wrap: anywhere;
}

.task-item__priority {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-surface-alt);
  color: var(--color-muted);
}

.task-item__priority[data-priority='high'] {
  background: rgba(248, 113, 113, 0.16);
  color: #fca5a5;
}

.task-item__priority[data-priority='medium'] {
  background: rgba(250, 204, 21, 0.16);
  color: #fde047;
}

.task-item__priority[data-priority='low'] {
  background: rgba(74, 222, 128, 0.16);
  color: #86efac;
}

.task-item__remove {
  border: none;
  background: transparent;
  color: var(--color-muted);
  font: inherit;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  border-radius: var(--radius-sm);
}

.task-item__remove:hover,
.task-item__remove:focus-visible {
  color: #fca5a5;
  outline: none;
}
</style>
