import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DataTable from 'primevue/datatable'
import Tooltip from 'primevue/tooltip'
import EmployeeTable from '@/modules/employees/components/EmployeeTable.vue'
import type { TeamMember } from '@/types'

const members: TeamMember[] = [
  {
    id: 'member-1',
    empId: 'EMP-0001',
    name: 'Ada',
    duty: 'head_manager',
    contract: 'part_time',
    weeklyHours: 32,
    holidays: [],
    email: 'ada@example.com',
    phone: '+1 555 010 0000',
    active: true,
    startDate: '2025-01-15',
  },
  {
    id: 'member-2',
    empId: 'EMP-0002',
    name: 'Bo',
    duty: 'assistant',
    contract: 'weekends',
    weeklyHours: 16,
    holidays: [{ year: 2026, week: 10 }],
    active: false,
    startDate: '2020-01-01',
    endDate: '2026-11-08',
  },
]

describe('EmployeeTable', () => {
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

  it('uses a compact table density', () => {
    const wrapper = mountTable()

    expect(wrapper.findComponent(DataTable).props('size')).toBe('small')
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

  it('shows edit and holiday actions for active members', () => {
    const wrapper = mountTable()

    expect(wrapper.find('[data-test="edit-member-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="holidays-member-1"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Edit Ada"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Holidays for Ada"]').exists()).toBe(true)
  })

  it('hides edit and holiday actions for inactive members', () => {
    const wrapper = mountTable()

    expect(wrapper.find('[data-test="edit-member-2"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="holidays-member-2"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Edit Bo"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Holidays for Bo"]').exists()).toBe(false)
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
    expect(wrapper.find('[aria-label="Deactivate Ada"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Reactivate Bo"]').exists()).toBe(true)
  })

  it('marks inactive rows and names', () => {
    const wrapper = mountTable()

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].classes()).not.toContain('employee-table__row--inactive')
    expect(rows[1].classes()).toContain('employee-table__row--inactive')
    expect(wrapper.find('.employee-table__name--inactive').text()).toBe('Bo')
    expect(wrapper.find('[aria-label="View details for Bo (inactive)"]').exists()).toBe(true)
  })

  it('emits details when an employee name is clicked', async () => {
    const wrapper = mountTable()

    await wrapper.find('[data-test="details-member-2"]').trigger('click')

    expect(wrapper.emitted('details')).toEqual([['member-2']])
  })

  it('emits deactivate and reactivate events with the member id', async () => {
    const wrapper = mountTable()

    await wrapper.find('[data-test="deactivate-member-1"]').trigger('click')
    await wrapper.find('[data-test="reactivate-member-2"]').trigger('click')

    expect(wrapper.emitted('deactivate')).toEqual([['member-1']])
    expect(wrapper.emitted('reactivate')).toEqual([['member-2']])
  })

  it('uses user status icons for the deactivate and reactivate actions', () => {
    const wrapper = mountTable()

    expect(wrapper.find('[data-test="deactivate-member-1"] .pi-user-minus').exists()).toBe(true)
    expect(wrapper.find('[data-test="reactivate-member-2"] .pi-user-plus').exists()).toBe(true)
  })
})
