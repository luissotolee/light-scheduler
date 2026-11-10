import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { SchedulerSettings } from '@/modules/scheduler/types'
import {
  DEFAULT_SCHEDULER_SETTINGS,
  parseSchedulerSettings,
  toSchedulingWindow,
  validateSchedulerSettings,
} from '@/modules/scheduler/utils/settings'
import { DEFAULT_SCHEDULING_WINDOW } from '@/shared/utils/shifts'
import { readUserSettings, writeUserSettingsScheduler } from '@/shared/utils/userSettings'

function readInitialSettings(): SchedulerSettings {
  return (
    parseSchedulerSettings(readUserSettings().scheduler) ?? {
      ...DEFAULT_SCHEDULER_SETTINGS,
    }
  )
}

export const useSchedulerSettingsStore = defineStore('schedulerSettings', () => {
  const settings = ref<SchedulerSettings>(readInitialSettings())

  const schedulingWindow = computed(
    () => toSchedulingWindow(settings.value) ?? { ...DEFAULT_SCHEDULING_WINDOW },
  )

  function applySettings(next: SchedulerSettings): boolean {
    const result = validateSchedulerSettings(next)
    if (!result.ok) return false

    settings.value = { ...result.value }
    writeUserSettingsScheduler(settings.value)
    return true
  }

  function resetSettings(): void {
    applySettings({ ...DEFAULT_SCHEDULER_SETTINGS })
  }

  function hydrate(): void {
    settings.value = readInitialSettings()
  }

  return { settings, schedulingWindow, applySettings, resetSettings, hydrate }
})
