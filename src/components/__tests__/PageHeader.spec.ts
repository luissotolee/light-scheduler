import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from '@/components/PageHeader.vue'

describe('PageHeader', () => {
  it('renders a title and description', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Scheduler', description: 'Plan the week' },
    })

    expect(wrapper.find('h1').text()).toBe('Scheduler')
    expect(wrapper.text()).toContain('Plan the week')
  })

  it('omits the description when not provided', () => {
    const wrapper = mount(PageHeader, { props: { title: 'Scheduler' } })

    expect(wrapper.find('.page-header__description').exists()).toBe(false)
  })

  it('renders the actions slot', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Scheduler' },
      slots: { actions: '<button type="button">Add shift</button>' },
    })

    expect(wrapper.find('.page-header__actions button').text()).toBe('Add shift')
  })
})
