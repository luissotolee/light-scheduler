import type {
  Contract,
  Duty,
  EmployeeCsvRecord,
  EmployeeFormErrors,
  EmployeeFormInput,
  EmployeeFormValidation,
  HolidayWeek,
  RowError,
  TeamMember,
  Validated,
} from '@/types'
import { getIsoWeeksInYear, parseIsoDate } from '@/shared/utils/calendar'

export const MAX_HOLIDAY_WEEKS = 6

export const WEEKLY_HOURS_ERROR = 'Weekly hours must be a number greater than 0 and at most 168'

export const DUTIES: readonly Duty[] = ['manager', 'employee', 'assistant', 'head_manager']

export const CONTRACTS: readonly Contract[] = ['fulltime', 'part_time', 'weekends']

export const DUTY_LABELS: Record<Duty, string> = {
  manager: 'Manager',
  employee: 'Employee',
  assistant: 'Assistant',
  head_manager: 'Head manager',
}

export function dutyModifier(duty: Duty): string {
  return duty.replace('_', '-')
}

export const CONTRACT_LABELS: Record<Contract, string> = {
  fulltime: 'Full-time',
  part_time: 'Part-time',
  weekends: 'Weekends',
}

const HOLIDAY_TOKEN_RE = /^(\d{4})-W([1-9]|[1-4]\d|5[0-3])$/

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const SPANISH_PHONE_DIGITS = 9
export const PHONE_PREFIX_MIN_DIGITS = 1
export const PHONE_PREFIX_MAX_DIGITS = 3

const PHONE_CHARS_RE = /^\+?[0-9 ().-]+$/

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return EMAIL_RE.test(trimmed)
}

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (!PHONE_CHARS_RE.test(trimmed)) return false
  const digits = trimmed.replace(/\D/g, '')

  if (trimmed.startsWith('+')) {
    return (
      digits.length >= PHONE_PREFIX_MIN_DIGITS + SPANISH_PHONE_DIGITS &&
      digits.length <= PHONE_PREFIX_MAX_DIGITS + SPANISH_PHONE_DIGITS
    )
  }

  return digits.length === SPANISH_PHONE_DIGITS
}

export function isDuty(value: unknown): value is Duty {
  return (
    value === 'manager' || value === 'employee' || value === 'assistant' || value === 'head_manager'
  )
}

export function parseDuty(value: unknown): Duty | null {
  return isDuty(value) ? value : null
}

export function isContract(value: unknown): value is Contract {
  return value === 'fulltime' || value === 'part_time' || value === 'weekends'
}

export function parseContract(value: unknown): Contract | null {
  return isContract(value) ? value : null
}

export function parseBoolean(value: unknown): boolean | null {
  if (typeof value !== 'string') return null
  if (value === '' || value === 'true') return true
  if (value === 'false') return false
  return null
}

export function parseWeeklyHours(value: unknown): number | null {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value.trim())
        : Number.NaN

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 168) return null
  return parsed
}

export function firstEmployeeFormError(errors: EmployeeFormErrors): string {
  const order: readonly (keyof EmployeeFormErrors)[] = [
    'name',
    'duty',
    'contract',
    'weeklyHours',
    'email',
    'phone',
    'holidays',
    'startDate',
  ]

  for (const field of order) {
    const message = errors[field]
    if (message) return message
  }

  return 'Invalid employee'
}

export function validateEmployeeForm(input: EmployeeFormInput): EmployeeFormValidation {
  const errors: EmployeeFormErrors = {}

  const name = input.name.trim()
  if (!name) errors.name = 'Name is required'

  const duty = parseDuty(input.duty)
  if (duty === null) errors.duty = 'Duty is invalid'

  const contract = parseContract(input.contract)
  if (contract === null) errors.contract = 'Contract is invalid'

  const weeklyHours = parseWeeklyHours(input.weeklyHours)
  if (weeklyHours === null) errors.weeklyHours = WEEKLY_HOURS_ERROR

  const email = input.email.trim()
  if (email && !isValidEmail(email)) errors.email = 'Email is invalid'

  const phone = input.phone.trim()
  if (phone && !isValidPhone(phone)) errors.phone = 'Phone is invalid'

  const holidays = normalizeHolidays(input.holidays ?? [])
  if (holidays.length > MAX_HOLIDAY_WEEKS) {
    errors.holidays = 'At most 6 holiday weeks are allowed'
  }

  const rawStartDate = input.startDate?.trim() ?? ''
  const startDate = rawStartDate ? parseIsoDate(rawStartDate) : undefined
  if (startDate === null) errors.startDate = 'Start date is invalid'

  if (
    duty === null ||
    contract === null ||
    weeklyHours === null ||
    Object.keys(errors).length > 0
  ) {
    return { ok: false, errors, message: firstEmployeeFormError(errors) }
  }

  return {
    ok: true,
    value: {
      name,
      duty,
      contract,
      weeklyHours,
      holidays,
      email,
      phone,
      ...(startDate ? { startDate } : {}),
    },
  }
}

export function holidayKey(holiday: HolidayWeek): string {
  return `${holiday.year}-W${holiday.week}`
}

export function serializeHolidays(holidays: HolidayWeek[]): string {
  return holidays.map(holidayKey).join(';')
}

export function parseHolidays(value: unknown): HolidayWeek[] | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return []

  const holidays: HolidayWeek[] = []
  for (const token of trimmed.split(';')) {
    const match = HOLIDAY_TOKEN_RE.exec(token.trim())
    if (!match) return null

    const year = Number(match[1])
    const week = Number(match[2])
    if (week > getIsoWeeksInYear(year)) return null

    holidays.push({ year, week })
  }

  return holidays
}

