import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SummaryTable from '@/modules/summary/components/SummaryTable.vue'
import type { SummaryDayHeader, SummaryRow } from '@/modules/summary/types'
import { WEEKDAY_ORDER, weekdayDayOfMonth } from '@/shared/utils/calendar'

const days: SummaryDayHeader[] = WEEKDAY_ORDER.map((weekday) => ({
  weekday,
  dayOfMonth: weekdayDayOfMonth('2026-11-02', weekday),
}))

function row(overrides: Partial<SummaryRow> = {}): SummaryRow {
  return {
    memberId: 'member-1',
    name: 'Ada',
    isVacation: false,
    cells: {
      monday: {
        kind: 'shifts',
        shifts: [
          { id: 's1', startMinute: 540, endMinute: 720, label: '09:00–12:00' },
          { id: 's2', startMinute: 840, endMinute: 1080, label: '14:00–18:00' },
        ],
      },
      tuesday: { kind: 'off' },
      wednesday: { kind: 'off' },
      thursday: { kind: 'off' },
      friday: { kind: 'off' },
      saturday: { kind: 'off' },
      sunday: { kind: 'off' },
    },
    ...overrides,
  }
}

describe('SummaryTable', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountTable(rows: SummaryRow[]) {
    return mount(SummaryTable, {
      props: { rows, days, weekRangeLabel: 'Nov 2 – Nov 8, 2026' },
      global: { plugins: [pinia] },
    })
  }

  it('renders the employee and weekday headers', () => {
    const wrapper = mountTable([row()])
    const headers = wrapper.findAll('thead th').map((header) => header.text())

    expect(headers[0]).toContain('Employee')
    expect(headers.slice(1).map((text) => text.replace(/\d+(st|nd|rd|th)/, '').trim())).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ])
  })

  it('emits the member id when the employee name is clicked', async () => {
    const wrapper = mountTable([row()])
    const button = wrapper.get('[data-test="summary-details-member-1"]')

    expect(button.text()).toBe('Ada')
    expect(button.attributes('aria-label')).toBe('View details for Ada')

    await button.trigger('click')

    expect(wrapper.emitted('details')).toEqual([['member-1']])
  })

  it('renders two shifts inside the same weekday cell', () => {
    const wrapper = mountTable([row()])
    const cell = wrapper.get('[data-test="summary-cell-member-1-monday"]')

    expect(cell.findAll('.summary-cell__shift').map((item) => item.text())).toEqual([
      '09:00–12:00',
      '14:00–18:00',
    ])
  })

  it('renders OFF for empty weekdays', () => {
    const wrapper = mountTable([row()])

    expect(wrapper.get('[data-test="summary-cell-member-1-tuesday"]').text()).toBe('OFF')
  })

  it('renders a vacation row spanning every weekday', () => {
    const wrapper = mountTable([
      row({
        isVacation: true,
        cells: Object.fromEntries(
          WEEKDAY_ORDER.map((weekday) => [weekday, { kind: 'vacations' }]),
        ) as SummaryRow['cells'],
      }),
    ])

    const celebration = wrapper.get('[data-test="summary-vacation"]')
    expect(celebration.text()).toBe('VACATIONS')
    expect(celebration.attributes('colspan')).toBe(String(days.length))
    expect(wrapper.get('[data-test="summary-row-member-1"]').classes()).toContain(
      'summary-table__row--vacation',
    )
  })

  it('uses row and column header scopes', () => {
    const wrapper = mountTable([row()])

    expect(wrapper.findAll('thead th[scope="col"]')).toHaveLength(8)
    expect(wrapper.findAll('tbody th[scope="row"]')).toHaveLength(1)
  })
})
