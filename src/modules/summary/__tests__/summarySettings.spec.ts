import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSummarySettingsStore } from '@/modules/summary/stores/summarySettings'
import { DEFAULT_SUMMARY_SETTINGS } from '@/shared/utils/summarySettings'
import { USER_SETTINGS_STORAGE_KEY } from '@/shared/utils/userSettings'

function storedSummary(): unknown {
  const raw = localStorage.getItem(USER_SETTINGS_STORAGE_KEY)
  return raw === null ? null : JSON.parse(raw).summary
}

describe('summary settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('uses the defaults when storage is empty', () => {
    const store = useSummarySettingsStore()

    expect(store.settings).toEqual(DEFAULT_SUMMARY_SETTINGS)
  })

  it('applies valid settings and persists them', () => {
    const store = useSummarySettingsStore()

    expect(store.applySettings({ showWeeklyHours: true })).toBe(true)
    expect(store.settings).toEqual({ showWeeklyHours: true })
    expect(storedSummary()).toEqual({ showWeeklyHours: true })
  })

  it('rehydrates from persisted settings', () => {
    const store = useSummarySettingsStore()
    store.applySettings({ showWeeklyHours: true })

    setActivePinia(createPinia())
    expect(useSummarySettingsStore().settings).toEqual({ showWeeklyHours: true })
  })

  it('uses the default for a legacy summary section without the setting', () => {
    localStorage.setItem(
      USER_SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: 1, summary: {} }),
    )

    expect(useSummarySettingsStore().settings).toEqual(DEFAULT_SUMMARY_SETTINGS)
  })

  it('falls back to defaults for corrupt or invalid storage', () => {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, 'not json')
    expect(useSummarySettingsStore().settings).toEqual(DEFAULT_SUMMARY_SETTINGS)

    localStorage.setItem(
      USER_SETTINGS_STORAGE_KEY,
      JSON.stringify({ version: 1, summary: { showWeeklyHours: 'yes' } }),
    )
    expect(useSummarySettingsStore().settings).toEqual(DEFAULT_SUMMARY_SETTINGS)
  })

  it('resets to defaults', () => {
    const store = useSummarySettingsStore()
    store.applySettings({ showWeeklyHours: true })

    store.resetSettings()

    expect(store.settings).toEqual(DEFAULT_SUMMARY_SETTINGS)
    expect(storedSummary()).toEqual(DEFAULT_SUMMARY_SETTINGS)
  })
})
