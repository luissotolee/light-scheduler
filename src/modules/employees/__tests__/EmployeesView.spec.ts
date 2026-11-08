import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import ConfirmActionDialog from '@/modules/employees/components/ConfirmActionDialog.vue'
import EmployeeDetailsDialog from '@/modules/employees/components/EmployeeDetailsDialog.vue'
import EmployeeFormDialog from '@/modules/employees/components/EmployeeFormDialog.vue'
import HolidayWeeksDialog from '@/modules/employees/components/HolidayWeeksDialog.vue'
import EmployeesView from '@/modules/employees/views/EmployeesView.vue'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { todayIsoDate } from '@/shared/utils/calendar'
import type { TeamMember } from '@/types'

const ada: TeamMember = {
  id: 'member-1',
  name: 'Ada',
  duty: 'manager',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [],
  email: 'ada@example.com',
  phone: '+1 555 010 0000',
  active: true,
  startDate: '2025-01-15',
}
const bo: TeamMember = {
  id: 'member-2',
  name: 'Bo',
  duty: 'employee',
  contract: 'part_time',
  weeklyHours: 20,
  holidays: [],
  active: true,
  startDate: '2026-02-01',
}

describe('EmployeesView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mountView() {
    return mount(EmployeesView, {
      global: {
        plugins: [pinia, PrimeVue],
        stubs: { teleport: true },
        directives: { tooltip: Tooltip },
      },
    })
  }

  it('shows an empty state, a live count, and an enabled add button', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain('No employees yet')
    expect(wrapper.text()).toContain('Employees: 0')
    expect(wrapper.find('[data-test="add-employee"]').attributes('disabled')).toBeUndefined()
  })

  it('renders employees and filters them through the store', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Employees: 2')
    expect(wrapper.findAll('.employee-table__name')).toHaveLength(2)
    expect(wrapper.text()).toContain('Manager')
    expect(wrapper.text()).toContain('Full-time')

    const input = wrapper.find('input[type="search"]')
    expect(input.attributes('placeholder')).toBe('Search by name')

    await input.setValue('ADA')
    expect(wrapper.findAll('.employee-table__name')).toHaveLength(1)
    expect(wrapper.text()).toContain('Ada')

    await input.setValue('ada@example.com')
    expect(wrapper.findAll('.employee-table__name')).toHaveLength(0)
    expect(wrapper.text()).toContain('No matching employees')
    expect(wrapper.text()).toContain('Try a different name.')

    await input.setValue('zzz')
    expect(wrapper.text()).toContain('No matching employees')
  })

  it('adds an employee through the form dialog', async () => {
    const workspace = useWorkspaceStore()
    const wrapper = mountView()

    await wrapper.find('[data-test="add-employee"]').trigger('click')
    const dialog = wrapper.findComponent(EmployeeFormDialog)
    expect(dialog.props('visible')).toBe(true)

    dialog.vm.$emit('submit', {
      name: 'Ada',
      duty: 'manager',
      contract: 'fulltime',
      weeklyHours: 40,
      phone: '+1 555 010 0000',
    })
    await nextTick()

    expect(workspace.members).toHaveLength(1)
    expect(workspace.members[0]).toMatchObject({
      name: 'Ada',
      weeklyHours: 40,
      phone: '+1 555 010 0000',
    })
    expect(dialog.props('visible')).toBe(false)
  })

  it('edits an employee through the form dialog', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const wrapper = mountView()

    await wrapper.find('[aria-label="Edit Ada"]').trigger('click')
    const dialog = wrapper.findComponent(EmployeeFormDialog)
    expect(dialog.props('member')).toMatchObject({ id: ada.id, name: 'Ada' })

    dialog.vm.$emit('submit', {
      name: 'Ada Lovelace',
      duty: 'head_manager',
      contract: 'weekends',
      weeklyHours: 32,
      phone: '+1 555 010 0001',
    })
    await nextTick()

    expect(workspace.members[0]).toMatchObject({
      id: ada.id,
      name: 'Ada Lovelace',
      duty: 'head_manager',
      contract: 'weekends',
      weeklyHours: 32,
      holidays: ada.holidays,
      phone: '+1 555 010 0001',
    })
    expect(dialog.props('visible')).toBe(false)
  })

  it('saves holiday weeks through the holiday dialog', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const wrapper = mountView()

    await wrapper.find('[aria-label="Holidays for Ada"]').trigger('click')
    const dialog = wrapper.findComponent(HolidayWeeksDialog)
    expect(dialog.props('visible')).toBe(true)
    expect(dialog.props('memberName')).toBe('Ada')

    dialog.vm.$emit('save', [
      { year: 2026, week: 12 },
      { year: 2026, week: 10 },
    ])
    await nextTick()

    expect(workspace.members[0].holidays).toEqual([
      { year: 2026, week: 10 },
      { year: 2026, week: 12 },
    ])
  })

  it('removes an employee only after confirming', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const wrapper = mountView()

    await wrapper.find('[aria-label="Remove Bo"]').trigger('click')
    const dialog = wrapper.findComponent(ConfirmActionDialog)
    expect(dialog.props('visible')).toBe(true)
    expect(dialog.props('header')).toBe('Remove employee')
    expect(dialog.props('message')).toContain('Remove Bo?')
    expect(workspace.members).toEqual([ada, bo])

    dialog.vm.$emit('confirm')
    await nextTick()

    expect(workspace.members).toEqual([ada])
    expect(dialog.props('visible')).toBe(false)
  })

  it('deactivates an employee only after confirming', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const wrapper = mountView()

    await wrapper.find('[aria-label="Deactivate Ada"]').trigger('click')
    const dialog = wrapper.findComponent(ConfirmActionDialog)
    expect(dialog.props('visible')).toBe(true)
    expect(dialog.props('header')).toBe('Deactivate employee')
    expect(dialog.props('message')).toContain('Deactivate Ada?')
    expect(workspace.members[0].active).toBe(true)

    dialog.vm.$emit('confirm')
    await nextTick()

    expect(workspace.members[0]).toMatchObject({ active: false, endDate: todayIsoDate() })
    expect(dialog.props('visible')).toBe(false)
  })

  it('reactivates an inactive employee directly', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([{ ...bo, active: false, endDate: '2026-11-01' }])
    const wrapper = mountView()

    await wrapper.find('[aria-label="Reactivate Bo"]').trigger('click')

    expect(workspace.members[0]).toMatchObject({ active: true })
    expect(workspace.members[0].endDate).toBeUndefined()
  })

  it('opens the employee details dialog from the name', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const wrapper = mountView()

    await wrapper.find('[aria-label="View details for Ada"]').trigger('click')
    const dialog = wrapper.findComponent(EmployeeDetailsDialog)
    expect(dialog.props('visible')).toBe(true)
    expect(dialog.props('member')).toMatchObject({ id: ada.id, name: 'Ada' })

    dialog.vm.$emit('update:visible', false)
    await nextTick()

    expect(dialog.props('visible')).toBe(false)
  })
})
