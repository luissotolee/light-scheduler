import { describe, expect, it } from 'vitest'
import type { HolidayWeek, TeamMember } from '@/types'
import {
  CONTRACTS,
  CONTRACT_LABELS,
  DUTIES,
  DUTY_LABELS,
  EMPLOYEE_HEADERS,
  MAX_HOLIDAY_WEEKS,
  PHONE_MAX_DIGITS,
  PHONE_MIN_DIGITS,
  employeeToRow,
  employeesToRows,
  holidayKey,
  isContract,
  isDuty,
  isValidEmail,
  isValidPhone,
  normalizeHolidays,
  parseContract,
  parseDuty,
  parseHolidays,
  parseWeeklyHours,
  serializeHolidays,
  validateEmployees,
} from '@/utils/employee'

const headers = ['name', 'duty', 'contract', 'weeklyHours', 'holidays', 'email', 'phone']

const member: TeamMember = {
  id: 'member-1',
  name: 'Ada',
  duty: 'head_manager',
  contract: 'part_time',
  weeklyHours: 37.5,
  holidays: [
    { year: 2026, week: 12 },
    { year: 2026, week: 10 },
  ],
  email: 'ada@example.com',
  phone: '+1 555 010 0000',
}

describe('employee constants and labels', () => {
  it('exposes every duty and contract with a display label', () => {
    expect(DUTIES).toEqual(['manager', 'employee', 'assistant', 'head_manager'])
    expect(CONTRACTS).toEqual(['fulltime', 'part_time', 'weekends'])
    expect(DUTY_LABELS).toEqual({
      manager: 'Manager',
      employee: 'Employee',
      assistant: 'Assistant',
      head_manager: 'Head manager',
    })
    expect(CONTRACT_LABELS).toEqual({
      fulltime: 'Full-time',
      part_time: 'Part-time',
      weekends: 'Weekends',
    })
    expect(MAX_HOLIDAY_WEEKS).toBe(6)
    expect(EMPLOYEE_HEADERS).toEqual([
      'name',
      'duty',
      'contract',
      'weeklyHours',
      'holidays',
      'email',
      'phone',
    ])
  })
})

describe('email and phone validators', () => {
  it('accepts valid email addresses and rejects invalid or blank ones', () => {
    expect(isValidEmail('ada@example.com')).toBe(true)
    expect(isValidEmail('  ada@example.com  ')).toBe(true)
    expect(isValidEmail('ada@sub.example.co')).toBe(true)
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('   ')).toBe(false)
    expect(isValidEmail('ada')).toBe(false)
    expect(isValidEmail('ada@example')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
  })

  it('accepts phone numbers with 7 to 15 digits and common formatting', () => {
    expect(PHONE_MIN_DIGITS).toBe(7)
    expect(PHONE_MAX_DIGITS).toBe(15)
    expect(isValidPhone('5551234')).toBe(true)
    expect(isValidPhone('+1 555 010 0000')).toBe(true)
    expect(isValidPhone('(555) 123-4567')).toBe(true)
    expect(isValidPhone(' 555-123-4567 ')).toBe(true)
    expect(isValidPhone('123456789012345')).toBe(true)
  })

  it('rejects blank, non-numeric, and out-of-range phone numbers', () => {
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('   ')).toBe(false)
    expect(isValidPhone('123456')).toBe(false)
    expect(isValidPhone('1234567890123456')).toBe(false)
    expect(isValidPhone('phone')).toBe(false)
    expect(isValidPhone('555-CALL-NOW')).toBe(false)
    expect(isValidPhone('+1 (555) 010-0000 ext 2')).toBe(false)
  })
})

describe('duty and contract parsers', () => {
  it('recognizes valid duties and rejects others', () => {
    for (const duty of DUTIES) {
      expect(isDuty(duty)).toBe(true)
      expect(parseDuty(duty)).toBe(duty)
    }

    expect(isDuty('chef')).toBe(false)
    expect(parseDuty('chef')).toBeNull()
    expect(parseDuty(null)).toBeNull()
    expect(parseDuty(42)).toBeNull()
  })

  it('recognizes valid contracts and rejects others', () => {
    for (const contract of CONTRACTS) {
      expect(isContract(contract)).toBe(true)
      expect(parseContract(contract)).toBe(contract)
    }

    expect(isContract('contractor')).toBe(false)
    expect(parseContract('contractor')).toBeNull()
    expect(parseContract(undefined)).toBeNull()
  })
})

