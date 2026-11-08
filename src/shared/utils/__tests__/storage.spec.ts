import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  readJson,
  readStorageValue,
  removeStorageValue,
  writeJson,
  writeStorageValue,
} from '@/shared/utils/storage'

describe('storage utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('round-trips a stored value', () => {
    expect(writeStorageValue('key', 'value')).toBe(true)
    expect(readStorageValue('key')).toBe('value')
  })

  it('returns null for a missing key', () => {
    expect(readStorageValue('missing')).toBeNull()
  })

  it('readJson returns null for a missing key without calling the validator', () => {
    const validate = vi.fn(() => 'value')

    expect(readJson('missing', validate)).toBeNull()
    expect(validate).not.toHaveBeenCalled()
  })

  it('readJson returns null for malformed JSON', () => {
    localStorage.setItem('broken', '{not json')

    expect(readJson('broken', () => 'value')).toBeNull()
  })

  it('readJson returns null when the validator rejects the parsed value', () => {
    writeJson('key', { valid: false })

    expect(readJson('key', () => null)).toBeNull()
  })

  it('readJson parses and returns a validated value', () => {
    writeJson('key', { valid: true })

    expect(
      readJson('key', (value) => (typeof value === 'object' && value !== null ? value : null)),
    ).toEqual({ valid: true })
  })

  it('writeJson never throws when the value cannot be serialized', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular

    expect(() => writeJson('key', circular)).not.toThrow()
    expect(readStorageValue('key')).toBeNull()
  })

  it('falls back safely when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(readStorageValue('key')).toBeNull()
    expect(readJson('key', () => 'value')).toBeNull()
  })

  it('returns false when setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    expect(writeStorageValue('key', 'value')).toBe(false)
    expect(() => writeJson('key', { value: true })).not.toThrow()
  })

  it('is safe when removeItem throws', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(() => removeStorageValue('key')).not.toThrow()
  })

  it('removes a stored value and tolerates an absent key', () => {
    writeStorageValue('key', 'value')

    removeStorageValue('key')
    expect(readStorageValue('key')).toBeNull()

    expect(() => removeStorageValue('key')).not.toThrow()
  })

  it('is safe when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(readStorageValue('key')).toBeNull()
    expect(writeStorageValue('key', 'value')).toBe(false)
    expect(() => removeStorageValue('key')).not.toThrow()
  })
})
