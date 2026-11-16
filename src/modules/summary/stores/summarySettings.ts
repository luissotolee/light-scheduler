import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SummarySettings } from '@/types'
import { DEFAULT_SUMMARY_SETTINGS, parseSummarySettings } from '@/shared/utils/summarySettings'
import { readUserSettings, writeUserSettingsSummary } from '@/shared/utils/userSettings'

function readInitialSettings(): SummarySettings {
  return (
    parseSummarySettings(readUserSettings().summary) ?? {
      ...DEFAULT_SUMMARY_SETTINGS,
    }
  )
}

export const useSummarySettingsStore = defineStore('summarySettings', () => {
  const settings = ref<SummarySettings>(readInitialSettings())

  function applySettings(next: SummarySettings): boolean {
    const parsed = parseSummarySettings(next)
    if (!parsed) return false

    settings.value = parsed
    writeUserSettingsSummary(settings.value)
    return true
  }

  function resetSettings(): void {
    applySettings({ ...DEFAULT_SUMMARY_SETTINGS })
  }

  function hydrate(): void {
    settings.value = readInitialSettings()
  }

  return { settings, applySettings, resetSettings, hydrate }
})
