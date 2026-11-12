import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import AppDialog from '@/shared/components/AppDialog.vue'
import { en } from '@/shared/i18n/messages/en'

enableAutoUnmount(afterEach)

function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal('matchMedia', () => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('AppDialog', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mountDialog() {
    return mount(AppDialog, {
      props: { visible: true, header: 'Settings' },
      slots: { default: '<p data-test="dialog-content">Body</p>' },
      global: { plugins: [PrimeVue] },
    })
  }

  it('keeps the default dialog without a back button on desktop', async () => {
    stubMatchMedia(false)
    mountDialog()
    await nextTick()

    expect(document.body.textContent).toContain('Settings')
    expect(document.body.querySelector('[data-test="dialog-content"]')).not.toBeNull()
    expect(document.body.querySelector('[data-test="dialog-back"]')).toBeNull()
  })

  it('renders a full-screen header with a back button on phones', async () => {
    stubMatchMedia(true)
    mountDialog()
    await nextTick()

    const back = document.body.querySelector<HTMLButtonElement>('[data-test="dialog-back"]')
    expect(back).not.toBeNull()
    expect(back?.getAttribute('aria-label')).toBe(en['common.back'])
    expect(document.body.querySelector('.app-dialog--phone')).not.toBeNull()
    expect(document.body.querySelector('[data-test="dialog-content"]')).not.toBeNull()
  })

  it('emits update:visible false when the phone back button is used', async () => {
    stubMatchMedia(true)
    const wrapper = mountDialog()
    await nextTick()

    const back = document.body.querySelector<HTMLButtonElement>('[data-test="dialog-back"]')
    back?.click()
    await nextTick()

    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })
})
