import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import SelectButton from 'primevue/selectbutton'
import SchedulerSettingsDialog from '@/modules/scheduler/components/SchedulerSettingsDialog.vue'
import TimePickerField from '@/modules/scheduler/components/TimePickerField.vue'
import { DEFAULT_SCHEDULER_SETTINGS } from '@/modules/scheduler/utils/settings'
import type { SchedulerSettings } from '@/modules/scheduler/types'
import { useLocaleStore } from '@/shared/stores/locale'

describe('SchedulerSettingsDialog', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  async function mountDialog(settings: SchedulerSettings = DEFAULT_SCHEDULER_SETTINGS) {
    const wrapper = mount(SchedulerSettingsDialog, {
      props: { visible: true, settings },
      global: { plugins: [PrimeVue], stubs: { teleport: true } },
    })
    await nextTick()
    return wrapper
  }

  it('renders the translated labels, pickers, rate switch, and hints', async () => {
    const wrapper = await mountDialog()

    expect(wrapper.text()).toContain('Schedule settings')
    expect(wrapper.text()).toContain('Start time')
    expect(wrapper.text()).toContain('End time')
    expect(wrapper.text()).toContain('Time slot')
    expect(wrapper.findAllComponents(TimePickerField)).toHaveLength(2)
    expect(wrapper.findComponent(SelectButton).props('options')).toEqual([
      { label: '30 min', value: 30 },
      { label: '15 min', value: 15 },
    ])
    expect(wrapper.text()).toContain('Ends the next day')
    expect(wrapper.text()).toContain(
      'Shifts outside these limits stay saved but are hidden from the grid.',
    )
  })

  it('emits valid settings on save', async () => {
    const wrapper = await mountDialog()

    await wrapper.find('[data-test="scheduler-settings-form"]').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([[DEFAULT_SCHEDULER_SETTINGS]])
  })

  it('shows a translated error and does not save an invalid window', async () => {
    const wrapper = await mountDialog({
      startTime: '09:00',
      endTime: '09:00',
      slotMinutes: 30,
    })

    expect(wrapper.find('[data-test="settings-error"]').text()).toBe(
      'Start and end times must be different',
    )
    expect(wrapper.find('[data-test="settings-save"]').attributes('disabled')).toBeDefined()

    await wrapper.find('[data-test="scheduler-settings-form"]').trigger('submit')

    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('snaps the times when the rate changes from 15 to 30 minutes', async () => {
    const wrapper = await mountDialog({
      startTime: '10:45',
      endTime: '12:45',
      slotMinutes: 15,
    })
    const pickers = () => wrapper.findAllComponents(TimePickerField)

    expect(pickers()[0].props('modelValue')).toBe('10:45')

    wrapper.findComponent(SelectButton).vm.$emit('update:modelValue', 30)
    await nextTick()

    expect(pickers()[0].props('modelValue')).toBe('10:30')
    expect(pickers()[1].props('modelValue')).toBe('12:30')
  })

  it('exposes a data-test hook on each rate option', async () => {
    const wrapper = await mountDialog()

    expect(wrapper.find('[data-test="settings-rate-30"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="settings-rate-15"]').exists()).toBe(true)

    await wrapper.find('[data-test="settings-rate-15"]').trigger('click')
    await nextTick()

    expect(wrapper.findComponent(SelectButton).props('modelValue')).toBe(15)
  })

  it('emits update:visible false when cancelled', async () => {
    const wrapper = await mountDialog()

    await wrapper.find('[data-test="settings-cancel"]').trigger('click')

    expect(wrapper.emitted('update:visible')).toEqual([[false]])
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('renders Spanish labels after switching locale', async () => {
    useLocaleStore().setLocale('es')
    const wrapper = await mountDialog()
    await nextTick()

    expect(wrapper.text()).toContain('Configuración del horario')
    expect(wrapper.text()).toContain('Hora de inicio')
    expect(wrapper.text()).toContain('Franja horaria')
  })
})
