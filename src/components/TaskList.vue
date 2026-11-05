<script setup lang="ts">
import TaskItem from '@/components/TaskItem.vue'
import type { Task } from '@/types'

defineProps<{
  tasks: Task[]
}>()

const emit = defineEmits<{
  toggle: [id: string]
  remove: [id: string]
}>()
</script>

<template>
  <ul v-if="tasks.length" class="task-list">
    <TaskItem
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      @toggle="emit('toggle', $event)"
      @remove="emit('remove', $event)"
    />
  </ul>
  <p v-else class="task-list__empty">Nothing scheduled. Add your first task above.</p>
</template>

<style scoped>
.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.task-list__empty {
  margin: 0;
  padding: 1.5rem;
  text-align: center;
  color: var(--color-muted);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}
</style>
