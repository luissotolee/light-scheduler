import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addWeeks,
  formatIsoDate,
  formatWeekRange,
  getIsoWeek,
  getIsoWeekStart,
  getIsoWeeksForYear,
  getIsoWeeksInYear,
  getWeekKey,
  holidayToWeekKey,
  isoDateToDate,
  parseIsoDate,
  startOfWeek,
  toLocalIsoDate,
  todayIsoDate,
} from '@/shared/utils/calendar'

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

describe('todayIsoDate', () => {
  it('returns the current local date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 8, 12))

    expect(todayIsoDate()).toBe('2026-11-08')
  })
})

describe('parseIsoDate', () => {
  it('accepts valid ISO dates and trims surrounding whitespace', () => {
    expect(parseIsoDate('2026-11-08')).toBe('2026-11-08')
    expect(parseIsoDate(' 2026-01-01 ')).toBe('2026-01-01')
  })

  it('rejects malformed, impossible, and non-string values', () => {
    expect(parseIsoDate('2026-13-01')).toBeNull()
    expect(parseIsoDate('2026-02-30')).toBeNull()
    expect(parseIsoDate('2026-1-1')).toBeNull()
    expect(parseIsoDate('08/11/2026')).toBeNull()
    expect(parseIsoDate('')).toBeNull()
    expect(parseIsoDate(null)).toBeNull()
    expect(parseIsoDate(new Date(2026, 10, 8))).toBeNull()
  })
})

describe('isoDateToDate', () => {
  it('builds a local date from an ISO date', () => {
    const date = isoDateToDate('2026-11-08')

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(10)
    expect(date.getDate()).toBe(8)
  })
})

describe('formatIsoDate', () => {
  it('formats an ISO date for display', () => {
    expect(formatIsoDate('2026-11-08')).toBe('Nov 8, 2026')
  })

  it('returns a placeholder for malformed input instead of throwing', () => {
    expect(formatIsoDate('not-a-date')).toBe('—')
    expect(formatIsoDate('')).toBe('—')
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

describe('getIsoWeek', () => {
  it('returns the ISO year and week for a mid-year date', () => {
    expect(getIsoWeek(new Date(2026, 6, 15))).toEqual({ year: 2026, week: 29 })
  })

  it('handles January 1 that belongs to the previous ISO year', () => {
    expect(getIsoWeek(new Date(2026, 0, 1))).toEqual({ year: 2026, week: 1 })
    expect(getIsoWeek(new Date(2027, 0, 1))).toEqual({ year: 2026, week: 53 })
  })

  it('handles December 31 at the end of a 52- or 53-week year', () => {
    expect(getIsoWeek(new Date(2026, 11, 31))).toEqual({ year: 2026, week: 53 })
    expect(getIsoWeek(new Date(2027, 11, 31))).toEqual({ year: 2027, week: 52 })
  })
})

describe('getIsoWeekStart', () => {
  it('returns the Monday of week 1, including days in the previous year', () => {
    expect(toLocalIsoDate(getIsoWeekStart(2026, 1))).toBe('2025-12-29')
    expect(getIsoWeekStart(2026, 1).getDay()).toBe(1)
  })

  it('returns the Monday of later weeks', () => {
    expect(toLocalIsoDate(getIsoWeekStart(2026, 29))).toBe('2026-07-13')
    expect(toLocalIsoDate(getIsoWeekStart(2026, 53))).toBe('2026-12-28')
  })

  it('is the inverse of getIsoWeek', () => {
    for (const week of [1, 10, 29, 52, 53]) {
      expect(getIsoWeek(getIsoWeekStart(2026, week))).toEqual({ year: 2026, week })
    }
  })
})

describe('getIsoWeeksInYear', () => {
  it('distinguishes 52- and 53-week years', () => {
    expect(getIsoWeeksInYear(2020)).toBe(53)
    expect(getIsoWeeksInYear(2021)).toBe(52)
    expect(getIsoWeeksInYear(2026)).toBe(53)
    expect(getIsoWeeksInYear(2027)).toBe(52)
  })
})

describe('getIsoWeeksForYear', () => {
  it('builds labelled options for every ISO week', () => {
    const weeks = getIsoWeeksForYear(2027)

    expect(weeks).toHaveLength(52)
    expect(weeks[0]).toEqual({
      year: 2027,
      week: 1,
      label: 'Week 1 — Jan 4 – Jan 10',
    })
    expect(weeks[51]).toEqual({
      year: 2027,
      week: 52,
      label: 'Week 52 — Dec 27 – Jan 2',
    })
  })

  it('includes week 53 in a 53-week year', () => {
    const weeks = getIsoWeeksForYear(2026)

    expect(weeks).toHaveLength(53)
    expect(weeks[52]).toEqual({
      year: 2026,
      week: 53,
      label: 'Week 53 — Dec 28 – Jan 3',
    })
  })
})

describe('holidayToWeekKey', () => {
  it('maps an ISO holiday week to its Monday week key', () => {
    expect(holidayToWeekKey({ year: 2026, week: 1 })).toBe('2025-12-29')
    expect(holidayToWeekKey({ year: 2026, week: 29 })).toBe('2026-07-13')
  })
})
