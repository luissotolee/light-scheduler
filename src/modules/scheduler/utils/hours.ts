import type { Duty, Shift, TeamMember } from '@/types'
import { DUTY_SORT_ORDER, compareNames, initialsOf } from '@/shared/utils/employee'

export { initialsOf }

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

export function sumShiftMinutes(shifts: readonly Shift[]): number {
  return shifts.reduce((total, shift) => total + (shift.endMinute - shift.startMinute), 0)
}

export function minutesToHours(minutes: number): number {
  return minutes / 60
}

export function formatHours(hours: number): string {
  return (Math.round(hours * 10) / 10).toFixed(1)
}

export function formatDiff(hours: number): string {
  const rounded = Math.round(hours * 10) / 10
  if (rounded === 0) return '0.0'
  return rounded > 0 ? `+${rounded.toFixed(1)}` : `-${Math.abs(rounded).toFixed(1)}`
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
