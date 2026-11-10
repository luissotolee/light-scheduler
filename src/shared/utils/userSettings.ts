import { isLocale } from '@/shared/i18n/types'
import type { Locale } from '@/shared/i18n/types'
import { readJson, readStorageValue, removeStorageValue, writeJson } from '@/shared/utils/storage'

export const USER_SETTINGS_STORAGE_KEY = 'light-scheduler.user-settings'
export const USER_SETTINGS_SCHEMA_VERSION = 1
export const LEGACY_LOCALE_STORAGE_KEY = 'light-scheduler.locale'
export const LEGACY_SCHEDULER_SETTINGS_STORAGE_KEY = 'light-scheduler.scheduler-settings'

export interface StoredUserSettings {
  version: typeof USER_SETTINGS_SCHEMA_VERSION
  locale?: Locale
  scheduler?: unknown
}

export interface UserSettingsSnapshot {
  locale: Locale | null
  scheduler: unknown
  hasScheduler: boolean
}

interface SchedulerSection {
  found: boolean
  value: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseUserSettings(value: unknown): UserSettingsSnapshot | null {
  if (!isRecord(value) || value.version !== USER_SETTINGS_SCHEMA_VERSION) return null

  return {
    locale: isLocale(value.locale) ? value.locale : null,
    scheduler: value.scheduler,
    hasScheduler: Object.prototype.hasOwnProperty.call(value, 'scheduler'),
  }
}

export function parseUserSettingsEntry(raw: string | null): UserSettingsSnapshot | null {
  if (raw === null) return null

  try {
    return parseUserSettings(JSON.parse(raw))
  } catch {
    return null
  }
}

function readLegacyLocale(): Locale | null {
  const raw = readStorageValue(LEGACY_LOCALE_STORAGE_KEY)
  return isLocale(raw) ? raw : null
}

function readLegacyScheduler(): SchedulerSection {
  const raw = readStorageValue(LEGACY_SCHEDULER_SETTINGS_STORAGE_KEY)
  if (raw === null) return { found: false, value: undefined }

  try {
    return { found: true, value: JSON.parse(raw) }
  } catch {
    return { found: false, value: undefined }
  }
}

export function readUserSettings(): UserSettingsSnapshot {
  const stored = readJson(USER_SETTINGS_STORAGE_KEY, parseUserSettings)
  const scheduler: SchedulerSection = stored?.hasScheduler
    ? { found: true, value: stored.scheduler }
    : readLegacyScheduler()

  return {
    locale: stored?.locale ?? readLegacyLocale(),
    scheduler: scheduler.value,
    hasScheduler: scheduler.found,
  }
}

function persistUserSettings(locale: Locale | null, scheduler: SchedulerSection): boolean {
  const payload: StoredUserSettings = { version: USER_SETTINGS_SCHEMA_VERSION }
  if (locale !== null) payload.locale = locale
  if (scheduler.found) payload.scheduler = scheduler.value

  return writeJson(USER_SETTINGS_STORAGE_KEY, payload)
}

function clearLegacySettings(): void {
  removeStorageValue(LEGACY_LOCALE_STORAGE_KEY)
  removeStorageValue(LEGACY_SCHEDULER_SETTINGS_STORAGE_KEY)
}

export function writeUserSettingsLocale(locale: Locale): void {
  const current = readUserSettings()
  const written = persistUserSettings(locale, {
    found: current.hasScheduler,
    value: current.scheduler,
  })
  if (written) clearLegacySettings()
}

export function writeUserSettingsScheduler(scheduler: unknown): void {
  const current = readUserSettings()
  const written = persistUserSettings(current.locale, { found: true, value: scheduler })
  if (written) clearLegacySettings()
}
