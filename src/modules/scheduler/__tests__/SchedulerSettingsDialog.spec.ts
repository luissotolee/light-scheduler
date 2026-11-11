import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import SelectButton from 'primevue/selectbutton'
import ToggleSwitch from 'primevue/toggleswitch'
import Tooltip from 'primevue/tooltip'
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
      global: {
        plugins: [PrimeVue],
        directives: { tooltip: Tooltip },
        stubs: { teleport: true },
      },
    })
    await nextTick()
    return wrapper
  }

  it('renders the translated labels, pickers, rate switch, and tooltip icons', async () => {
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
    expect(wrapper.text()).toContain('Show headcount per hour')
    expect(wrapper.findComponent(ToggleSwitch).props('modelValue')).toBe(false)
  })

  it('moves the setting explanations into info tooltips', async () => {
    const wrapper = await mountDialog()

    const startInfo = wrapper.find('[data-test="settings-start-info"]')
    expect(startInfo.attributes('aria-label')).toBe(
      'First hour shown in the grid. Shifts outside the visible window stay saved but are hidden.',
    )
    expect(startInfo.attributes('data-pd-tooltip')).toBeDefined()

    const endInfo = wrapper.find('[data-test="settings-end-info"]')
    expect(endInfo.attributes('aria-label')).toBe(
      'Last hour shown in the grid. If it is earlier than the start time, the schedule continues into the next day.',
    )
    expect(endInfo.attributes('data-pd-tooltip')).toBeDefined()

    const rateInfo = wrapper.find('[data-test="settings-rate-info"]')
    expect(rateInfo.attributes('aria-label')).toBe(
      'Time step used by the grid. Smaller slots allow more precise shifts but add more columns.',
    )
    expect(rateInfo.attributes('data-pd-tooltip')).toBeDefined()

    const headcountInfo = wrapper.find('[data-test="settings-headcount-info"]')
    expect(headcountInfo.attributes('aria-label')).toBe(
      'Adds a badge next to each hour with the largest number of employees working at the same time during that hour.',
    )
    expect(headcountInfo.attributes('data-pd-tooltip')).toBeDefined()

    expect(wrapper.find('.scheduler-settings__description').exists()).toBe(false)
    expect(wrapper.findAll('.scheduler-settings__hint')).toHaveLength(1)
    expect(wrapper.find('[data-test="settings-next-day"]').exists()).toBe(true)
  })

  it('emits the enabled hourly headcount setting on save', async () => {
    const wrapper = await mountDialog()
    const toggle = wrapper.findComponent(ToggleSwitch)

    expect(toggle.props('modelValue')).toBe(false)

    toggle.vm.$emit('update:modelValue', true)
    await nextTick()
    await wrapper.find('[data-test="scheduler-settings-form"]').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([
      [{ ...DEFAULT_SCHEDULER_SETTINGS, showHourlyHeadcount: true }],
    ])
  })

  it('reflects an enabled hourly headcount setting as checked', async () => {
    const wrapper = await mountDialog({
      ...DEFAULT_SCHEDULER_SETTINGS,
      showHourlyHeadcount: true,
    })

    expect(wrapper.findComponent(ToggleSwitch).props('modelValue')).toBe(true)
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
      showHourlyHeadcount: false,
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
      showHourlyHeadcount: false,
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
    expect(wrapper.text()).toContain('Mostrar empleados por hora')
    expect(wrapper.find('[data-test="settings-start-info"]').attributes('aria-label')).toBe(
      'Primera hora que se muestra en la tabla. Los turnos fuera de la ventana visible se guardan pero no se muestran.',
    )
  })
})
