import { describe, expect, it } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import HomeView from '@/views/HomeView.vue'

describe('HomeView', () => {
  it('describes the application purpose', () => {
    const wrapper = mount(HomeView, { global: { stubs: { RouterLink: RouterLinkStub } } })

    expect(wrapper.text()).toContain('Light Scheduler')
    expect(wrapper.text()).toContain('frontend-only')
    expect(wrapper.text()).toContain('CSV files')
  })

  it('links to every feature page and the scheduler CTA', () => {
    const wrapper = mount(HomeView, { global: { stubs: { RouterLink: RouterLinkStub } } })
    const links = wrapper.findAllComponents(RouterLinkStub)
    const paths = links.map((link) => link.props('to'))

    expect(paths).toContain('/scheduler')
    expect(paths).toContain('/employees')
    expect(paths).toContain('/summary')
    expect(paths).toContain('/history')
    expect(paths).toContain('/csv')
  })
})
