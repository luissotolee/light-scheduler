import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addWeeks,
  formatWeekRange,
  getWeekKey,
  startOfWeek,
  toLocalIsoDate,
} from '@/utils/calendar'

afterEach(() => {
  vi.useRealTimers()
})

describe('toLocalIsoDate', () => {
  it('formats a local date with zero padding', () => {
    expect(toLocalIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('uses local calendar fields rather than UTC', () => {
    expect(toLocalIsoDate(new Date(2026, 10, 2, 0, 30))).toBe('2026-11-02')
  })
})

describe('startOfWeek', () => {
  it('returns Monday at local midnight for a mid-week date', () => {
    const result = startOfWeek(new Date(2026, 10, 4, 15, 30))

    expect(result.getDay()).toBe(1)
    expect(toLocalIsoDate(result)).toBe('2026-11-02')
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
  })

  it('maps Sunday to the preceding Monday', () => {
    expect(toLocalIsoDate(startOfWeek(new Date(2026, 10, 8, 12)))).toBe('2026-11-02')
  })

  it('does not mutate the input date', () => {
    const date = new Date(2026, 10, 4, 15, 30)

    startOfWeek(date)

    expect(toLocalIsoDate(date)).toBe('2026-11-04')
  })
})

describe('getWeekKey', () => {
  it('uses the current local date when called with today', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 8, 12))

    expect(getWeekKey(new Date())).toBe('2026-11-02')
  })
})

describe('addWeeks', () => {
  it('moves forward and backward seven days per week', () => {
    const date = new Date(2026, 10, 2)

    expect(toLocalIsoDate(addWeeks(date, 1))).toBe('2026-11-09')
    expect(toLocalIsoDate(addWeeks(date, -1))).toBe('2026-10-26')
  })

  it('does not mutate the input date', () => {
    const date = new Date(2026, 10, 2)

    addWeeks(date, 1)

    expect(toLocalIsoDate(date)).toBe('2026-11-02')
  })
})

describe('formatWeekRange', () => {
  it('formats a Monday-to-Sunday range', () => {
    expect(formatWeekRange('2026-11-02')).toBe('Nov 2 – Nov 8, 2026')
  })
})
