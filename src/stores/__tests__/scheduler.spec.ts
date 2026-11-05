import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSchedulerStore } from '@/stores/scheduler'

describe('scheduler store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts empty with zeroed stats', () => {
    const store = useSchedulerStore()

    expect(store.tasks).toEqual([])
    expect(store.total).toBe(0)
    expect(store.completed).toBe(0)
    expect(store.remaining).toBe(0)
    expect(store.progress).toBe(0)
  })

  it('adds a trimmed task with the given priority', () => {
    const store = useSchedulerStore()

    const task = store.addTask({ title: '  write tests  ', priority: 'high' })

    expect(task).not.toBeNull()
    expect(store.tasks).toHaveLength(1)
    expect(task?.title).toBe('write tests')
    expect(task?.priority).toBe('high')
    expect(task?.done).toBe(false)
    expect(task?.id).toBeTruthy()
  })

  it('rejects blank titles', () => {
    const store = useSchedulerStore()

    const result = store.addTask({ title: '   ', priority: 'low' })

    expect(result).toBeNull()
    expect(store.tasks).toHaveLength(0)
  })

  it('toggles completion and updates computed stats', () => {
    const store = useSchedulerStore()
    const first = store.addTask({ title: 'first', priority: 'low' })
    store.addTask({ title: 'second', priority: 'medium' })

    store.toggleTask(first!.id)

    expect(store.total).toBe(2)
    expect(store.completed).toBe(1)
    expect(store.remaining).toBe(1)
    expect(store.progress).toBe(50)
  })

  it('ignores toggles for unknown ids', () => {
    const store = useSchedulerStore()
    store.addTask({ title: 'only', priority: 'low' })

    store.toggleTask('missing')

    expect(store.completed).toBe(0)
  })

  it('removes a task by id', () => {
    const store = useSchedulerStore()
    const task = store.addTask({ title: 'remove me', priority: 'high' })
    store.addTask({ title: 'keep me', priority: 'low' })

    store.removeTask(task!.id)

    expect(store.tasks.map((item) => item.title)).toEqual(['keep me'])
  })

  it('clears completed tasks only', () => {
    const store = useSchedulerStore()
    const done = store.addTask({ title: 'done', priority: 'low' })
    store.addTask({ title: 'pending', priority: 'high' })
    store.toggleTask(done!.id)

    store.clearCompleted()

    expect(store.tasks.map((item) => item.title)).toEqual(['pending'])
  })

  it('updates a task priority', () => {
    const store = useSchedulerStore()
    const task = store.addTask({ title: 'reprioritize', priority: 'low' })

    store.setPriority(task!.id, 'high')

    expect(store.tasks[0].priority).toBe('high')
  })

  it('does nothing when setting priority for unknown ids', () => {
    const store = useSchedulerStore()
    store.addTask({ title: 'keep', priority: 'low' })

    store.setPriority('missing', 'high')

    expect(store.tasks[0].priority).toBe('low')
  })
})
