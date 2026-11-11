import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tooltip from 'primevue/tooltip'
import EmployeeTable from '@/modules/employees/components/EmployeeTable.vue'
import type { TeamMember } from '@/types'

const members: TeamMember[] = [  {
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

const sortingMembers: TeamMember[] = [
  {
    id: 'member-cara',
    empId: 'EMP-0003',
    name: 'Cara',
    duty: 'employee',
    contract: 'fulltime',
    weeklyHours: 40,
    holidays: [],
    active: true,
    startDate: '2025-01-01',
  },
  {
    id: 'member-abel',
    empId: 'EMP-0004',
    name: 'Abel',
    duty: 'manager',
    contract: 'part_time',
    weeklyHours: 20,
    holidays: [],
    active: true,
    startDate: '2025-01-01',
  },
  {
    id: 'member-bea',
    empId: 'EMP-0005',
    name: 'Bea',
    duty: 'assistant',
    contract: 'weekends',
    weeklyHours: 12,
    holidays: [],
    active: true,
    startDate: '2025-01-01',
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

  function mountSortingTable() {
    return mount(EmployeeTable, {
      props: { members: sortingMembers },
      global: { stubs: { teleport: true }, directives: { tooltip: Tooltip } },
    })
  }

  function renderedNames(wrapper: ReturnType<typeof mountSortingTable>): string[] {
    return wrapper.findAll('.employee-table__name').map((node) => node.text())
  }

  it('uses a compact table density', () => {
    const wrapper = mountTable()

    expect(wrapper.findComponent(DataTable).props('size')).toBe('small')
  })

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

  it('makes name, duty, and contract columns sortable with name as the default', () => {
    const wrapper = mountSortingTable()
    const table = wrapper.findComponent(DataTable)

    expect(table.props('sortField')).toBe('name')
    expect(table.props('sortOrder')).toBe(1)
    expect(table.props('removableSort')).toBe(false)

    const columns = wrapper.findAllComponents(Column)
    expect(columns[0].props()).toMatchObject({ field: 'name', sortable: true })
    expect(columns[1].props()).toMatchObject({ field: 'duty', sortable: true })
    expect(columns[1].props('sortField')).toBe('dutySortRank')
    expect(columns[2].props()).toMatchObject({ field: 'contract', sortable: true })
    expect(columns[2].props('sortField')).toBe('contractSortRank')
  })

  it('exposes stable sort header hooks for the guided demo', async () => {
    const wrapper = mountSortingTable()

    expect(wrapper.find('[data-test="sort-name"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="sort-duty"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="sort-contract"]').exists()).toBe(true)

    await wrapper.find('[data-test="sort-duty"]').trigger('click')
    await nextTick()
    expect(renderedNames(wrapper)).toEqual(['Bea', 'Abel', 'Cara'])
  })

  it('sorts by name ascending by default', () => {
    const wrapper = mountSortingTable()

    expect(renderedNames(wrapper)).toEqual(['Abel', 'Bea', 'Cara'])
  })

  it('toggles the name sort order when the name header is clicked', async () => {
    const wrapper = mountSortingTable()
    const nameHeader = wrapper.findAll('thead th')[0]

    await nameHeader.trigger('click')
    await nextTick()
    expect(renderedNames(wrapper)).toEqual(['Cara', 'Bea', 'Abel'])

    await nameHeader.trigger('click')
    await nextTick()
    expect(renderedNames(wrapper)).toEqual(['Abel', 'Bea', 'Cara'])
  })

  it('sorts by duty rank and reverses when the duty header is clicked again', async () => {
    const wrapper = mountSortingTable()
    const dutyHeader = wrapper.findAll('thead th')[1]

    await dutyHeader.trigger('click')
    await nextTick()
    expect(renderedNames(wrapper)).toEqual(['Bea', 'Abel', 'Cara'])

    await dutyHeader.trigger('click')
    await nextTick()
    expect(renderedNames(wrapper)).toEqual(['Cara', 'Abel', 'Bea'])
  })

  it('sorts by contract rank and reverses when the contract header is clicked again', async () => {
    const wrapper = mountSortingTable()
    const contractHeader = wrapper.findAll('thead th')[2]

    await contractHeader.trigger('click')
    await nextTick()
    expect(renderedNames(wrapper)).toEqual(['Cara', 'Abel', 'Bea'])

    await contractHeader.trigger('click')
    await nextTick()
    expect(renderedNames(wrapper)).toEqual(['Bea', 'Abel', 'Cara'])
  })

  it('keeps the active sort when the members prop is filtered', async () => {
    const wrapper = mountSortingTable()
    const dutyHeader = wrapper.findAll('thead th')[1]

    await dutyHeader.trigger('click')
    await nextTick()

    await wrapper.setProps({ members: [sortingMembers[0], sortingMembers[2]] })
    await nextTick()

    expect(renderedNames(wrapper)).toEqual(['Bea', 'Cara'])
  })
})
