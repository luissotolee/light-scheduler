import { describe, expect, it } from 'vitest'
import type { EmployeeFormInput, HolidayWeek, TeamMember, WeekKey } from '@/types'
import {
  CONTRACTS,
  DUTIES,
  EMPLOYEE_HEADERS,
  MAX_HOLIDAY_WEEKS,
  PHONE_PREFIX_MAX_DIGITS,
  PHONE_PREFIX_MIN_DIGITS,
  SPANISH_PHONE_DIGITS,
  dutyModifier,
  employeeToRow,
  employeesToRows,
  firstEmployeeFormError,
  holidayKey,
  isContract,
  isDuty,
  isValidEmail,
  isValidPhone,
  isMemberInWeek,
  normalizeHolidays,
  parseBoolean,
  parseContract,
  parseDuty,
  parseHolidays,
  parseWeeklyHours,
  serializeHolidays,
  validateEmployeeForm,
  validateEmployees,
} from '@/shared/utils/employee'

const headers = [
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
  active: true,
  startDate: '2025-01-15',
}

describe('employee constants', () => {
  it('exposes every duty, contract, and canonical header', () => {
    expect(DUTIES).toEqual(['manager', 'employee', 'assistant', 'head_manager'])
    expect(CONTRACTS).toEqual(['fulltime', 'part_time', 'weekends'])
    expect(MAX_HOLIDAY_WEEKS).toBe(6)
    expect(EMPLOYEE_HEADERS).toEqual([
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
    ])
  })
})

describe('dutyModifier', () => {
  it('maps duties to their CSS modifier', () => {
    expect(dutyModifier('manager')).toBe('manager')
    expect(dutyModifier('employee')).toBe('employee')
    expect(dutyModifier('assistant')).toBe('assistant')
    expect(dutyModifier('head_manager')).toBe('head-manager')
  })
})

