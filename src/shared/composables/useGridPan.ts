import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

interface PanStart {
  pointerId: number
  startX: number
  startY: number
  scrollLeft: number
  scrollTop: number
  target: EventTarget | null
}

export interface UseGridPanOptions {
  element: Ref<HTMLElement | null>
  enabled: Readonly<Ref<boolean>>
  onPanStart?: () => void
  onPanEnd?: () => void
  thresholdPx?: number
}

const DEFAULT_THRESHOLD_PX = 8

export function useGridPan(options: UseGridPanOptions): { panning: Ref<boolean> } {
  const panning = ref(false)
  const threshold = options.thresholdPx ?? DEFAULT_THRESHOLD_PX
  let pending: PanStart | null = null
  let active: PanStart | null = null
  let attached: HTMLElement | null = null

  function isIgnored(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest('[data-pan-ignore="true"]') !== null
  }

  function endPan(): void {
    if (!panning.value) return
    panning.value = false
    active = null
    options.onPanEnd?.()
  }

  function reset(): void {
    pending = null
    endPan()
  }

  function handlePointerDown(event: PointerEvent): void {
    if (!options.enabled.value || event.pointerType !== 'touch') return
    if (pending || panning.value) return
    if (isIgnored(event.target)) return

    const element = options.element.value
    if (!element) return

    pending = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
      target: event.target,
    }
  }

  function handlePointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return

    if (active && active.pointerId === event.pointerId) {
      const element = options.element.value
      if (!element) return
      event.preventDefault()
      element.scrollLeft = active.scrollLeft - (event.clientX - active.startX)
      element.scrollTop = active.scrollTop - (event.clientY - active.startY)
      return
    }

    const state = pending
    if (!state || state.pointerId !== event.pointerId) return

    const deltaX = event.clientX - state.startX
    const deltaY = event.clientY - state.startY
    if (Math.abs(deltaX) <= threshold && Math.abs(deltaY) <= threshold) return

    pending = null

    if (isIgnored(state.target)) return

    active = state
    panning.value = true
    options.onPanStart?.()

    const element = options.element.value
    if (!element) {
      endPan()
      return
    }

    event.preventDefault()
    element.scrollLeft = state.scrollLeft - deltaX
    element.scrollTop = state.scrollTop - deltaY
  }

  function handlePointerEnd(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return

    if (active && active.pointerId === event.pointerId) {
      endPan()
      return
    }

    if (pending && pending.pointerId === event.pointerId) {
      pending = null
    }
  }

  const pointerDown = handlePointerDown
  const pointerMove = handlePointerMove
  const pointerUp = handlePointerEnd
  const pointerCancel = handlePointerEnd

  function detach(): void {
    if (!attached) return
    attached.removeEventListener('pointerdown', pointerDown, true)
    attached.removeEventListener('pointermove', pointerMove, { capture: true })
    attached.removeEventListener('pointerup', pointerUp, true)
    attached.removeEventListener('pointercancel', pointerCancel, true)
    attached = null
    reset()
  }

  function attach(element: HTMLElement | null): void {
    detach()
    if (!element) return
    attached = element
    element.addEventListener('pointerdown', pointerDown, true)
    element.addEventListener('pointermove', pointerMove, { capture: true, passive: false })
    element.addEventListener('pointerup', pointerUp, true)
    element.addEventListener('pointercancel', pointerCancel, true)
  }

  onMounted(() => attach(options.element.value))
  watch(options.element, attach)
  watch(options.enabled, (enabled) => {
    if (!enabled) reset()
  })

  onBeforeUnmount(detach)

  return { panning }
}
