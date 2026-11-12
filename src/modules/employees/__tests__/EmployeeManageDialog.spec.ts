import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import EmployeeManageDialog from '@/modules/employees/components/EmployeeManageDialog.vue'
import { en } from '@/shared/i18n/messages/en'
import type { TeamMember } from '@/types'

enableAutoUnmount(afterEach)

const ada: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
  name: 'Ada',
  duty: 'head_manager',
  contract: 'part_time',
  weeklyHours: 32,
  holidays: [{ year: 2026, week: 10 }],
  email: 'ada@example.com',
  phone: '+1 555 010 0000',
  comment: 'No morning shifts',
  active: true,
  startDate: '2025-01-15',
}

const bo: TeamMember = {
  id: 'member-2',
  empId: 'EMP-0002',
  name: 'Bo',
  duty: 'employee',
  contract: 'fulltime',
  weeklyHours: 20,
  holidays: [],
  active: false,
  startDate: '2025-01-15',
  endDate: '2026-11-08',
}

function dialogBody(): DOMWrapper<HTMLElement> {
  return new DOMWrapper(document.body)
}

describe('EmployeeManageDialog', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function mountDialog(member: TeamMember | null = ada) {
    const wrapper = mount(EmployeeManageDialog, {
      props: { visible: true, member },
      global: { plugins: [PrimeVue] },
    })
    await nextTick()
    return wrapper
  }

  it('renders the employee details and active management actions', async () => {
    await mountDialog()

    const body = dialogBody()
    expect(body.find('[data-test="employee-manage"]').exists()).toBe(true)
    expect(body.find('[data-test="details-duty"]').text()).toBe('Head manager')
    expect(body.find('[data-test="details-contract"]').text()).toBe('Part-time')
    expect(body.find('[data-test="edit-member-1"]').text()).toContain(en['common.edit'])
    expect(body.find('[data-test="holidays-member-1"]').text()).toContain(en['common.holidays'])
    expect(body.find('[data-test="deactivate-member-1"]').text()).toContain(
      en['common.deactivate'],
    )
    expect(body.find('[data-test="remove-member-1"]').text()).toContain(en['common.remove'])
    expect(body.find('[data-test="close-details"]').text()).toContain(en['common.close'])
    expect(body.find('[data-test="reactivate-member-1"]').exists()).toBe(false)
  })

  it('renders reactivate and remove for inactive employees', async () => {
    await mountDialog(bo)

    const body = dialogBody()
    expect(body.find('[data-test="details-status"]').text()).toBe(en['employees.status.inactive'])
    expect(body.find('[data-test="reactivate-member-2"]').text()).toContain(
      en['common.reactivate'],
    )
    expect(body.find('[data-test="remove-member-2"]').text()).toContain(en['common.remove'])
    expect(body.find('[data-test="edit-member-2"]').exists()).toBe(false)
    expect(body.find('[data-test="holidays-member-2"]').exists()).toBe(false)
    expect(body.find('[data-test="deactivate-member-2"]').exists()).toBe(false)
  })

  it('emits management actions with the member id', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('[data-test="edit-member-1"]').trigger('click')
    await dialogBody().find('[data-test="holidays-member-1"]').trigger('click')
    await dialogBody().find('[data-test="deactivate-member-1"]').trigger('click')
    await dialogBody().find('[data-test="remove-member-1"]').trigger('click')

    expect(wrapper.emitted('edit')).toEqual([['member-1']])
    expect(wrapper.emitted('holidays')).toEqual([['member-1']])
    expect(wrapper.emitted('deactivate')).toEqual([['member-1']])
    expect(wrapper.emitted('remove')).toEqual([['member-1']])
  })

  it('emits reactivate for an inactive employee', async () => {
    const wrapper = await mountDialog(bo)

    await dialogBody().find('[data-test="reactivate-member-2"]').trigger('click')

    expect(wrapper.emitted('reactivate')).toEqual([['member-2']])
  })

  it('emits update:visible false when closed', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('[data-test="close-details"]').trigger('click')

    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })

  it('renders no employee content when nothing is selected', async () => {
    await mountDialog(null)

    expect(dialogBody().find('[data-test="employee-manage"]').exists()).toBe(false)
    expect(dialogBody().text()).toContain(en['employees.manage.title'])
  })
})
