import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSchedulerSettingsStore } from '@/modules/scheduler/stores/schedulerSettings'
import { DEFAULT_SCHEDULER_SETTINGS } from '@/modules/scheduler/utils/settings'
import {
  LEGACY_SCHEDULER_SETTINGS_STORAGE_KEY,
  USER_SETTINGS_STORAGE_KEY,
} from '@/shared/utils/userSettings'

function storedScheduler(): unknown {
  const raw = localStorage.getItem(USER_SETTINGS_STORAGE_KEY)
  return raw === null ? null : JSON.parse(raw).scheduler
}

describe('scheduler settings store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('uses the defaults when storage is empty', () => {
    const store = useSchedulerSettingsStore()

    expect(store.settings).toEqual(DEFAULT_SCHEDULER_SETTINGS)
    expect(store.schedulingWindow).toEqual({
      startMinute: 540,
      endMinute: 1500,
      slotMinutes: 30,
    })
  })

  it('applies valid settings and persists them', () => {
    const store = useSchedulerSettingsStore()

    const applied = store.applySettings({
      startTime: '09:15',
      endTime: '12:00',
      slotMinutes: 15,
      showHourlyHeadcount: false,
    })

    expect(applied).toBe(true)
    expect(store.settings).toEqual({
      startTime: '09:15',
      endTime: '12:00',
      slotMinutes: 15,
      showHourlyHeadcount: false,
    })
    expect(store.schedulingWindow).toEqual({
      startMinute: 555,
      endMinute: 720,
      slotMinutes: 15,
    })
    expect(storedScheduler()).toEqual(store.settings)
  })

  it('persists and rehydrates the hourly headcount setting', () => {
    const store = useSchedulerSettingsStore()
    store.applySettings({
      startTime: '08:00',
      endTime: '16:00',
      slotMinutes: 15,
      showHourlyHeadcount: true,
    })

    expect(storedScheduler()).toEqual({
      startTime: '08:00',
      endTime: '16:00',
      slotMinutes: 15,
      showHourlyHeadcount: true,
    })

    const rehydrated = useSchedulerSettingsStore()
    rehydrated.hydrate()

    expect(rehydrated.settings.showHourlyHeadcount).toBe(true)

    setActivePinia(createPinia())
    expect(useSchedulerSettingsStore().settings.showHourlyHeadcount).toBe(true)
  })

  it('rejects invalid settings without changing state or storage', () => {
    const store = useSchedulerSettingsStore()

    const applied = store.applySettings({
      startTime: '09:10',
      endTime: '01:00',
      slotMinutes: 30,
      showHourlyHeadcount: false,
    })

    expect(applied).toBe(false)
    expect(store.settings).toEqual(DEFAULT_SCHEDULER_SETTINGS)
    expect(localStorage.getItem(USER_SETTINGS_STORAGE_KEY)).toBeNull()
  })

  it('hydrates from persisted settings on creation', () => {
    localStorage.setItem(
      USER_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        scheduler: { startTime: '08:00', endTime: '16:00', slotMinutes: 15 },
      }),
    )

    const store = useSchedulerSettingsStore()

    expect(store.settings).toEqual({
      startTime: '08:00',
      endTime: '16:00',
      slotMinutes: 15,
      showHourlyHeadcount: false,
    })
    expect(store.schedulingWindow).toEqual({
      startMinute: 480,
      endMinute: 960,
      slotMinutes: 15,
    })
  })

  it('falls back to defaults for corrupt or invalid storage', () => {
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, 'not json')

    expect(useSchedulerSettingsStore().settings).toEqual(DEFAULT_SCHEDULER_SETTINGS)

    localStorage.setItem(
      USER_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        scheduler: { startTime: '09:00', endTime: '09:00', slotMinutes: 30 },
      }),
    )

    const store = useSchedulerSettingsStore()
    store.hydrate()

    expect(store.settings).toEqual(DEFAULT_SCHEDULER_SETTINGS)
  })

  it('resets to defaults', () => {
    const store = useSchedulerSettingsStore()
    store.applySettings({
      startTime: '08:00',
      endTime: '16:00',
      slotMinutes: 15,
      showHourlyHeadcount: false,
    })

    store.resetSettings()

    expect(store.settings).toEqual(DEFAULT_SCHEDULER_SETTINGS)
    expect(storedScheduler()).toEqual(DEFAULT_SCHEDULER_SETTINGS)
  })

  it('hydrates from the legacy scheduler settings key', () => {
    localStorage.setItem(
      LEGACY_SCHEDULER_SETTINGS_STORAGE_KEY,
      JSON.stringify({ startTime: '08:00', endTime: '16:00', slotMinutes: 15 }),
    )

    expect(useSchedulerSettingsStore().settings).toEqual({
      startTime: '08:00',
      endTime: '16:00',
      slotMinutes: 15,
      showHourlyHeadcount: false,
    })
  })

  it('hydrate picks up externally restored storage values', () => {
    const store = useSchedulerSettingsStore()
    store.applySettings({
      startTime: '08:00',
      endTime: '16:00',
      slotMinutes: 15,
      showHourlyHeadcount: true,
    })

    localStorage.setItem(
      USER_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        scheduler: { startTime: '09:00', endTime: '01:00', slotMinutes: 30 },
      }),
    )
    store.hydrate()

    expect(store.settings).toEqual(DEFAULT_SCHEDULER_SETTINGS)
  })
})
