import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import HolidayWeeksDialog from '@/components/HolidayWeeksDialog.vue'
import type { HolidayWeek } from '@/types'

enableAutoUnmount(afterEach)

function dialogBody(): DOMWrapper<HTMLElement> {
  return new DOMWrapper(document.body)
}

describe('HolidayWeeksDialog', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function mountDialog(visible = true, selected: HolidayWeek[] = [], initialYear?: number) {
    const wrapper = mount(HolidayWeeksDialog, {
      props: { visible, memberName: 'Ada', selected, initialYear },
      global: { plugins: [PrimeVue] },
    })
    await nextTick()
    return wrapper
  }

  it('renders every ISO week for the selected year', async () => {
    await mountDialog(true, [], 2026)

    expect(dialogBody().find('[data-test="current-year"]').text()).toBe('2026')
    expect(dialogBody().findAll('.holiday-dialog__week')).toHaveLength(53)
    expect(dialogBody().find('[data-test="week-1"]').text()).toBe('Week 1 — Dec 29 – Jan 4')
    expect(dialogBody().find('[data-test="week-1"]').text()).not.toContain('2026')
    expect(dialogBody().find('[data-test="week-53"]').text()).toContain('Week 53')
    expect(dialogBody().find('[data-test="counter"]').text()).toBe('0 of 6 selected')
  })

  it('toggles a week and updates the counter and pressed state', async () => {
    await mountDialog()

    await dialogBody().find('[data-test="week-10"]').trigger('click')
    expect(dialogBody().find('[data-test="week-10"]').attributes('aria-pressed')).toBe('true')
    expect(dialogBody().find('[data-test="counter"]').text()).toBe('1 of 6 selected')

    await dialogBody().find('[data-test="week-10"]').trigger('click')
    expect(dialogBody().find('[data-test="week-10"]').attributes('aria-pressed')).toBe('false')
    expect(dialogBody().find('[data-test="counter"]').text()).toBe('0 of 6 selected')
  })

  it('blocks a seventh distinct week', async () => {
    await mountDialog()

    for (const week of [1, 2, 3, 4, 5, 6]) {
      await dialogBody().find(`[data-test="week-${week}"]`).trigger('click')
    }

    expect(dialogBody().find('[data-test="counter"]').text()).toBe('6 of 6 selected')
    expect(dialogBody().find('[data-test="week-7"]').attributes('disabled')).toBeDefined()
    expect(dialogBody().find('[data-test="week-1"]').attributes('disabled')).toBeUndefined()
  })

  it('saves normalized holidays in week order and closes', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('[data-test="week-12"]').trigger('click')
    await dialogBody().find('[data-test="week-10"]').trigger('click')
    await dialogBody().find('[data-test="save-holidays"]').trigger('click')

    expect(wrapper.emitted('save')).toEqual([
      [
        [
          { year: 2026, week: 10 },
          { year: 2026, week: 12 },
        ],
      ],
    ])
    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })

  it('navigates between years', async () => {
    await mountDialog(true, [], 2026)

    await dialogBody().find('[data-test="next-year"]').trigger('click')
    expect(dialogBody().find('[data-test="current-year"]').text()).toBe('2027')
    expect(dialogBody().findAll('.holiday-dialog__week')).toHaveLength(52)

    await dialogBody().find('[data-test="previous-year"]').trigger('click')
    expect(dialogBody().find('[data-test="current-year"]').text()).toBe('2026')

    await dialogBody().find('[data-test="previous-year"]').trigger('click')
    expect(dialogBody().find('[data-test="current-year"]').text()).toBe('2025')
    expect(dialogBody().findAll('.holiday-dialog__week')).toHaveLength(52)
  })

  it('resets the selection from the member when opened', async () => {
    const wrapper = await mountDialog(false, [{ year: 2025, week: 5 }])

    await wrapper.setProps({ visible: true })

    expect(dialogBody().find('[data-test="current-year"]').text()).toBe('2025')
    expect(dialogBody().find('[data-test="counter"]').text()).toBe('1 of 6 selected')
    expect(dialogBody().find('[data-test="week-5"]').attributes('aria-pressed')).toBe('true')
  })

  it('emits update:visible false when cancelled', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('[data-test="cancel-holidays"]').trigger('click')

    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })
})
