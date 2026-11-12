import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

interface PanPointer {
  x: number
  y: number
}

interface PanStart {
  centroidX: number
  centroidY: number
  scrollLeft: number
  scrollTop: number
}

export interface UseTwoFingerPanOptions {
  element: Ref<HTMLElement | null>
  enabled: Readonly<Ref<boolean>>
  onPanStart?: () => void
  onPanEnd?: () => void
}

export function useTwoFingerPan(options: UseTwoFingerPanOptions): { panning: Ref<boolean> } {
  const panning = ref(false)
  const points = new Map<number, PanPointer>()
  let start: PanStart | null = null
  let attached: HTMLElement | null = null

  function centroid(): { x: number; y: number } {
    let x = 0
    let y = 0
    for (const point of points.values()) {
      x += point.x
      y += point.y
    }
    const size = points.size || 1
    return { x: x / size, y: y / size }
  }

  function startPan(): void {
    const element = options.element.value
    if (!element || panning.value) return
    const center = centroid()
    start = {
      centroidX: center.x,
      centroidY: center.y,
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
    }
    panning.value = true
    options.onPanStart?.()
  }

  function endPan(): void {
    if (!panning.value) return
    panning.value = false
    start = null
    options.onPanEnd?.()
  }

  function handlePointerDown(event: PointerEvent): void {
    if (!options.enabled.value || event.pointerType !== 'touch') return
    points.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (points.size === 2) startPan()
  }

  function handlePointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return
    if (!points.has(event.pointerId)) return
    points.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (!panning.value || !start) return
    const element = options.element.value
    if (!element) return

    event.preventDefault()
    const center = centroid()
    element.scrollLeft = start.scrollLeft - (center.x - start.centroidX)
    element.scrollTop = start.scrollTop - (center.y - start.centroidY)
  }

  function handlePointerEnd(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return
    points.delete(event.pointerId)
    if (points.size < 2) endPan()
  }

  function reset(): void {
    points.clear()
    endPan()
  }

  const pointerDown = handlePointerDown
  const pointerMove = handlePointerMove
  const pointerUp = handlePointerEnd
  const pointerCancel = handlePointerEnd

  function detach(): void {
    if (!attached) return
    attached.removeEventListener('pointerdown', pointerDown, true)
    attached.removeEventListener('pointermove', pointerMove, true)
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
