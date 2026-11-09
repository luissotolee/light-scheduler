export interface TargetResolution {
  element: HTMLElement | null
  rect: DOMRect | null
}

function findWithinScope(scope: Element | Document, testId: string): HTMLElement[] {
  const escaped = testId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return Array.from(scope.querySelectorAll(`[data-test="${escaped}"]`))
}

export function resolveTarget(
  testId: string,
  options: { within?: string; index?: number } = {},
): TargetResolution {
  const { within, index = 0 } = options

  let scope: Element | Document = document

  if (within) {
    const escaped = within.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const withinEl = document.querySelector(`[data-test="${escaped}"]`)
    if (!withinEl) return { element: null, rect: null }
    scope = withinEl
  }

  const candidates = findWithinScope(scope, testId)

  if (candidates.length === 0) return { element: null, rect: null }

  const element = candidates[Math.min(index, candidates.length - 1)]
  const rect = element.getBoundingClientRect()

  return { element, rect }
}

export async function waitForTarget(
  testId: string,
  options: { within?: string; index?: number; timeoutMs?: number } = {},
): Promise<TargetResolution> {
  const { timeoutMs = 5000, ...resolveOptions } = options
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const result = resolveTarget(testId, resolveOptions)
    if (result.element) return result
    await new Promise((r) => setTimeout(r, 50))
  }

  return { element: null, rect: null }
}

export function scrollIntoView(element: HTMLElement): void {
  element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' })
}

export function getRectCenter(rect: DOMRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

export function clickElement(element: HTMLElement): void {
  element.click()
}

export function pointerClickElement(element: HTMLElement): void {
  const rect = element.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const events = [
    new PointerEvent('pointerdown', { clientX: centerX, clientY: centerY, bubbles: true }),
    new PointerEvent('pointerup', { clientX: centerX, clientY: centerY, bubbles: true }),
    new PointerEvent('click', { clientX: centerX, clientY: centerY, bubbles: true }),
  ]

  events.forEach((e) => element.dispatchEvent(e))
}

export function pressKey(element: HTMLElement, key: string): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true })
  element.dispatchEvent(event)
}

export function fillInput(element: HTMLElement, value: string): void {
  const input =
    element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      ? element
      : element.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')

  if (input) {
    input.value = value
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.dispatchEvent(new Event('blur'))
  } else if (element.contentEditable === 'true') {
    element.textContent = value
    element.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}