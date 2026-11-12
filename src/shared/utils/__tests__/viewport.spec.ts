import { describe, expect, it } from 'vitest'
import {
  PHONE_LANDSCAPE_MAX_HEIGHT,
  PHONE_LANDSCAPE_MAX_WIDTH,
  PHONE_MAX_WIDTH,
  PHONE_MEDIA_QUERY,
  computeKeyboardInset,
} from '@/shared/utils/viewport'

describe('viewport', () => {
  it('defines a phone media query for portrait and landscape phones', () => {
    expect(PHONE_MEDIA_QUERY).toContain(`(max-width: ${PHONE_MAX_WIDTH}px)`)
    expect(PHONE_MEDIA_QUERY).toContain(`(max-height: ${PHONE_LANDSCAPE_MAX_HEIGHT}px)`)
    expect(PHONE_MEDIA_QUERY).toContain(`(max-width: ${PHONE_LANDSCAPE_MAX_WIDTH}px)`)
  })

  it('reports no keyboard inset when the visual viewport matches the layout', () => {
    expect(computeKeyboardInset(800, 800, 0)).toBe(0)
  })

  it('reports the keyboard inset when the visual viewport shrinks', () => {
    expect(computeKeyboardInset(800, 500, 0)).toBe(300)
  })

  it('accounts for the visual viewport offset', () => {
    expect(computeKeyboardInset(800, 600, 100)).toBe(100)
  })

  it('never returns a negative inset', () => {
    expect(computeKeyboardInset(500, 800, 0)).toBe(0)
  })
})
