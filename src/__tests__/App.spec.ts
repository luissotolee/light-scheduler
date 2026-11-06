import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'
import { NAV_ITEMS } from '@/router/nav'

const routes = NAV_ITEMS.map((item) => ({
  path: item.path,
  name: item.name,
  component: { template: '<div class="route-stub">{{ $route.path }}</div>' },
}))

async function mountApp(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  await router.push(path)
  await router.isReady()

  return mount(App, { global: { plugins: [router] } })
}

describe('App', () => {
  it('renders the brand and every navigation label', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.find('.app__brand').text()).toBe('Light Scheduler')
    const links = wrapper.findAll('.app-nav__link').map((link) => link.text())
    expect(links).toEqual(NAV_ITEMS.map((item) => item.label))
  })

  it('marks exactly one active navigation link', async () => {
    const wrapper = await mountApp('/scheduler')
    const active = wrapper.findAll('.app-nav__link[aria-current="page"]')

    expect(active).toHaveLength(1)
    expect(active[0].text()).toBe('Scheduler')
  })

  it('renders the active route inside the main region', async () => {
    const wrapper = await mountApp('/employees')

    expect(wrapper.find('.app__main').text()).toContain('/employees')
  })
})
