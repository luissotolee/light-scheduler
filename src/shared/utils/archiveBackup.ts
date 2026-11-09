import type {
  Contract,
  DayOff,
  Duty,
  HolidayWeek,
  Shift,
  TeamMember,
  Weekday,
  WeekKey,
} from '@/types'
import type { MessageKey } from '@/shared/i18n/messages/en'
import {
  WEEKDAY_ORDER,
  getIsoWeek,
  getIsoWeekStart,
  getIsoWeeksInYear,
  getWeekKey,
  isoDateToDate,
  parseIsoDate,
} from '@/shared/utils/calendar'
import {
  isContract,
  isDuty,
  isValidEmpId,
  normalizeHolidays,
  parseWeeklyHours,
} from '@/shared/utils/employee'
import { createId } from '@/shared/utils/id'
import { isWeekday } from '@/shared/utils/persistence'

export const BACKUP_FORMAT = 'light-scheduler-backup'
export const BACKUP_VERSION = 1
export const BACKUP_MIME = 'application/gzip'
export const BACKUP_EXTENSION = 'json.gz'
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024

export interface BackupShift {
  weekday: Weekday
  startMinute: number
  endMinute: number
}

export interface BackupEmployee {
  emp_id: string
  name: string
  duty: Duty
  contract: Contract
  weeklyHours: number
  holidays: HolidayWeek[]
  email?: string
  phone?: string
  comment?: string
  active: boolean
  startDate: string
  endDate?: string
}

export type BackupSchedules = Record<string, Record<string, Record<string, BackupShift[]>>>

export type BackupDayOffs = Record<string, Record<string, Record<string, Weekday[]>>>

export interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  exportedAt: string
  currentWeekKey?: WeekKey
  employees: BackupEmployee[]
  schedules: BackupSchedules
  dayOffs?: BackupDayOffs
}

export interface BackupData {
  members: TeamMember[]
  schedules: Record<WeekKey, Shift[]>
  dayOffs: Record<WeekKey, DayOff[]>
  currentWeekKey?: WeekKey
}

export type BackupParseResult = { ok: true; data: BackupData } | { ok: false; error: MessageKey }

export type BackupFileReadResult = { ok: true; value: unknown } | { ok: false; error: MessageKey }

type Parsed<T> = { ok: true; value: T } | { ok: false; error: MessageKey }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoYearKey(yearKey: string): boolean {
  if (!/^\d{4}$/u.test(yearKey)) return false
  const year = Number(yearKey)
  return Number.isInteger(year) && year >= 1
}

function isIsoWeekNumber(year: number, week: number): boolean {
  return Number.isInteger(week) && week >= 1 && week <= getIsoWeeksInYear(year)
}

function parseHolidays(value: unknown): HolidayWeek[] | null {
  if (!Array.isArray(value)) return null

  const holidays: HolidayWeek[] = []
  for (const item of value) {
    if (!isRecord(item)) return null

    const year = item.year
    const week = item.week
    if (typeof year !== 'number' || !Number.isInteger(year) || year < 1) return null
    if (typeof week !== 'number' || !isIsoWeekNumber(year, week)) return null

    holidays.push({ year, week })
  }

  return normalizeHolidays(holidays)
}

