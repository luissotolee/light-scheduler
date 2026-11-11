import type { MessageKey } from '@/shared/i18n/messages/en'
import type { SchedulerSettings, SlotMinutes } from '@/types'
import type { SchedulingWindow } from '@/shared/utils/shifts'
import { formatMinutesToHhmm, parseTimeToMinutes } from '@/shared/utils/shifts'

export const MAX_SCHEDULE_END_MINUTE = 1500

const MINUTES_PER_DAY = 1440

export const DEFAULT_SCHEDULER_SETTINGS: SchedulerSettings = {
  startTime: '09:00',
  endTime: '01:00',
  slotMinutes: 30,
  showHourlyHeadcount: false,
}

export type SchedulerSettingsValidation =
  | { ok: true; value: SchedulerSettings; window: SchedulingWindow }
  | { ok: false; error: MessageKey }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isSlotMinutes(value: unknown): value is SlotMinutes {
  return value === 15 || value === 30
}

export function toSchedulingWindow(settings: SchedulerSettings): SchedulingWindow | null {
  if (!isSlotMinutes(settings.slotMinutes)) return null

  const startMinute = parseTimeToMinutes(settings.startTime)
  const clockEnd = parseTimeToMinutes(settings.endTime)
  if (startMinute === null || clockEnd === null) return null
  if (startMinute === clockEnd) return null

  const endMinute = clockEnd + (clockEnd < startMinute ? MINUTES_PER_DAY : 0)
  if (endMinute > MAX_SCHEDULE_END_MINUTE) return null
  if (endMinute - startMinute < settings.slotMinutes) return null

  return { startMinute, endMinute, slotMinutes: settings.slotMinutes }
}

export function validateSchedulerSettings(value: unknown): SchedulerSettingsValidation {
  if (!isRecord(value)) return { ok: false, error: 'errors.settingsSlot' }

  if (!isSlotMinutes(value.slotMinutes)) {
    return { ok: false, error: 'errors.settingsSlot' }
  }
  const slotMinutes = value.slotMinutes

  if (typeof value.startTime !== 'string') {
    return { ok: false, error: 'errors.settingsStartTime' }
  }
  if (typeof value.endTime !== 'string') {
    return { ok: false, error: 'errors.settingsEndTime' }
  }

  const startMinute = parseTimeToMinutes(value.startTime)
  if (startMinute === null) {
    return { ok: false, error: 'errors.settingsStartTime' }
  }

  const clockEnd = parseTimeToMinutes(value.endTime)
  if (clockEnd === null) {
    return { ok: false, error: 'errors.settingsEndTime' }
  }

  if (startMinute === clockEnd) {
    return { ok: false, error: 'errors.settingsSameTimes' }
  }

  const endMinute = clockEnd + (clockEnd < startMinute ? MINUTES_PER_DAY : 0)
  if (endMinute > MAX_SCHEDULE_END_MINUTE) {
    return { ok: false, error: 'errors.settingsMaxEnd' }
  }

  if (endMinute - startMinute < slotMinutes) {
    return { ok: false, error: 'errors.settingsWindow' }
  }

  if (startMinute % slotMinutes !== 0 || clockEnd % slotMinutes !== 0) {
    return { ok: false, error: 'errors.settingsAligned' }
  }

  const showHourlyHeadcount =
    value.showHourlyHeadcount === undefined
      ? DEFAULT_SCHEDULER_SETTINGS.showHourlyHeadcount
      : value.showHourlyHeadcount

  if (typeof showHourlyHeadcount !== 'boolean') {
    return { ok: false, error: 'errors.settingsHeadcount' }
  }

  const settings: SchedulerSettings = {
    startTime: formatMinutesToHhmm(startMinute),
    endTime: formatMinutesToHhmm(clockEnd),
    slotMinutes,
    showHourlyHeadcount,
  }

  return {
    ok: true,
    value: settings,
    window: { startMinute, endMinute, slotMinutes },
  }
}

export function parseSchedulerSettings(value: unknown): SchedulerSettings | null {
  const result = validateSchedulerSettings(value)
  return result.ok ? result.value : null
}

export function snapTimeToStep(hhmm: string, step: SlotMinutes): string {
  const minute = parseTimeToMinutes(hhmm)
  if (minute === null) return hhmm
  const snapped = Math.floor(minute / step) * step
  return formatMinutesToHhmm(snapped)
}
