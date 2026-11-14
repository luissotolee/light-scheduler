import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import HolidayExportDialog from '@/modules/employees/components/HolidayExportDialog.vue'
import { exportYearOptions } from '@/modules/employees/utils/holidayExport'
import { useLocaleStore } from '@/shared/stores/locale'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'

enableAutoUnmount(afterEach)

function dialogBody(): DOMWrapper<HTMLElement> {
  return new DOMWrapper(document.body)
}

describe('HolidayExportDialog', () => {
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

  async function mountDialog(visible = true) {
    const wrapper = mount(HolidayExportDialog, {
      props: { visible },
      global: { plugins: [PrimeVue] },
    })
    await nextTick()
    return wrapper
  }

  it('renders the current and next year options', async () => {
    await mountDialog()
    const [currentYear, nextYear] = exportYearOptions()

    expect(dialogBody().find('[data-test="holiday-export-dialog"]').exists()).toBe(true)
    expect(dialogBody().find('[data-test="export-year-current"]').exists()).toBe(true)
    expect(dialogBody().find('[data-test="export-year-next"]').exists()).toBe(true)
    expect(dialogBody().text()).toContain(String(currentYear))
    expect(dialogBody().text()).toContain(String(nextYear))
    expect(dialogBody().text()).toContain(en['employees.exportHolidays.description'])
  })

  it('defaults to the current year', async () => {
    await mountDialog()

    const current = dialogBody().find('[data-test="export-year-current"] input')
      .element as HTMLInputElement
    expect(current.checked).toBe(true)
  })

  it('resets to the current year each time it opens', async () => {
    const wrapper = await mountDialog()
    const [currentYear, nextYear] = exportYearOptions()

    await dialogBody().find('[data-test="export-year-next"]').trigger('click')
    await wrapper.setProps({ visible: false })
    await wrapper.setProps({ visible: true })
    await nextTick()
    await dialogBody().find('[data-test="confirm-holiday-export"]').trigger('click')

    expect(wrapper.emitted('export')).toEqual([[currentYear]])
    expect(nextYear).not.toBe(currentYear)
  })

  it('emits the selected year and closes on confirm', async () => {
    const wrapper = await mountDialog()
    const [, nextYear] = exportYearOptions()

    await dialogBody().find('[data-test="export-year-next"]').trigger('click')
    await dialogBody().find('[data-test="confirm-holiday-export"]').trigger('click')

    expect(wrapper.emitted('export')).toEqual([[nextYear]])
    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })

  it('closes without exporting on cancel', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('[data-test="cancel-holiday-export"]').trigger('click')

    expect(wrapper.emitted('export')).toBeUndefined()
    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })

  it('renders Spanish labels for the active locale', async () => {
    useLocaleStore().setLocale('es')

    await mountDialog()

    expect(dialogBody().text()).toContain(es['employees.exportHolidays.description'])
    expect(dialogBody().text()).toContain(es['common.cancel'])
    expect(dialogBody().text()).toContain(es['employees.exportHolidays.confirm'])
  })
})
