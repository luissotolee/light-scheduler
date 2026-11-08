import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeekdayTabs from '@/modules/scheduler/components/WeekdayTabs.vue'
import type { Weekday } from '@/types'

const weekdays: { value: Weekday; label: string; dayOfMonth: number }[] = [
  { value: 'monday', label: 'Monday', dayOfMonth: 2 },
  { value: 'tuesday', label: 'Tuesday', dayOfMonth: 3 },
]

describe('WeekdayTabs', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a vertical tablist with the selected weekday', () => {
    const wrapper = mount(WeekdayTabs, { props: { modelValue: 'monday', weekdays } })

    const nav = wrapper.find('nav')
    expect(nav.attributes('role')).toBe('tablist')
    expect(nav.attributes('aria-orientation')).toBe('vertical')
    expect(nav.attributes('aria-label')).toBe('Weekdays')

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(tabs[0].text()).toBe('Monday 2nd')
    expect(tabs[1].text()).toBe('Tuesday 3rd')
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    expect(tabs[1].attributes('aria-selected')).toBe('false')
  })

  it('marks the selected tab as keyboard-focusable only', () => {
    const wrapper = mount(WeekdayTabs, { props: { modelValue: 'tuesday', weekdays } })

    expect(wrapper.find('[data-test="weekday-tab-monday"]').attributes('tabindex')).toBe('-1')
    expect(wrapper.find('[data-test="weekday-tab-tuesday"]').attributes('tabindex')).toBe('0')
  })

  it('emits update:modelValue when a tab is clicked', async () => {
    const wrapper = mount(WeekdayTabs, { props: { modelValue: 'monday', weekdays } })

    await wrapper.find('[data-test="weekday-tab-tuesday"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['tuesday']])
  })
})
