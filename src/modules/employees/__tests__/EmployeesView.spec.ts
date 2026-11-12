import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import type { Directive } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import EmployeesView from '@/modules/employees/views/EmployeesView.vue'
import { useEmployeesStore } from '@/modules/employees/stores/employees'
import { useLocaleStore } from '@/shared/stores/locale'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'
import type { TeamMember } from '@/types'

const ada: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
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
  empId: 'EMP-0002',
  name: 'Bo',
  duty: 'employee',
  contract: 'part_time',
  weeklyHours: 20,
  holidays: [],
  active: false,
  startDate: '2026-02-01',
  endDate: '2026-11-01',
}

describe('EmployeesView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
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

  function mountPhoneView() {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    return mountView()
  }

  it('renders an unchecked, accessible hide-deactivated switch by default', () => {
    const wrapper = mountView()
    const toggle = wrapper.find('[data-test="hide-inactive"]')
    const input = toggle.find('input[role="switch"]')

    expect(toggle.text()).toContain(en['employees.hideInactive'])
    expect(input.exists()).toBe(true)
    expect(input.attributes('id')).toBe('employee-hide-inactive')
    expect(toggle.attributes('for')).toBe('employee-hide-inactive')
    expect(input.attributes('aria-checked')).toBe('false')
  })

  it('explains the active-only toggle through the tooltip directive', () => {
    const tooltipBindings: Array<{ el: HTMLElement; value: string }> = []
    const recordingTooltip: Directive<HTMLElement, string> = {
      mounted(el, binding) {
        tooltipBindings.push({ el, value: binding.value })
      },
    }

    const wrapper = mount(EmployeesView, {
      global: {
        plugins: [pinia, PrimeVue],
        stubs: { teleport: true },
        directives: { tooltip: recordingTooltip },
      },
    })

    const toggle = wrapper.find('[data-test="hide-inactive"]')

    expect(toggle.attributes('title')).toBeUndefined()
    const toggleBinding = tooltipBindings.find((binding) => binding.el === toggle.element)
    expect(toggleBinding?.value).toBe(en['employees.hideInactive.tooltip'])
  })

  it('shows active and deactivated employees until the switch is turned on', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const wrapper = mountView()

    expect(wrapper.findAll('.employee-table__name')).toHaveLength(2)

    await wrapper.find('input[role="switch"]').setValue(true)
    await nextTick()

    expect(wrapper.findAll('.employee-table__name')).toHaveLength(1)
    expect(wrapper.text()).toContain('Ada')
    expect(wrapper.text()).not.toContain('Bo')
    expect(wrapper.text()).toContain(en['employees.count'].replace('{active}', '1').replace('{total}', '2'))
  })

  it('toggles the active-only filter from the demo label target', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const store = useEmployeesStore()
    const wrapper = mount(EmployeesView, {
      attachTo: document.body,
      global: {
        plugins: [pinia, PrimeVue],
        stubs: { teleport: true },
        directives: { tooltip: Tooltip },
      },
    })

    const toggle = wrapper.find('[data-test="hide-inactive"]')
    ;(toggle.element as HTMLElement).click()
    await nextTick()

    expect(store.hideInactive).toBe(true)
    expect(wrapper.findAll('.employee-table__name')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Bo')
    wrapper.unmount()
  })

  it('restores deactivated employees when the switch is turned off', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const wrapper = mountView()
    const input = wrapper.find('input[role="switch"]')

    await input.setValue(true)
    await nextTick()
    expect(wrapper.findAll('.employee-table__name')).toHaveLength(1)

    await input.setValue(false)
    await nextTick()
    expect(wrapper.findAll('.employee-table__name')).toHaveLength(2)
  })

  it('shows the all-inactive empty state when every employee is deactivated', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([{ ...ada, active: false, endDate: '2026-11-01' }])
    const wrapper = mountView()

    await wrapper.find('input[role="switch"]').setValue(true)
    await nextTick()

    expect(wrapper.text()).toContain(en['employees.allInactiveTitle'])
    expect(wrapper.text()).toContain(en['employees.allInactiveDescription'])
  })

  it('keeps the no-match empty state when a search matches only hidden employees', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const wrapper = mountView()

    await wrapper.find('input[type="search"]').setValue('Bo')
    await wrapper.find('input[role="switch"]').setValue(true)
    await nextTick()

    expect(wrapper.text()).toContain(en['employees.noMatchTitle'])
    expect(wrapper.text()).not.toContain(en['employees.allInactiveTitle'])
  })

  it('does not clear the search when the switch is toggled', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const store = useEmployeesStore()
    const wrapper = mountView()

    await wrapper.find('input[type="search"]').setValue('Ada')
    await wrapper.find('input[role="switch"]').setValue(true)
    await nextTick()

    expect(wrapper.find('input[type="search"]').element).toHaveProperty('value', 'Ada')
    expect(store.search).toBe('Ada')
  })

  it('renders the switch label and all-inactive message in Spanish', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([{ ...ada, active: false, endDate: '2026-11-01' }])
    const wrapper = mountView()
    const localeStore = useLocaleStore()

    await wrapper.find('input[role="switch"]').setValue(true)
    localeStore.setLocale('es')
    await nextTick()

    expect(wrapper.find('[data-test="hide-inactive"]').text()).toContain(
      es['employees.hideInactive'],
    )
    expect(wrapper.text()).toContain(es['employees.allInactiveTitle'])
    expect(wrapper.text()).toContain(es['employees.allInactiveDescription'])
  })

  it('resets the hide-deactivated switch when the view unmounts', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const store = useEmployeesStore()
    const wrapper = mountView()

    await wrapper.find('input[role="switch"]').setValue(true)
    expect(store.hideInactive).toBe(true)

    wrapper.unmount()

    expect(store.hideInactive).toBe(false)
  })

  it('opens employee details on desktop when a name is clicked', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const store = useEmployeesStore()
    const wrapper = mountView()

    await wrapper.find('[data-test="details-member-1"]').trigger('click')

    expect(store.detailsVisible).toBe(true)
    expect(store.manageVisible).toBe(false)
  })

  it('opens the manage dialog from the simplified phone table', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const store = useEmployeesStore()
    const wrapper = mountPhoneView()

    expect(wrapper.findAll('.employee-table__contact-icon')).toHaveLength(0)
    expect(wrapper.find('[data-test="edit-member-1"]').exists()).toBe(false)

    await wrapper.find('[data-test="details-member-1"]').trigger('click')
    await nextTick()

    expect(store.manageVisible).toBe(true)
    expect(store.manageTargetId).toBe(ada.id)
    expect(store.detailsVisible).toBe(false)
    expect(wrapper.find('[data-test="employee-manage"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="edit-member-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="remove-member-1"]').exists()).toBe(true)
  })

  it('keeps the manage dialog open when editing or managing holidays', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const store = useEmployeesStore()
    const wrapper = mountPhoneView()

    await wrapper.find('[data-test="details-member-1"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-test="edit-member-1"]').trigger('click')

    expect(store.formVisible).toBe(true)
    expect(store.manageVisible).toBe(true)

    store.closeForm()
    await nextTick()
    await wrapper.find('[data-test="holidays-member-1"]').trigger('click')

    expect(store.holidayVisible).toBe(true)
    expect(store.manageVisible).toBe(true)
  })

  it('closes the manage dialog before confirming deactivation or removal', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const store = useEmployeesStore()
    const wrapper = mountPhoneView()

    await wrapper.find('[data-test="details-member-1"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-test="deactivate-member-1"]').trigger('click')

    expect(store.manageVisible).toBe(false)
    expect(store.confirmVisible).toBe(true)
    expect(store.pendingAction?.kind).toBe('deactivate')

    store.cancelAction()
    await nextTick()
    await wrapper.find('[data-test="details-member-1"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-test="remove-member-1"]').trigger('click')

    expect(store.manageVisible).toBe(false)
    expect(store.confirmVisible).toBe(true)
    expect(store.pendingAction?.kind).toBe('remove')
  })

  it('reactivates a member without closing the manage dialog', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([bo])
    const store = useEmployeesStore()
    const wrapper = mountPhoneView()

    await wrapper.find('[data-test="details-member-2"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-test="reactivate-member-2"]').trigger('click')

    expect(workspace.findMember(bo.id)?.active).toBe(true)
    expect(store.manageVisible).toBe(true)
    expect(store.manageTargetId).toBe(bo.id)
  })
})
