import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import { NAV_ITEMS } from '@/router/nav'

const routes = NAV_ITEMS.map((item) => ({
  path: item.path,
  name: item.name,
  component: { template: '<div />' },
}))

async function mountNav(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  await router.push(path)
  await router.isReady()

  return mount(AppNav, {
    props: { items: NAV_ITEMS },
    global: { plugins: [router] },
  })
}

describe('AppNav', () => {
  it('renders every nav item with its path', async () => {
    const wrapper = await mountNav('/')
    const links = wrapper.findAll('.app-nav__link')

    expect(links.map((link) => link.text())).toEqual(NAV_ITEMS.map((item) => item.label))
    expect(links.map((link) => link.attributes('href'))).toEqual(
      NAV_ITEMS.map((item) => item.path),
    )
  })

  it('marks exactly the active route with aria-current', async () => {
    const wrapper = await mountNav('/scheduler')
    const active = wrapper.findAll('.app-nav__link[aria-current="page"]')

    expect(active).toHaveLength(1)
    expect(active[0].text()).toBe('Scheduler')
  })

  it('adds an accessible nav landmark', async () => {
    const wrapper = await mountNav('/')

    expect(wrapper.find('nav').attributes('aria-label')).toBe('Primary')
  })
})
