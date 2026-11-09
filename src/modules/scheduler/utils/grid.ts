import type { Shift } from '@/types'
import type { MinuteRange } from '@/shared/utils/shifts'
import {
  DAY_END_MINUTE,
  DAY_START_MINUTE,
  SLOT_MINUTES,
  shiftsOverlap,
} from '@/shared/utils/shifts'

const DAY_SPAN_MINUTES = DAY_END_MINUTE - DAY_START_MINUTE

export const MAX_SHIFTS_PER_ROW = 2

export function minuteToPercent(minute: number): number {
  return ((minute - DAY_START_MINUTE) / DAY_SPAN_MINUTES) * 100
}

export function rangeToPercentWidth(start: number, end: number): number {
  return ((end - start) / DAY_SPAN_MINUTES) * 100
}

export function offsetXToMinute(offsetX: number, trackWidth: number): number {
  return DAY_START_MINUTE + (offsetX / trackWidth) * DAY_SPAN_MINUTES
}

export function minuteDeltaFromPixels(deltaPx: number, trackWidth: number): number {
  return (deltaPx / trackWidth) * DAY_SPAN_MINUTES
}

export function firstFreeStartMinute(bars: Shift[]): number {
  for (
    let start = DAY_START_MINUTE;
    start + SLOT_MINUTES <= DAY_END_MINUTE;
    start += SLOT_MINUTES
  ) {
    const slot = { startMinute: start, endMinute: start + SLOT_MINUTES }
    if (!bars.some((bar) => shiftsOverlap(bar, slot))) return start
  }

  return DAY_END_MINUTE
}

export function rangeGap(a: MinuteRange, b: MinuteRange): number {
  const start = Math.max(a.startMinute, b.startMinute)
  const end = Math.min(a.endMinute, b.endMinute)
  return Math.max(0, start - end)
}

function isCloserShift(
  target: MinuteRange,
  current: MinuteRange,
  best: MinuteRange,
): boolean {
  const currentGap = rangeGap(target, current)
  const bestGap = rangeGap(target, best)
  if (currentGap !== bestGap) return currentGap < bestGap
  if (current.startMinute !== best.startMinute) return current.startMinute < best.startMinute
  if (current.endMinute !== best.endMinute) return current.endMinute < best.endMinute
  return false
}

export function closestShiftIndex(target: MinuteRange, bars: readonly Shift[]): number {
  if (bars.length === 0) return -1
  let bestIndex = 0
  let bestShift = bars[0]
  for (let i = 1; i < bars.length; i++) {
    const current = bars[i]
    if (isCloserShift(target, current, bestShift)) {
      bestIndex = i
      bestShift = current
    }
  }
  return bestIndex
}
