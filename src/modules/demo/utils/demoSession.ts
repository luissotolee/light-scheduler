import { useWorkspaceStore } from '@/shared/stores/workspace'
import { useEmployeesStore } from '@/modules/employees/stores/employees'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import { useHistoryStore } from '@/modules/history/stores/history'
import { useCsvStore } from '@/modules/csv/stores/csv'
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
import { useLocaleStore, isLocale, LOCALE_STORAGE_KEY } from '@/shared/stores/locale'
import { parsePersistedWorkspace, WORKSPACE_STORAGE_KEY } from '@/shared/utils/persistence'
import { router } from '@/router'
import { startEngine, stopEngine } from '@/modules/demo/player/engine'
import { getDemoScenario } from '@/modules/demo/scenarios'

let appSnapshot: AppStorageSnapshot | null = null

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

    const historyStore = useHistoryStore()
    historyStore.selectWeek(null)

    const csvStore = useCsvStore()
    csvStore.resetStatus()

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

      const localeValue = entries[LOCALE_STORAGE_KEY] ?? null
      if (localeValue !== null && isLocale(localeValue)) {
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
  const historyStore = useHistoryStore()
  const csvStore = useCsvStore()

  employeesStore.resetUi()
  schedulerStore.selectWeekday('monday')
  schedulerStore.clearError()
  historyStore.selectWeek(null)
  csvStore.resetStatus()
}