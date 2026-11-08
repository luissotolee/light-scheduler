import type { Shift } from '@/types'
import {
  DAY_END_MINUTE,
  DAY_START_MINUTE,
  SLOT_MINUTES,
  shiftsOverlap,
} from '@/shared/utils/shifts'

const DAY_SPAN_MINUTES = DAY_END_MINUTE - DAY_START_MINUTE

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
