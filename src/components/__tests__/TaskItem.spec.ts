import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskItem from '@/components/TaskItem.vue'
import type { Task } from '@/types'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Review PR',
    priority: 'medium',
    done: false,
    createdAt: 0,
    ...overrides,
  }
}

describe('TaskItem', () => {
  it('renders the task title and priority', () => {
    const wrapper = mount(TaskItem, { props: { task: makeTask({ priority: 'high' }) } })

    expect(wrapper.text()).toContain('Review PR')
    expect(wrapper.find('.task-item__priority').text()).toBe('high')
  })

  it('applies the done modifier', () => {
    const wrapper = mount(TaskItem, { props: { task: makeTask({ done: true }) } })

    expect(wrapper.classes()).toContain('task-item--done')
  })

  it('emits toggle when the checkbox changes', async () => {
    const wrapper = mount(TaskItem, { props: { task: makeTask() } })

    await wrapper.find('input[type="checkbox"]').trigger('change')

    expect(wrapper.emitted('toggle')).toEqual([['task-1']])
  })

  it('emits remove when the remove button is clicked', async () => {
    const wrapper = mount(TaskItem, { props: { task: makeTask() } })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('remove')).toEqual([['task-1']])
  })
})