export function normalizeHolidays(holidays: HolidayWeek[]): HolidayWeek[] {
  const unique = new Map<string, HolidayWeek>()
  for (const holiday of holidays) {
    unique.set(holidayKey(holiday), holiday)
  }

  return [...unique.values()].sort((a, b) => a.year - b.year || a.week - b.week)
}

export const EMPLOYEE_HEADERS: readonly string[] = [
  'name',
  'duty',
  'contract',
  'weeklyHours',
  'holidays',
  'email',
  'phone',
  'active',
  'startDate',
  'endDate',
]

const REQUIRED_HEADERS = ['name', 'duty', 'contract', 'weeklyHours', 'holidays']

export function validateEmployees(
  headers: string[],
  rows: string[][],
): Validated<EmployeeCsvRecord> {
  const normalizedHeaders = headers.map((header) => header.trim().toLowerCase())
  const uniqueHeaders = new Set(normalizedHeaders)
  const allowedHeaders = EMPLOYEE_HEADERS.map((header) => header.toLowerCase())
  const requiredHeaders = REQUIRED_HEADERS.map((header) => header.toLowerCase())
  const headersValid =
    normalizedHeaders.length === uniqueHeaders.size &&
    requiredHeaders.every((header) => uniqueHeaders.has(header)) &&
    normalizedHeaders.every((header) => allowedHeaders.includes(header))

  if (!headersValid) {
    return { ok: false, errors: [{ row: 1, message: 'Unexpected CSV headers' }] }
  }

  const indexOf = (header: string): number => normalizedHeaders.indexOf(header.toLowerCase())
  const valueAt = (row: string[], header: string): string => row[indexOf(header)] ?? ''

  const data: EmployeeCsvRecord[] = []
  const errors: RowError[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const rowErrors: RowError[] = []

    const name = valueAt(row, 'name').trim()
    if (!name) rowErrors.push({ row: rowNumber, message: 'Name is required' })

    const duty = parseDuty(valueAt(row, 'duty').trim())
    if (duty === null) rowErrors.push({ row: rowNumber, message: 'Duty is invalid' })

    const contract = parseContract(valueAt(row, 'contract').trim())
    if (contract === null) {
      rowErrors.push({ row: rowNumber, message: 'Contract is invalid' })
    }

    const weeklyHours = parseWeeklyHours(valueAt(row, 'weeklyHours'))
    if (weeklyHours === null) {
      rowErrors.push({ row: rowNumber, message: WEEKLY_HOURS_ERROR })
    }

    const parsedHolidays = parseHolidays(valueAt(row, 'holidays'))
    if (parsedHolidays === null) {
      rowErrors.push({ row: rowNumber, message: 'Holidays are invalid' })
    }

    const holidays = parsedHolidays ? normalizeHolidays(parsedHolidays) : []
    if (holidays.length > MAX_HOLIDAY_WEEKS) {
      rowErrors.push({ row: rowNumber, message: 'At most 6 holiday weeks are allowed' })
    }

    if (
      rowErrors.length > 0 ||
      duty === null ||
      contract === null ||
      weeklyHours === null ||
      parsedHolidays === null
    ) {
      errors.push(...rowErrors)
      return
    }

    const email = valueAt(row, 'email').trim()
    if (email && !isValidEmail(email)) {
      rowErrors.push({ row: rowNumber, message: 'Email is invalid' })
    }

    const phone = valueAt(row, 'phone').trim()
    if (phone && !isValidPhone(phone)) {
      rowErrors.push({ row: rowNumber, message: 'Phone is invalid' })
    }

    const active = parseBoolean(valueAt(row, 'active').trim())
    if (active === null) {
      rowErrors.push({ row: rowNumber, message: 'Active is invalid' })
    }

    const rawStartDate = valueAt(row, 'startDate').trim()
    const startDate = rawStartDate ? parseIsoDate(rawStartDate) : undefined
    if (startDate === null) {
      rowErrors.push({ row: rowNumber, message: 'Start date is invalid' })
    }

    const rawEndDate = valueAt(row, 'endDate').trim()
    const endDate = rawEndDate ? parseIsoDate(rawEndDate) : undefined
    if (endDate === null) {
      rowErrors.push({ row: rowNumber, message: 'End date is invalid' })
    }

    if (startDate && endDate && endDate < startDate) {
      rowErrors.push({ row: rowNumber, message: 'End date cannot be before start date' })
    }

    if (active === false && !rawEndDate) {
      rowErrors.push({ row: rowNumber, message: 'End date is required for inactive employees' })
    }

    if (active === true && rawEndDate) {
      rowErrors.push({ row: rowNumber, message: 'End date is not allowed for active employees' })
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
      return
    }

    data.push({
      name,
      duty,
      contract,
      weeklyHours,
      holidays,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(active === null ? {} : { active }),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    })
  })

  return errors.length > 0 ? { ok: false, errors } : { ok: true, data }
}

export function employeeToRow(member: TeamMember): (string | number)[] {
  return [
    member.name,
    member.duty,
    member.contract,
    member.weeklyHours,
    serializeHolidays(member.holidays),
    member.email ?? '',
    member.phone ?? '',
    member.active ? 'true' : 'false',
    member.startDate,
    member.endDate ?? '',
  ]
}

export function employeesToRows(members: TeamMember[]): (string | number)[][] {
  return members.map(employeeToRow)
}
