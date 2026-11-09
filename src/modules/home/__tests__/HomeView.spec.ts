import { beforeEach, describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import HomeView from '@/modules/home/views/HomeView.vue'
import { useLocaleStore } from '@/shared/stores/locale'
import { es } from '@/shared/i18n/messages/es'

function mountView() {
  return mount(HomeView, {
    global: { plugins: [createPinia()], stubs: { RouterLink: RouterLinkStub } },
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
    expect(paths).toContain('/employees')
    expect(paths).toContain('/summary')
    expect(paths).toContain('/csv')
  })

  it('translates the feature cards live', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(HomeView, {
      global: { plugins: [pinia], stubs: { RouterLink: RouterLinkStub } },
    })

    useLocaleStore().setLocale('es')
    await nextTick()

    expect(wrapper.text()).toContain(es['home.cta'])
    expect(wrapper.text()).toContain(es['home.feature.scheduler.description'])
  })
})
