import { useWorkspaceStore } from '@/shared/stores/workspace'
import { useEmployeesStore } from '@/modules/employees/stores/employees'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import { useSchedulerSettingsStore } from '@/modules/scheduler/stores/schedulerSettings'
import { useArchiveStore } from '@/modules/archive/stores/archive'
import { useCalendarStore } from '@/modules/calendar/stores/calendar'
import { buildDemoWorkspace } from '@/modules/demo/fixtures/demoWorkspace'
import {
  captureAppStorage,
  restoreAppStorage,
  writeDemoBackup,
  clearDemoBackup,
  setDemoRecovered,
  clearDemoRecovered,
  type AppStorageSnapshot,
} from '@/modules/demo/utils/storageSnapshot'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { useLocaleStore, isLocale } from '@/shared/stores/locale'
import type { Locale } from '@/shared/i18n/types'
import { parsePersistedWorkspace, WORKSPACE_STORAGE_KEY } from '@/shared/utils/persistence'
import {
  LEGACY_LOCALE_STORAGE_KEY,
  parseUserSettingsEntry,
  USER_SETTINGS_STORAGE_KEY,
} from '@/shared/utils/userSettings'
import { router } from '@/router'
import { startEngine, stopEngine } from '@/modules/demo/player/engine'
import { getDemoScenario } from '@/modules/demo/scenarios'

let appSnapshot: AppStorageSnapshot | null = null

function readSnapshotLocale(entries: Record<string, string | null>): Locale | null {
  const settings = parseUserSettingsEntry(entries[USER_SETTINGS_STORAGE_KEY] ?? null)
  if (settings?.locale) return settings.locale

  const legacy = entries[LEGACY_LOCALE_STORAGE_KEY] ?? null
  return isLocale(legacy) ? legacy : null
}

export async function startDemo(scenarioId: string): Promise<boolean> {
  const demoStore = useDemoStore()

  try {
    // Validate scenario BEFORE mutating storage
    const scenario = getDemoScenario(scenarioId)
    if (!scenario) {
      demoStore.reportError('demo.error.start')
      return false
    }

    try {
      appSnapshot = captureAppStorage()
    } catch {
      demoStore.reportError('demo.error.storage')
      appSnapshot = null
      return false
    }

    if (!appSnapshot || !writeDemoBackup(appSnapshot)) {
      demoStore.reportError('demo.error.storage')
      appSnapshot = null
      return false
    }

    const workspaceStore = useWorkspaceStore()
    const demoWorkspace = buildDemoWorkspace(new Date())
    workspaceStore.loadWorkspace(demoWorkspace)

    const employeesStore = useEmployeesStore()
    employeesStore.resetUi()

    const schedulerStore = useSchedulerStore()
    schedulerStore.selectWeekday('monday')
    schedulerStore.clearError()

    const schedulerSettingsStore = useSchedulerSettingsStore()
    schedulerSettingsStore.resetSettings()

    const archiveStore = useArchiveStore()
    archiveStore.resetStatus()

    useCalendarStore().resetStatus()

    await router.push('/scheduler')
    await router.isReady()

    // Clear recovery flag before launching engine
    clearDemoRecovered()

    // Launch engine in background with completion callback to restore user data
    void startEngine(scenario, () => {
      void stopDemo()
    }).catch(() => {
      demoStore.reportError('demo.error.start')
    })

    return true
  } catch {
    appSnapshot = null
    clearDemoBackup()
    demoStore.reportError('demo.error.start')
    return false
  }
}

export async function stopDemo(): Promise<void> {
  const demoStore = useDemoStore()
  const localeStore = useLocaleStore()
  const workspaceStore = useWorkspaceStore()

  await stopEngine()

  demoStore.stop()

  let restoreSucceeded = false

  if (appSnapshot) {
    try {
      const entries = appSnapshot.entries

      const localeValue = readSnapshotLocale(entries)
      if (localeValue !== null) {
        localeStore.setLocale(localeValue)
      }

      const workspaceRaw = entries[WORKSPACE_STORAGE_KEY] ?? null
      let restoredWorkspace: ReturnType<typeof parsePersistedWorkspace> = null
      if (workspaceRaw !== null) {
        try {
          restoredWorkspace = parsePersistedWorkspace(JSON.parse(workspaceRaw))
        } catch {
          // Parse failed - will trigger restore error
          throw new Error('Workspace parse failed')
        }
      }
      workspaceStore.loadWorkspace(restoredWorkspace)

      restoreAppStorage(appSnapshot)
      useSchedulerSettingsStore().hydrate()
      restoreSucceeded = true
    } catch {
      demoStore.reportError('demo.error.restore')
    } finally {
      appSnapshot = null
    }
  }

  if (restoreSucceeded) {
    clearDemoBackup()
    setDemoRecovered()
    demoStore.showRestored()
  }

  const employeesStore = useEmployeesStore()
  const schedulerStore = useSchedulerStore()
  const archiveStore = useArchiveStore()

  employeesStore.resetUi()
  schedulerStore.selectWeekday('monday')
  schedulerStore.clearError()
  archiveStore.resetStatus()
  useCalendarStore().resetStatus()
}
