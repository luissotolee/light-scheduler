import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import DatePicker from 'primevue/datepicker'
import EmployeeSicknessDialog from '@/modules/employees/components/EmployeeSicknessDialog.vue'
import { useLocaleStore } from '@/shared/stores/locale'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'
import type { SickLeave } from '@/types'
import { nextTick } from 'vue'

const existing: SickLeave = {
  id: 'sick-1',
  startDate: '2026-11-04',
  endDate: '2026-11-06',
}

describe('EmployeeSicknessDialog', () => {
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

  async function mountDialog(selected: SickLeave[] = []) {
    const wrapper = mount(EmployeeSicknessDialog, {
      props: { visible: true, memberName: 'Ada', selected },
      global: { plugins: [pinia, PrimeVue], stubs: { teleport: true } },
    })
    await nextTick()
    return wrapper
  }

  async function setDates(
    wrapper: Awaited<ReturnType<typeof mountDialog>>,
    start: Date,
    end: Date,
  ): Promise<void> {
    const pickers = wrapper.findAllComponents(DatePicker)
    pickers[0].vm.$emit('update:modelValue', start)
    pickers[1].vm.$emit('update:modelValue', end)
    await nextTick()
  }

  it('shows the translated title and empty state', async () => {
    const wrapper = await mountDialog()

    expect(wrapper.text()).toContain('Sick leave — Ada')
    expect(wrapper.find('[data-test="sick-leave-empty"]').text()).toBe(en['employees.sick.empty'])
  })

  it('lists the selected leaves and removes one', async () => {
    const wrapper = await mountDialog([existing])

    expect(wrapper.find('[data-test="sick-leave-sick-1"]').text()).toContain('Nov 4, 2026')

    await wrapper.find('[data-test="sick-remove-sick-1"]').trigger('click')

    expect(wrapper.find('[data-test="sick-leave-sick-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="sick-leave-empty"]').exists()).toBe(true)
  })

  it('adds a date range and saves the normalized list', async () => {
    const wrapper = await mountDialog()
    await setDates(wrapper, new Date(2026, 10, 4), new Date(2026, 10, 6))

    await wrapper.find('[data-test="sick-add-range"]').trigger('click')

    const item = wrapper.find('[data-test="sick-leave-list"] li')
    expect(item.text()).toContain('Nov 4, 2026')
    expect(item.text()).toContain('Nov 6, 2026')

    await wrapper.find('[data-test="sick-save"]').trigger('click')

    const saved = wrapper.emitted('save')?.[0]?.[0] as SickLeave[]
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ startDate: '2026-11-04', endDate: '2026-11-06' })
    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })

  it('rejects a range whose end is before the start', async () => {
    const wrapper = await mountDialog()
    await setDates(wrapper, new Date(2026, 10, 6), new Date(2026, 10, 4))

    await wrapper.find('[data-test="sick-add-range"]').trigger('click')

    expect(wrapper.find('[data-test="sick-error"]').text()).toBe(en['errors.endBeforeStart'])
    expect(wrapper.find('[data-test="sick-leave-list"]').exists()).toBe(false)
  })

  it('rejects a range that overlaps an existing leave', async () => {
    const wrapper = await mountDialog([existing])
    await setDates(wrapper, new Date(2026, 10, 5), new Date(2026, 10, 7))

    await wrapper.find('[data-test="sick-add-range"]').trigger('click')

    expect(wrapper.find('[data-test="sick-error"]').text()).toBe(en['errors.sickLeaveOverlap'])
  })

  it('renders Spanish labels', async () => {
    useLocaleStore().setLocale('es')
    const wrapper = await mountDialog([existing])
    await nextTick()

    expect(wrapper.text()).toContain('Baja por enfermedad — Ada')
    expect(wrapper.text()).toContain(es['employees.sick.addRange'])
  })
})
