import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import EmployeeFormDialog from '@/components/EmployeeFormDialog.vue'
import HolidayWeeksDialog from '@/components/HolidayWeeksDialog.vue'
import EmployeesView from '@/views/EmployeesView.vue'
import { useWorkspaceStore } from '@/stores/workspace'
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
}
const bo: TeamMember = {
  id: 'member-2',
  name: 'Bo',
  duty: 'employee',
  contract: 'part_time',
  weeklyHours: 20,
  holidays: [],
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
    await input.setValue('ADA')
    expect(wrapper.findAll('.employee-table__name')).toHaveLength(1)
    expect(wrapper.text()).toContain('Ada')

    await input.setValue('ada@example.com')
    expect(wrapper.findAll('.employee-table__name')).toHaveLength(1)

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

  it('removes an employee from the table', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const wrapper = mountView()

    await wrapper.find('[aria-label="Remove Bo"]').trigger('click')

    expect(workspace.members).toEqual([ada])
  })
})
