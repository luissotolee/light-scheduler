import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { isLocale, readInitialLocale, useLocaleStore } from '@/shared/stores/locale'
import type { Locale } from '@/shared/i18n/types'

const STORAGE_KEY = 'light-scheduler.locale'

describe('locale store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.lang = 'en'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults to English and syncs the document language', () => {
    const store = useLocaleStore()

    expect(store.locale).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('persists the selected locale and updates the document language', async () => {
    const store = useLocaleStore()

    store.setLocale('es')
    await nextTick()

    expect(store.locale).toBe('es')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('es')
    expect(document.documentElement.lang).toBe('es')
  })

  it('reads a stored supported locale on creation', () => {
    localStorage.setItem(STORAGE_KEY, 'es')
    setActivePinia(createPinia())

    expect(useLocaleStore().locale).toBe('es')
  })

  it('rejects invalid stored values and falls back to English', () => {
    localStorage.setItem(STORAGE_KEY, 'fr')
    setActivePinia(createPinia())

    expect(useLocaleStore().locale).toBe('en')
    expect(readInitialLocale()).toBe('en')
  })

  it('ignores invalid runtime locale values', () => {
    const store = useLocaleStore()

    store.setLocale('fr' as Locale)

    expect(store.locale).toBe('en')
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('falls back to English when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('unavailable')
    })

    expect(readInitialLocale()).toBe('en')
  })

  it('still switches in memory when persisting throws', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('unavailable')
    })
    const store = useLocaleStore()

    store.setLocale('es')
    await nextTick()

    expect(store.locale).toBe('es')
    expect(document.documentElement.lang).toBe('es')
  })

  it('guards locale values', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('es')).toBe(true)
    expect(isLocale('fr')).toBe(false)
    expect(isLocale(null)).toBe(false)
  })
})
