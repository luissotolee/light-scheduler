<script setup lang="ts">
import { ref } from 'vue'
import type { NewTask, Priority } from '@/types'

const emit = defineEmits<{
  submit: [task: NewTask]
}>()

const title = ref('')
const priority = ref<Priority>('medium')

function handleSubmit(): void {
  const trimmed = title.value.trim()
  if (!trimmed) return

  emit('submit', { title: trimmed, priority: priority.value })
  title.value = ''
  priority.value = 'medium'
}
</script>

<template>
  <form class="task-form" @submit.prevent="handleSubmit">
    <input
      v-model="title"
      class="task-form__input"
      type="text"
      placeholder="What needs to be done?"
      aria-label="Task title"
    />
    <select v-model="priority" class="task-form__select" aria-label="Task priority">
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
    <button class="task-form__button" type="submit" :disabled="!title.trim()">Add</button>
  </form>
</template>

<style scoped>
.task-form {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.task-form__input {
  flex: 1 1 16rem;
  min-width: 0;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.task-form__input:focus-visible,
.task-form__select:focus-visible,
.task-form__button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.task-form__select {
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.task-form__button {
  padding: 0.65rem 1.25rem;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: #0b0f19;
  font-weight: 700;
  cursor: pointer;
  transition: filter 150ms ease;
}

.task-form__button:hover:not(:disabled) {
  filter: brightness(1.08);
}

.task-form__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
