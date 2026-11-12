import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useGridPan } from '@/shared/composables/useGridPan'

const Probe = defineComponent({
  setup() {
    const element = ref<HTMLElement | null>(null)
    const enabled = ref(true)
    const onPanStart = vi.fn()
    const onPanEnd = vi.fn()
    const { panning } = useGridPan({ element, enabled, onPanStart, onPanEnd })
    return { element, enabled, panning, onPanStart, onPanEnd }
  },
  template:
    '<div ref="element" data-test="scroller">{{ panning }}<span data-test="handle" data-pan-ignore="true" /></div>',
})

function touch(
  element: Element,
  type: string,
  x: number,
  y = 0,
  pointerType = 'touch',
  pointerId = 1,
): void {
  element.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId,
      pointerType,
      clientX: x,
      clientY: y,
    }),
  )
}

describe('useGridPan', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pans the scroller with a single touch pointer after the threshold', async () => {
    const wrapper = mount(Probe)
    await nextTick()
    const scroller = wrapper.get('[data-test="scroller"]').element as HTMLElement

    touch(scroller, 'pointerdown', 100, 100)
    touch(scroller, 'pointermove', 80, 90)
    await nextTick()

    expect(scroller.textContent).toContain('true')
    expect(scroller.scrollLeft).toBe(20)
    expect(scroller.scrollTop).toBe(10)
    expect(wrapper.vm.onPanStart).toHaveBeenCalledTimes(1)

    touch(scroller, 'pointerup', 80, 90)
    await nextTick()

    expect(scroller.textContent).toContain('false')
    expect(wrapper.vm.onPanEnd).toHaveBeenCalledTimes(1)
  })

  it('does not pan until the pointer moves past the threshold', async () => {
    const wrapper = mount(Probe)
    await nextTick()
    const scroller = wrapper.get('[data-test="scroller"]').element as HTMLElement

    touch(scroller, 'pointerdown', 100, 100)
    touch(scroller, 'pointermove', 104, 102)
    await nextTick()

    expect(scroller.textContent).toContain('false')
    expect(scroller.scrollLeft).toBe(0)
    expect(wrapper.vm.onPanStart).not.toHaveBeenCalled()
  })

  it('ignores touch pointers that start on a pan-ignore target', async () => {
    const wrapper = mount(Probe)
    await nextTick()
    const scroller = wrapper.get('[data-test="scroller"]').element as HTMLElement
    const handle = wrapper.get('[data-test="handle"]').element

    touch(handle, 'pointerdown', 100)
    touch(handle, 'pointermove', 40)
    await nextTick()

    expect(scroller.textContent).toContain('false')
    expect(scroller.scrollLeft).toBe(0)
  })

  it('stops a pending pan when the gesture target becomes ignored', async () => {
    const wrapper = mount(Probe)
    await nextTick()
    const scroller = wrapper.get('[data-test="scroller"]').element as HTMLElement
    const handle = wrapper.get('[data-test="handle"]').element

    handle.removeAttribute('data-pan-ignore')
    touch(handle, 'pointerdown', 100)
    handle.setAttribute('data-pan-ignore', 'true')
    touch(handle, 'pointermove', 40)
    await nextTick()

    expect(scroller.textContent).toContain('false')
    expect(scroller.scrollLeft).toBe(0)
  })

  it('ignores mouse pointers', async () => {
    const wrapper = mount(Probe)
    await nextTick()
    const scroller = wrapper.get('[data-test="scroller"]').element as HTMLElement

    touch(scroller, 'pointerdown', 100, 100, 'mouse')
    touch(scroller, 'pointermove', 40, 100, 'mouse')
    await nextTick()

    expect(scroller.textContent).toContain('false')
    expect(scroller.scrollLeft).toBe(0)
  })

  it('does nothing when disabled', async () => {
    const wrapper = mount(Probe)
    await nextTick()
    const scroller = wrapper.get('[data-test="scroller"]').element as HTMLElement
    wrapper.vm.enabled = false
    await nextTick()

    touch(scroller, 'pointerdown', 100, 100)
    touch(scroller, 'pointermove', 40, 100)
    await nextTick()

    expect(scroller.textContent).toContain('false')
    expect(scroller.scrollLeft).toBe(0)
  })

  it('ignores a second pointer while a pan is in progress', async () => {
    const wrapper = mount(Probe)
    await nextTick()
    const scroller = wrapper.get('[data-test="scroller"]').element as HTMLElement

    touch(scroller, 'pointerdown', 100, 100)
    touch(scroller, 'pointermove', 80, 90)
    touch(scroller, 'pointerdown', 200, 200, 'touch', 2)
    touch(scroller, 'pointermove', 0, 0, 'touch', 2)
    await nextTick()

    expect(scroller.scrollLeft).toBe(20)
    expect(scroller.scrollTop).toBe(10)
  })
})
