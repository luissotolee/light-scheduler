import { beforeEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import LanguageSwitcher from '@/shared/components/LanguageSwitcher.vue'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'
import { useLocaleStore } from '@/shared/stores/locale'

enableAutoUnmount(afterEach)

function mountSwitcher() {
  return mount(LanguageSwitcher, {
    attachTo: document.body,
    global: { plugins: [createPinia()] },
  })
}

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.lang = 'en'
  })

  it('shows the current flag, code, and accessible label', () => {
    const wrapper = mountSwitcher()
    const trigger = wrapper.find('[data-test="language-trigger"]')

    expect(trigger.text()).toContain('EN')
    expect(trigger.find('svg').exists()).toBe(true)
    expect(trigger.find('.pi-chevron-down').exists()).toBe(true)
    expect(trigger.attributes('aria-label')).toBe(
      en['languageSwitcher.changeLanguage'].replace('{language}', 'English'),
    )
    expect(trigger.attributes('aria-haspopup')).toBe('menu')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    expect(trigger.attributes('aria-controls')).toBe('language-switcher-menu')
  })

  it('opens a menu with both languages and marks the current one', async () => {
    const wrapper = mountSwitcher()

    await wrapper.find('[data-test="language-trigger"]').trigger('click')
    await nextTick()

    const menu = wrapper.find('[role="menu"]')
    expect(menu.exists()).toBe(true)
    expect(menu.attributes('aria-label')).toBe(en['languageSwitcher.menuLabel'])

    const options = wrapper.findAll('[role="menuitemradio"]')
    expect(options).toHaveLength(2)
    expect(options.map((option) => option.text())).toEqual(['English', 'Español'])
    expect(options[0].attributes('aria-checked')).toBe('true')
    expect(options[1].attributes('aria-checked')).toBe('false')
    expect(wrapper.find('[data-test="language-option-en"] .pi-check').exists()).toBe(true)
    expect(wrapper.find('[data-test="language-trigger"]').attributes('aria-expanded')).toBe('true')
  })

  it('selects Spanish with the keyboard and re-renders live', async () => {
    const wrapper = mountSwitcher()
    const localeStore = useLocaleStore()

    await wrapper.find('[data-test="language-trigger"]').trigger('click')
    await nextTick()

    await wrapper.find('[role="menuitemradio"]').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement?.textContent).toContain('Español')

    await (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    )
    await nextTick()

    expect(localeStore.locale).toBe('es')
    expect(document.documentElement.lang).toBe('es')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="language-trigger"]').text()).toContain('ES')
    expect(wrapper.find('[data-test="language-trigger"]').attributes('aria-label')).toBe(
      es['languageSwitcher.changeLanguage'].replace('{language}', 'Español'),
    )
  })

  it('selects a language with a click and closes the menu', async () => {
    const wrapper = mountSwitcher()

    await wrapper.find('[data-test="language-trigger"]').trigger('click')
    await wrapper.find('[data-test="language-option-es"]').trigger('click')
    await nextTick()

    expect(useLocaleStore().locale).toBe('es')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('[data-test="language-trigger"]').element)
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const wrapper = mountSwitcher()

    await wrapper.find('[data-test="language-trigger"]').trigger('click')
    await nextTick()

    await wrapper.find('[role="menu"]').trigger('keydown', { key: 'Escape' })
    await nextTick()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.find('[data-test="language-trigger"]').element)
  })

  it('closes on an outside pointerdown', async () => {
    const wrapper = mountSwitcher()

    await wrapper.find('[data-test="language-trigger"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })

  it('closes when pressing Tab', async () => {
    const wrapper = mountSwitcher()

    await wrapper.find('[data-test="language-trigger"]').trigger('click')
    await nextTick()

    await wrapper.find('[role="menu"]').trigger('keydown', { key: 'Tab' })

    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
  })
})
