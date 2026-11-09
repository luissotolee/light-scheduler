import type { DayOff, RowError, Shift, TeamMember, WeekKey, Weekday } from '@/types'
import {
  WEEKDAY_ORDER,
  getIsoWeek,
  getIsoWeekStart,
  getIsoWeeksInYear,
  getWeekKey,
  isoDateToDate,
  weekdayIsoDate,
} from '@/shared/utils/calendar'
import { formatMinutesToHhmm } from '@/shared/utils/shifts'
import { isMemberInWeek } from '@/shared/utils/employee'
import { createId } from '@/shared/utils/id'

export const SCHEDULE_HEADERS: readonly string[] = [
  'week',
  'emp_id',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const DAY_OFF_TOKEN = 'OFF'
export const SHIFT_LIST_SEPARATOR = ';'
export const SHIFT_RANGE_SEPARATOR = '-'
export const MAX_SCHEDULE_MINUTE = 1500

export interface ImportedScheduleData {
  schedules: Record<WeekKey, Shift[]>
  dayOffs: Record<WeekKey, DayOff[]>
  weekCount: number
  shiftCount: number
}

export type ValidatedSchedule =
  | { ok: true; data: ImportedScheduleData }
  | { ok: false; errors: RowError[] }

export type ParsedDayCell =
  | { kind: 'empty' }
  | { kind: 'off' }
  | { kind: 'shifts'; ranges: { startMinute: number; endMinute: number }[] }
  | { kind: 'invalid' }

const WEEK_TOKEN_RE = /^Y(\d{4})W(\d{1,2})$/i
const SCHEDULE_TIME_RE = /^(\d{1,2}):([0-5]\d)$/

export function formatIsoWeekToken(year: number, week: number): string {
  return `Y${year}W${week}`
}

export function weekKeyToIsoWeekToken(weekKey: WeekKey): string {
  const { year, week } = getIsoWeek(isoDateToDate(weekKey))
  return formatIsoWeekToken(year, week)
}

export function parseIsoWeekToken(
  token: string,
): { year: number; week: number; weekKey: WeekKey } | null {
  const match = WEEK_TOKEN_RE.exec(token.trim())
  if (!match) return null

  const year = Number(match[1])
  const week = Number(match[2])
  if (!Number.isInteger(year) || !Number.isInteger(week)) return null
  if (week < 1 || week > getIsoWeeksInYear(year)) return null

  const weekKey = getWeekKey(getIsoWeekStart(year, week))
  return { year, week, weekKey }
}

function parseScheduleTime(value: string): number | null {
  const match = SCHEDULE_TIME_RE.exec(value.trim())
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])
  const total = hour * 60 + minute
  if (total > MAX_SCHEDULE_MINUTE) return null
  return total
}

export function formatShiftRangeToken(
  shift: Pick<Shift, 'startMinute' | 'endMinute'>,
): string {
  return `${formatMinutesToHhmm(shift.startMinute)}-${formatMinutesToHhmm(shift.endMinute)}`
}

export function parseShiftRangeToken(
  token: string,
): { startMinute: number; endMinute: number } | null {
  const parts = token.split(SHIFT_RANGE_SEPARATOR)
  if (parts.length !== 2) return null

  const startMinute = parseScheduleTime(parts[0])
  const endMinute = parseScheduleTime(parts[1])
  if (startMinute === null || endMinute === null) return null
  if (startMinute >= endMinute) return null

  return { startMinute, endMinute }
}

export function formatDayCell(shifts: readonly Shift[], isDayOff: boolean): string {
  if (isDayOff) return DAY_OFF_TOKEN
  if (shifts.length === 0) return ''

  return [...shifts]
    .sort((a, b) => a.startMinute - b.startMinute)
    .map((shift) => formatShiftRangeToken(shift))
    .join(SHIFT_LIST_SEPARATOR)
}

export function parseDayCell(value: string): ParsedDayCell {
  const trimmed = value.trim()
  if (!trimmed) return { kind: 'empty' }
  if (trimmed.toUpperCase() === DAY_OFF_TOKEN) return { kind: 'off' }

  const tokens = trimmed.split(SHIFT_LIST_SEPARATOR)
  const ranges: { startMinute: number; endMinute: number }[] = []

  for (const token of tokens) {
    const parsed = parseShiftRangeToken(token)
    if (!parsed) return { kind: 'invalid' }
    ranges.push(parsed)
  }

  const sorted = [...ranges].sort((a, b) => a.startMinute - b.startMinute)
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].startMinute < sorted[index - 1].endMinute) {
      return { kind: 'invalid' }
    }
  }

  return { kind: 'shifts', ranges: sorted }
}

