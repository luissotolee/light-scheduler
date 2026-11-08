import type { DayOff, HolidayWeek, Shift, TeamMember, Weekday, WeekKey } from '@/types'
import { getIsoWeeksInYear, parseIsoDate } from '@/shared/utils/calendar'
import { isContract, isDuty, normalizeHolidays, parseWeeklyHours } from '@/shared/utils/employee'

export const WORKSPACE_STORAGE_KEY = 'light-scheduler.workspace'
export const WORKSPACE_SCHEMA_VERSION = 1

export interface PersistedWorkspace {
  version: typeof WORKSPACE_SCHEMA_VERSION
  members: TeamMember[]
  schedules: Record<WeekKey, Shift[]>
  dayOffs: Record<WeekKey, DayOff[]>
  currentWeekKey: WeekKey
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string'
}

function isOptionalIsoDate(value: unknown): boolean {
  return value === undefined || parseIsoDate(value) !== null
}

function parseList<T>(value: unknown, isValidItem: (item: unknown) => item is T): T[] | null {
  if (!Array.isArray(value)) return null

  const result: T[] = []
  for (const item of value) {
    if (!isValidItem(item)) return null
    result.push(item)
  }
  return result
}

function parseWeekRecord<T>(
  value: unknown,
  isValidItem: (item: unknown) => item is T,
): Record<WeekKey, T[]> | null {
  if (!isRecord(value)) return null

  const result: Record<WeekKey, T[]> = {}
  for (const [weekKey, items] of Object.entries(value)) {
    const parsed = parseList(items, isValidItem)
    if (parsed === null) return null
    result[weekKey] = parsed
  }
  return result
}

export function isWeekday(value: unknown): value is Weekday {
  return (
    value === 'monday' ||
    value === 'tuesday' ||
    value === 'wednesday' ||
    value === 'thursday' ||
    value === 'friday' ||
    value === 'saturday' ||
    value === 'sunday'
  )
}

export function isShift(value: unknown): value is Shift {
  if (!isRecord(value)) return false
  if (typeof value.startMinute !== 'number' || typeof value.endMinute !== 'number') {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.memberId === 'string' &&
    isWeekday(value.weekday) &&
    Number.isFinite(value.startMinute) &&
    Number.isFinite(value.endMinute) &&
    value.startMinute >= 0 &&
    value.startMinute < value.endMinute &&
    value.endMinute <= 1500
  )
}

export function isDayOff(value: unknown): value is DayOff {
  return isRecord(value) && typeof value.memberId === 'string' && isWeekday(value.weekday)
}

function isHolidayWeek(value: unknown): value is HolidayWeek {
  if (!isRecord(value)) return false
  if (typeof value.year !== 'number' || typeof value.week !== 'number') return false
  if (!Number.isInteger(value.year) || value.year < 1) return false
  if (!Number.isInteger(value.week) || value.week < 1) return false

  return value.week <= getIsoWeeksInYear(value.year)
}

function parseHolidayWeeks(value: unknown): HolidayWeek[] | null {
  const holidays = parseList(value, isHolidayWeek)
  if (holidays === null) return null
  return normalizeHolidays(holidays)
}

export function isTeamMember(value: unknown): value is TeamMember {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isDuty(value.duty) &&
    isContract(value.contract) &&
    parseWeeklyHours(value.weeklyHours) !== null &&
    parseHolidayWeeks(value.holidays) !== null &&
    typeof value.active === 'boolean' &&
    parseIsoDate(value.startDate) !== null &&
    isOptionalString(value.email) &&
    isOptionalString(value.phone) &&
    isOptionalIsoDate(value.endDate)
  )
}

export function parsePersistedWorkspace(value: unknown): PersistedWorkspace | null {
  if (!isRecord(value)) return null
  if (value.version !== WORKSPACE_SCHEMA_VERSION) return null

  const members = parseList(value.members, isTeamMember)
  if (members === null) return null

  const schedules = parseWeekRecord(value.schedules, isShift)
  if (schedules === null) return null

  const dayOffs = parseWeekRecord(value.dayOffs, isDayOff)
  if (dayOffs === null) return null

  const currentWeekKey = parseIsoDate(value.currentWeekKey)
  if (currentWeekKey === null) return null

  return {
    version: WORKSPACE_SCHEMA_VERSION,
    members,
    schedules,
    dayOffs,
    currentWeekKey,
  }
}

export function serializeWorkspace(
  payload: Omit<PersistedWorkspace, 'version'>,
): PersistedWorkspace {
  return { version: WORKSPACE_SCHEMA_VERSION, ...payload }
}
