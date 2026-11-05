import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import HelloPrimeView from '@/views/HelloPrimeView.vue'

describe('HelloPrimeView', () => {
  beforeAll(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('renders the PrimeVue component samples', () => {
    const wrapper = mount(HelloPrimeView, {
      global: { plugins: [PrimeVue, ToastService] },
    })

    expect(wrapper.text()).toContain('Hello PrimeVue')
    expect(wrapper.text()).toContain('Buttons')
    expect(wrapper.text()).toContain('Form controls')
    expect(wrapper.findAll('button').length).toBeGreaterThan(0)
  })

  it('opens the dialog and fires a toast', async () => {
    const wrapper = mount(HelloPrimeView, {
      attachTo: document.body,
      global: { plugins: [PrimeVue, ToastService] },
    })

    const findButton = (label: string): HTMLButtonElement =>
      Array.from(document.querySelectorAll('button')).find((button) =>
        button.textContent?.includes(label),
      ) as HTMLButtonElement

    expect(findButton('Show toast')).toBeTruthy()
    findButton('Show toast').click()
    findButton('Open dialog').click()
    await wrapper.vm.$nextTick()

    expect(document.body.textContent).toContain('Dialogs, toasts, and other overlays')

    findButton('Got it').click()
    await wrapper.vm.$nextTick()

    wrapper.unmount()
  })
})
