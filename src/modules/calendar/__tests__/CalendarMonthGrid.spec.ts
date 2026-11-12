import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CalendarMonthGrid from '@/modules/calendar/components/CalendarMonthGrid.vue'
import type { CalendarEntry } from '@/types'

const entries: CalendarEntry[] = [
  {
    id: 'holiday-1',
    date: '2026-11-03',
    name: 'Bank holiday',
    kind: 'public_holiday',
  },
  {
    id: 'event-1',
    date: '2026-11-03',
    name: 'Team day',
    kind: 'custom_event',
  },
  {
    id: 'event-2',
    date: '2026-11-05',
    name: 'Meeting',
    kind: 'custom_event',
  },
]

function mountGrid(props: { month: string; entries: CalendarEntry[]; selectedDate?: string }) {
  return mount(CalendarMonthGrid, {
    props,
    global: { plugins: [createPinia()] },
  })
}

describe('CalendarMonthGrid', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders a six-week Monday-first grid', () => {
    const wrapper = mountGrid({ month: '2026-11-01', entries: [] })

    expect(wrapper.findAll('.calendar-grid__weekday')).toHaveLength(7)
    expect(wrapper.findAll('[data-test^="calendar-day-"]')).toHaveLength(42)
    expect(wrapper.find('[data-test="calendar-day-2026-11-03"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="calendar-day-2026-10-26"]').classes()).toContain(
      'calendar-grid__day--outside',
    )
  })

  it('shows entry markers and includes names in the accessible label', () => {
    const wrapper = mountGrid({ month: '2026-11-01', entries })

    const day = wrapper.find('[data-test="calendar-day-2026-11-03"]')
    expect(day.findAll('.calendar-grid__marker')).toHaveLength(2)
    expect(day.find('.calendar-grid__marker--public_holiday').exists()).toBe(true)
    expect(day.find('.calendar-grid__marker--custom_event').exists()).toBe(true)
    expect(day.attributes('aria-label')).toContain('Bank holiday')
    expect(day.attributes('aria-label')).toContain('Team day')
  })

  it('marks the selected day and emits the selected date', async () => {
    const wrapper = mountGrid({ month: '2026-11-01', entries, selectedDate: '2026-11-03' })

    const day = wrapper.find('[data-test="calendar-day-2026-11-03"]')
    expect(day.attributes('aria-pressed')).toBe('true')
    expect(day.classes()).toContain('calendar-grid__day--selected')

    await wrapper.find('[data-test="calendar-day-2026-11-05"]').trigger('click')

    expect(wrapper.emitted('select')).toEqual([['2026-11-05']])
  })

  it('emits the double-clicked date to open the add form', async () => {
    const wrapper = mountGrid({ month: '2026-11-01', entries })

    await wrapper.find('[data-test="calendar-day-2026-11-05"]').trigger('dblclick')

    expect(wrapper.emitted('add')).toEqual([['2026-11-05']])
  })
})
