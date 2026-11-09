import { describe, expect, it } from 'vitest'
import type { Shift } from '@/types'
import {
  firstFreeStartMinute,
  minuteDeltaFromPixels,
  minuteToPercent,
  offsetXToMinute,
  rangeGap,
  rangeToPercentWidth,
  closestShiftIndex,
} from '@/modules/scheduler/utils/grid'

function bar(startMinute: number, endMinute: number): Shift {
  return {
    id: `shift-${startMinute}`,
    memberId: 'member-1',
    weekday: 'monday',
    startMinute,
    endMinute,
  }
}

describe('minuteToPercent', () => {
  it('maps the day window to 0–100%', () => {
    expect(minuteToPercent(540)).toBe(0)
    expect(minuteToPercent(1020)).toBe(50)
    expect(minuteToPercent(1080)).toBe(56.25)
    expect(minuteToPercent(1500)).toBe(100)
  })

  it('maps a slot boundary to a fractional percentage', () => {
    expect(minuteToPercent(570)).toBeCloseTo(3.125)
  })
})

describe('rangeToPercentWidth', () => {
  it('converts a minute range to a percentage width', () => {
    expect(rangeToPercentWidth(540, 570)).toBeCloseTo(3.125)
    expect(rangeToPercentWidth(540, 720)).toBeCloseTo(18.75)
    expect(rangeToPercentWidth(540, 1500)).toBe(100)
  })
})

describe('offsetXToMinute', () => {
  it('converts horizontal offsets to minutes inside the day window', () => {
    expect(offsetXToMinute(0, 960)).toBe(540)
    expect(offsetXToMinute(30, 960)).toBe(570)
    expect(offsetXToMinute(480, 960)).toBe(1020)
    expect(offsetXToMinute(960, 960)).toBe(1500)
  })
})

describe('minuteDeltaFromPixels', () => {
  it('converts pixel deltas to minute deltas', () => {
    expect(minuteDeltaFromPixels(0, 960)).toBe(0)
    expect(minuteDeltaFromPixels(30, 960)).toBe(30)
    expect(minuteDeltaFromPixels(480, 960)).toBe(480)
    expect(minuteDeltaFromPixels(48, 1536)).toBe(30)
  })
})

describe('firstFreeStartMinute', () => {
  it('returns the start of the day when there are no bars', () => {
    expect(firstFreeStartMinute([])).toBe(540)
  })

  it('skips occupied slots and returns the first free one', () => {
    expect(firstFreeStartMinute([bar(540, 570)])).toBe(570)
    expect(firstFreeStartMinute([bar(540, 600)])).toBe(600)
    expect(firstFreeStartMinute([bar(540, 570), bar(570, 600)])).toBe(600)
  })

  it('returns the day end when every slot is occupied', () => {
    expect(firstFreeStartMinute([bar(540, 1500)])).toBe(1500)
  })
})

describe('rangeGap', () => {
  it('returns 0 for overlapping ranges', () => {
    expect(rangeGap({ startMinute: 540, endMinute: 600 }, { startMinute: 570, endMinute: 630 })).toBe(0)
    expect(rangeGap({ startMinute: 570, endMinute: 630 }, { startMinute: 540, endMinute: 600 })).toBe(0)
  })

  it('returns 0 for touching ranges', () => {
    expect(rangeGap({ startMinute: 540, endMinute: 600 }, { startMinute: 600, endMinute: 660 })).toBe(0)
    expect(rangeGap({ startMinute: 600, endMinute: 660 }, { startMinute: 540, endMinute: 600 })).toBe(0)
  })

  it('returns exact gap for disjoint ranges', () => {
    expect(rangeGap({ startMinute: 540, endMinute: 600 }, { startMinute: 630, endMinute: 690 })).toBe(30)
    expect(rangeGap({ startMinute: 630, endMinute: 690 }, { startMinute: 540, endMinute: 600 })).toBe(30)
  })

  it('handles cross-midnight touching', () => {
    expect(rangeGap({ startMinute: 1440, endMinute: 1500 }, { startMinute: 1500, endMinute: 1560 })).toBe(0)
    expect(rangeGap({ startMinute: 1500, endMinute: 1560 }, { startMinute: 1440, endMinute: 1500 })).toBe(0)
  })

  it('handles cross-midnight gap', () => {
    expect(rangeGap({ startMinute: 1440, endMinute: 1500 }, { startMinute: 1530, endMinute: 1590 })).toBe(30)
    expect(rangeGap({ startMinute: 1530, endMinute: 1590 }, { startMinute: 1440, endMinute: 1500 })).toBe(30)
  })
})

describe('closestShiftIndex', () => {
  it('returns -1 for empty array', () => {
    expect(closestShiftIndex({ startMinute: 540, endMinute: 600 }, [])).toBe(-1)
  })

  it('picks touching or overlapping shift (gap 0)', () => {
    const shifts = [bar(540, 600), bar(720, 780)]
    expect(closestShiftIndex({ startMinute: 600, endMinute: 660 }, shifts)).toBe(0)
    expect(closestShiftIndex({ startMinute: 570, endMinute: 630 }, shifts)).toBe(0)
  })

  it('picks nearer disjoint shift', () => {
    const shifts = [bar(540, 600), bar(720, 780)]
    expect(closestShiftIndex({ startMinute: 660, endMinute: 720 }, shifts)).toBe(1)
  })

  it('equidistant picks earlier start even if later in array', () => {
    const shifts = [bar(720, 780), bar(540, 600)]
    expect(closestShiftIndex({ startMinute: 630, endMinute: 690 }, shifts)).toBe(1)
  })

  it('tie on start picks earlier end', () => {
    const shifts = [bar(540, 600), bar(540, 660)]
    expect(closestShiftIndex({ startMinute: 720, endMinute: 780 }, shifts)).toBe(1)
  })

  it('exact duplicates keep earlier array entry (stable)', () => {
    const shifts = [bar(540, 600), bar(540, 600)]
    expect(closestShiftIndex({ startMinute: 630, endMinute: 690 }, shifts)).toBe(0)
  })

  it('cross-midnight target picks nearest', () => {
    const shifts = [bar(1440, 1500), bar(540, 600)]
    expect(closestShiftIndex({ startMinute: 1500, endMinute: 1560 }, shifts)).toBe(0)
    expect(closestShiftIndex({ startMinute: 1530, endMinute: 1590 }, shifts)).toBe(0)
  })
})
