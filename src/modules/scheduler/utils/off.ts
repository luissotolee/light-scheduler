import type { DayOff } from '@/types'

export const MIN_DAYS_OFF = 2

export function countDaysOffByMember(dayOffs: readonly DayOff[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const dayOff of dayOffs) {
    counts.set(dayOff.memberId, (counts.get(dayOff.memberId) ?? 0) + 1)
  }
  return counts
}
