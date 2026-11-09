import { describe, expect, it } from 'vitest'
import type { DayOff, Shift, TeamMember } from '@/types'
import {
  DAY_OFF_TOKEN,
  SCHEDULE_HEADERS,
  buildScheduleCsvRows,
  formatDayCell,
  formatIsoWeekToken,
  formatShiftRangeToken,
  parseDayCell,
  parseIsoWeekToken,
  parseShiftRangeToken,
  validateScheduleCsv,
  weekKeyToIsoWeekToken,
} from '@/shared/utils/scheduleCsv'
import { getIsoWeekStart, getWeekKey } from '@/shared/utils/calendar'
import { parseCsv, toCsv } from '@/shared/utils/csv'

const ada: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
  name: 'Ada',
  duty: 'manager',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [],
  active: true,
  startDate: '2025-01-01',
}

const bo: TeamMember = {
  id: 'member-2',
  empId: 'EMP-0002',
  name: 'Bo',
  duty: 'employee',
  contract: 'part_time',
  weeklyHours: 20,
  holidays: [],
  active: true,
  startDate: '2025-01-01',
}

const week1 = getWeekKey(getIsoWeekStart(2026, 1))
const week45 = '2026-11-02'

function shift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 'shift-1',
    memberId: ada.id,
    weekday: 'monday',
    startMinute: 540,
    endMinute: 1020,
    ...overrides,
  }
}

function dayOff(overrides: Partial<DayOff> = {}): DayOff {
  return { memberId: ada.id, weekday: 'tuesday', ...overrides }
}

describe('week tokens', () => {
  it('formats canonical ISO week tokens without padding', () => {
    expect(formatIsoWeekToken(2026, 1)).toBe('Y2026W1')
    expect(formatIsoWeekToken(2026, 45)).toBe('Y2026W45')
  })

  it('maps a week key to its ISO year and week', () => {
    expect(weekKeyToIsoWeekToken(week45)).toBe('Y2026W45')
    expect(weekKeyToIsoWeekToken(week1)).toBe('Y2026W1')
  })

  it('parses tokens case-insensitively and accepts padded weeks', () => {
    expect(parseIsoWeekToken('Y2026W1')).toEqual({ year: 2026, week: 1, weekKey: week1 })
    expect(parseIsoWeekToken('y2026w01')).toEqual({ year: 2026, week: 1, weekKey: week1 })
    expect(parseIsoWeekToken('Y2026W45')?.weekKey).toBe(week45)
  })

  it('handles year-boundary weeks', () => {
    expect(week1).toBe('2025-12-29')
    expect(parseIsoWeekToken('Y2026W1')?.weekKey).toBe('2025-12-29')
  })

  it('rejects invalid tokens', () => {
    expect(parseIsoWeekToken('')).toBeNull()
    expect(parseIsoWeekToken('2026W1')).toBeNull()
    expect(parseIsoWeekToken('Y2026')).toBeNull()
    expect(parseIsoWeekToken('Y2026W0')).toBeNull()
    expect(parseIsoWeekToken('Y2026W54')).toBeNull()
  })
})

describe('shift range tokens', () => {
  it('formats and parses a regular range', () => {
    const token = formatShiftRangeToken({ startMinute: 540, endMinute: 1020 })
    expect(token).toBe('09:00-17:00')
    expect(parseShiftRangeToken(token)).toEqual({ startMinute: 540, endMinute: 1020 })
  })

  it('preserves overnight shifts up to 25:00', () => {
    const token = formatShiftRangeToken({ startMinute: 1320, endMinute: 1500 })
    expect(token).toBe('22:00-25:00')
    expect(parseShiftRangeToken(token)).toEqual({ startMinute: 1320, endMinute: 1500 })
  })

  it('rejects invalid ranges', () => {
    expect(parseShiftRangeToken('17:00-09:00')).toBeNull()
    expect(parseShiftRangeToken('09:00-09:00')).toBeNull()
    expect(parseShiftRangeToken('09:00-25:30')).toBeNull()
    expect(parseShiftRangeToken('9am-5pm')).toBeNull()
    expect(parseShiftRangeToken('09:00')).toBeNull()
  })
})

