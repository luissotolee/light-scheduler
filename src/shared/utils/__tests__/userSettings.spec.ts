import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LEGACY_LOCALE_STORAGE_KEY,
  LEGACY_SCHEDULER_SETTINGS_STORAGE_KEY,
  USER_SETTINGS_STORAGE_KEY,
  parseUserSettings,
  parseUserSettingsEntry,
  readUserSettings,
  writeUserSettingsLocale,
  writeUserSettingsScheduler,
} from '@/shared/utils/userSettings'

const CUSTOM_SETTINGS = { startTime: '08:00', endTime: '16:00', slotMinutes: 15 }

function storedSettings(): unknown {
  const raw = localStorage.getItem(USER_SETTINGS_STORAGE_KEY)
  return raw === null ? null : JSON.parse(raw)
}

describe('user settings storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stores locale and scheduler settings in one entry', () => {
    writeUserSettingsLocale('es')
    writeUserSettingsScheduler(CUSTOM_SETTINGS)

    expect(storedSettings()).toEqual({
      version: 1,
      locale: 'es',
      scheduler: CUSTOM_SETTINGS,
    })
  })

  it('preserves scheduler settings when the locale changes', () => {
    writeUserSettingsScheduler(CUSTOM_SETTINGS)
    writeUserSettingsLocale('es')

    expect(storedSettings()).toEqual({
      version: 1,
      locale: 'es',
      scheduler: CUSTOM_SETTINGS,
    })
  })

  it('preserves the locale when scheduler settings change', () => {
    writeUserSettingsLocale('es')
    writeUserSettingsScheduler(CUSTOM_SETTINGS)

    expect(readUserSettings()).toEqual({
      locale: 'es',
      scheduler: CUSTOM_SETTINGS,
      hasScheduler: true,
    })
  })

  it('migrates legacy keys into the unified entry on the next write', () => {
    localStorage.setItem(LEGACY_LOCALE_STORAGE_KEY, 'es')
    localStorage.setItem(LEGACY_SCHEDULER_SETTINGS_STORAGE_KEY, JSON.stringify(CUSTOM_SETTINGS))

    expect(readUserSettings()).toEqual({
      locale: 'es',
      scheduler: CUSTOM_SETTINGS,
      hasScheduler: true,
    })

    writeUserSettingsLocale('en')

    expect(storedSettings()).toEqual({
      version: 1,
      locale: 'en',
      scheduler: CUSTOM_SETTINGS,
    })
    expect(localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(LEGACY_SCHEDULER_SETTINGS_STORAGE_KEY)).toBeNull()
  })

  it('ignores invalid legacy values', () => {
    localStorage.setItem(LEGACY_LOCALE_STORAGE_KEY, 'fr')
    localStorage.setItem(LEGACY_SCHEDULER_SETTINGS_STORAGE_KEY, 'not json')

    expect(readUserSettings()).toEqual({
      locale: null,
      scheduler: undefined,
      hasScheduler: false,
    })
  })

  it('ignores an unsupported persisted locale', () => {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, JSON.stringify({ version: 1, locale: 'fr' }))

    expect(readUserSettings().locale).toBeNull()
  })

  it('rejects snapshots with an unknown version or invalid shape', () => {
    expect(parseUserSettings({ version: 2, locale: 'es' })).toBeNull()
    expect(parseUserSettings('nope')).toBeNull()
    expect(parseUserSettings(null)).toBeNull()
  })

  it('parses a raw storage entry and tolerates corrupt JSON', () => {
    expect(parseUserSettingsEntry(JSON.stringify({ version: 1, locale: 'es' }))).toEqual({
      locale: 'es',
      scheduler: undefined,
      hasScheduler: false,
    })
    expect(parseUserSettingsEntry('{not json')).toBeNull()
    expect(parseUserSettingsEntry(null)).toBeNull()
  })

  it('keeps legacy keys when the unified write fails', () => {
    localStorage.setItem(LEGACY_LOCALE_STORAGE_KEY, 'es')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    writeUserSettingsLocale('en')

    expect(localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY)).toBe('es')
  })
})
