import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ShiftBar from '@/modules/scheduler/components/ShiftBar.vue'
import type { Shift } from '@/types'

const shift: Shift = {
  id: 'shift-1',
  memberId: 'member-1',
  weekday: 'monday',
  startMinute: 540,
  endMinute: 600,
}

async function pointer(element: Element, type: string, init: PointerEventInit = {}): Promise<void> {
  element.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      ...init,
    }),
  )
  await nextTick()
}

function stubTrackRect(width = 1536): void {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width,
    height: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect)
}

describe('ShiftBar', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    Object.defineProperty(Element.prototype, 'setPointerCapture', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
    Object.defineProperty(Element.prototype, 'releasePointerCapture', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
    stubTrackRect()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    Reflect.deleteProperty(Element.prototype, 'setPointerCapture')
    Reflect.deleteProperty(Element.prototype, 'releasePointerCapture')
  })

  function mountBar(overrides: Partial<Shift> = {}, disabled = false) {
    return mount(ShiftBar, {
      props: {
        shift: { ...shift, ...overrides },
        memberName: 'Ada',
        duty: 'employee',
        disabled,
      },
    })
  }

  it('positions the bar from the shift minute range as percentages', () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    expect(bar.attributes('style')).toContain('left: 0%')
    expect(bar.attributes('style')).toContain('width: 6.25%')
    expect(bar.attributes('aria-label')).toContain('Shift for Ada: 09:00 to 10:00')
    expect(bar.attributes('title')).toBe('Right-click to remove this shift')
    expect(wrapper.text()).toContain('09:00–10:00')
  })

  it('positions a later bar with a percentage offset', () => {
    const wrapper = mountBar({ startMinute: 1020, endMinute: 1200 })
    const bar = wrapper.find('[data-test="shift-bar"]')

    expect(bar.attributes('style')).toContain('left: 50%')
    expect(bar.attributes('style')).toContain('width: 18.75%')
  })

  it('emits remove on right-click and prevents the browser menu', async () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    bar.element.dispatchEvent(event)
    await nextTick()

    expect(wrapper.emitted('remove')).toEqual([['shift-1']])
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.emitted('resize')).toBeUndefined()
  })

  it('adds the duty modifier class and selected state', () => {
    const wrapper = mount(ShiftBar, {
      props: {
        shift,
        memberName: 'Ada',
        duty: 'head_manager',
        selected: true,
      },
    })

    const bar = wrapper.find('[data-test="shift-bar"]')
    expect(bar.classes()).toContain('shift-bar--head-manager')
    expect(bar.classes()).toContain('shift-bar--selected')
  })

  it('moves the bar when its body is dragged', async () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await pointer(bar.element, 'pointerdown', { clientX: 100 })
    await pointer(bar.element, 'pointermove', { clientX: 148 })
    await pointer(bar.element, 'pointerup', { clientX: 148 })

    expect(wrapper.emitted('moveStart')).toEqual([['shift-1']])
    expect(wrapper.emitted('moveDrag')).toEqual([
      [{ id: 'shift-1', startMinute: 570, endMinute: 630, clientY: 0 }],
    ])
    expect(wrapper.emitted('moveEnd')).toEqual([
      [{ id: 'shift-1', startMinute: 570, endMinute: 630, clientY: 0 }],
    ])
    expect(wrapper.emitted('resize')).toBeUndefined()
  })

  it('clamps a moved bar to the day window', async () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await pointer(bar.element, 'pointerdown', { clientX: 100 })
    await pointer(bar.element, 'pointermove', { clientX: -1000 })
    await pointer(bar.element, 'pointerup', { clientX: -1000 })

    expect(wrapper.emitted('moveEnd')).toEqual([
      [{ id: 'shift-1', startMinute: 540, endMinute: 600, clientY: 0 }],
    ])
    expect(wrapper.emitted('resize')).toBeUndefined()
  })

  it('resizes from the end handle', async () => {
    const wrapper = mountBar()
    const handle = wrapper.find('[data-test="resize-end"]')

    await pointer(handle.element, 'pointerdown', { clientX: 100 })
    await pointer(handle.element, 'pointermove', { clientX: 148 })
    await pointer(handle.element, 'pointerup', { clientX: 148 })

    expect(wrapper.emitted('resize')).toEqual([
      [{ id: 'shift-1', startMinute: 540, endMinute: 630 }],
    ])
  })

  it('resizes from the start handle and enforces the minimum duration', async () => {
    const wrapper = mountBar({ startMinute: 600, endMinute: 720 })
    const handle = wrapper.find('[data-test="resize-start"]')

    await pointer(handle.element, 'pointerdown', { clientX: 100 })
    await pointer(handle.element, 'pointermove', { clientX: 52 })
    await pointer(handle.element, 'pointerup', { clientX: 52 })

    expect(wrapper.emitted('resize')).toEqual([
      [{ id: 'shift-1', startMinute: 570, endMinute: 720 }],
    ])

    const second = mountBar()
    const startHandle = second.find('[data-test="resize-start"]')
    await pointer(startHandle.element, 'pointerdown', { clientX: 100 })
    await pointer(startHandle.element, 'pointermove', { clientX: 1000 })
    await pointer(startHandle.element, 'pointerup', { clientX: 1000 })

    expect(second.emitted('resize')).toEqual([
      [{ id: 'shift-1', startMinute: 570, endMinute: 600 }],
    ])
  })

  it('does not start dragging on a secondary mouse button', async () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await pointer(bar.element, 'pointerdown', { button: 2, clientX: 100 })
    await pointer(bar.element, 'pointerup', { clientX: 100 })

    expect(wrapper.emitted('resize')).toBeUndefined()
  })

  it('ignores pointer movement without an active drag', async () => {
    const wrapper = mountBar()

    await pointer(wrapper.find('[data-test="shift-bar"]').element, 'pointermove', {
      clientX: 200,
    })

    expect(wrapper.emitted('resize')).toBeUndefined()
  })

  it('cancels a drag without emitting', async () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await pointer(bar.element, 'pointerdown', { clientX: 100 })
    await pointer(bar.element, 'pointermove', { clientX: 148 })
    await pointer(bar.element, 'pointercancel')

    expect(wrapper.emitted('resize')).toBeUndefined()
  })

  it('moves with arrow keys and resizes with shift plus arrows', async () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await bar.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('resize')).toEqual([
      [{ id: 'shift-1', startMinute: 570, endMinute: 630 }],
    ])

    await bar.trigger('keydown.shift', { key: 'ArrowRight' })
    expect(wrapper.emitted('resize')?.[1]).toEqual([
      { id: 'shift-1', startMinute: 540, endMinute: 630 },
    ])
  })

  it('keeps the minimum duration when resizing left with the keyboard', async () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await bar.trigger('keydown.shift', { key: 'ArrowLeft' })

    expect(wrapper.emitted('resize')).toEqual([
      [{ id: 'shift-1', startMinute: 540, endMinute: 570 }],
    ])
  })

  it('jumps to the start and end of the day with Home and End', async () => {
    const wrapper = mountBar({ startMinute: 600, endMinute: 660 })
    const bar = wrapper.find('[data-test="shift-bar"]')

    await bar.trigger('keydown', { key: 'End' })
    await bar.trigger('keydown', { key: 'Home' })

    expect(wrapper.emitted('resize')).toEqual([
      [{ id: 'shift-1', startMinute: 1440, endMinute: 1500 }],
      [{ id: 'shift-1', startMinute: 540, endMinute: 600 }],
    ])
  })

  it('does not emit when a keyboard move leaves the range unchanged', async () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await bar.trigger('keydown', { key: 'Home' })
    await bar.trigger('keydown', { key: 'PageDown' })

    expect(wrapper.emitted('resize')).toBeUndefined()
  })

  it('emits remove for Delete and Backspace', async () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await bar.trigger('keydown', { key: 'Delete' })
    await bar.trigger('keydown', { key: 'Backspace' })

    expect(wrapper.emitted('remove')).toEqual([['shift-1'], ['shift-1']])
  })

  it('is enabled by default', () => {
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    expect(bar.attributes('aria-disabled')).toBe('false')
    expect(bar.attributes('tabindex')).toBe('0')
    expect(bar.classes()).not.toContain('shift-bar--disabled')
  })

  it('marks a disabled bar and removes it from the tab order', () => {
    const wrapper = mountBar({}, true)
    const bar = wrapper.find('[data-test="shift-bar"]')

    expect(bar.attributes('aria-disabled')).toBe('true')
    expect(bar.attributes('tabindex')).toBe('-1')
    expect(bar.classes()).toContain('shift-bar--disabled')
  })

  it('blocks drag, keyboard, and context menu actions when disabled', async () => {
    const wrapper = mountBar({}, true)
    const bar = wrapper.find('[data-test="shift-bar"]')

    await pointer(bar.element, 'pointerdown', { clientX: 100 })
    await pointer(bar.element, 'pointermove', { clientX: 148 })
    await pointer(bar.element, 'pointerup', { clientX: 148 })

    await bar.trigger('keydown', { key: 'ArrowRight' })
    await bar.trigger('keydown', { key: 'Delete' })

    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    bar.element.dispatchEvent(event)
    await nextTick()

    expect(wrapper.emitted('resize')).toBeUndefined()
    expect(wrapper.emitted('remove')).toBeUndefined()
    expect(event.defaultPrevented).toBe(true)
  })

  it('uses a custom window and slot size for positioning and keyboard movement', async () => {
    const wrapper = mount(ShiftBar, {
      props: {
        shift,
        memberName: 'Ada',
        duty: 'employee',
        limits: { startMinute: 540, endMinute: 660, slotMinutes: 15 },
      },
    })
    const bar = wrapper.find('[data-test="shift-bar"]')

    expect(bar.attributes('style')).toContain('left: 0%')
    expect(bar.attributes('style')).toContain('width: 50%')

    await bar.trigger('keydown', { key: 'ArrowRight' })

    expect(wrapper.emitted('resize')).toEqual([
      [{ id: 'shift-1', startMinute: 555, endMinute: 615 }],
    ])
  })

  it('emits longPress after holding a shift with a touch pointer', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    vi.useFakeTimers()
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await pointer(bar.element, 'pointerdown', {
      pointerType: 'touch',
      isPrimary: true,
      clientX: 100,
      clientY: 10,
    })
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(wrapper.emitted('longPress')).toEqual([['shift-1']])
    expect(wrapper.emitted('moveCancel')).toEqual([[]])
    vi.useRealTimers()
  })

  it('cancels longPress when the finger moves', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    vi.useFakeTimers()
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await pointer(bar.element, 'pointerdown', {
      pointerType: 'touch',
      isPrimary: true,
      clientX: 100,
      clientY: 10,
    })
    await pointer(bar.element, 'pointermove', {
      pointerType: 'touch',
      isPrimary: true,
      clientX: 140,
      clientY: 10,
    })
    vi.advanceTimersByTime(500)
    await nextTick()

    expect(wrapper.emitted('longPress')).toBeUndefined()
    vi.useRealTimers()
  })

  it('does not remove on right-click on phones', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const wrapper = mountBar()
    const bar = wrapper.find('[data-test="shift-bar"]')

    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    bar.element.dispatchEvent(event)
    await nextTick()

    expect(wrapper.emitted('remove')).toBeUndefined()
    expect(event.defaultPrevented).toBe(true)
  })
})
