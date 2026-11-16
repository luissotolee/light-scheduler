import type { Shift, WeekKey } from '@/types'
import type { RestConflict } from '@/modules/scheduler/types'
import { WEEKDAY_ORDER, isoDateToDayNumber } from '@/shared/utils/calendar'

export const MIN_REST_MINUTES = 12 * 60

const MINUTES_PER_DAY = 1440

interface TimelineShift {
  shift: Shift
  weekKey: WeekKey
  day: number
  start: number
  end: number
}

function toTimeline(shift: Shift, weekKey: WeekKey): TimelineShift {
  const day = isoDateToDayNumber(weekKey) + WEEKDAY_ORDER.indexOf(shift.weekday)
  return {
    shift,
    weekKey,
    day,
    start: day * MINUTES_PER_DAY + shift.startMinute,
    end: day * MINUTES_PER_DAY + shift.endMinute,
  }
}

export function findRestConflicts(
  candidate: Shift,
  candidateWeekKey: WeekKey,
  schedules: Readonly<Record<WeekKey, readonly Shift[]>>,
): RestConflict[] {
  const candidateShift = toTimeline(candidate, candidateWeekKey)
  let previous: TimelineShift | null = null
  let following: TimelineShift | null = null

  for (const [weekKey, shifts] of Object.entries(schedules)) {
    for (const shift of shifts) {
      if (shift.memberId !== candidate.memberId) continue
      if (shift.id === candidate.id) continue

      const entry = toTimeline(shift, weekKey)
      // Same-day split shifts are intra-day breaks, not the daily rest gap.
      if (entry.day === candidateShift.day) continue

      if (entry.day < candidateShift.day) {
        if (!previous || entry.end > previous.end) previous = entry
      } else if (!following || entry.start < following.start) {
        following = entry
      }
    }
  }

  const conflicts: RestConflict[] = []

  if (previous) {
    const restMinutes = candidateShift.start - previous.end
    if (restMinutes < MIN_REST_MINUTES) {
      conflicts.push({ shift: previous.shift, weekKey: previous.weekKey, restMinutes })
    }
  }

  if (following) {
    const restMinutes = following.start - candidateShift.end
    if (restMinutes < MIN_REST_MINUTES) {
      conflicts.push({ shift: following.shift, weekKey: following.weekKey, restMinutes })
    }
  }

  return conflicts.sort((a, b) => a.restMinutes - b.restMinutes)
}
