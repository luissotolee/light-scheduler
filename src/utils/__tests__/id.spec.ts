import { describe, expect, it, vi } from 'vitest'
import { createId } from '@/utils/id'

describe('createId', () => {
  it('uses crypto.randomUUID when available', () => {
    const uuid = '00000000-0000-4000-8000-000000000000'
    const spy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(uuid)

    expect(createId()).toBe(uuid)

    spy.mockRestore()
  })

  it('falls back to a time-based id when randomUUID is missing', () => {
    vi.stubGlobal('crypto', {})

    expect(createId()).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)

    vi.unstubAllGlobals()
  })
})
