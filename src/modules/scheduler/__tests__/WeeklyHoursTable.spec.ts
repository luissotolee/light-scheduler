import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Tooltip from 'primevue/tooltip'
import WeeklyHoursTable from '@/modules/scheduler/components/WeeklyHoursTable.vue'
import type { WeeklyHoursGroup, WeeklyHoursRow } from '@/modules/scheduler/utils/hours'

function makeRow(overrides: Partial<WeeklyHoursRow> = {}): WeeklyHoursRow {
  return {
    memberId: 'row',
    name: 'Row',
    initials: 'R',
    currentHours: 0,
    contractHours: 0,
    diffHours: 0,
    contractHoursAmount: 0,
    contractHoursPeriod: 'week',
    monthlyHours: null,
    ...overrides,
  }
}

const groups: WeeklyHoursGroup[] = [
  {
    duty: 'manager',
    rows: [
      makeRow({
        memberId: 'ada',
        name: 'Ada Lovelace',
        initials: 'AL',
        currentHours: 42.5,
        contractHours: 40,
        diffHours: 2.5,
      }),
    ],
  },
  {
    duty: 'employee',
    rows: [
      makeRow({
        memberId: 'bo',
        name: 'Bo Chen',
        initials: 'BC',
        currentHours: 40,
        contractHours: 40,
        diffHours: 0,
      }),
      makeRow({
        memberId: 'cy',
        name: 'Cy Diaz',
        initials: 'CD',
        currentHours: 30,
        contractHours: 40,
        diffHours: -10,
      }),
    ],
  },
]

const monthlyGroups: WeeklyHoursGroup[] = [
  {
    duty: 'manager',
    rows: [
      makeRow({
        memberId: 'bruno',
        name: 'Bruno García',
        initials: 'BG',
        currentHours: 35,
        contractHours: 36.9,
        diffHours: -1.9,
        contractHoursAmount: 160,
        contractHoursPeriod: 'month',
        monthlyHours: {
          currentHours: 140,
          contractHours: 160,
          diffHours: -20,
          hasHoliday: true,
        },
      }),
      makeRow({
        memberId: 'ada',
        name: 'Ada Lovelace',
        initials: 'AL',
        currentHours: 42.5,
        contractHours: 40,
        diffHours: 2.5,
        contractHoursAmount: 40,
        monthlyHours: {
          currentHours: 170,
          contractHours: 173.3,
          diffHours: -3.3,
          hasHoliday: false,
        },
      }),
    ],
  },
]

function mountTable(tableGroups: WeeklyHoursGroup[] = groups, monthLabel = 'November 2026') {
  return mount(WeeklyHoursTable, {
    props: { groups: tableGroups, monthLabel },
    global: { directives: { tooltip: Tooltip } },
  })
}

