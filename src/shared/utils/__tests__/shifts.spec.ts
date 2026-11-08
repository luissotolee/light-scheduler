import { describe, expect, it } from 'vitest'
import {
  formatMinutesToHhmm,
  parseTimeToMinutes,
  shiftsOverlap,
  toShiftMinutes,
} from '@/shared/utils/shifts'

describe('parseTimeToMinutes', () => {
  it('parses valid HH:mm values', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0)
    expect(parseTimeToMinutes('09:30')).toBe(570)
    expect(parseTimeToMinutes('23:59')).toBe(1439)
  })

  it('rejects malformed or out-of-range values', () => {
    expect(parseTimeToMinutes('24:00')).toBeNull()
    expect(parseTimeToMinutes('9:00')).toBeNull()
    expect(parseTimeToMinutes('09:60')).toBeNull()
    expect(parseTimeToMinutes('noon')).toBeNull()
  })
})

describe('formatMinutesToHhmm', () => {
  it('formats minutes since midnight with zero padding', () => {
    expect(formatMinutesToHhmm(0)).toBe('00:00')
    expect(formatMinutesToHhmm(570)).toBe('09:30')
    expect(formatMinutesToHhmm(1439)).toBe('23:59')
  })

  it('round-trips with parseTimeToMinutes', () => {
    expect(parseTimeToMinutes(formatMinutesToHhmm(615))).toBe(615)
  })
})

describe('shiftsOverlap', () => {
  const base = { startMinute: 540, endMinute: 720 }

  it('detects overlapping ranges', () => {
    expect(shiftsOverlap(base, { startMinute: 660, endMinute: 780 })).toBe(true)
    expect(shiftsOverlap(base, { startMinute: 480, endMinute: 600 })).toBe(true)
  })

  it('treats touching ranges as non-overlapping', () => {
    expect(shiftsOverlap(base, { startMinute: 720, endMinute: 780 })).toBe(false)
    expect(shiftsOverlap(base, { startMinute: 480, endMinute: 540 })).toBe(false)
  })

  it('treats disjoint ranges as non-overlapping', () => {
    expect(shiftsOverlap(base, { startMinute: 780, endMinute: 900 })).toBe(false)
  })
})

describe('toShiftMinutes', () => {
  it('converts a valid start and end pair', () => {
    expect(toShiftMinutes('09:00', '17:00')).toEqual({ startMinute: 540, endMinute: 1020 })
  })

  it('rejects invalid times', () => {
    expect(toShiftMinutes('9:00', '17:00')).toBeNull()
    expect(toShiftMinutes('09:00', '25:00')).toBeNull()
  })

  it('rejects an end at or before the start', () => {
    expect(toShiftMinutes('09:00', '09:00')).toBeNull()
    expect(toShiftMinutes('17:00', '09:00')).toBeNull()
  })
})
