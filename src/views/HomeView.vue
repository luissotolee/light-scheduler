<script setup lang="ts">
import { storeToRefs } from 'pinia'
import StatsBar from '@/components/StatsBar.vue'
import TaskForm from '@/components/TaskForm.vue'
import TaskList from '@/components/TaskList.vue'
import { useSchedulerStore } from '@/stores/scheduler'
import type { NewTask } from '@/types'

const store = useSchedulerStore()
const { tasks, total, completed, remaining, progress } = storeToRefs(store)

function handleSubmit(task: NewTask): void {
  store.addTask(task)
}
</script>

<template>
  <section class="home">
    <header class="home__header">
      <h1>Today</h1>
      <p>Plan the day, keep it light, ship the important things.</p>
    </header>

    <TaskForm @submit="handleSubmit" />

    <StatsBar :total="total" :completed="completed" :remaining="remaining" :progress="progress" />

    <TaskList :tasks="tasks" @toggle="store.toggleTask" @remove="store.removeTask" />

    <div v-if="completed > 0" class="home__actions">
      <button type="button" class="home__clear" @click="store.clearCompleted">
        Clear completed ({{ completed }})
      </button>
    </div>
  </section>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.home__header h1 {
  margin: 0 0 0.35rem;
  font-size: 1.75rem;
}

.home__header p {
  margin: 0;
  color: var(--color-muted);
}

.home__actions {
  display: flex;
  justify-content: flex-end;
}

.home__clear {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-muted);
  padding: 0.5rem 0.9rem;
  font: inherit;
  cursor: pointer;
}

.home__clear:hover {
  color: var(--color-text);
  border-color: var(--color-accent);
}
</style>
