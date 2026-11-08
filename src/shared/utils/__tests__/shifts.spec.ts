import { describe, expect, it } from 'vitest'
import {
  DAY_END_MINUTE,
  DAY_START_MINUTE,
  buildDaySlots,
  clampToDayWindow,
  formatExtendedMinutes,
  formatMinutesToHhmm,
  isNextDayMinute,
  mergeOverlappingRanges,
  normalizeGridRange,
  parseTimeToMinutes,
  shiftsOverlap,
  snapToSlot,
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

describe('mergeOverlappingRanges', () => {
  it('returns the candidate unchanged when nothing overlaps', () => {
    expect(
      mergeOverlappingRanges({ startMinute: 540, endMinute: 600 }, [
        { startMinute: 660, endMinute: 720 },
        { startMinute: 780, endMinute: 840 },
      ]),
    ).toEqual({ range: { startMinute: 540, endMinute: 600 }, mergedIndexes: [] })
  })

  it('absorbs a range contained by the candidate', () => {
    expect(
      mergeOverlappingRanges({ startMinute: 540, endMinute: 720 }, [
        { startMinute: 600, endMinute: 660 },
      ]),
    ).toEqual({ range: { startMinute: 540, endMinute: 720 }, mergedIndexes: [0] })
  })

  it('expands to a range that contains the candidate', () => {
    expect(
      mergeOverlappingRanges({ startMinute: 600, endMinute: 660 }, [
        { startMinute: 540, endMinute: 720 },
      ]),
    ).toEqual({ range: { startMinute: 540, endMinute: 720 }, mergedIndexes: [0] })
  })

  it('merges partially overlapping ranges in both directions', () => {
    expect(
      mergeOverlappingRanges({ startMinute: 540, endMinute: 660 }, [
        { startMinute: 600, endMinute: 720 },
      ]),
    ).toEqual({ range: { startMinute: 540, endMinute: 720 }, mergedIndexes: [0] })

    expect(
      mergeOverlappingRanges({ startMinute: 600, endMinute: 720 }, [
        { startMinute: 540, endMinute: 660 },
      ]),
    ).toEqual({ range: { startMinute: 540, endMinute: 720 }, mergedIndexes: [0] })
  })

  it('leaves two disjoint others unmerged', () => {
    expect(
      mergeOverlappingRanges({ startMinute: 540, endMinute: 600 }, [
        { startMinute: 480, endMinute: 540 },
        { startMinute: 660, endMinute: 720 },
      ]),
    ).toEqual({ range: { startMinute: 540, endMinute: 600 }, mergedIndexes: [] })
  })

  it('keeps extending through chained overlaps until a fixpoint', () => {
    expect(
      mergeOverlappingRanges({ startMinute: 540, endMinute: 600 }, [
        { startMinute: 620, endMinute: 700 },
        { startMinute: 580, endMinute: 640 },
      ]),
    ).toEqual({ range: { startMinute: 540, endMinute: 700 }, mergedIndexes: [0, 1] })
  })

  it('merges cross-midnight ranges', () => {
    expect(
      mergeOverlappingRanges({ startMinute: 1410, endMinute: 1470 }, [
        { startMinute: 1440, endMinute: 1500 },
      ]),
    ).toEqual({ range: { startMinute: 1410, endMinute: 1500 }, mergedIndexes: [0] })
  })

  it('does not merge touching ranges', () => {
    expect(
      mergeOverlappingRanges({ startMinute: 540, endMinute: 600 }, [
        { startMinute: 600, endMinute: 660 },
        { startMinute: 480, endMinute: 540 },
      ]),
    ).toEqual({ range: { startMinute: 540, endMinute: 600 }, mergedIndexes: [] })
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

describe('buildDaySlots', () => {
  it('builds 32 half-hour slots from 09:00 through 01:00 next day', () => {
    const slots = buildDaySlots()

    expect(slots).toHaveLength(32)
    expect(slots[0]).toEqual({
      index: 0,
      startMinute: DAY_START_MINUTE,
      endMinute: 570,
      label: '09:00',
      hourLabel: '09',
      minuteLabel: '00',
      isNextDay: false,
    })
    expect(slots[31]).toEqual({
      index: 31,
      startMinute: 1470,
      endMinute: DAY_END_MINUTE,
      label: '00:30',
      hourLabel: '00',
      minuteLabel: '30',
      isNextDay: true,
    })
    expect(slots.every((slot) => slot.endMinute - slot.startMinute === 30)).toBe(true)
  })

  it('marks slots that start on the next calendar day', () => {
    const slots = buildDaySlots()

    expect(slots.find((slot) => slot.startMinute === 1440)?.label).toBe('00:00')
    expect(slots.filter((slot) => slot.isNextDay)).toHaveLength(2)
  })
})

describe('snapToSlot', () => {
  it('rounds to the nearest half hour', () => {
    expect(snapToSlot(540)).toBe(540)
    expect(snapToSlot(545)).toBe(540)
    expect(snapToSlot(555)).toBe(570)
    expect(snapToSlot(604)).toBe(600)
    expect(snapToSlot(1500)).toBe(1500)
  })
})

describe('clampToDayWindow', () => {
  it('clamps minutes to the scheduling window', () => {
    expect(clampToDayWindow(0)).toBe(DAY_START_MINUTE)
    expect(clampToDayWindow(600)).toBe(600)
    expect(clampToDayWindow(1600)).toBe(DAY_END_MINUTE)
  })
})

describe('normalizeGridRange', () => {
  it('snaps and orders a valid range', () => {
    expect(normalizeGridRange(545, 605)).toEqual({ startMinute: 540, endMinute: 600 })
    expect(normalizeGridRange(720, 540)).toEqual({ startMinute: 540, endMinute: 720 })
  })

  it('rejects ranges shorter than 30 minutes', () => {
    expect(normalizeGridRange(540, 550)).toBeNull()
    expect(normalizeGridRange(1500, 1530)).toBeNull()
  })

  it('clamps ranges to the day window', () => {
    expect(normalizeGridRange(0, 1600)).toEqual({
      startMinute: DAY_START_MINUTE,
      endMinute: DAY_END_MINUTE,
    })
    expect(normalizeGridRange(1440, 1500)).toEqual({ startMinute: 1440, endMinute: 1500 })
  })
})

describe('formatExtendedMinutes', () => {
  it('formats minutes beyond midnight as next-day clock times', () => {
    expect(formatExtendedMinutes(540)).toBe('09:00')
    expect(formatExtendedMinutes(1440)).toBe('00:00')
    expect(formatExtendedMinutes(1470)).toBe('00:30')
    expect(formatExtendedMinutes(1500)).toBe('01:00')
  })
})

describe('isNextDayMinute', () => {
  it('detects minutes on the following calendar day', () => {
    expect(isNextDayMinute(1439)).toBe(false)
    expect(isNextDayMinute(1440)).toBe(true)
    expect(isNextDayMinute(1500)).toBe(true)
  })
})
