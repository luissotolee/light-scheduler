import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
import { useLocaleStore } from '@/shared/stores/locale'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'
import { NAV_ITEMS } from '@/router/nav'

const routes = NAV_ITEMS.map((item) => ({
  path: item.path,
  name: item.name,
  component: { template: '<div class="route-stub">{{ $route.path }}</div>' },
}))

async function mountApp(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  await router.push(path)
  await router.isReady()

  return mount(App, { global: { plugins: [pinia, router] } })
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
  })

  it('renders the brand and every navigation label', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.find('.app__brand').text()).toBe('Light Scheduler')
    const links = wrapper.findAll('.app-nav__link').map((link) => link.text())
    expect(links).toEqual(NAV_ITEMS.map((item) => en[item.labelKey]))
    expect(wrapper.find('.app__footer').text()).toBe(en['app.footer'])
  })

  it('marks exactly one active navigation link', async () => {
    const wrapper = await mountApp('/scheduler')
    const active = wrapper.findAll('.app-nav__link[aria-current="page"]')

    expect(active).toHaveLength(1)
    expect(active[0].text()).toBe(en['nav.scheduler'])
  })

  it('renders the active route inside the main region', async () => {
    const wrapper = await mountApp('/employees')

    expect(wrapper.find('.app__main').text()).toContain('/employees')
  })

  it('re-renders the whole shell in Spanish without remounting', async () => {
    const wrapper = await mountApp('/')
    const localeStore = useLocaleStore()
    const brand = wrapper.find('.app__brand').element

    expect(wrapper.find('.app-nav__link').text()).toBe(en['nav.home'])

    localeStore.setLocale('es')
    await nextTick()

    expect(wrapper.find('.app__brand').element).toBe(brand)
    expect(wrapper.find('.app-nav__link').text()).toBe(es['nav.home'])
    expect(wrapper.find('.app__footer').text()).toBe(es['app.footer'])
    expect(document.documentElement.lang).toBe('es')
  })
})