function compareWeeks(a: WeekKey, b: WeekKey): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export function buildScheduleCsvRows(
  members: readonly TeamMember[],
  schedules: Readonly<Record<WeekKey, Shift[]>>,
  dayOffs: Readonly<Record<WeekKey, DayOff[]>>,
): string[][] {
  const memberIds = new Set(members.map((member) => member.id))

  const weeks = Object.keys(schedules)
    .filter((weekKey) =>
      (schedules[weekKey] ?? []).some((shift) => memberIds.has(shift.memberId)),
    )
    .sort(compareWeeks)

  const rows: string[][] = []

  for (const weekKey of weeks) {
    const marker = new Array<string>(SCHEDULE_HEADERS.length).fill('')
    marker[0] = weekKeyToIsoWeekToken(weekKey)
    rows.push(marker)

    const weekEnd = weekdayIsoDate(weekKey, 'sunday')
    const activeMembers = members
      .filter((member) => isMemberInWeek(member, weekKey, weekEnd))
      .sort((a, b) => {
        if (a.empId < b.empId) return -1
        if (a.empId > b.empId) return 1
        return 0
      })

    for (const member of activeMembers) {
      const row: string[] = ['', member.empId]

      for (const weekday of WEEKDAY_ORDER) {
        const shifts = (schedules[weekKey] ?? []).filter(
          (shift) => shift.memberId === member.id && shift.weekday === weekday,
        )
        const isDayOff = (dayOffs[weekKey] ?? []).some(
          (off) => off.memberId === member.id && off.weekday === weekday,
        )
        row.push(formatDayCell(shifts, isDayOff))
      }

      rows.push(row)
    }
  }

  return rows
}

export function validateScheduleCsv(
  headers: readonly string[],
  rows: readonly string[][],
  members: readonly TeamMember[],
): ValidatedSchedule {
  const normalizedHeaders = headers.map((header) => header.trim().toLowerCase())
  const expectedHeaders = SCHEDULE_HEADERS.map((header) => header.toLowerCase())
  const headersValid =
    normalizedHeaders.length === expectedHeaders.length &&
    expectedHeaders.every((header, index) => header === normalizedHeaders[index])

  if (!headersValid) {
    return { ok: false, errors: [{ row: 1, message: 'errors.unexpectedHeaders' }] }
  }

  const memberByEmpId = new Map<string, TeamMember>()
  for (const member of members) {
    if (memberByEmpId.has(member.empId)) {
      return { ok: false, errors: [{ row: 1, message: 'errors.duplicateEmpId' }] }
    }
    memberByEmpId.set(member.empId, member)
  }

  const errors: RowError[] = []
  const schedules: Record<WeekKey, Shift[]> = {}
  const dayOffs: Record<WeekKey, DayOff[]> = {}
  const seen = new Set<string>()
  let currentWeekKey: WeekKey | null = null

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const weekCell = (row[0] ?? '').trim()

    if (weekCell) {
      const parsedWeek = parseIsoWeekToken(weekCell)
      if (!parsedWeek) {
        errors.push({ row: rowNumber, message: 'errors.invalidScheduleWeek' })
        return
      }
      currentWeekKey = parsedWeek.weekKey
    }

    const empId = (row[1] ?? '').trim()
    const cells = WEEKDAY_ORDER.map((_, weekdayIndex) => (row[weekdayIndex + 2] ?? '').trim())
    const hasWeekdayData = cells.some((cell) => cell !== '')

    if (!empId) {
      if (hasWeekdayData) {
        errors.push({ row: rowNumber, message: 'errors.missingEmpId' })
      }
      return
    }

    if (currentWeekKey === null) {
      errors.push({ row: rowNumber, message: 'errors.invalidScheduleWeek' })
      return
    }

    const weekKey = currentWeekKey

    const member = memberByEmpId.get(empId)
    if (!member) {
      errors.push({ row: rowNumber, message: 'errors.unknownEmpId' })
      return
    }

    const rowKey = `${weekKey}:${member.id}`
    if (seen.has(rowKey)) {
      errors.push({ row: rowNumber, message: 'errors.duplicateScheduleRow' })
      return
    }
    seen.add(rowKey)

    WEEKDAY_ORDER.forEach((weekday: Weekday, weekdayIndex) => {
      const cell = cells[weekdayIndex]
      if (!cell) return

      const parsedCell = parseDayCell(cell)
      if (parsedCell.kind === 'invalid') {
        errors.push({ row: rowNumber, message: 'errors.invalidShiftCell' })
        return
      }

      if (parsedCell.kind === 'off') {
        const offs = dayOffs[weekKey] ?? []
        offs.push({ memberId: member.id, weekday })
        dayOffs[weekKey] = offs
        return
      }

      if (parsedCell.kind === 'shifts') {
        const shifts = schedules[weekKey] ?? []
        for (const range of parsedCell.ranges) {
          shifts.push({
            id: createId(),
            memberId: member.id,
            weekday,
            startMinute: range.startMinute,
            endMinute: range.endMinute,
          })
        }
        schedules[weekKey] = shifts
      }
    })
  })

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  const weekKeys = Object.keys(schedules)
  const shiftCount = weekKeys.reduce((total, weekKey) => total + schedules[weekKey].length, 0)

  return {
    ok: true,
    data: {
      schedules,
      dayOffs,
      weekCount: weekKeys.length,
      shiftCount,
    },
  }
}
