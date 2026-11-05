import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutView from '@/views/AboutView.vue'

describe('AboutView', () => {
  it('describes the stack', () => {
    const wrapper = mount(AboutView)

    expect(wrapper.find('h1').text()).toBe('About this project')
    const text = wrapper.text()
    expect(text).toContain('Vue 3')
    expect(text).toContain('Vite')
    expect(text).toContain('Vitest')
    expect(text).toContain('GitHub Actions')
  })
})
