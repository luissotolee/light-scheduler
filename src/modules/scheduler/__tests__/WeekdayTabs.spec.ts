import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeekdayTabs from '@/modules/scheduler/components/WeekdayTabs.vue'
import type { CalendarEntry, Weekday } from '@/types'

const weekdays: {
  value: Weekday
  label: string
  dayOfMonth: number
  entries: CalendarEntry[]
}[] = [
  { value: 'monday', label: 'Monday', dayOfMonth: 2, entries: [] },
  { value: 'tuesday', label: 'Tuesday', dayOfMonth: 3, entries: [] },
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

  it('shows a marker before the weekday label when the day has calendar entries', () => {
    const withEntries = [
      {
        ...weekdays[0],
        entries: [
          {
            id: 'holiday-1',
            date: '2026-11-02',
            name: 'Bank holiday',
            kind: 'public_holiday' as const,
          },
        ],
      },
      {
        ...weekdays[1],
        entries: [
          {
            id: 'event-1',
            date: '2026-11-03',
            name: 'Team day',
            kind: 'custom_event' as const,
          },
        ],
      },
    ]
    const wrapper = mount(WeekdayTabs, { props: { modelValue: 'monday', weekdays: withEntries } })

    const mondayMarker = wrapper.find('[data-test="weekday-calendar-marker-monday"]')
    const tuesdayMarker = wrapper.find('[data-test="weekday-calendar-marker-tuesday"]')

    expect(wrapper.find('[data-test="weekday-tab-monday"]').element.firstElementChild).toBe(
      mondayMarker.element,
    )
    expect(wrapper.find('[data-test="weekday-tab-tuesday"]').element.firstElementChild).toBe(
      tuesdayMarker.element,
    )
    expect(mondayMarker.exists()).toBe(true)
    expect(mondayMarker.find('.pi-star-fill').exists()).toBe(true)
    expect(mondayMarker.attributes('title')).toBe('Public holiday: Bank holiday')
    expect(wrapper.find('[data-test="weekday-tab-monday"]').text()).toContain(
      'Calendar entries: Public holiday: Bank holiday',
    )

    expect(tuesdayMarker.exists()).toBe(true)
    expect(tuesdayMarker.find('.pi-calendar').exists()).toBe(true)
    expect(tuesdayMarker.attributes('title')).toBe('Custom event: Team day')
  })

  it('omits the marker when a day has no calendar entries', () => {
    const wrapper = mount(WeekdayTabs, { props: { modelValue: 'monday', weekdays } })

    expect(wrapper.find('[data-test="weekday-calendar-marker-monday"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="weekday-calendar-marker-tuesday"]').exists()).toBe(false)
  })
})