describe('parseBoolean', () => {
  it('reads blank and true as true and false as false', () => {
    expect(parseBoolean('')).toBe(true)
    expect(parseBoolean('true')).toBe(true)
    expect(parseBoolean('false')).toBe(false)
  })

  it('rejects non-strings and unknown tokens', () => {
    expect(parseBoolean('yes')).toBeNull()
    expect(parseBoolean('TRUE')).toBeNull()
    expect(parseBoolean(null)).toBeNull()
    expect(parseBoolean(undefined)).toBeNull()
    expect(parseBoolean(0)).toBeNull()
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

  it('accepts Spanish national numbers with exactly 9 digits and common formatting', () => {
    expect(SPANISH_PHONE_DIGITS).toBe(9)
    expect(PHONE_PREFIX_MIN_DIGITS).toBe(1)
    expect(PHONE_PREFIX_MAX_DIGITS).toBe(3)
    expect(isValidPhone('612345678')).toBe(true)
    expect(isValidPhone('612 345 678')).toBe(true)
    expect(isValidPhone('612-345-678')).toBe(true)
    expect(isValidPhone('612.345.678')).toBe(true)
    expect(isValidPhone('(612) 345-678')).toBe(true)
    expect(isValidPhone(' 612 345 678 ')).toBe(true)
  })

  it('accepts an optional 1 to 3 digit country prefix plus the 9 national digits', () => {
    expect(isValidPhone('+34 612 345 678')).toBe(true)
    expect(isValidPhone('+34612345678')).toBe(true)
    expect(isValidPhone('+1 612 345 678')).toBe(true)
    expect(isValidPhone('+44 612 345 678')).toBe(true)
    expect(isValidPhone('+123612345678')).toBe(true)
  })

  it('rejects blank, malformed, and out-of-range phone numbers', () => {
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('   ')).toBe(false)
    expect(isValidPhone('61234567')).toBe(false)
    expect(isValidPhone('6123456789')).toBe(false)
    expect(isValidPhone('+34 612 345 6')).toBe(false)
    expect(isValidPhone('+1234 612 345 678')).toBe(false)
    expect(isValidPhone('phone')).toBe(false)
    expect(isValidPhone('612-ABC-678')).toBe(false)
    expect(isValidPhone('++34 612 345 678')).toBe(false)
    expect(isValidPhone('+34 612 345 678 ext 2')).toBe(false)
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

describe('validateEmployeeForm', () => {
  const validInput: EmployeeFormInput = {
    name: '  Ada  ',
    duty: 'manager',
    contract: 'fulltime',
    weeklyHours: 40,
    email: '  ada@example.com ',
    phone: ' +1 555 010 0000 ',
    holidays: [
      { year: 2026, week: 12 },
      { year: 2026, week: 10 },
      { year: 2026, week: 12 },
    ],
  }

  it('returns trimmed, normalized values for a valid input', () => {
    expect(validateEmployeeForm(validInput)).toEqual({
      ok: true,
      value: {
        name: 'Ada',
        duty: 'manager',
        contract: 'fulltime',
        weeklyHours: 40,
        email: 'ada@example.com',
        phone: '+1 555 010 0000',
        holidays: [
          { year: 2026, week: 10 },
          { year: 2026, week: 12 },
        ],
      },
    })
  })

  it('accepts empty or whitespace-only email and phone as empty strings', () => {
    for (const [email, phone] of [
      ['', ''],
      ['   ', '   '],
    ]) {
      const result = validateEmployeeForm({ ...validInput, email, phone })

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.email).toBe('')
        expect(result.value.phone).toBe('')
      }
    }
  })

  it('rejects a blank name', () => {
    expect(validateEmployeeForm({ ...validInput, name: '   ' })).toEqual({
      ok: false,
      errors: { name: 'errors.requiredName' },
      message: 'errors.requiredName',
    })
  })

  it('rejects an invalid duty and contract', () => {
    expect(validateEmployeeForm({ ...validInput, duty: 'chef' })).toEqual({
      ok: false,
      errors: { duty: 'errors.invalidDuty' },
      message: 'errors.invalidDuty',
    })

    expect(validateEmployeeForm({ ...validInput, contract: 'contractor' })).toEqual({
      ok: false,
      errors: { contract: 'errors.invalidContract' },
      message: 'errors.invalidContract',
    })
  })

  it.each([0, -1, 169, null, 'abc'])('rejects weekly hours %s', (weeklyHours) => {
    expect(validateEmployeeForm({ ...validInput, weeklyHours })).toEqual({
      ok: false,
      errors: { weeklyHours: 'errors.weeklyHours' },
      message: 'errors.weeklyHours',
    })
  })

  it.each([40, 37.5])('accepts weekly hours %s', (weeklyHours) => {
    const result = validateEmployeeForm({ ...validInput, weeklyHours })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.weeklyHours).toBe(weeklyHours)
    }
  })

  it('rejects invalid email and phone values', () => {
    expect(validateEmployeeForm({ ...validInput, email: 'not-an-email' })).toEqual({
      ok: false,
      errors: { email: 'errors.invalidEmail' },
      message: 'errors.invalidEmail',
    })

    expect(validateEmployeeForm({ ...validInput, phone: '123' })).toEqual({
      ok: false,
      errors: { phone: 'errors.invalidPhone' },
      message: 'errors.invalidPhone',
    })
  })

  it('rejects more than six holiday weeks', () => {
    const holidays: HolidayWeek[] = Array.from({ length: 7 }, (_, index) => ({
      year: 2026,
      week: index + 1,
    }))

    expect(validateEmployeeForm({ ...validInput, holidays })).toEqual({
      ok: false,
      errors: { holidays: 'errors.maxHolidays' },
      message: 'errors.maxHolidays',
    })
  })

  it('reports the first error in field order', () => {
    const holidays: HolidayWeek[] = Array.from({ length: 7 }, (_, index) => ({
      year: 2026,
      week: index + 1,
    }))

    expect(
      validateEmployeeForm({
        name: '  ',
        duty: 'chef',
        contract: 'contractor',
        weeklyHours: 0,
        email: 'not-an-email',
        phone: '123',
        holidays,
        startDate: 'not-a-date',
      }),
    ).toEqual({
      ok: false,
      errors: {
        name: 'errors.requiredName',
        duty: 'errors.invalidDuty',
        contract: 'errors.invalidContract',
        weeklyHours: 'errors.weeklyHours',
        email: 'errors.invalidEmail',
        phone: 'errors.invalidPhone',
        holidays: 'errors.maxHolidays',
        startDate: 'errors.invalidStartDate',
      },
      message: 'errors.requiredName',
    })

    expect(firstEmployeeFormError({ phone: 'errors.invalidPhone', email: 'errors.invalidEmail' })).toBe(
      'errors.invalidEmail',
    )
  })

  it('includes a valid start date and omits a blank one', () => {
    const withStartDate = validateEmployeeForm({ ...validInput, startDate: ' 2026-11-08 ' })
    expect(withStartDate.ok).toBe(true)
    if (withStartDate.ok) {
      expect(withStartDate.value.startDate).toBe('2026-11-08')
    }

    const withoutStartDate = validateEmployeeForm({ ...validInput, startDate: '   ' })
    expect(withoutStartDate.ok).toBe(true)
    if (withoutStartDate.ok) {
      expect(withoutStartDate.value.startDate).toBeUndefined()
    }
  })

  it('rejects an invalid start date', () => {
    expect(validateEmployeeForm({ ...validInput, startDate: '2026-13-01' })).toEqual({
      ok: false,
      errors: { startDate: 'errors.invalidStartDate' },
      message: 'errors.invalidStartDate',
    })
  })

  it('falls back to a generic message when there are no errors', () => {
    expect(firstEmployeeFormError({})).toBe('errors.invalidEmployee')
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

  it('validates the week number against the ISO weeks in its year', () => {
    expect(parseHolidays('2027-W53')).toBeNull()
    expect(parseHolidays('2026-W53')).toEqual([{ year: 2026, week: 53 }])
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
          active: true,
        },
        {
          name: 'Bo',
          duty: 'employee',
          contract: 'part_time',
          weeklyHours: 20,
          holidays: [],
          active: true,
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
          active: true,
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
      errors: [{ row: 1, message: 'errors.unexpectedHeaders' }],
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
        { row: 3, message: 'errors.requiredName' },
        { row: 3, message: 'errors.invalidDuty' },
        { row: 3, message: 'errors.invalidContract' },
        { row: 3, message: 'errors.weeklyHours' },
        { row: 3, message: 'errors.invalidHolidays' },
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
      errors: [{ row: 2, message: 'errors.maxHolidays' }],
    })
  })

  it('rejects a holiday week that does not exist in its ISO year', () => {
    const result = validateEmployees(headers, [
      ['Ada', 'manager', 'fulltime', '40', '2027-W53', ''],
    ])

    expect(result).toEqual({
      ok: false,
      errors: [{ row: 2, message: 'errors.invalidHolidays' }],
    })
  })

  it('rejects an end date before the start date', () => {
    const result = validateEmployees(headers, [
      ['Ada', 'manager', 'fulltime', '40', '', '', '', 'false', '2026-12-01', '2026-11-01'],
    ])

    expect(result).toEqual({
      ok: false,
      errors: [{ row: 2, message: 'errors.endBeforeStart' }],
    })
  })

  it('rejects rows with invalid email and phone values', () => {
    const result = validateEmployees(headers, [
      ['Ada', 'manager', 'fulltime', '40', '', 'not-an-email', '123'],
    ])

    expect(result).toEqual({
      ok: false,
      errors: [
        { row: 2, message: 'errors.invalidEmail' },
        { row: 2, message: 'errors.invalidPhone' },
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
          active: true,
        },
      ],
    })
  })

  it('parses active, start date, and end date columns', () => {
    const result = validateEmployees(headers, [
      ['Ada', 'manager', 'fulltime', '40', '', '', '', 'false', '2020-01-01', '2026-11-08'],
      ['Bo', 'employee', 'part_time', '20', '', '', '', 'true', '2024-05-01', ''],
    ])

    expect(result).toEqual({
      ok: true,
      data: [
        {
          name: 'Ada',
          duty: 'manager',
          contract: 'fulltime',
          weeklyHours: 40,
          holidays: [],
          active: false,
          startDate: '2020-01-01',
          endDate: '2026-11-08',
        },
        {
          name: 'Bo',
          duty: 'employee',
          contract: 'part_time',
          weeklyHours: 20,
          holidays: [],
          active: true,
          startDate: '2024-05-01',
        },
      ],
    })
  })

  it('defaults a missing active column to true', () => {
    const result = validateEmployees(
      ['name', 'duty', 'contract', 'weeklyHours', 'holidays'],
      [['Ada', 'manager', 'fulltime', '40', '']],
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
          active: true,
        },
      ],
    })
  })

  it('rejects invalid active and date values', () => {
    const result = validateEmployees(headers, [
      ['Ada', 'manager', 'fulltime', '40', '', '', '', 'yes', '2026-13-01', 'soon'],
    ])

    expect(result).toEqual({
      ok: false,
      errors: [
        { row: 2, message: 'errors.invalidActive' },
        { row: 2, message: 'errors.invalidStartDate' },
        { row: 2, message: 'errors.invalidEndDate' },
      ],
    })
  })

  it('reconciles active status with the end date', () => {
    const inactiveWithoutEnd = validateEmployees(headers, [
      ['Ada', 'manager', 'fulltime', '40', '', '', '', 'false', '', ''],
    ])
    expect(inactiveWithoutEnd).toEqual({
      ok: false,
      errors: [{ row: 2, message: 'errors.endRequiredInactive' }],
    })

    const activeWithEnd = validateEmployees(headers, [
      ['Bo', 'employee', 'part_time', '20', '', '', '', 'true', '', '2026-11-08'],
    ])
    expect(activeWithEnd).toEqual({
      ok: false,
      errors: [{ row: 2, message: 'errors.endNotAllowedActive' }],
    })
  })

  it('treats short rows as missing values', () => {
    const result = validateEmployees(headers, [['Ada']])

    expect(result).toEqual({
      ok: false,
      errors: [
        { row: 2, message: 'errors.invalidDuty' },
        { row: 2, message: 'errors.invalidContract' },
        { row: 2, message: 'errors.weeklyHours' },
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
      'true',
      '2025-01-15',
      '',
    ])
  })

  it('maps a member without an email, phone, or end date to empty cells', () => {
    expect(
      employeeToRow({
        id: 'member-2',
        name: 'Bo',
        duty: 'employee',
        contract: 'fulltime',
        weeklyHours: 40,
        holidays: [],
        active: true,
        startDate: '2026-11-08',
      }),
    ).toEqual(['Bo', 'employee', 'fulltime', 40, '', '', '', 'true', '2026-11-08', ''])
  })

  it('serializes inactive members with their end date', () => {
    expect(
      employeeToRow({
        id: 'member-3',
        name: 'Cy',
        duty: 'assistant',
        contract: 'weekends',
        weeklyHours: 12,
        holidays: [],
        active: false,
        startDate: '2020-01-01',
        endDate: '2026-11-08',
      }),
    ).toEqual(['Cy', 'assistant', 'weekends', 12, '', '', '', 'false', '2020-01-01', '2026-11-08'])
  })

  it('maps a list of members', () => {
    expect(employeesToRows([member])).toEqual([employeeToRow(member)])
    expect(employeesToRows([])).toEqual([])
  })
})

