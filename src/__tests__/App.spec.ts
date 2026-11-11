import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
import { useLocaleStore } from '@/shared/stores/locale'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'
import { NAV_ITEMS } from '@/router/nav'

vi.mock('@/modules/demo/player/engine', () => ({
  startEngine: vi.fn().mockResolvedValue(undefined),
  stopEngine: vi.fn().mockResolvedValue(undefined),
}))

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
    expect(wrapper.find('.app__footer-text').text()).toBe(en['app.footer'])
  })

  it('links to Ko-fi from the footer', async () => {
    const wrapper = await mountApp('/')
    const link = wrapper.find('[data-test="ko-fi-button"]')

    expect(link.attributes('href')).toBe('https://ko-fi.com/J8C02AHRYD')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(link.text()).toBe(en['app.supportOnKoFi'])
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
    expect(wrapper.find('.app__footer-text').text()).toBe(es['app.footer'])
    expect(document.documentElement.lang).toBe('es')
  })

  it('renders demo start button when demo is idle', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.find('[data-test="demo-start-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="demo-start-button"]').text()).toBe(en['demo.start'])
  })

  it('does not render demo overlay when demo is idle', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.find('[data-test="demo-overlay"]').exists()).toBe(false)
  })

  it('does not render demo banner when demo is idle', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.find('[data-test="demo-banner"]').exists()).toBe(false)
  })

  it('renders demo banner when demo is running', async () => {
    const wrapper = await mountApp('/')
    const demoStore = useDemoStore()
    demoStore.status = 'running'
    demoStore.stepIndex = 0
    demoStore.totalSteps = 2
    demoStore.currentStep = { id: '1', action: 'spotlight', target: { testId: 'test' }, narrationKey: 'demo.scenario.scheduler.intro' }

    await nextTick()

    expect(wrapper.find('[data-test="demo-banner"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="demo-banner"]').text()).toContain(en['demo.banner'])
    expect(wrapper.find('[data-test="demo-progress"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="demo-previous"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="demo-pause"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="demo-next"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="demo-exit"]').exists()).toBe(true)
  })

  it('does not start demo engine on refresh when idle', async () => {
    const { startEngine } = await import('@/modules/demo/player/engine')

    const wrapper = await mountApp('/')

    expect(startEngine).not.toHaveBeenCalled()
    const demoStore = useDemoStore()
    expect(demoStore.status).toBe('idle')
    expect(wrapper.find('[data-test="demo-start-button"]').exists()).toBe(true)
  })

  it('mounts demo overlay when demo status is running', async () => {
    const wrapper = await mountApp('/')
    const demoStore = useDemoStore()
    demoStore.status = 'running'
    demoStore.totalSteps = 1
    demoStore.currentStep = { id: '1', action: 'spotlight', target: { testId: 'test' }, narrationKey: 'demo.scenario.scheduler.intro' }

    await nextTick()
    await nextTick()
    await vi.dynamicImportSettled()

    expect(wrapper.find('[data-test="demo-overlay"]').exists()).toBe(true)
  })
})