describe('parseWeeklyHours', () => {
  it('accepts finite numbers between 1 and 168', () => {
    expect(parseWeeklyHours(37.5)).toBe(37.5)
    expect(parseWeeklyHours(1)).toBe(1)
    expect(parseWeeklyHours(168)).toBe(168)
    expect(parseWeeklyHours('40')).toBe(40)
    expect(parseWeeklyHours(' 37.5 ')).toBe(37.5)
  })

  it('rejects zero, negatives, out-of-range, and non-numeric values', () => {
    expect(parseWeeklyHours(0)).toBeNull()
    expect(parseWeeklyHours(-1)).toBeNull()
    expect(parseWeeklyHours(169)).toBeNull()
    expect(parseWeeklyHours('abc')).toBeNull()
    expect(parseWeeklyHours('')).toBeNull()
    expect(parseWeeklyHours('   ')).toBeNull()
    expect(parseWeeklyHours(Number.NaN)).toBeNull()
    expect(parseWeeklyHours(Number.POSITIVE_INFINITY)).toBeNull()
    expect(parseWeeklyHours(null)).toBeNull()
    expect(parseWeeklyHours({})).toBeNull()
  })
})

describe('holiday serialization', () => {
  it('builds stable keys and serializes with semicolons', () => {
    expect(holidayKey({ year: 2026, week: 3 })).toBe('2026-W3')
    expect(serializeHolidays([])).toBe('')
    expect(
      serializeHolidays([
        { year: 2026, week: 3 },
        { year: 2027, week: 40 },
      ]),
    ).toBe('2026-W3;2027-W40')
  })

  it('round-trips serialized holidays', () => {
    const holidays: HolidayWeek[] = [
      { year: 2026, week: 1 },
      { year: 2026, week: 53 },
    ]

    expect(parseHolidays(serializeHolidays(holidays))).toEqual(holidays)
  })

  it('treats blank values as no holidays and rejects non-strings', () => {
    expect(parseHolidays('')).toEqual([])
    expect(parseHolidays('   ')).toEqual([])
    expect(parseHolidays(null)).toBeNull()
    expect(parseHolidays(42)).toBeNull()
  })

  it('rejects malformed tokens', () => {
    expect(parseHolidays('2026-W01')).toBeNull()
    expect(parseHolidays('2026-W0')).toBeNull()
    expect(parseHolidays('2026-W54')).toBeNull()
    expect(parseHolidays('abc')).toBeNull()
    expect(parseHolidays('2026-W1;')).toBeNull()
    expect(parseHolidays('2026-W1;;2026-W2')).toBeNull()
  })
})

describe('normalizeHolidays', () => {
  it('deduplicates and sorts by year then week', () => {
    expect(
      normalizeHolidays([
        { year: 2027, week: 2 },
        { year: 2026, week: 20 },
        { year: 2026, week: 3 },
        { year: 2026, week: 3 },
      ]),
    ).toEqual([
      { year: 2026, week: 3 },
      { year: 2026, week: 20 },
      { year: 2027, week: 2 },
    ])
  })

  it('returns a new empty array for empty input', () => {
    const input: HolidayWeek[] = []

    expect(normalizeHolidays(input)).toEqual([])
    expect(normalizeHolidays(input)).not.toBe(input)
  })
})