describe('WeeklyHoursTable', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renders the heading and a visually hidden caption', () => {
    const wrapper = mountTable()

    expect(wrapper.find('h2').text()).toBe('Weekly hours')
    expect(wrapper.find('caption').text()).toBe(
      'Scheduled and contract hours per employee, including monthly totals for monthly or yearly contracts',
    )
    expect(wrapper.find('caption').classes()).toContain('visually-hidden')
  })

  it('renders group labels in order', () => {
    const wrapper = mountTable()

    const groupHeaders = wrapper.findAll('.weekly-hours__group')
    expect(groupHeaders.map((group) => group.text())).toEqual(['Managers', 'Employees'])
    expect(groupHeaders[0].attributes('scope')).toBe('colgroup')
    expect(groupHeaders[0].attributes('colspan')).toBe('1')
    expect(groupHeaders[1].attributes('scope')).toBe('colgroup')
    expect(groupHeaders[1].attributes('colspan')).toBe('2')
    expect(wrapper.find('[data-test="weekly-hours-group-manager"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="weekly-hours-group-employee"]').exists()).toBe(true)
  })

  it('renders row initials with a full-name tooltip and title', () => {
    const wrapper = mountTable()

    const initials = wrapper.find('[data-test="weekly-hours-row-ada"]')
    expect(initials.text()).toBe('AL')
    expect(initials.attributes('title')).toBe('Ada Lovelace')
    expect(initials.attributes('scope')).toBe('col')
  })

  it('lays employees out as columns with three metric rows', () => {
    const wrapper = mountTable()

    expect(wrapper.findAll('.weekly-hours__name')).toHaveLength(3)
    expect(wrapper.findAll('thead tr')).toHaveLength(2)
    expect(wrapper.findAll('[data-test^="weekly-hours-metric-"]')).toHaveLength(3)

    for (const metric of wrapper.findAll('[data-test^="weekly-hours-metric-"]')) {
      expect(metric.findAll('td')).toHaveLength(3)
    }
  })

  it('supports more than ten employees as horizontally scrollable columns', () => {
    const manyRows = Array.from({ length: 12 }, (_, index) =>
      makeRow({
        memberId: `employee-${index}`,
        name: `Employee ${index}`,
        initials: `E${index}`,
        currentHours: 40,
        contractHours: 40,
        diffHours: 0,
      }),
    )
    const wrapper = mountTable([{ duty: 'employee', rows: manyRows }])

    expect(wrapper.find('.weekly-hours__scroll').exists()).toBe(true)
    expect(wrapper.findAll('.weekly-hours__name')).toHaveLength(12)
  })

  it('renders current, contract, and diff values', () => {
    const wrapper = mountTable()

    expect(wrapper.find('[data-test="weekly-hours-row-ada-current"]').text()).toBe('42.5')
    expect(wrapper.find('[data-test="weekly-hours-row-ada-contract"]').text()).toBe('40.0')
    expect(wrapper.find('[data-test="weekly-hours-row-ada-diff"]').text()).toBe('+2.5')
    expect(wrapper.find('[data-test="weekly-hours-row-cy-diff"]').text()).toBe('-10.0')
  })

  it('marks negative diffs with the danger class and zero diffs as muted', () => {
    const wrapper = mountTable()

    const positive = wrapper.find('[data-test="weekly-hours-row-ada-diff"]')
    expect(positive.classes()).not.toContain('weekly-hours__diff--negative')
    expect(positive.classes()).not.toContain('weekly-hours__diff--zero')

    const zero = wrapper.find('[data-test="weekly-hours-row-bo-diff"]')
    expect(zero.classes()).toContain('weekly-hours__diff--zero')
    expect(zero.text()).toBe('0.0')

    const negative = wrapper.find('[data-test="weekly-hours-row-cy-diff"]')
    expect(negative.classes()).toContain('weekly-hours__diff--negative')
  })

  it('shows an empty state when there are no groups', () => {
    const wrapper = mountTable([])

    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.text()).toContain('No employees are available this week.')
  })

  it('adds monthly rows and a month heading for monthly or yearly contracts', () => {
    const wrapper = mountTable(monthlyGroups)

    expect(wrapper.find('[data-test="weekly-hours-month-heading"]').text()).toBe('November 2026')
    expect(wrapper.find('[data-test="weekly-hours-metric-month-current"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="weekly-hours-metric-month-contract"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="weekly-hours-metric-month-diff"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="weekly-hours-row-bruno-month-current"]').text()).toContain(
      '140.0',
    )
    expect(wrapper.find('[data-test="weekly-hours-row-bruno-month-contract"]').text()).toBe(
      '160.0',
    )
    expect(wrapper.find('[data-test="weekly-hours-row-bruno-month-diff"]').text()).toBe('-20.0')
  })

  it('shows a holiday asterisk only for employees with a holiday in the month', () => {
    const wrapper = mountTable(monthlyGroups)

    expect(
      wrapper.find('[data-test="weekly-hours-row-bruno-month-holiday"]').exists(),
    ).toBe(true)
    expect(wrapper.find('[data-test="weekly-hours-row-ada-month-holiday"]').exists()).toBe(false)
  })

  it('explains the original contract amount on the weekly contract cell', () => {
    const wrapper = mountTable(monthlyGroups)

    expect(
      wrapper.find('[data-test="weekly-hours-row-bruno-contract"]').attributes('title'),
    ).toBe('160 h/month')
    expect(
      wrapper.find('[data-test="weekly-hours-row-ada-contract"]').attributes('title'),
    ).toBeUndefined()
  })

  it('updates when the groups prop changes', async () => {
    const wrapper = mountTable()

    await wrapper.setProps({
      groups: [
        {
          duty: 'manager',
          rows: [
            makeRow({
              memberId: 'ada',
              name: 'Ada Lovelace',
              initials: 'AL',
              currentHours: 50,
              contractHours: 40,
              diffHours: 10,
            }),
          ],
        },
      ],
    })

    expect(wrapper.find('[data-test="weekly-hours-row-ada-current"]').text()).toBe('50.0')
    expect(wrapper.find('[data-test="weekly-hours-row-ada-diff"]').text()).toBe('+10.0')
    expect(wrapper.find('[data-test="weekly-hours-row-bo"]').exists()).toBe(false)
  })
})
