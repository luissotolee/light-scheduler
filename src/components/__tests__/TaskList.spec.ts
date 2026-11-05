import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskList from '@/components/TaskList.vue'
import TaskItem from '@/components/TaskItem.vue'
import type { Task } from '@/types'

function makeTask(id: string, title: string): Task {
  return { id, title, priority: 'low', done: false, createdAt: 0 }
}

describe('TaskList', () => {
  it('shows an empty state when there are no tasks', () => {
    const wrapper = mount(TaskList, { props: { tasks: [] } })

    expect(wrapper.text()).toContain('Nothing scheduled')
    expect(wrapper.find('ul').exists()).toBe(false)
  })

  it('renders one item per task', () => {
    const wrapper = mount(TaskList, {
      props: { tasks: [makeTask('1', 'First'), makeTask('2', 'Second')] },
    })

    const items = wrapper.findAllComponents(TaskItem)
    expect(items).toHaveLength(2)
    expect(items[0].props('task').title).toBe('First')
  })

  it('re-emits toggle and remove from child items', async () => {
    const wrapper = mount(TaskList, { props: { tasks: [makeTask('1', 'First')] } })

    const item = wrapper.findComponent(TaskItem)
    item.vm.$emit('toggle', '1')
    item.vm.$emit('remove', '1')

    expect(wrapper.emitted('toggle')).toEqual([['1']])
    expect(wrapper.emitted('remove')).toEqual([['1']])
  })
})
