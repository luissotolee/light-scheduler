import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  resolveTarget,
  waitForTarget,
  getRectCenter,
  clickElement,
  pointerClickElement,
  pressKey,
  fillInput,
  prefersReducedMotion,
  isPhoneViewport,
  scrollIntoView,
  scrollToTop,
} from '@/modules/demo/utils/dom'

describe('dom utils', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('resolveTarget', () => {
    it('finds element by data-test', () => {
      const el = document.createElement('div')
      el.setAttribute('data-test', 'my-button')
      document.body.appendChild(el)

      const result = resolveTarget('my-button')
      expect(result.element).toBe(el)
      expect(result.rect).toBeDefined()
    })

    it('returns null when element not found', () => {
      const result = resolveTarget('missing')
      expect(result.element).toBeNull()
      expect(result.rect).toBeNull()
    })

    it('uses within scope', () => {
      const container = document.createElement('div')
      container.setAttribute('data-test', 'container')
      const inner = document.createElement('button')
      inner.setAttribute('data-test', 'inner-btn')
      container.appendChild(inner)
      document.body.appendChild(container)

      const result = resolveTarget('inner-btn', { within: 'container' })
      expect(result.element).toBe(inner)
    })

    it('returns null when within scope not found', () => {
      const result = resolveTarget('inner', { within: 'missing-container' })
      expect(result.element).toBeNull()
    })

    it('uses index for multiple matches', () => {
      const el1 = document.createElement('button')
      el1.setAttribute('data-test', 'dup-btn')
      const el2 = document.createElement('button')
      el2.setAttribute('data-test', 'dup-btn')
      document.body.appendChild(el1)
      document.body.appendChild(el2)

      const result0 = resolveTarget('dup-btn', { index: 0 })
      const result1 = resolveTarget('dup-btn', { index: 1 })

      expect(result0.element).toBe(el1)
      expect(result1.element).toBe(el2)
    })
  })

  describe('waitForTarget', () => {
    it('resolves immediately when element exists', async () => {
      const el = document.createElement('div')
      el.setAttribute('data-test', 'wait-me')
      document.body.appendChild(el)

      const result = await waitForTarget('wait-me', { timeoutMs: 100 })
      expect(result.element).toBe(el)
    })

    it('waits for element to appear', async () => {
      const promise = waitForTarget('late-element', { timeoutMs: 500 })

      setTimeout(() => {
        const el = document.createElement('div')
        el.setAttribute('data-test', 'late-element')
        document.body.appendChild(el)
      }, 50)

      const result = await promise
      expect(result.element).not.toBeNull()
    })

    it('returns null on timeout', async () => {
      const result = await waitForTarget('never-appears', { timeoutMs: 50 })
      expect(result.element).toBeNull()
    })
  })

  describe('scrollIntoView', () => {
    it('centers the element in the viewport', () => {
      const el = document.createElement('div')
      const scrollSpy = vi.fn()
      el.scrollIntoView = scrollSpy

      scrollIntoView(el)

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'center',
        inline: 'center',
      })
    })
  })

  describe('scrollToTop', () => {
    it('resets the page scroll position', () => {
      const scroller = document.scrollingElement ?? document.documentElement
      scroller.scrollTop = 480
      scroller.scrollLeft = 120

      scrollToTop()

      expect(scroller.scrollTop).toBe(0)
      expect(scroller.scrollLeft).toBe(0)
    })
  })

  describe('getRectCenter', () => {
    it('calculates center of rect', () => {
      const rect = { left: 10, top: 20, width: 100, height: 50, right: 110, bottom: 70, x: 10, y: 20, toJSON: () => {} } as DOMRect
      const center = getRectCenter(rect)
      expect(center.x).toBe(60)
      expect(center.y).toBe(45)
    })
  })

  describe('clickElement', () => {
    it('dispatches click event', () => {
      const el = document.createElement('button')
      const clickSpy = vi.spyOn(el, 'click')
      clickElement(el)
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('pointerClickElement', () => {
    it('dispatches pointer events', () => {
      const el = document.createElement('button')
      el.getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 50, right: 110, bottom: 70, x: 10, y: 20, toJSON: () => {} } as DOMRect)
      const dispatchSpy = vi.spyOn(el, 'dispatchEvent')

      pointerClickElement(el)

      expect(dispatchSpy).toHaveBeenCalledTimes(3)
      const events = dispatchSpy.mock.calls.map((c) => c[0])
      expect(events[0].type).toBe('pointerdown')
      expect(events[1].type).toBe('pointerup')
      expect(events[2].type).toBe('click')
    })

    it('dispatches the pointer sequence at a fractional point', () => {
      const el = document.createElement('div')
      el.getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 50, right: 110, bottom: 70, x: 10, y: 20, toJSON: () => ({}) } as DOMRect)
      const handler = vi.fn()
      el.addEventListener('pointerdown', handler)

      pointerClickElement(el, { x: 0.25, y: 0.5 })

      expect(handler.mock.calls[0][0].clientX).toBe(35)
      expect(handler.mock.calls[0][0].clientY).toBe(45)
    })
  })

  describe('pressKey', () => {
    it('dispatches keydown with modifiers', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const handler = vi.fn()
      el.addEventListener('keydown', handler)

      pressKey(el, 'Shift+ArrowRight')

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler.mock.calls[0][0]).toMatchObject({
        key: 'ArrowRight',
        shiftKey: true,
      })
    })

    it('dispatches keydown event', () => {
      const el = document.createElement('input')
      const dispatchSpy = vi.spyOn(el, 'dispatchEvent')

      pressKey(el, 'Enter')

      expect(dispatchSpy).toHaveBeenCalled()
      const event = dispatchSpy.mock.calls[0][0] as KeyboardEvent
      expect(event.type).toBe('keydown')
      expect(event.key).toBe('Enter')
    })
  })

  describe('fillInput', () => {
    it('sets value on input element', () => {
      const el = document.createElement('input')
      const dispatchSpy = vi.spyOn(el, 'dispatchEvent')

      fillInput(el, 'test value')

      expect(el.value).toBe('test value')
      expect(dispatchSpy).toHaveBeenCalledTimes(3)
      expect(dispatchSpy.mock.calls[0][0].type).toBe('input')
      expect(dispatchSpy.mock.calls[1][0].type).toBe('change')
      expect(dispatchSpy.mock.calls[2][0].type).toBe('blur')
    })

    it('checks a checkbox or switch input from a truthy value', () => {
      const el = document.createElement('input')
      el.type = 'checkbox'
      document.body.appendChild(el)
      const onChange = vi.fn()
      el.addEventListener('change', onChange)

      fillInput(el, 'true')
      expect(el.checked).toBe(true)
      expect(onChange).toHaveBeenCalledTimes(1)

      fillInput(el, 'false')
      expect(el.checked).toBe(false)
      expect(onChange).toHaveBeenCalledTimes(2)
    })

    it('sets value on an input nested inside the target element', () => {
      const wrapper = document.createElement('span')
      const input = document.createElement('input')
      wrapper.appendChild(input)
      const dispatchSpy = vi.spyOn(input, 'dispatchEvent')

      fillInput(wrapper, '42')

      expect(input.value).toBe('42')
      expect(dispatchSpy).toHaveBeenCalledTimes(3)
    })

it('sets textContent on contenteditable', () => {
    const el = document.createElement('div')
    el.contentEditable = 'true'
    const dispatchSpy = vi.spyOn(el, 'dispatchEvent')

    fillInput(el, 'editable text')

    expect(el.textContent).toBe('editable text')
    expect(dispatchSpy).toHaveBeenCalledTimes(1)
  })
  })

  describe('prefersReducedMotion', () => {
    it('returns matchMedia result', () => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
      expect(prefersReducedMotion()).toBe(true)

      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
      expect(prefersReducedMotion()).toBe(false)
    })

    it('returns false when matchMedia throws', () => {
      vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => { throw new Error() }))
      expect(prefersReducedMotion()).toBe(false)
    })
  })

  describe('isPhoneViewport', () => {
    it('returns the phone media query result', () => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
      expect(isPhoneViewport()).toBe(true)

      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
      expect(isPhoneViewport()).toBe(false)
    })

    it('returns false when matchMedia throws', () => {
      vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => { throw new Error() }))
      expect(isPhoneViewport()).toBe(false)
    })
  })
})