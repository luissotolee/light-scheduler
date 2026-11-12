import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Tooltip from 'primevue/tooltip'
import PageHeader from '@/shared/components/PageHeader.vue'

describe('PageHeader', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mountHeader(
    props: { title: string; description?: string; descriptionTooltip?: boolean },
    slotContent?: string,
  ) {
    return mount(PageHeader, {
      props,
      slots: slotContent ? { actions: slotContent } : undefined,
      global: { directives: { tooltip: Tooltip } },
    })
  }

  it('renders a title and description', () => {
    const wrapper = mountHeader({ title: 'Scheduler', description: 'Plan the week' })

    expect(wrapper.find('h1').text()).toBe('Scheduler')
    expect(wrapper.text()).toContain('Plan the week')
  })

  it('omits the description when not provided', () => {
    const wrapper = mountHeader({ title: 'Scheduler' })

    expect(wrapper.find('.page-header__description').exists()).toBe(false)
  })

  it('renders the actions slot', () => {
    const wrapper = mountHeader({ title: 'Scheduler' }, '<button type="button">Add shift</button>')

    expect(wrapper.find('.page-header__actions button').text()).toBe('Add shift')
  })

  it('renders the description as an info tooltip without a paragraph', () => {
    const wrapper = mountHeader({
      title: 'Scheduler',
      description: 'Plan the week',
      descriptionTooltip: true,
    })

    expect(wrapper.find('.page-header__description').exists()).toBe(false)
    const info = wrapper.find('[data-test="page-header-info"]')
    expect(info.exists()).toBe(true)
    expect(info.attributes('aria-label')).toBe('Plan the week')
    expect(info.find('.pi.pi-info-circle').exists()).toBe(true)
  })

  it('shows the description inline instead of a tooltip icon on phones', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const wrapper = mountHeader({
      title: 'Scheduler',
      description: 'Plan the week',
      descriptionTooltip: true,
    })

    expect(wrapper.find('[data-test="page-header-info"]').exists()).toBe(false)
    expect(wrapper.find('.page-header__description').text()).toBe('Plan the week')
  })
})