describe('validateEmployees', () => {
  it('maps every column and normalizes values', () => {
    const result = validateEmployees(headers, [
      [
        ' Ada ',
        'manager',
        'fulltime',
        '40',
        '2026-W12;2026-W10',
        ' ada@example.com ',
        ' +1 555 010 0000 ',
      ],
      ['Bo', 'employee', 'part_time', '20', '', '', ''],
    ])

    expect(result).toEqual({
      ok: true,
      data: [
        {
          name: 'Ada',
          duty: 'manager',
          contract: 'fulltime',
          weeklyHours: 40,
          holidays: [
            { year: 2026, week: 10 },
            { year: 2026, week: 12 },
          ],
          email: 'ada@example.com',
          phone: '+1 555 010 0000',
        },
        {
          name: 'Bo',
          duty: 'employee',
          contract: 'part_time',
          weeklyHours: 20,
          holidays: [],
        },
      ],
    })
  })

  it('accepts trimmed, lowercased, reordered headers and a missing email column', () => {
    const result = validateEmployees(
      [' Name ', 'DUTY', 'Contract', 'WEEKLYHOURS', 'Holidays'],
      [[' Ada ', 'assistant', 'weekends', '37.5', '2026-W2']],
    )

    expect(result).toEqual({
      ok: true,
      data: [
        {
          name: 'Ada',
          duty: 'assistant',
          contract: 'weekends',
          weeklyHours: 37.5,
          holidays: [{ year: 2026, week: 2 }],
        },
      ],
    })
  })

  it.each([
    ['a missing required header', ['name', 'duty', 'contract', 'weeklyHours']],
    ['an unknown header', [...headers, 'salary']],
    ['a duplicated header', ['name', 'name', 'duty', 'contract', 'weeklyHours', 'holidays']],
    ['an entirely different header set', ['name', 'email']],
    ['no headers', []],
  ])('rejects %s with a header error', (_label, candidateHeaders) => {
    const result = validateEmployees(candidateHeaders, [])

    expect(result).toEqual({
      ok: false,
      errors: [{ row: 1, message: 'Unexpected CSV headers' }],
    })
  })

  it('collects every field error for a row with the header row offset', () => {
    const result = validateEmployees(headers, [
      ['Ada', 'manager', 'fulltime', '40', '', ''],
      ['', 'chef', 'contractor', '0', '2026-W54', ''],
    ])

    expect(result).toEqual({
      ok: false,
      errors: [
        { row: 3, message: 'Name is required' },
        { row: 3, message: 'Duty is invalid' },
        { row: 3, message: 'Contract is invalid' },
        { row: 3, message: 'Weekly hours must be between 0 and 168' },
        { row: 3, message: 'Holidays are invalid' },
      ],
    })
  })

  it('rejects rows with more than six holiday weeks', () => {
    const result = validateEmployees(headers, [
      [
        'Ada',
        'manager',
        'fulltime',
        '40',
        '2026-W1;2026-W2;2026-W3;2026-W4;2026-W5;2026-W6;2026-W7',
        '',
      ],
    ])

    expect(result).toEqual({
      ok: false,
      errors: [{ row: 2, message: 'At most 6 holiday weeks are allowed' }],
    })
  })

  it('rejects rows with invalid email and phone values', () => {
    const result = validateEmployees(headers, [
      ['Ada', 'manager', 'fulltime', '40', '', 'not-an-email', '123'],
    ])

    expect(result).toEqual({
      ok: false,
      errors: [
        { row: 2, message: 'Email is invalid' },
        { row: 2, message: 'Phone is invalid' },
      ],
    })
  })

  it('imports legacy rows without the optional phone column', () => {
    const result = validateEmployees(
      ['name', 'duty', 'contract', 'weeklyHours', 'holidays', 'email'],
      [['Ada', 'manager', 'fulltime', '40', '', 'ada@example.com']],
    )

    expect(result).toEqual({
      ok: true,
      data: [
        {
          name: 'Ada',
          duty: 'manager',
          contract: 'fulltime',
          weeklyHours: 40,
          holidays: [],
          email: 'ada@example.com',
        },
      ],
    })
  })

  it('treats short rows as missing values', () => {
    const result = validateEmployees(headers, [['Ada']])

    expect(result).toEqual({
      ok: false,
      errors: [
        { row: 2, message: 'Duty is invalid' },
        { row: 2, message: 'Contract is invalid' },
        { row: 2, message: 'Weekly hours must be between 0 and 168' },
      ],
    })
  })
})

describe('row mapping', () => {
  it('maps a member to the canonical column order', () => {
    expect(employeeToRow(member)).toEqual([
      'Ada',
      'head_manager',
      'part_time',
      37.5,
      '2026-W12;2026-W10',
      'ada@example.com',
      '+1 555 010 0000',
    ])
  })

  it('maps a member without an email or phone to empty cells', () => {
    expect(
      employeeToRow({
        id: 'member-2',
        name: 'Bo',
        duty: 'employee',
        contract: 'fulltime',
        weeklyHours: 40,
        holidays: [],
      }),
    ).toEqual(['Bo', 'employee', 'fulltime', 40, '', '', ''])
  })

  it('maps a list of members', () => {
    expect(employeesToRows([member])).toEqual([employeeToRow(member)])
    expect(employeesToRows([])).toEqual([])
  })
})