describe('day cells', () => {
  it('formats and parses empty and day-off cells', () => {
    expect(formatDayCell([], false)).toBe('')
    expect(formatDayCell([], true)).toBe(DAY_OFF_TOKEN)
    expect(parseDayCell('')).toEqual({ kind: 'empty' })
    expect(parseDayCell(' off ')).toEqual({ kind: 'off' })
  })

  it('joins multiple sorted shifts with a semicolon', () => {
    const cell = formatDayCell(
      [
        { ...shift(), id: 'b', startMinute: 900, endMinute: 1080 },
        { ...shift(), id: 'a', startMinute: 540, endMinute: 780 },
      ],
      false,
    )

    expect(cell).toBe('09:00-13:00;15:00-18:00')
    expect(parseDayCell(cell)).toEqual({
      kind: 'shifts',
      ranges: [
        { startMinute: 540, endMinute: 780 },
        { startMinute: 900, endMinute: 1080 },
      ],
    })
  })

  it('rejects invalid cells', () => {
    expect(parseDayCell('OFF;09:00-17:00')).toEqual({ kind: 'invalid' })
    expect(parseDayCell('09:00-17:00;')).toEqual({ kind: 'invalid' })
    expect(parseDayCell('09:00-17:00;16:00-18:00')).toEqual({ kind: 'invalid' })
    expect(parseDayCell('nope')).toEqual({ kind: 'invalid' })
  })
})

describe('buildScheduleCsvRows', () => {
  it('emits a padded marker row per week and one row per active employee', () => {
    const rows = buildScheduleCsvRows(
      [bo, ada],
      {
        [week45]: [shift()],
      },
      { [week45]: [dayOff()] },
    )

    expect(rows).toEqual([
      ['Y2026W45', '', '', '', '', '', '', '', ''],
      ['', 'EMP-0001', '09:00-17:00', 'OFF', '', '', '', '', ''],
      ['', 'EMP-0002', '', '', '', '', '', '', ''],
    ])
  })

  it('sorts weeks chronologically and omits weeks with no shifts', () => {
    const rows = buildScheduleCsvRows(
      [ada],
      {
        [week45]: [shift()],
        [week1]: [shift({ id: 'shift-2', weekday: 'friday' })],
        '2026-01-05': [],
      },
      {},
    )

    const markers = rows.filter((row) => row[0] !== '').map((row) => row[0])
    expect(markers).toEqual(['Y2026W1', 'Y2026W45'])
  })

  it('ignores shifts that reference unknown members', () => {
    const rows = buildScheduleCsvRows(
      [ada],
      { [week45]: [shift({ memberId: 'missing' })] },
      {},
    )

    expect(rows).toEqual([])
  })

  it('uses the employee id and never the employee name', () => {
    const rows = buildScheduleCsvRows([ada], { [week45]: [shift()] }, {})
    const flat = rows.flat().join(',')

    expect(flat).toContain(ada.empId)
    expect(flat).not.toContain(ada.name)
  })

  it('omits members outside the week', () => {
    const future: TeamMember = { ...bo, startDate: '2027-01-01' }
    const rows = buildScheduleCsvRows([ada, future], { [week45]: [shift()] }, {})

    expect(rows.some((row) => row[1] === 'EMP-0002')).toBe(false)
  })
})

