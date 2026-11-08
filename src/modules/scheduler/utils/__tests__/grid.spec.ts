import { describe, expect, it } from 'vitest'
import type { Shift } from '@/types'
import {
  firstFreeStartMinute,
  minuteDeltaFromPixels,
  minuteToPercent,
  offsetXToMinute,
  rangeToPercentWidth,
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
