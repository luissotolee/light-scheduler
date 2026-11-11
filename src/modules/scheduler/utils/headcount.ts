import type { DayRow } from '@/modules/scheduler/types'
import type { DaySlot } from '@/shared/utils/shifts'

export interface HourGroup {
  key: string
  label: string
  span: number
  isNextDay: boolean
  startMinute: number
  endMinute: number
}

export interface HourHeadcount extends HourGroup {
  count: number
}

type Interval = [start: number, end: number]

function isWorking(row: DayRow): boolean {
  return !row.isOff && !row.isHoliday
}

function mergeInterval(merged: Interval[], start: number, end: number): void {
  const last = merged[merged.length - 1]
  if (last && start <= last[1]) {
    last[1] = Math.max(last[1], end)
    return
  }
  merged.push([start, end])
}

function employeeIntervals(
  row: DayRow,
  startMinute: number,
  endMinute: number,
): Interval[] {
  const intervals: Interval[] = []

  for (const bar of row.bars) {
    const start = Math.max(bar.startMinute, startMinute)
    const end = Math.min(bar.endMinute, endMinute)
    if (start < end) intervals.push([start, end])
  }

  intervals.sort((a, b) => a[0] - b[0])

  const merged: Interval[] = []
  for (const [start, end] of intervals) {
    mergeInterval(merged, start, end)
  }

  return merged
}

export function buildHourGroups(slots: readonly DaySlot[]): HourGroup[] {
  const groups: HourGroup[] = []

  for (const slot of slots) {
    const last = groups[groups.length - 1]
    if (!last || last.label !== slot.hourLabel) {
      groups.push({
        key: `${slot.hourLabel}-${slot.index}`,
        label: slot.hourLabel,
        span: 1,
        isNextDay: slot.isNextDay,
        startMinute: slot.startMinute,
        endMinute: slot.endMinute,
      })
    } else {
      last.span += 1
      last.endMinute = slot.endMinute
    }
  }

  return groups
}

export function countPeakEmployees(
  rows: readonly DayRow[],
  startMinute: number,
  endMinute: number,
): number {
  const events: Array<{ minute: number; delta: 1 | -1 }> = []

  for (const row of rows) {
    if (!isWorking(row)) continue

    for (const [start, end] of employeeIntervals(row, startMinute, endMinute)) {
      events.push({ minute: start, delta: 1 }, { minute: end, delta: -1 })
    }
  }

  // Half-open intervals: an end (-1) is processed before a start (+1) at the
  // same minute, so a hand-off at e.g. 10:30 never counts both employees.
  events.sort((a, b) => a.minute - b.minute || a.delta - b.delta)

  let current = 0
  let peak = 0
  for (const event of events) {
    current += event.delta
    peak = Math.max(peak, current)
  }

  return peak
}

export function buildHourlyHeadcounts(
  rows: readonly DayRow[],
  slots: readonly DaySlot[],
): HourHeadcount[] {
  return buildHourGroups(slots).map((group) => ({
    ...group,
    count: countPeakEmployees(rows, group.startMinute, group.endMinute),
  }))
}
