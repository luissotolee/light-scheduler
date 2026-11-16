import type { SickLeave, TeamMember, Weekday, WeekKey } from '@/types'
import { parseIsoDate, weekdayIsoDate } from '@/shared/utils/calendar'

export const DEFAULT_SICK_LEAVES: readonly SickLeave[] = []

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isSickLeave(value: unknown): value is SickLeave {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || value.id.trim() === '') return false

  const startDate = parseIsoDate(value.startDate)
  const endDate = parseIsoDate(value.endDate)
  if (startDate === null || endDate === null) return false

  return startDate <= endDate
}

export function parseSickLeaves(value: unknown): SickLeave[] | null {
  if (value === undefined) return []

  if (!Array.isArray(value)) return null

  const leaves: SickLeave[] = []
  const ids = new Set<string>()
  for (const item of value) {
    if (!isSickLeave(item)) return null
    if (ids.has(item.id)) return null
    ids.add(item.id)
    leaves.push({ id: item.id, startDate: item.startDate, endDate: item.endDate })
  }

  return normalizeSickLeaves(leaves)
}

export function normalizeSickLeaves(leaves: readonly SickLeave[]): SickLeave[] {
  return [...leaves]
    .map((leave) => ({ id: leave.id, startDate: leave.startDate, endDate: leave.endDate }))
    .sort(
      (a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate),
    )
}

export function sickLeavesOf(member: Pick<TeamMember, 'sickLeaves'>): SickLeave[] {
  return member.sickLeaves ?? []
}

export function sickLeaveCoversDate(
  leave: Pick<SickLeave, 'startDate' | 'endDate'>,
  isoDate: string,
): boolean {
  return leave.startDate <= isoDate && isoDate <= leave.endDate
}

export function isDateInSickLeaves(
  leaves: readonly Pick<SickLeave, 'startDate' | 'endDate'>[],
  isoDate: string,
): boolean {
  return leaves.some((leave) => sickLeaveCoversDate(leave, isoDate))
}

export function isMemberSickOnDate(
  member: Pick<TeamMember, 'sickLeaves'>,
  isoDate: string,
): boolean {
  return isDateInSickLeaves(sickLeavesOf(member), isoDate)
}

export function isMemberSickOnWeekday(
  member: Pick<TeamMember, 'sickLeaves'>,
  weekKey: WeekKey,
  weekday: Weekday,
): boolean {
  return isMemberSickOnDate(member, weekdayIsoDate(weekKey, weekday))
}

export function isValidSickLeaveRange(startDate: string, endDate: string): boolean {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  if (start === null || end === null) return false
  return start <= end
}

export function overlapsSickLeave(
  leaves: readonly Pick<SickLeave, 'startDate' | 'endDate'>[],
  startDate: string,
  endDate: string,
): boolean {
  return leaves.some(
    (leave) => leave.startDate <= endDate && startDate <= leave.endDate,
  )
}
