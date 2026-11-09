import { readStorageValue, writeStorageValue, removeStorageValue } from '@/shared/utils/storage'

export const DEMO_BACKUP_KEY = 'light-scheduler.demo.backup'
export const DEMO_RECOVERED_KEY = 'light-scheduler.demo.recovered'
export const DEMO_RECOVERY_ERROR_KEY = 'light-scheduler.demo.recoveryError'
export const APP_STORAGE_PREFIX = 'light-scheduler.'

export interface AppStorageSnapshot {
  version: 1
  createdAt: number
  entries: Record<string, string | null>
}

function isAppStorageKey(key: string): boolean {
  return key.startsWith(APP_STORAGE_PREFIX) && !key.startsWith('light-scheduler.demo.')
}

export function captureAppStorage(): AppStorageSnapshot {
  const entries: Record<string, string | null> = {}

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && isAppStorageKey(key)) {
        entries[key] = localStorage.getItem(key)
      }
    }
  } catch {
    // In restricted environments, return empty snapshot
  }

  return {
    version: 1,
    createdAt: Date.now(),
    entries,
  }
}

export function restoreAppStorage(snapshot: AppStorageSnapshot): void {
  const currentKeys = new Set<string>()
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && isAppStorageKey(key)) {
      currentKeys.add(key)
    }
  }

  const snapshotKeys = new Set(Object.keys(snapshot.entries))

  // Apply snapshot first so a partial failure still leaves known data restored.
  for (const [key, value] of Object.entries(snapshot.entries)) {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  }

  for (const key of currentKeys) {
    if (!snapshotKeys.has(key)) {
      localStorage.removeItem(key)
    }
  }
}

export function writeDemoBackup(snapshot: AppStorageSnapshot): boolean {
  try {
    writeStorageValue(DEMO_BACKUP_KEY, JSON.stringify(snapshot))
    return true
  } catch {
    return false
  }
}

export function readDemoBackup(): AppStorageSnapshot | null {
  try {
    const raw = readStorageValue(DEMO_BACKUP_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppStorageSnapshot
  } catch {
    return null
  }
}

export function clearDemoBackup(): void {
  removeStorageValue(DEMO_BACKUP_KEY)
}

export function setDemoRecovered(): void {
  writeStorageValue(DEMO_RECOVERED_KEY, 'true')
}

export function clearDemoRecovered(): void {
  removeStorageValue(DEMO_RECOVERED_KEY)
}

export function isDemoRecovered(): boolean {
  return readStorageValue(DEMO_RECOVERED_KEY) === 'true'
}

export function setDemoRecoveryError(): void {
  try {
    localStorage.setItem(DEMO_RECOVERY_ERROR_KEY, 'true')
  } catch {
    // best effort
  }
}

export function clearDemoRecoveryError(): void {
  try {
    localStorage.removeItem(DEMO_RECOVERY_ERROR_KEY)
  } catch {
    removeStorageValue(DEMO_RECOVERY_ERROR_KEY)
  }
}

export function hasDemoRecoveryError(): boolean {
  try {
    return localStorage.getItem(DEMO_RECOVERY_ERROR_KEY) === 'true'
  } catch {
    return readStorageValue(DEMO_RECOVERY_ERROR_KEY) === 'true'
  }
}

export type RecoverResult = 'restored' | 'none' | 'error'

export function recoverInterruptedDemo(): RecoverResult {
  if (!isDemoRecovered()) {
    const backup = readDemoBackup()
    if (!backup) return 'none'

    try {
      restoreAppStorage(backup)
    } catch {
      setDemoRecoveryError()
      return 'error'
    }

    try {
      clearDemoBackup()
      setDemoRecovered()
    } catch {
      // Best effort: data is restored; cleanup failure should not block boot.
    }
    return 'restored'
  }

  clearDemoRecovered()
  return 'none'
}