import { onBeforeUnmount, onMounted } from 'vue'
import { PHONE_MEDIA_QUERY, computeKeyboardInset } from '@/shared/utils/viewport'

function focusedEditable(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const active = document.activeElement
  if (!(active instanceof HTMLElement)) return null
  const editable =
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement ||
    active.isContentEditable
  return editable ? active : null
}

export function useKeyboardInset(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  let viewport: VisualViewport | null = null

  function applyInset(): void {
    if (!viewport) return
    const inset = computeKeyboardInset(
      window.innerHeight,
      viewport.height,
      viewport.offsetTop,
    )
    document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`)
    document.documentElement.style.setProperty('--visual-viewport-height', `${viewport.height}px`)
  }

  function keepFieldVisible(): void {
    if (!viewport) return
    const active = focusedEditable()
    if (!active || typeof active.scrollIntoView !== 'function') return

    const rect = active.getBoundingClientRect()
    const top = viewport.offsetTop
    const bottom = top + viewport.height
    const margin = 24
    if (rect.top < top + margin || rect.bottom > bottom - margin) {
      active.scrollIntoView({ block: 'center', inline: 'nearest' })
    }
  }

  function handleResize(): void {
    applyInset()
    window.setTimeout(keepFieldVisible, 250)
  }

  function handleScroll(): void {
    applyInset()
  }

  function handleFocusIn(event: FocusEvent): void {
    if (typeof window.matchMedia !== 'function') return
    if (!window.matchMedia(PHONE_MEDIA_QUERY).matches) return
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const editable =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target.isContentEditable
    if (!editable) return
    window.setTimeout(keepFieldVisible, 300)
  }

  onMounted(() => {
    document.addEventListener('focusin', handleFocusIn)

    viewport = window.visualViewport ?? null
    if (!viewport) return

    applyInset()
    viewport.addEventListener('resize', handleResize)
    viewport.addEventListener('scroll', handleScroll)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('focusin', handleFocusIn)
    if (!viewport) return
    viewport.removeEventListener('resize', handleResize)
    viewport.removeEventListener('scroll', handleScroll)
    document.documentElement.style.removeProperty('--keyboard-inset')
    document.documentElement.style.removeProperty('--visual-viewport-height')
    viewport = null
  })
}
