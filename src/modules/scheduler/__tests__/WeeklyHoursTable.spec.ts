import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Tooltip from 'primevue/tooltip'
import WeeklyHoursTable from '@/modules/scheduler/components/WeeklyHoursTable.vue'
import type { WeeklyHoursGroup } from '@/modules/scheduler/utils/hours'

const groups: WeeklyHoursGroup[] = [
  {
    duty: 'manager',
    label: 'Managers',
    rows: [
      {
        memberId: 'ada',
        name: 'Ada Lovelace',
        initials: 'AL',
        currentHours: 42.5,
        contractHours: 40,
        diffHours: 2.5,
      },
    ],
  },
  {
    duty: 'employee',
    label: 'Employees',
    rows: [
      {
        memberId: 'bo',
        name: 'Bo Chen',
        initials: 'BC',
        currentHours: 40,
        contractHours: 40,
        diffHours: 0,
      },
      {
        memberId: 'cy',
        name: 'Cy Diaz',
        initials: 'CD',
        currentHours: 30,
        contractHours: 40,
        diffHours: -10,
      },
    ],
  },
]

function mountTable(tableGroups: WeeklyHoursGroup[] = groups) {
  return mount(WeeklyHoursTable, {
    props: { groups: tableGroups },
    global: { directives: { tooltip: Tooltip } },
  })
}

describe('WeeklyHoursTable', () => {
  it('renders the heading and a visually hidden caption', () => {
    const wrapper = mountTable()

    expect(wrapper.find('h2').text()).toBe('Weekly hours')
    expect(wrapper.find('caption').text()).toBe('Weekly scheduled and contract hours per employee')
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
    const manyRows = Array.from({ length: 12 }, (_, index) => ({
      memberId: `employee-${index}`,
      name: `Employee ${index}`,
      initials: `E${index}`,
      currentHours: 40,
      contractHours: 40,
      diffHours: 0,
    }))
    const wrapper = mountTable([
      { duty: 'employee', label: 'Employees', rows: manyRows },
    ])

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
    expect(wrapper.text()).toContain('No active employees.')
  })

  it('updates when the groups prop changes', async () => {
    const wrapper = mountTable()

    await wrapper.setProps({
      groups: [
        {
          duty: 'manager',
          label: 'Managers',
          rows: [
            {
              memberId: 'ada',
              name: 'Ada Lovelace',
              initials: 'AL',
              currentHours: 50,
              contractHours: 40,
              diffHours: 10,
            },
          ],
        },
      ],
    })

    expect(wrapper.find('[data-test="weekly-hours-row-ada-current"]').text()).toBe('50.0')
    expect(wrapper.find('[data-test="weekly-hours-row-ada-diff"]').text()).toBe('+10.0')
    expect(wrapper.find('[data-test="weekly-hours-row-bo"]').exists()).toBe(false)
  })
})