function parseBackupEmployee(value: unknown): Parsed<BackupEmployee> {
  if (!isRecord(value)) return { ok: false, error: 'archive.invalidBackup' }

  const empId = value.emp_id
  if (typeof empId !== 'string' || !isValidEmpId(empId)) {
    return { ok: false, error: 'errors.invalidEmpId' }
  }

  const name = value.name
  if (typeof name !== 'string' || name.trim() === '') {
    return { ok: false, error: 'errors.requiredName' }
  }

  if (!isDuty(value.duty)) return { ok: false, error: 'errors.invalidDuty' }
  if (!isContract(value.contract)) return { ok: false, error: 'errors.invalidContract' }

  const weeklyHours = parseWeeklyHours(value.weeklyHours)
  if (weeklyHours === null) return { ok: false, error: 'errors.weeklyHours' }

  const holidays = parseHolidays(value.holidays)
  if (holidays === null) return { ok: false, error: 'errors.invalidHolidays' }

  if (typeof value.active !== 'boolean') {
    return { ok: false, error: 'errors.invalidActive' }
  }

  const startDate = parseIsoDate(value.startDate)
  if (startDate === null) return { ok: false, error: 'errors.invalidStartDate' }

  const rawEndDate = value.endDate
  if (rawEndDate !== undefined && typeof rawEndDate !== 'string') {
    return { ok: false, error: 'errors.invalidEndDate' }
  }
  const endDate = rawEndDate === undefined ? undefined : parseIsoDate(rawEndDate)
  if (rawEndDate !== undefined && endDate === null) {
    return { ok: false, error: 'errors.invalidEndDate' }
  }
  if (endDate && endDate < startDate) {
    return { ok: false, error: 'errors.endBeforeStart' }
  }
  if (!value.active && !endDate) {
    return { ok: false, error: 'errors.endRequiredInactive' }
  }
  if (value.active && endDate) {
    return { ok: false, error: 'errors.endNotAllowedActive' }
  }

  const email = value.email
  if (email !== undefined && typeof email !== 'string') {
    return { ok: false, error: 'errors.invalidEmail' }
  }
  const phone = value.phone
  if (phone !== undefined && typeof phone !== 'string') {
    return { ok: false, error: 'errors.invalidPhone' }
  }
  const comment = value.comment
  if (comment !== undefined && typeof comment !== 'string') {
    return { ok: false, error: 'errors.invalidComment' }
  }

  return {
    ok: true,
    value: {
      emp_id: empId.trim(),
      name: name.trim(),
      duty: value.duty,
      contract: value.contract,
      weeklyHours,
      holidays,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(comment?.trim() ? { comment: comment.trim() } : {}),
      active: value.active,
      startDate,
      ...(endDate ? { endDate } : {}),
    },
  }
}

function parseBackupShift(value: unknown): BackupShift | null {
  if (!isRecord(value)) return null
  if (!isWeekday(value.weekday)) return null

  const startMinute = value.startMinute
  const endMinute = value.endMinute
  if (typeof startMinute !== 'number' || typeof endMinute !== 'number') return null
  if (!Number.isFinite(startMinute) || !Number.isFinite(endMinute)) return null
  if (startMinute < 0 || startMinute >= endMinute || endMinute > 1500) return null

  return { weekday: value.weekday, startMinute, endMinute }
}

function parseBackupSchedules(
  value: unknown,
  membersByEmpId: ReadonlyMap<string, TeamMember>,
): Parsed<Record<WeekKey, Shift[]>> {
  if (value === undefined) return { ok: true, value: {} }
  if (!isRecord(value)) return { ok: false, error: 'archive.invalidBackup' }

  const schedules: Record<WeekKey, Shift[]> = {}

  for (const [yearKey, weeksValue] of Object.entries(value)) {
    if (!isIsoYearKey(yearKey)) {
      return { ok: false, error: 'archive.invalidWeek' }
    }
    const year = Number(yearKey)
    if (!isRecord(weeksValue)) return { ok: false, error: 'archive.invalidBackup' }

    for (const [weekKey, employeesValue] of Object.entries(weeksValue)) {
      const week = Number(weekKey)
      if (!isIsoWeekNumber(year, week) || weekKey !== String(week)) {
        return { ok: false, error: 'archive.invalidWeek' }
      }
      if (!isRecord(employeesValue)) return { ok: false, error: 'archive.invalidBackup' }

      const weekStart = getWeekKey(getIsoWeekStart(year, week))
      const shifts: Shift[] = []

      for (const [empId, shiftsValue] of Object.entries(employeesValue)) {
        const member = membersByEmpId.get(empId)
        if (!member) return { ok: false, error: 'errors.unknownEmpId' }
        if (!Array.isArray(shiftsValue)) {
          return { ok: false, error: 'archive.invalidBackup' }
        }

        for (const rawShift of shiftsValue) {
          const shift = parseBackupShift(rawShift)
          if (!shift) return { ok: false, error: 'errors.shiftTimes' }
          shifts.push({ id: createId(), memberId: member.id, ...shift })
        }
      }

      if (shifts.length > 0) schedules[weekStart] = shifts
    }
  }

  return { ok: true, value: schedules }
}

