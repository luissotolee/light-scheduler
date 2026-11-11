import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Select from 'primevue/select'
import Tooltip from 'primevue/tooltip'
import TimePickerField from '@/modules/scheduler/components/TimePickerField.vue'

describe('TimePickerField', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  function mountField(modelValue = '10:45', minuteStep: 15 | 30 = 30, tooltip?: string) {
    return mount(TimePickerField, {
      props: { modelValue, label: 'Start time', minuteStep, idPrefix: 'start', tooltip },
      global: { plugins: [PrimeVue], directives: { tooltip: Tooltip } },
    })
  }

  it('renders 24-hour hour options and minute options for the active step', () => {
    const wrapper = mountField('10:45', 30)
    const selects = wrapper.findAllComponents(Select)

    expect(selects).toHaveLength(2)
    const hourOptions = selects[0].props('options') as Array<{ label: string }>
    expect(hourOptions).toHaveLength(24)
    expect(hourOptions[0].label).toBe('00')
    expect(hourOptions[23].label).toBe('23')

    const minuteOptions = selects[1].props('options') as Array<{ label: string }>
    expect(minuteOptions.map((option) => option.label)).toEqual(['00', '30'])
  })

  it('renders 15-minute options when the step is 15', () => {
    const wrapper = mountField('10:45', 15)
    const minuteOptions = wrapper.findAllComponents(Select)[1].props('options') as Array<{
      label: string
    }>

    expect(minuteOptions.map((option) => option.label)).toEqual(['00', '15', '30', '45'])
  })

  it('aligns an unaligned minute down to the displayed step', () => {
    const wrapper = mountField('10:45', 30)

    expect(wrapper.findAllComponents(Select)[1].props('modelValue')).toBe(30)
  })

  it('emits a formatted value when the hour or minute changes', async () => {
    const wrapper = mountField('10:30', 30)
    const [hourSelect, minuteSelect] = wrapper.findAllComponents(Select)

    hourSelect.vm.$emit('update:modelValue', 11)
    minuteSelect.vm.$emit('update:modelValue', 0)

    expect(wrapper.emitted('update:modelValue')).toEqual([['11:30'], ['10:00']])
  })

  it('renders an info tooltip when a tooltip is provided', () => {
    const wrapper = mountField('10:45', 30, 'First hour shown in the grid.')

    const info = wrapper.find('[data-test="start-info"]')
    expect(info.exists()).toBe(true)
    expect(info.attributes('aria-label')).toBe('First hour shown in the grid.')
    expect(info.attributes('data-pd-tooltip')).toBeDefined()
    expect(info.find('.pi.pi-info-circle').exists()).toBe(true)
  })

  it('does not render an info icon without a tooltip', () => {
    const wrapper = mountField()

    expect(wrapper.find('[data-test="start-info"]').exists()).toBe(false)
  })
})
