import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from '@/shared/components/EmptyState.vue'

describe('EmptyState', () => {
  it('renders a title and description', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No employees yet', description: 'Add someone to begin.' },
    })

    expect(wrapper.find('h2').text()).toBe('No employees yet')
    expect(wrapper.text()).toContain('Add someone to begin.')
  })

  it('omits the description when not provided', () => {
    const wrapper = mount(EmptyState, { props: { title: 'No employees yet' } })

    expect(wrapper.find('.empty-state__description').exists()).toBe(false)
  })

  it('renders the action slot', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'No employees yet' },
      slots: { action: '<button type="button">Add</button>' },
    })

    expect(wrapper.find('.empty-state__action button').text()).toBe('Add')
  })
})
