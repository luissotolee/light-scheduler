import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EmployeesView from '@/views/EmployeesView.vue'
import { useWorkspaceStore } from '@/stores/workspace'

describe('EmployeesView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountView() {
    return mount(EmployeesView, { global: { plugins: [pinia] } })
  }

  it('shows an empty state and a live count', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain('No employees yet')
    expect(wrapper.text()).toContain('Employees: 0')
    expect(wrapper.find('[data-test="add-employee"]').attributes('disabled')).toBeDefined()
  })

  it('renders employees and filters them through the store', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([
      { id: 'member-1', name: 'Ada', email: 'ada@example.com' },
      { id: 'member-2', name: 'Bo' },
    ])
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Employees: 2')
    expect(wrapper.findAll('.employees__member')).toHaveLength(2)

    const input = wrapper.find('input[type="search"]')
    await input.setValue('ADA')
    expect(wrapper.findAll('.employees__member')).toHaveLength(1)
    expect(wrapper.text()).toContain('Ada')

    await input.setValue('ada@example.com')
    expect(wrapper.findAll('.employees__member')).toHaveLength(1)
    expect(wrapper.text()).toContain('Ada')

    await input.setValue('zzz')
    expect(wrapper.text()).toContain('No matching employees')
  })
})
