import type { Duty, Shift, TeamMember } from '@/types'
import { DUTY_SORT_ORDER, compareNames, initialsOf } from '@/shared/utils/employee'
import { minutesToHours, sumShiftMinutes } from '@/shared/utils/hours'

export { initialsOf, minutesToHours, sumShiftMinutes }
export { formatDiff, formatHours } from '@/shared/utils/hours'

export interface WeeklyHoursRow {
  memberId: string
  name: string
  initials: string
  currentHours: number
  contractHours: number
  diffHours: number
}

export interface WeeklyHoursGroup {
  duty: Duty
  rows: WeeklyHoursRow[]
}

export function buildWeeklyHoursGroups(
  members: readonly TeamMember[],
  shifts: readonly Shift[],
): WeeklyHoursGroup[] {
  const minutesByMember = new Map<string, number>()
  for (const shift of shifts) {
    const current = minutesByMember.get(shift.memberId) ?? 0
    minutesByMember.set(shift.memberId, current + (shift.endMinute - shift.startMinute))
  }

  const rowsByDuty = new Map<Duty, WeeklyHoursRow[]>()
  for (const member of members) {
    const currentHours = minutesToHours(minutesByMember.get(member.id) ?? 0)
    const rows = rowsByDuty.get(member.duty) ?? []
    rows.push({
      memberId: member.id,
      name: member.name,
      initials: initialsOf(member.name),
      currentHours,
      contractHours: member.weeklyHours,
      diffHours: currentHours - member.weeklyHours,
    })
    rowsByDuty.set(member.duty, rows)
  }

  const groups: WeeklyHoursGroup[] = []
  for (const duty of DUTY_SORT_ORDER) {
    const rows = rowsByDuty.get(duty)
    if (!rows || rows.length === 0) continue
    rows.sort((a, b) => compareNames(a.name, b.name) || a.memberId.localeCompare(b.memberId))
    groups.push({ duty, rows })
  }

  return groups
}
