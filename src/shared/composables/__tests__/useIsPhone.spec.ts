import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useIsPhone } from '@/shared/composables/useIsPhone'

interface Listener {
  (event: { matches: boolean }): void
}

function stubMatchMedia(matches: boolean): { listeners: Listener[]; removeEventListener: () => void } {
  const listeners: Listener[] = []
  const removeEventListener = vi.fn()
  const mql = {
    matches,
    addEventListener: vi.fn((_type: string, listener: Listener) => {
      listeners.push(listener)
    }),
    removeEventListener: vi.fn((_type: string, listener: Listener) => {
      removeEventListener()
      const index = listeners.indexOf(listener)
      if (index >= 0) listeners.splice(index, 1)
    }),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => mql))
  return { listeners, removeEventListener }
}

const Probe = defineComponent({
  setup() {
    const isPhone = useIsPhone()
    return { isPhone }
  },
  template: '<span data-test="probe">{{ isPhone ? "phone" : "desktop" }}</span>',
})

describe('useIsPhone', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('falls back to desktop when matchMedia is unavailable', () => {
    const wrapper = mount(Probe)
    expect(wrapper.get('[data-test="probe"]').text()).toBe('desktop')
  })

  it('initializes from the media query result', () => {
    stubMatchMedia(true)
    const wrapper = mount(Probe)
    expect(wrapper.get('[data-test="probe"]').text()).toBe('phone')
  })

  it('reacts to media query changes', async () => {
    const { listeners } = stubMatchMedia(false)
    const wrapper = mount(Probe)
    expect(wrapper.get('[data-test="probe"]').text()).toBe('desktop')

    listeners[0]?.({ matches: true })
    await nextTick()

    expect(wrapper.get('[data-test="probe"]').text()).toBe('phone')
  })

  it('removes the media query listener on unmount', () => {
    const { removeEventListener } = stubMatchMedia(false)
    const wrapper = mount(Probe)
    wrapper.unmount()
    expect(removeEventListener).toHaveBeenCalled()
  })
})
