import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { useEmployeesStore } from '@/modules/employees/stores/employees'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import { useSchedulerSettingsStore } from '@/modules/scheduler/stores/schedulerSettings'
import { DEFAULT_SCHEDULER_SETTINGS } from '@/modules/scheduler/utils/settings'
import { USER_SETTINGS_STORAGE_KEY } from '@/shared/utils/userSettings'
import { useArchiveStore } from '@/modules/archive/stores/archive'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { useLocaleStore } from '@/shared/stores/locale'
import { startDemo, stopDemo } from '@/modules/demo/utils/demoSession'
import { readDemoBackup } from '@/modules/demo/utils/storageSnapshot'
import { router } from '@/router'
import { startEngine } from '@/modules/demo/player/engine'

vi.mock('@/modules/demo/player/engine', () => ({
  startEngine: vi.fn().mockResolvedValue(undefined),
  stopEngine: vi.fn().mockResolvedValue(undefined),
}))

const mockedStartEngine = vi.mocked(startEngine)

describe('demoSession', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('captures snapshot before starting demo', async () => {
    localStorage.setItem('light-scheduler.workspace', '{"data": "original"}')
    localStorage.setItem('light-scheduler.locale', 'en')

    mockedStartEngine.mockResolvedValue(undefined)

    const result = await startDemo('scheduler-demo')
    expect(result).toBe(true)

    const backup = readDemoBackup()
    expect(backup).not.toBeNull()
    expect(backup?.entries['light-scheduler.workspace']).toBe('{"data": "original"}')
    expect(backup?.entries['light-scheduler.locale']).toBe('en')
  })

  it('loads demo workspace into workspace store', async () => {
    const workspaceStore = useWorkspaceStore()
    expect(workspaceStore.members.length).toBe(0)

    mockedStartEngine.mockResolvedValue(undefined)

    await startDemo('scheduler-demo')

    expect(workspaceStore.members.length).toBeGreaterThan(0)
    expect(Object.keys(workspaceStore.schedules).length).toBeGreaterThan(0)
  })

  it('resets UI stores', async () => {
    const employeesStore = useEmployeesStore()
    employeesStore.setSearch('test')
    employeesStore.openCreate()

    const schedulerStore = useSchedulerStore()
    schedulerStore.selectWeekday('friday')

    const archiveStore = useArchiveStore()
    archiveStore.setError('archive.importFailed')

    mockedStartEngine.mockResolvedValue(undefined)

    await startDemo('scheduler-demo')

    expect(employeesStore.search).toBe('')
    expect(employeesStore.formVisible).toBe(false)
    expect(schedulerStore.selectedWeekday).toBe('monday')
    expect(schedulerStore.error).toBeNull()
    expect(archiveStore.status.state).toBe('idle')
  })

  it('navigates to scheduler route', async () => {
    mockedStartEngine.mockResolvedValue(undefined)

    await startDemo('scheduler-demo')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/scheduler')
  })

  it('restores snapshot on stopDemo', async () => {
    localStorage.setItem(
      'light-scheduler.workspace',
      '{"version":1,"members":[],"schedules":{},"dayOffs":{},"currentWeekKey":"2026-11-02"}',
    )
    localStorage.setItem('light-scheduler.locale', 'en')

    mockedStartEngine.mockResolvedValue(undefined)

    await startDemo('scheduler-demo')

    const workspaceStore = useWorkspaceStore()
    expect(workspaceStore.members.length).toBeGreaterThan(0)

    await stopDemo()

    expect(localStorage.getItem('light-scheduler.workspace')).toBe(
      '{"version":1,"members":[],"schedules":{},"dayOffs":{},"currentWeekKey":"2026-11-02"}',
    )
    expect(localStorage.getItem('light-scheduler.locale')).toBe('en')
    expect(readDemoBackup()).toBeNull()
  })

  it('restores locale and workspace stores in memory on stopDemo', async () => {
    localStorage.setItem(
      'light-scheduler.workspace',
      '{"version":1,"members":[],"schedules":{},"dayOffs":{},"currentWeekKey":"2026-11-02"}',
    )
    localStorage.setItem('light-scheduler.locale', 'es')

    mockedStartEngine.mockResolvedValue(undefined)

    await startDemo('scheduler-demo')

    const workspaceStore = useWorkspaceStore()
    const localeStore = useLocaleStore()
    expect(workspaceStore.members.length).toBeGreaterThan(0)
    // Locale remains 'es' during demo (startDemo doesn't change it)
    expect(localeStore.locale).toBe('es')

    await stopDemo()

    // Locale should be restored to 'es' (from snapshot)
    expect(localeStore.locale).toBe('es')
    // Workspace should be restored to empty (parsed from snapshot)
    expect(workspaceStore.members.length).toBe(0)
    expect(workspaceStore.currentWeekKey).toBe('2026-11-02')
  })

  it('resets UI stores on stopDemo', async () => {
    mockedStartEngine.mockResolvedValue(undefined)

    await startDemo('scheduler-demo')

    const employeesStore = useEmployeesStore()
    employeesStore.setSearch('test')

    const schedulerStore = useSchedulerStore()
    schedulerStore.selectWeekday('friday')

    await stopDemo()

    expect(employeesStore.search).toBe('')
    expect(schedulerStore.selectedWeekday).toBe('monday')
  })

  it('shows restored flag on demo store', async () => {
    localStorage.setItem(
      'light-scheduler.workspace',
      '{"version":1,"members":[],"schedules":{},"dayOffs":{},"currentWeekKey":"2026-W45"}',
    )

    let completionCallback: (() => void) | undefined
    mockedStartEngine.mockImplementation((_scenario, onComplete) => {
      completionCallback = onComplete
      return Promise.resolve()
    })

    await startDemo('scheduler-demo')

    const demoStore = useDemoStore()
    expect(demoStore.showRestoredFlag).toBe(false)

    // Invoke completion callback to simulate natural demo completion
    completionCallback!()
    await stopDemo()

    expect(demoStore.showRestoredFlag).toBe(true)
  })

  it('keeps backup and reports error on restore failure', async () => {
    localStorage.setItem('light-scheduler.workspace', 'invalid json')
    localStorage.setItem('light-scheduler.locale', 'en')

    mockedStartEngine.mockResolvedValue(undefined)

    await startDemo('scheduler-demo')

    const demoStore = useDemoStore()
    await stopDemo()

    // Backup should be kept
    expect(readDemoBackup()).not.toBeNull()
    // Error should be reported
    expect(demoStore.errorKey).toBe('demo.error.restore')
    // Restored flag should not be shown
    expect(demoStore.showRestoredFlag).toBe(false)
  })

  it('returns false for unknown scenario without mutating storage', async () => {
    localStorage.setItem('light-scheduler.workspace', '{"data": "original"}')
    localStorage.setItem('light-scheduler.locale', 'en')

    mockedStartEngine.mockResolvedValue(undefined)

    const result = await startDemo('unknown-scenario')
    expect(result).toBe(false)

    // No backup should be written
    expect(readDemoBackup()).toBeNull()
    // Engine should not be started
    expect(mockedStartEngine).not.toHaveBeenCalled()
    // Workspace should not be changed
    const workspaceStore = useWorkspaceStore()
    expect(workspaceStore.members.length).toBe(0)
  })

  it('calls startEngine once with resolved scenario on valid startDemo', async () => {
    localStorage.setItem('light-scheduler.workspace', '{"data": "original"}')
    localStorage.setItem('light-scheduler.locale', 'en')

    let resolveStartEngine: () => void
    const startEnginePromise = new Promise<void>((resolve) => {
      resolveStartEngine = resolve
    })
    mockedStartEngine.mockReturnValue(startEnginePromise)

    const startPromise = startDemo('scheduler-demo')

    // startDemo should return true immediately after launching engine
    expect(await startPromise).toBe(true)
    expect(mockedStartEngine).toHaveBeenCalledTimes(1)

    // Verify scenario was passed to startEngine
    const [passedScenario] = mockedStartEngine.mock.calls[0] as [
      { id: string; steps: unknown[] },
      (() => void) | undefined,
    ]
    expect(passedScenario.id).toBe('scheduler-demo')
    expect(passedScenario.steps.length).toBeGreaterThan(0)

    // Complete the engine
    resolveStartEngine!()
    await startEnginePromise
  })

  it('restores user data when engine invokes completion callback', async () => {
    localStorage.setItem(
      'light-scheduler.workspace',
      '{"version":1,"members":[],"schedules":{},"dayOffs":{},"currentWeekKey":"2026-11-02"}',
    )
    localStorage.setItem('light-scheduler.locale', 'en')

    let completionCallback: (() => void) | undefined
    mockedStartEngine.mockImplementation((_scenario, onComplete) => {
      completionCallback = onComplete
      return Promise.resolve()
    })

    await startDemo('scheduler-demo')

    completionCallback?.()
    await stopDemo()

    expect(localStorage.getItem('light-scheduler.workspace')).toBe(
      '{"version":1,"members":[],"schedules":{},"dayOffs":{},"currentWeekKey":"2026-11-02"}',
    )
    expect(readDemoBackup()).toBeNull()
    const demoStore = useDemoStore()
    expect(demoStore.showRestoredFlag).toBe(true)
  })
})
describe('demoSession scheduler settings', () => {
  const customSettings = {
    startTime: '08:00',
    endTime: '16:00',
    slotMinutes: 15 as const,
    showHourlyHeadcount: true,
  }

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('resets scheduler settings for the demo and restores the user values on stop', async () => {
    const settingsStore = useSchedulerSettingsStore()
    settingsStore.applySettings(customSettings)
    const saved = localStorage.getItem(USER_SETTINGS_STORAGE_KEY)

    mockedStartEngine.mockResolvedValue(undefined)

    await startDemo('scheduler-demo')

    expect(settingsStore.settings).toEqual(DEFAULT_SCHEDULER_SETTINGS)

    await stopDemo()

    expect(settingsStore.settings).toEqual(customSettings)
    expect(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)).toBe(saved)
  })

  it('removes the demo settings key when the user had no saved settings', async () => {
    mockedStartEngine.mockResolvedValue(undefined)

    await startDemo('scheduler-demo')

    expect(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)).not.toBeNull()

    await stopDemo()

    expect(useSchedulerSettingsStore().settings).toEqual(DEFAULT_SCHEDULER_SETTINGS)
    expect(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)).toBeNull()
  })
})
