import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useKeyboardInset } from '@/shared/composables/useKeyboardInset'

const Probe = defineComponent({
  setup() {
    useKeyboardInset()
    return {}
  },
  template: '<span>probe</span>',
})

interface FakeViewport {
  height: number
  offsetTop: number
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  resizeListener?: () => void
}

function stubVisualViewport(height: number, offsetTop = 0): FakeViewport {
  const viewport: FakeViewport = {
    height,
    offsetTop,
    addEventListener: vi.fn((type: string, listener: () => void) => {
      if (type === 'resize') viewport.resizeListener = listener
    }),
    removeEventListener: vi.fn(),
  }
  Object.defineProperty(window, 'visualViewport', {
    configurable: true,
    value: viewport,
  })
  return viewport
}

describe('useKeyboardInset', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    Reflect.deleteProperty(window, 'visualViewport')
    document.documentElement.style.removeProperty('--keyboard-inset')
    document.documentElement.style.removeProperty('--visual-viewport-height')
  })

  it('does nothing when visualViewport is unavailable', () => {
    const wrapper = mount(Probe)
    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('')
    wrapper.unmount()
  })

  it('writes the keyboard inset from the visual viewport', () => {
    stubVisualViewport(500)
    const wrapper = mount(Probe)

    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe(
      `${window.innerHeight - 500}px`,
    )
    expect(document.documentElement.style.getPropertyValue('--visual-viewport-height')).toBe(
      '500px',
    )
    wrapper.unmount()
  })

  it('updates on resize and cleans up on unmount', () => {
    const viewport = stubVisualViewport(800)
    const wrapper = mount(Probe)
    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('0px')

    viewport.height = 400
    viewport.resizeListener?.()

    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe(
      `${window.innerHeight - 400}px`,
    )

    wrapper.unmount()
    expect(viewport.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('')
  })
})
