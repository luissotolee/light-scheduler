import { beforeEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import KoFiButton from '@/shared/components/KoFiButton.vue'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'
import { useLocaleStore } from '@/shared/stores/locale'

enableAutoUnmount(afterEach)

function mountButton() {
  return mount(KoFiButton, {
    global: { plugins: [createPinia()] },
  })
}

describe('KoFiButton', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.lang = 'en'
  })

  it('renders a link to the Ko-fi page', () => {
    const link = mountButton().find('[data-test="ko-fi-button"]')

    expect(link.attributes('href')).toBe('https://ko-fi.com/J8C02AHRYD')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.text()).toBe(en['app.supportOnKoFi'])
  })

  it('renders the Ko-fi cup icon as decorative', () => {
    const icon = mountButton().find('.ko-fi-button__icon')

    expect(icon.attributes('src')).toBe('https://storage.ko-fi.com/cdn/cup-border.png')
    expect(icon.attributes('alt')).toBe('')
    expect(icon.attributes('aria-hidden')).toBe('true')
  })

  it('translates the label when the locale changes', async () => {
    const wrapper = mountButton()
    const localeStore = useLocaleStore()

    localeStore.setLocale('es')
    await nextTick()

    expect(wrapper.find('[data-test="ko-fi-button"]').text()).toBe(es['app.supportOnKoFi'])
  })
})