function parseBackupDayOffs(
  value: unknown,
  membersByEmpId: ReadonlyMap<string, TeamMember>,
): Parsed<Record<WeekKey, DayOff[]>> {
  if (value === undefined) return { ok: true, value: {} }
  if (!isRecord(value)) return { ok: false, error: 'archive.invalidBackup' }

  const dayOffs: Record<WeekKey, DayOff[]> = {}

  for (const [yearKey, weeksValue] of Object.entries(value)) {
    if (!isIsoYearKey(yearKey)) {
      return { ok: false, error: 'archive.invalidWeek' }
    }
    const year = Number(yearKey)
    if (!isRecord(weeksValue)) return { ok: false, error: 'archive.invalidBackup' }

    for (const [weekKey, employeesValue] of Object.entries(weeksValue)) {
      const week = Number(weekKey)
      if (!isIsoWeekNumber(year, week) || weekKey !== String(week)) {
        return { ok: false, error: 'archive.invalidWeek' }
      }
      if (!isRecord(employeesValue)) return { ok: false, error: 'archive.invalidBackup' }

      const weekStart = getWeekKey(getIsoWeekStart(year, week))
      const offs: DayOff[] = []
      const seen = new Set<string>()

      for (const [empId, daysValue] of Object.entries(employeesValue)) {
        const member = membersByEmpId.get(empId)
        if (!member) return { ok: false, error: 'errors.unknownEmpId' }
        if (!Array.isArray(daysValue)) {
          return { ok: false, error: 'archive.invalidBackup' }
        }

        for (const day of daysValue) {
          if (!isWeekday(day)) return { ok: false, error: 'archive.invalidBackup' }
          const key = `${member.id}:${day}`
          if (seen.has(key)) continue
          seen.add(key)
          offs.push({ memberId: member.id, weekday: day })
        }
      }

      if (offs.length > 0) dayOffs[weekStart] = offs
    }
  }

  return { ok: true, value: dayOffs }
}

function toBackupEmployee(member: TeamMember): BackupEmployee {
  return {
    emp_id: member.empId,
    name: member.name,
    duty: member.duty,
    contract: member.contract,
    weeklyHours: member.weeklyHours,
    holidays: normalizeHolidays(member.holidays).map((holiday) => ({
      year: holiday.year,
      week: holiday.week,
    })),
    ...(member.email ? { email: member.email } : {}),
    ...(member.phone ? { phone: member.phone } : {}),
    ...(member.comment ? { comment: member.comment } : {}),
    active: member.active,
    startDate: member.startDate,
    ...(member.endDate ? { endDate: member.endDate } : {}),
  }
}

function compareBackupShifts(a: BackupShift, b: BackupShift): number {
  const weekdayDelta = WEEKDAY_ORDER.indexOf(a.weekday) - WEEKDAY_ORDER.indexOf(b.weekday)
  if (weekdayDelta !== 0) return weekdayDelta
  if (a.startMinute !== b.startMinute) return a.startMinute - b.startMinute
  return a.endMinute - b.endMinute
}

export function buildBackup(
  members: readonly TeamMember[],
  schedules: Readonly<Record<WeekKey, Shift[]>>,
  dayOffs: Readonly<Record<WeekKey, DayOff[]>>,
  currentWeekKey: WeekKey,
  now: Date = new Date(),
): BackupFile {
  const memberById = new Map(members.map((member) => [member.id, member]))
  const scheduleBuckets: BackupSchedules = {}
  const dayOffBuckets: BackupDayOffs = {}
  const weekKeys = [...new Set([...Object.keys(schedules), ...Object.keys(dayOffs)])].sort()

  for (const weekKey of weekKeys) {
    const shifts = (schedules[weekKey] ?? []).filter((shift) => memberById.has(shift.memberId))
    const offs = (dayOffs[weekKey] ?? []).filter((off) => memberById.has(off.memberId))
    if (shifts.length === 0 && offs.length === 0) continue

    const { year, week } = getIsoWeek(isoDateToDate(weekKey))
    const yearKey = String(year)
    const weekPart = String(week)

    if (shifts.length > 0) {
      const weekBucket = scheduleBuckets[yearKey]?.[weekPart] ?? {}
      scheduleBuckets[yearKey] = scheduleBuckets[yearKey] ?? {}
      scheduleBuckets[yearKey][weekPart] = weekBucket

      for (const shift of shifts) {
        const member = memberById.get(shift.memberId)
        if (!member) continue

        const empShifts = weekBucket[member.empId] ?? []
        weekBucket[member.empId] = empShifts
        empShifts.push({
          weekday: shift.weekday,
          startMinute: shift.startMinute,
          endMinute: shift.endMinute,
        })
      }

      for (const empShifts of Object.values(weekBucket)) {
        empShifts.sort(compareBackupShifts)
      }
    }

    if (offs.length > 0) {
      const weekBucket = dayOffBuckets[yearKey]?.[weekPart] ?? {}
      dayOffBuckets[yearKey] = dayOffBuckets[yearKey] ?? {}
      dayOffBuckets[yearKey][weekPart] = weekBucket

      for (const off of offs) {
        const member = memberById.get(off.memberId)
        if (!member) continue

        const days = weekBucket[member.empId] ?? []
        weekBucket[member.empId] = days
        if (!days.includes(off.weekday)) days.push(off.weekday)
      }

      for (const days of Object.values(weekBucket)) {
        days.sort((a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b))
      }
    }
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    currentWeekKey,
    employees: members.map(toBackupEmployee),
    schedules: scheduleBuckets,
    dayOffs: dayOffBuckets,
  }
}

