import type { Duty, Shift, TeamMember, WeekKey } from '@/types'

export const WEEKLY_HOURS_GROUP_ORDER: readonly Duty[] = [
  'head_manager',
  'assistant',
  'manager',
  'employee',
]

export function dutyRank(duty: Duty): number {
  const index = WEEKLY_HOURS_GROUP_ORDER.indexOf(duty)
  return index === -1 ? WEEKLY_HOURS_GROUP_ORDER.length : index
}

export function compareNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' })
}

export function compareMembersByDuty(
  a: Pick<TeamMember, 'id' | 'name' | 'duty'>,
  b: Pick<TeamMember, 'id' | 'name' | 'duty'>,
): number {
  return (
    dutyRank(a.duty) - dutyRank(b.duty) ||
    compareNames(a.name, b.name) ||
    a.id.localeCompare(b.id)
  )
}

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

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word[0].toUpperCase())
    .join('')
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

export function isMemberInWeek(
  member: Pick<TeamMember, 'startDate' | 'endDate'>,
  weekStart: WeekKey,
  weekEnd: WeekKey,
): boolean {
  if (member.startDate > weekEnd) return false
  if (member.endDate !== undefined && member.endDate < weekStart) return false
  return true
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
  for (const duty of WEEKLY_HOURS_GROUP_ORDER) {
    const rows = rowsByDuty.get(duty)
    if (!rows || rows.length === 0) continue
    rows.sort((a, b) => compareNames(a.name, b.name) || a.memberId.localeCompare(b.memberId))
    groups.push({ duty, rows })
  }

  return groups
}
