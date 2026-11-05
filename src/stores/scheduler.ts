import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { NewTask, Priority, Task } from '@/types'
import { createId } from '@/utils/id'

export const useSchedulerStore = defineStore('scheduler', () => {
  const tasks = ref<Task[]>([])

  const total = computed(() => tasks.value.length)
  const completed = computed(() => tasks.value.filter((task) => task.done).length)
  const remaining = computed(() => total.value - completed.value)
  const progress = computed(() =>
    total.value === 0 ? 0 : Math.round((completed.value / total.value) * 100),
  )

  function addTask(payload: NewTask): Task | null {
    const title = payload.title.trim()
    if (!title) return null

    const task: Task = {
      id: createId(),
      title,
      priority: payload.priority,
      done: false,
      createdAt: Date.now(),
    }
    tasks.value.push(task)
    return task
  }

  function removeTask(id: string): void {
    tasks.value = tasks.value.filter((task) => task.id !== id)
  }

  function toggleTask(id: string): void {
    const task = tasks.value.find((item) => item.id === id)
    if (task) task.done = !task.done
  }

  function clearCompleted(): void {
    tasks.value = tasks.value.filter((task) => !task.done)
  }

  function setPriority(id: string, priority: Priority): void {
    const task = tasks.value.find((item) => item.id === id)
    if (task) task.priority = priority
  }

  return {
    tasks,
    total,
    completed,
    remaining,
    progress,
    addTask,
    removeTask,
    toggleTask,
    clearCompleted,
    setPriority,
  }
})
