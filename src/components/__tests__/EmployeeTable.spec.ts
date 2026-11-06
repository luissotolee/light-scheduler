import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Tooltip from 'primevue/tooltip'
import EmployeeTable from '@/components/EmployeeTable.vue'
import type { TeamMember } from '@/types'

const members: TeamMember[] = [
  {
    id: 'member-1',
    name: 'Ada',
    duty: 'head_manager',
    contract: 'part_time',
    weeklyHours: 32,
    holidays: [],
    email: 'ada@example.com',
    phone: '+1 555 010 0000',
  },
  {
    id: 'member-2',
    name: 'Bo',
    duty: 'assistant',
    contract: 'weekends',
    weeklyHours: 16,
    holidays: [{ year: 2026, week: 10 }],
  },
]

describe('EmployeeTable', () => {
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

  function mountTable() {
    return mount(EmployeeTable, {
      props: { members },
      global: { stubs: { teleport: true }, directives: { tooltip: Tooltip } },
    })
  }

  it('renders member fields with duty and contract labels', () => {
    const wrapper = mountTable()

    expect(wrapper.text()).toContain('Ada')
    expect(wrapper.text()).toContain('Head manager')
    expect(wrapper.text()).toContain('Part-time')
    expect(wrapper.text()).toContain('32')
    expect(wrapper.text()).toContain('Bo')
    expect(wrapper.text()).toContain('Assistant')
    expect(wrapper.text()).toContain('Weekends')
  })

  it('adds duty and contract modifier classes to chips', () => {
    const wrapper = mountTable()

    expect(wrapper.find('.employee-table__chip--head-manager').exists()).toBe(true)
    expect(wrapper.find('.employee-table__chip--part-time').exists()).toBe(true)
    expect(wrapper.find('.employee-table__chip--assistant').exists()).toBe(true)
    expect(wrapper.find('.employee-table__chip--weekends').exists()).toBe(true)
  })

  it('renders contact icons only for phone and email values that exist', () => {
    const wrapper = mountTable()

    expect(wrapper.findAll('.employee-table__contact-icon')).toHaveLength(2)
    expect(wrapper.find('[aria-label="Phone: +1 555 010 0000"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Email: ada@example.com"]').exists()).toBe(true)

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].find('.pi-phone').exists()).toBe(true)
    expect(rows[0].find('.pi-envelope').exists()).toBe(true)
    expect(rows[1].find('.employee-table__contact-icon').exists()).toBe(false)
  })

  it('uses icons for the table actions', () => {
    const wrapper = mountTable()

    expect(wrapper.find('[data-test="edit-member-1"] .pi-pencil').exists()).toBe(true)
    expect(wrapper.find('[data-test="holidays-member-1"] .pi-calendar').exists()).toBe(true)
    expect(wrapper.find('[data-test="remove-member-1"] .pi-trash').exists()).toBe(true)
  })

  it('emits edit, holidays, and remove events with the member id', async () => {
    const wrapper = mountTable()

    await wrapper.find('[data-test="edit-member-1"]').trigger('click')
    await wrapper.find('[data-test="holidays-member-1"]').trigger('click')
    await wrapper.find('[data-test="remove-member-2"]').trigger('click')

    expect(wrapper.emitted('edit')).toEqual([['member-1']])
    expect(wrapper.emitted('holidays')).toEqual([['member-1']])
    expect(wrapper.emitted('remove')).toEqual([['member-2']])
  })

  it('labels action buttons for assistive technology', () => {
    const wrapper = mountTable()

    expect(wrapper.find('[aria-label="Edit Ada"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Holidays for Ada"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Remove Ada"]').exists()).toBe(true)
  })
})
