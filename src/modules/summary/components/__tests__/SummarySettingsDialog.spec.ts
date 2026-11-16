import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import ToggleSwitch from 'primevue/toggleswitch'
import Tooltip from 'primevue/tooltip'
import SummarySettingsDialog from '@/modules/summary/components/SummarySettingsDialog.vue'
import { DEFAULT_SUMMARY_SETTINGS } from '@/shared/utils/summarySettings'
import type { SummarySettings } from '@/types'

describe('SummarySettingsDialog', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  async function mountDialog(settings: SummarySettings = DEFAULT_SUMMARY_SETTINGS) {
    const wrapper = mount(SummarySettingsDialog, {
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

  it('renders the translated labels and toggle', async () => {
    const wrapper = await mountDialog()

    expect(wrapper.text()).toContain('Summary settings')
    expect(wrapper.text()).toContain('Choose which columns appear in the summary table.')
    expect(wrapper.text()).toContain('Show weekly hours vs contract')
    expect(wrapper.findComponent(ToggleSwitch).props('modelValue')).toBe(false)
    expect(wrapper.find('[data-test="summary-settings-info"]').attributes('aria-label')).toBe(
      'Adds Total, Contract, and Diff columns so each employee’s scheduled hours are compared with their weekly contract.',
    )
  })

  it('reflects an enabled setting as checked', async () => {
    const wrapper = await mountDialog({ showWeeklyHours: true })

    expect(wrapper.findComponent(ToggleSwitch).props('modelValue')).toBe(true)
  })

  it('emits the enabled setting on save', async () => {
    const wrapper = await mountDialog()
    const toggle = wrapper.findComponent(ToggleSwitch)

    toggle.vm.$emit('update:modelValue', true)
    await nextTick()
    await wrapper.get('[data-test="summary-settings-form"]').trigger('submit')

    expect(wrapper.emitted('save')).toEqual([[{ showWeeklyHours: true }]])
  })

  it('closes without saving from the cancel button', async () => {
    const wrapper = await mountDialog()

    await wrapper.get('[data-test="summary-settings-cancel"]').trigger('click')

    expect(wrapper.emitted('update:visible')).toEqual([[false]])
    expect(wrapper.emitted('save')).toBeUndefined()
  })
})