describe('validateScheduleCsv', () => {
  const header = [...SCHEDULE_HEADERS]

  it('parses a valid chunked file with marker and employee rows', () => {
    const result = validateScheduleCsv(
      header,
      [
        ['Y2026W45', '', '', '', '', '', '', '', ''],
        ['', 'EMP-0001', '09:00-17:00', 'OFF', '', '', '', '', ''],
      ],
      [ada, bo],
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.data.weekCount).toBe(1)
    expect(result.data.shiftCount).toBe(1)
    expect(result.data.schedules[week45]).toEqual([
      expect.objectContaining({
        memberId: ada.id,
        weekday: 'monday',
        startMinute: 540,
        endMinute: 1020,
      }),
    ])
    expect(result.data.dayOffs[week45]).toEqual([{ memberId: ada.id, weekday: 'tuesday' }])
  })

  it('inherits the current week for blank week cells and accepts repeated tokens', () => {
    const result = validateScheduleCsv(
      header,
      [
        ['Y2026W45', '', '', '', '', '', '', '', ''],
        ['', 'EMP-0001', '09:00-17:00', '', '', '', '', '', ''],
        ['Y2026W45', '', '', '', '', '', '', '', ''],
        ['', 'EMP-0002', '', '09:00-13:00', '', '', '', '', ''],
      ],
      [ada, bo],
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.shiftCount).toBe(2)
    expect(result.data.schedules[week45]).toHaveLength(2)
  })

  it('supports multiple shifts in a single cell', () => {
    const result = validateScheduleCsv(
      header,
      [
        ['Y2026W45', '', '', '', '', '', '', '', ''],
        ['', 'EMP-0001', '09:00-13:00;15:00-19:00', '', '', '', '', '', ''],
      ],
      [ada],
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.shiftCount).toBe(2)
  })

  it('rejects unexpected headers, including the legacy schedule format', () => {
    expect(
      validateScheduleCsv(['member', 'weekday', 'start', 'end'], [['Ada', 'monday', '09:00', '17:00']], [ada]),
    ).toEqual({ ok: false, errors: [{ row: 1, message: 'errors.unexpectedHeaders' }] })
  })

  it('rejects unknown, missing, and duplicated employee ids', () => {
    expect(
      validateScheduleCsv(header, [['Y2026W45', '', '', '', '', '', '', '', ''], ['', 'EMP-9999', '09:00-17:00', '', '', '', '', '', '']], [ada]),
    ).toEqual({ ok: false, errors: [{ row: 3, message: 'errors.unknownEmpId' }] })

    expect(
      validateScheduleCsv(header, [['', '', '09:00-17:00', '', '', '', '', '', '']], [ada]),
    ).toEqual({
      ok: false,
      errors: [{ row: 2, message: 'errors.missingEmpId' }],
    })
  })

  it('rejects duplicate employee rows for the same week', () => {
    const result = validateScheduleCsv(
      header,
      [
        ['Y2026W45', '', '', '', '', '', '', '', ''],
        ['', 'EMP-0001', '09:00-17:00', '', '', '', '', '', ''],
        ['', 'EMP-0001', '', '09:00-17:00', '', '', '', '', ''],
      ],
      [ada],
    )

    expect(result).toEqual({ ok: false, errors: [{ row: 4, message: 'errors.duplicateScheduleRow' }] })
  })

  it('rejects invalid weeks and shift cells', () => {
    expect(
      validateScheduleCsv(header, [['Y2026W99', '', '', '', '', '', '', '', '']], [ada]),
    ).toEqual({ ok: false, errors: [{ row: 2, message: 'errors.invalidScheduleWeek' }] })

    expect(
      validateScheduleCsv(
        header,
        [
          ['Y2026W45', '', '', '', '', '', '', '', ''],
          ['', 'EMP-0001', 'nope', '', '', '', '', '', ''],
        ],
        [ada],
      ),
    ).toEqual({ ok: false, errors: [{ row: 3, message: 'errors.invalidShiftCell' }] })
  })

  it('rejects a workspace with duplicate employee ids', () => {
    const duplicate: TeamMember = { ...bo, empId: ada.empId }

    expect(validateScheduleCsv(header, [], [ada, duplicate])).toEqual({
      ok: false,
      errors: [{ row: 1, message: 'errors.duplicateEmpId' }],
    })
  })

  it('returns ok with no shifts for an empty schedule file', () => {
    const result = validateScheduleCsv(header, [['Y2026W45', '', '', '', '', '', '', '', '']], [ada])

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.shiftCount).toBe(0)
    expect(result.data.weekCount).toBe(0)
  })

  it('round-trips through toCsv and parseCsv', () => {
    const rows = buildScheduleCsvRows([ada, bo], { [week45]: [shift()] }, {})
    const text = toCsv([...SCHEDULE_HEADERS], rows)
    const parsed = parseCsv(text)

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const result = validateScheduleCsv(parsed.headers, parsed.rows, [ada, bo])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.shiftCount).toBe(1)
  })
})
