import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import EmployeeDetailsDialog from '@/shared/components/EmployeeDetailsDialog.vue'
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

function dialogBody(): DOMWrapper<HTMLElement> {
  return new DOMWrapper(document.body)
}

describe('EmployeeDetailsDialog', () => {
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

  async function mountDialog(member: TeamMember | null = ada) {
    const wrapper = mount(EmployeeDetailsDialog, {
      props: { visible: true, member },
      global: { plugins: [PrimeVue] },
    })
    await nextTick()
    return wrapper
  }

  it('renders the employee details read-only', async () => {
    await mountDialog()

    const body = dialogBody()
    expect(body.text()).toContain('Ada')
    expect(body.find('[data-test="details-emp-id"]').text()).toBe('EMP-0001')
    expect(body.find('[data-test="details-duty"]').text()).toBe('Head manager')
    expect(body.find('[data-test="details-contract"]').text()).toBe('Part-time')
    expect(body.find('[data-test="details-hours"]').text()).toBe('32')
    expect(body.find('[data-test="details-email"]').text()).toBe('ada@example.com')
    expect(body.find('[data-test="details-phone"]').text()).toBe('+1 555 010 0000')
    expect(body.find('[data-test="details-comment"]').text()).toBe('No morning shifts')
    expect(body.find('[data-test="details-status"]').text()).toBe('Active')
    expect(body.find('[data-test="details-start-date"]').text()).toBe('Jan 15, 2025')
    expect(body.find('[data-test="details-end-date"]').exists()).toBe(false)
  })

  it('lists holiday weeks with their ranges', async () => {
    await mountDialog()

    const items = dialogBody().findAll('.employee-details__holiday-list li')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('Week 10')
    expect(items[0].text()).toContain('2026')
  })

  it('shows an empty holidays message when there are no holidays', async () => {
    await mountDialog({ ...ada, holidays: [] })

    expect(dialogBody().find('[data-test="details-no-holidays"]').text()).toBe('No holidays')
  })

  it('shows inactive status and the end date when present', async () => {
    await mountDialog({ ...ada, active: false, endDate: '2026-11-08' })

    expect(dialogBody().find('[data-test="details-status"]').text()).toBe('Inactive')
    expect(dialogBody().find('[data-test="details-end-date"]').text()).toBe('Nov 8, 2026')
  })

  it('shows a dash for missing contact details', async () => {
    await mountDialog({ ...ada, email: undefined, phone: undefined, comment: undefined })

    expect(dialogBody().find('[data-test="details-email"]').text()).toBe('—')
    expect(dialogBody().find('[data-test="details-phone"]').text()).toBe('—')
    expect(dialogBody().find('[data-test="details-comment"]').text()).toBe('—')
  })

  it('preserves multiline comments', async () => {
    await mountDialog({ ...ada, comment: 'No morning shifts\nWeekends only' })

    expect(dialogBody().find('[data-test="details-comment"]').text()).toBe(
      'No morning shifts\nWeekends only',
    )
  })

  it('emits update:visible false when closed', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('[data-test="close-details"]').trigger('click')

    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })

  it('renders no member content when nothing is selected', async () => {
    await mountDialog(null)

    expect(dialogBody().find('.employee-details__body').exists()).toBe(false)
  })
})
