import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppNav from '@/shared/components/AppNav.vue'
import { en } from '@/shared/i18n/messages/en'
import { NAV_ITEMS } from '@/router/nav'

const routes = NAV_ITEMS.map((item) => ({
  path: item.path,
  name: item.name,
  component: { template: '<div />' },
}))

async function mountNav(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  await router.push(path)
  await router.isReady()

  return mount(AppNav, {
    props: { items: NAV_ITEMS },
    global: { plugins: [pinia, router] },
  })
}

describe('AppNav', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders every nav item with its translated label and path', async () => {
    const wrapper = await mountNav('/')
    const links = wrapper.findAll('.app-nav__link')

    expect(links.map((link) => link.text())).toEqual(NAV_ITEMS.map((item) => en[item.labelKey]))
    expect(links.map((link) => link.attributes('href'))).toEqual(
      NAV_ITEMS.map((item) => item.path),
    )
  })

  it('marks exactly the active route with aria-current', async () => {
    const wrapper = await mountNav('/scheduler')
    const active = wrapper.findAll('.app-nav__link[aria-current="page"]')

    expect(active).toHaveLength(1)
    expect(active[0].text()).toBe(en['nav.scheduler'])
  })

  it('adds an accessible nav landmark', async () => {
    const wrapper = await mountNav('/')

    expect(wrapper.find('nav').attributes('aria-label')).toBe(en['app.navPrimary'])
  })

  it('renders icon-only links with accessible names on phones', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const wrapper = await mountNav('/')
    const links = wrapper.findAll('.app-nav__link')

    expect(links.map((link) => link.text())).toEqual(NAV_ITEMS.map(() => ''))
    expect(links.map((link) => link.attributes('aria-label'))).toEqual(
      NAV_ITEMS.map((item) => en[item.labelKey]),
    )
    expect(links[0].find('.pi.pi-home').exists()).toBe(true)
  })
})
