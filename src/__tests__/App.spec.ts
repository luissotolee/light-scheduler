import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '@/App.vue'

async function mountApp() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div>home view</div>' } }],
  })
  await router.push('/')
  await router.isReady()

  return mount(App, { global: { plugins: [router] } })
}

describe('App', () => {
  it('renders the brand and navigation', async () => {
    const wrapper = await mountApp()

    expect(wrapper.find('.app__brand').text()).toBe('Light Scheduler')
    const links = wrapper.findAll('.app__nav a').map((link) => link.text())
    expect(links).toEqual(['Home', 'Hello PrimeVue', 'About'])
  })

  it('renders the active route inside the main region', async () => {
    const wrapper = await mountApp()

    expect(wrapper.find('.app__main').text()).toContain('home view')
  })
})
