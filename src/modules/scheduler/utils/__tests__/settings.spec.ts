import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SCHEDULER_SETTINGS,
  isSlotMinutes,
  parseSchedulerSettings,
  snapTimeToStep,
  toSchedulingWindow,
  validateSchedulerSettings,
} from '@/modules/scheduler/utils/settings'
import type { SchedulerSettings } from '@/modules/scheduler/types'

function settings(overrides: Partial<SchedulerSettings> = {}): SchedulerSettings {
  return { ...DEFAULT_SCHEDULER_SETTINGS, ...overrides }
}

describe('isSlotMinutes', () => {
  it('accepts 15 and 30 and rejects everything else', () => {
    expect(isSlotMinutes(15)).toBe(true)
    expect(isSlotMinutes(30)).toBe(true)
    expect(isSlotMinutes(60)).toBe(false)
    expect(isSlotMinutes('30')).toBe(false)
    expect(isSlotMinutes(undefined)).toBe(false)
  })
})

describe('toSchedulingWindow', () => {
  it('maps the defaults to 09:00–01:00 with 30 minute slots', () => {
    expect(toSchedulingWindow(settings())).toEqual({
      startMinute: 540,
      endMinute: 1500,
      slotMinutes: 30,
    })
  })

  it('maps a same-day window', () => {
    expect(toSchedulingWindow(settings({ startTime: '08:00', endTime: '12:00' }))).toEqual({
      startMinute: 480,
      endMinute: 720,
      slotMinutes: 30,
    })
  })

  it('treats an end before the start as the next day', () => {
    expect(toSchedulingWindow(settings({ startTime: '22:00', endTime: '01:00' }))).toEqual({
      startMinute: 1320,
      endMinute: 1500,
      slotMinutes: 30,
    })
  })

  it('returns null for invalid settings', () => {
    expect(toSchedulingWindow(settings({ startTime: '24:00' }))).toBeNull()
    expect(toSchedulingWindow(settings({ startTime: '09:00', endTime: '09:00' }))).toBeNull()
    expect(toSchedulingWindow(settings({ startTime: '23:00', endTime: '02:00' }))).toBeNull()
    expect(toSchedulingWindow(settings({ startTime: '09:00', endTime: '09:15' }))).toBeNull()
  })
})

describe('validateSchedulerSettings', () => {
  it('accepts valid settings and normalizes the value', () => {
    const result = validateSchedulerSettings({
      startTime: '09:15',
      endTime: '01:00',
      slotMinutes: 15,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual({
      startTime: '09:15',
      endTime: '01:00',
      slotMinutes: 15,
      showHourlyHeadcount: false,
    })
    expect(result.window).toEqual({ startMinute: 555, endMinute: 1500, slotMinutes: 15 })
  })

  it('defaults a missing headcount setting and accepts explicit booleans', () => {
    const missing = validateSchedulerSettings({
      startTime: '09:00',
      endTime: '01:00',
      slotMinutes: 30,
    })
    expect(missing.ok).toBe(true)
    if (missing.ok) expect(missing.value.showHourlyHeadcount).toBe(false)

    const enabled = validateSchedulerSettings({
      startTime: '09:00',
      endTime: '01:00',
      slotMinutes: 30,
      showHourlyHeadcount: true,
    })
    expect(enabled.ok).toBe(true)
    if (enabled.ok) expect(enabled.value.showHourlyHeadcount).toBe(true)
  })

  it('rejects a non-boolean headcount setting', () => {
    expect(
      validateSchedulerSettings({
        startTime: '09:00',
        endTime: '01:00',
        slotMinutes: 30,
        showHourlyHeadcount: 'yes',
      }),
    ).toEqual({ ok: false, error: 'errors.settingsHeadcount' })
  })

  it('rejects non-object values and invalid slot values', () => {
    expect(validateSchedulerSettings(null)).toEqual({ ok: false, error: 'errors.settingsSlot' })
    expect(validateSchedulerSettings([])).toEqual({ ok: false, error: 'errors.settingsSlot' })
    expect(
      validateSchedulerSettings({ startTime: '09:00', endTime: '01:00', slotMinutes: 60 }),
    ).toEqual({ ok: false, error: 'errors.settingsSlot' })
  })

  it('rejects missing or malformed times', () => {
    expect(
      validateSchedulerSettings({ startTime: '9:00', endTime: '01:00', slotMinutes: 30 }),
    ).toEqual({ ok: false, error: 'errors.settingsStartTime' })
    expect(
      validateSchedulerSettings({ startTime: '09:00', endTime: 'noon', slotMinutes: 30 }),
    ).toEqual({ ok: false, error: 'errors.settingsEndTime' })
    expect(validateSchedulerSettings({ slotMinutes: 30 })).toEqual({
      ok: false,
      error: 'errors.settingsStartTime',
    })
  })

  it('rejects times that are not aligned with the slot', () => {
    expect(
      validateSchedulerSettings({ startTime: '09:10', endTime: '01:00', slotMinutes: 30 }),
    ).toEqual({ ok: false, error: 'errors.settingsAligned' })
    expect(
      validateSchedulerSettings({ startTime: '09:00', endTime: '00:10', slotMinutes: 30 }),
    ).toEqual({ ok: false, error: 'errors.settingsAligned' })
  })

  it('rejects equal start and end times', () => {
    expect(
      validateSchedulerSettings({ startTime: '09:00', endTime: '09:00', slotMinutes: 30 }),
    ).toEqual({ ok: false, error: 'errors.settingsSameTimes' })
  })

  it('rejects windows that extend past 01:00 the next day', () => {
    expect(
      validateSchedulerSettings({ startTime: '23:00', endTime: '02:00', slotMinutes: 30 }),
    ).toEqual({ ok: false, error: 'errors.settingsMaxEnd' })
  })

  it('requires at least one full slot', () => {
    expect(
      validateSchedulerSettings({ startTime: '09:00', endTime: '09:15', slotMinutes: 30 }),
    ).toEqual({ ok: false, error: 'errors.settingsWindow' })
  })
})

describe('parseSchedulerSettings', () => {
  it('returns valid settings and null for invalid payloads', () => {
    expect(parseSchedulerSettings(settings())).toEqual(DEFAULT_SCHEDULER_SETTINGS)
    expect(parseSchedulerSettings({ startTime: 'nope' })).toBeNull()
    expect(parseSchedulerSettings('nope')).toBeNull()
  })
})

describe('snapTimeToStep', () => {
  it('rounds minutes down to the nearest step', () => {
    expect(snapTimeToStep('10:45', 30)).toBe('10:30')
    expect(snapTimeToStep('10:45', 15)).toBe('10:45')
    expect(snapTimeToStep('01:00', 30)).toBe('01:00')
    expect(snapTimeToStep('invalid', 30)).toBe('invalid')
  })
})
