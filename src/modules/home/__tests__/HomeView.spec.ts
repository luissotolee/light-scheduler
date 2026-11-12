import { beforeEach, describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { nextTick } from 'vue'
import HomeView from '@/modules/home/views/HomeView.vue'
import { useLocaleStore } from '@/shared/stores/locale'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'

function mountView(pinia = createPinia()) {
  return mount(HomeView, {
    global: { plugins: [pinia, PrimeVue], stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('HomeView', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('describes the application purpose', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Light Scheduler')
    expect(wrapper.text()).toContain('frontend-only')
    expect(wrapper.text()).toContain('CSV files')
  })

  it('links to every feature page and the scheduler CTA', () => {
    const wrapper = mountView()
    const links = wrapper.findAllComponents(RouterLinkStub)
    const paths = links.map((link) => link.props('to'))

    expect(paths).toContain('/scheduler')
    expect(paths).toContain('/calendar')
    expect(paths).toContain('/employees')
    expect(paths).toContain('/summary')
    expect(paths).toContain('/archive')
  })

  it('shows feature cards in the same order as the top navigation', () => {
    const wrapper = mountView()
    const links = wrapper
      .findAllComponents(RouterLinkStub)
      .filter((link) => link.classes().includes('home__feature-link'))
      .map((link) => link.props('to'))
    const icons = wrapper.findAll('.home__feature-icon').map((icon) => icon.classes())

    expect(links).toEqual(['/scheduler', '/summary', '/calendar', '/employees', '/archive'])
    expect(icons).toHaveLength(5)
    expect(icons[0]).toContain('pi-calendar')
    expect(icons[1]).toContain('pi-table')
    expect(icons[2]).toContain('pi-calendar-plus')
    expect(icons[3]).toContain('pi-users')
    expect(icons[4]).toContain('pi-file-export')
  })

  it('strongly recommends the guided demo first', async () => {
    const wrapper = mountView()

    const recommendation = wrapper.find('[data-test="home-demo-recommendation"]')
    expect(recommendation.exists()).toBe(true)
    expect(recommendation.text()).toContain(en['home.demo.title'])
    expect(recommendation.text()).toContain(en['home.demo.description'])

    const start = wrapper.find('[data-test="home-demo-start"]')
    expect(start.attributes('aria-expanded')).toBe('false')

    await start.trigger('click')
    expect(start.attributes('aria-expanded')).toBe('true')
  })

  it('translates the feature cards live', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mountView(pinia)

    useLocaleStore().setLocale('es')
    await nextTick()

    expect(wrapper.text()).toContain(es['home.cta'])
    expect(wrapper.text()).toContain(es['home.feature.scheduler.description'])
    expect(wrapper.text()).toContain(es['home.demo.title'])
  })
})
