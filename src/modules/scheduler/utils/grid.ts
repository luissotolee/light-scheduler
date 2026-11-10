import type { Shift } from '@/types'
import type { DaySlot, MinuteRange, SchedulingWindow } from '@/shared/utils/shifts'
import { DEFAULT_SCHEDULING_WINDOW, shiftsOverlap } from '@/shared/utils/shifts'

export const MAX_SHIFTS_PER_ROW = 2

function windowSpan(window: SchedulingWindow): number {
  return window.endMinute - window.startMinute
}

export function windowFromSlots(slots: readonly DaySlot[]): SchedulingWindow {
  if (slots.length === 0) return { ...DEFAULT_SCHEDULING_WINDOW }

  const first = slots[0]
  const last = slots[slots.length - 1]
  const slotMinutes = first.endMinute - first.startMinute
  if (slotMinutes <= 0) return { ...DEFAULT_SCHEDULING_WINDOW }

  return {
    startMinute: first.startMinute,
    endMinute: last.endMinute,
    slotMinutes,
  }
}

export function minuteToPercent(
  minute: number,
  window: SchedulingWindow = DEFAULT_SCHEDULING_WINDOW,
): number {
  const span = windowSpan(window)
  if (span <= 0) return 0
  return ((minute - window.startMinute) / span) * 100
}

export function rangeToPercentWidth(
  start: number,
  end: number,
  window: SchedulingWindow = DEFAULT_SCHEDULING_WINDOW,
): number {
  const span = windowSpan(window)
  if (span <= 0) return 0
  return ((end - start) / span) * 100
}

export function offsetXToMinute(
  offsetX: number,
  trackWidth: number,
  window: SchedulingWindow = DEFAULT_SCHEDULING_WINDOW,
): number {
  if (trackWidth <= 0) return window.startMinute
  return window.startMinute + (offsetX / trackWidth) * windowSpan(window)
}

export function minuteDeltaFromPixels(
  deltaPx: number,
  trackWidth: number,
  window: SchedulingWindow = DEFAULT_SCHEDULING_WINDOW,
): number {
  if (trackWidth <= 0) return 0
  return (deltaPx / trackWidth) * windowSpan(window)
}

export function firstFreeStartMinute(
  bars: readonly Shift[],
  window: SchedulingWindow = DEFAULT_SCHEDULING_WINDOW,
): number {
  const step = window.slotMinutes
  if (step <= 0) return window.startMinute

  for (let start = window.startMinute; start + step <= window.endMinute; start += step) {
    const slot = { startMinute: start, endMinute: start + step }
    if (!bars.some((bar) => shiftsOverlap(bar, slot))) return start
  }

  return window.endMinute
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