describe('isMemberInWeek', () => {
  const weekStart: WeekKey = '2026-11-02'
  const weekEnd: WeekKey = '2026-11-08'

  function member(overrides: Partial<Pick<TeamMember, 'startDate' | 'endDate'>> = {}) {
    return {
      id: 'member-1',
      name: 'Test Member',
      duty: 'employee',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [],
      active: true,
      startDate: '2026-01-01',
      ...overrides,
    }
  }

  it('includes member starting on Monday of the week', () => {
    expect(isMemberInWeek(member({ startDate: '2026-11-02' }), weekStart, weekEnd)).toBe(true)
  })

  it('includes member starting on Sunday of the week', () => {
    expect(isMemberInWeek(member({ startDate: '2026-11-08' }), weekStart, weekEnd)).toBe(true)
  })

  it('includes member starting mid-week', () => {
    expect(isMemberInWeek(member({ startDate: '2026-11-04' }), weekStart, weekEnd)).toBe(true)
  })

  it('excludes member starting on Monday of next week', () => {
    expect(isMemberInWeek(member({ startDate: '2026-11-09' }), weekStart, weekEnd)).toBe(false)
  })

  it('includes member with endDate on Monday of the week', () => {
    expect(isMemberInWeek(member({ endDate: '2026-11-02' }), weekStart, weekEnd)).toBe(true)
  })

  it('includes member with endDate on Sunday of the week', () => {
    expect(isMemberInWeek(member({ endDate: '2026-11-08' }), weekStart, weekEnd)).toBe(true)
  })

  it('excludes member with endDate before the week', () => {
    expect(isMemberInWeek(member({ endDate: '2026-11-01' }), weekStart, weekEnd)).toBe(false)
  })

  it('includes member with endDate after the week', () => {
    expect(isMemberInWeek(member({ endDate: '2026-11-09' }), weekStart, weekEnd)).toBe(true)
  })

  it('includes member with no endDate (ongoing)', () => {
    expect(isMemberInWeek(member({ endDate: undefined }), weekStart, weekEnd)).toBe(true)
  })

  it('excludes member with startDate after week and no endDate', () => {
    expect(isMemberInWeek(member({ startDate: '2026-11-09', endDate: undefined }), weekStart, weekEnd)).toBe(false)
  })
})