export function parseBackup(value: unknown): BackupParseResult {
  if (!isRecord(value)) return { ok: false, error: 'archive.invalidBackup' }
  if (value.format !== BACKUP_FORMAT) return { ok: false, error: 'archive.invalidBackup' }
  if (value.version !== BACKUP_VERSION) {
    return { ok: false, error: 'archive.unsupportedVersion' }
  }
  if (!Array.isArray(value.employees)) {
    return { ok: false, error: 'archive.invalidBackup' }
  }

  const members: TeamMember[] = []
  const membersByEmpId = new Map<string, TeamMember>()
  const seenEmpIds = new Set<string>()

  for (const rawEmployee of value.employees) {
    const parsed = parseBackupEmployee(rawEmployee)
    if (!parsed.ok) return parsed

    const employee = parsed.value
    if (seenEmpIds.has(employee.emp_id)) {
      return { ok: false, error: 'errors.duplicateEmpId' }
    }
    seenEmpIds.add(employee.emp_id)

    const member: TeamMember = {
      id: createId(),
      empId: employee.emp_id,
      name: employee.name,
      duty: employee.duty,
      contract: employee.contract,
      weeklyHours: employee.weeklyHours,
      holidays: employee.holidays,
      ...(employee.email ? { email: employee.email } : {}),
      ...(employee.phone ? { phone: employee.phone } : {}),
      ...(employee.comment ? { comment: employee.comment } : {}),
      active: employee.active,
      startDate: employee.startDate,
      ...(employee.endDate ? { endDate: employee.endDate } : {}),
    }

    members.push(member)
    membersByEmpId.set(member.empId, member)
  }

  const schedules = parseBackupSchedules(value.schedules, membersByEmpId)
  if (!schedules.ok) return schedules

  const dayOffs = parseBackupDayOffs(value.dayOffs, membersByEmpId)
  if (!dayOffs.ok) return dayOffs

  let currentWeekKey: WeekKey | undefined
  if (value.currentWeekKey !== undefined) {
    const parsedWeekKey = parseIsoDate(value.currentWeekKey)
    if (parsedWeekKey === null) return { ok: false, error: 'archive.invalidBackup' }
    currentWeekKey = parsedWeekKey
  }

  return {
    ok: true,
    data: {
      members,
      schedules: schedules.value,
      dayOffs: dayOffs.value,
      ...(currentWeekKey ? { currentWeekKey } : {}),
    },
  }
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0)
  const result = new Uint8Array(size)

  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return result
}

function streamFromBytes(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}

function compressionTransform(): TransformStream<Uint8Array, Uint8Array> {
  return new CompressionStream('gzip') as unknown as TransformStream<Uint8Array, Uint8Array>
}

function decompressionTransform(): TransformStream<Uint8Array, Uint8Array> {
  return new DecompressionStream('gzip') as unknown as TransformStream<Uint8Array, Uint8Array>
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }

  return concatChunks(chunks)
}

export async function gzipJson(value: unknown): Promise<Blob> {
  if (typeof CompressionStream === 'undefined') {
    throw new Error('compression-unsupported')
  }

  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const compressed = await readStream(streamFromBytes(bytes).pipeThrough(compressionTransform()))

  return new Blob([compressed.buffer as ArrayBuffer], { type: BACKUP_MIME })
}

export async function gunzipJson(file: Blob): Promise<unknown> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('compression-unsupported')
  }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const decompressed = await readStream(
    streamFromBytes(bytes).pipeThrough(decompressionTransform()),
  )

  return JSON.parse(new TextDecoder().decode(decompressed)) as unknown
}

export async function readBackupFile(file: Blob): Promise<BackupFileReadResult> {
  if (file.size > MAX_BACKUP_BYTES) {
    return { ok: false, error: 'archive.backupTooLarge' }
  }
  if (typeof DecompressionStream === 'undefined') {
    return { ok: false, error: 'archive.compressionUnsupported' }
  }

  try {
    return { ok: true, value: await gunzipJson(file) }
  } catch {
    return { ok: false, error: 'archive.invalidBackup' }
  }
}
