import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useTwoFingerPan } from '@/shared/composables/useTwoFingerPan'

const Probe = defineComponent({
  setup() {
    const element = ref<HTMLElement | null>(null)
    const enabled = ref(true)
    const { panning } = useTwoFingerPan({ element, enabled })
    return { element, panning }
  },
  template: '<div ref="element" data-test="scroller">{{ panning }}</div>',
})

function touch(element: Element, type: string, pointerId: number, x: number, y = 0): void {
  element.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId,
      pointerType: 'touch',
      clientX: x,
      clientY: y,
    }),
  )
}

describe('useTwoFingerPan', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pans the scroller with two touch pointers', async () => {
    const wrapper = mount(Probe)
    await nextTick()
    const scroller = wrapper.get('[data-test="scroller"]').element as HTMLElement

    touch(scroller, 'pointerdown', 1, 100, 100)
    touch(scroller, 'pointerdown', 2, 200, 100)
    await nextTick()
    expect(scroller.textContent).toBe('true')

    touch(scroller, 'pointermove', 1, 80, 90)
    touch(scroller, 'pointermove', 2, 180, 90)

    expect(scroller.scrollLeft).toBe(20)
    expect(scroller.scrollTop).toBe(10)
  })

  it('does not pan with a single touch pointer', async () => {
    const wrapper = mount(Probe)
    await nextTick()
    const scroller = wrapper.get('[data-test="scroller"]').element as HTMLElement

    touch(scroller, 'pointerdown', 1, 100, 100)
    touch(scroller, 'pointermove', 1, 40, 100)

    expect(scroller.textContent).toBe('false')
    expect(scroller.scrollLeft).toBe(0)
  })

  it('ignores mouse pointers', async () => {
    const wrapper = mount(Probe)
    await nextTick()
    await nextTick()
    const scroller = wrapper.get('[data-test="scroller"]').element as HTMLElement

    scroller.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: 'mouse',
        clientX: 100,
        clientY: 100,
      }),
    )
    scroller.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 2,
        pointerType: 'mouse',
        clientX: 200,
        clientY: 100,
      }),
    )

    expect(scroller.textContent).toBe('false')
  })
})
