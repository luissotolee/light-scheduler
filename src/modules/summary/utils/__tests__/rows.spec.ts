import { describe, expect, it } from 'vitest'
import type { DayOff, Shift, TeamMember, Weekday } from '@/types'
import {
  SUMMARY_PRINT_MAX_ROW_UNITS,
  SUMMARY_PRINT_MIN_ZOOM,
  buildSummaryRows,
  computeSummaryPrintZoom,
  formatShiftRange,
  isVacationWeek,
  summaryRowUnits,
} from '@/modules/summary/utils/rows'
import type { SummaryRow } from '@/modules/summary/types'
import { getIsoWeek } from '@/shared/utils/calendar'

const weekKey = '2026-11-02'

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'member-1',
    name: 'Ada',
    duty: 'employee',
    contract: 'fulltime',
    weeklyHours: 40,
    holidays: [],
    active: true,
    startDate: '2025-01-01',
    ...overrides,
  }
}

function shift(
  id: string,
  memberId: string,
  weekday: Weekday,
  startMinute: number,
  endMinute: number,
): Shift {
  return { id, memberId, weekday, startMinute, endMinute }
}

function dayOff(memberId: string, weekday: Weekday): DayOff {
  return { memberId, weekday }
}

function vacationHoliday(): TeamMember['holidays'] {
  return [getIsoWeek(new Date(2026, 10, 2))]
}

describe('formatShiftRange', () => {
  it('formats a daytime shift', () => {
    expect(formatShiftRange({ startMinute: 540, endMinute: 720 })).toBe('09:00–12:00')
  })

  it('formats an overnight shift with extended minutes', () => {
    expect(formatShiftRange({ startMinute: 1380, endMinute: 1500 })).toBe('23:00–01:00')
  })
})

describe('isVacationWeek', () => {
  it('is true when a holiday matches the selected week', () => {
    expect(isVacationWeek(member({ holidays: vacationHoliday() }), weekKey)).toBe(true)
  })

  it('is false when holidays belong to another week', () => {
    expect(isVacationWeek(member({ holidays: [{ year: 2026, week: 2 }] }), weekKey)).toBe(false)
  })

  it('is true when one of several holidays matches', () => {
    expect(
      isVacationWeek(
        member({ holidays: [{ year: 2026, week: 2 }, ...vacationHoliday()] }),
        weekKey,
      ),
    ).toBe(true)
  })

  it('is false without holidays', () => {
    expect(isVacationWeek(member(), weekKey)).toBe(false)
  })
})

describe('buildSummaryRows', () => {
  it('excludes members who start after the week', () => {
    const rows = buildSummaryRows({
      members: [member({ id: 'later', startDate: '2026-11-09' })],
      shifts: [],
      dayOffs: [],
      weekKey,
    })

    expect(rows).toHaveLength(0)
  })

  it('excludes members whose employment ended before the week', () => {
    const rows = buildSummaryRows({
      members: [member({ id: 'gone', endDate: '2026-11-01' })],
      shifts: [],
      dayOffs: [],
      weekKey,
    })

    expect(rows).toHaveLength(0)
  })

  it('includes inactive members employed during the week', () => {
    const rows = buildSummaryRows({
      members: [member({ id: 'inactive', active: false, endDate: '2026-11-04' })],
      shifts: [],
      dayOffs: [],
      weekKey,
    })

    expect(rows.map((row) => row.memberId)).toEqual(['inactive'])
  })

  it('sorts rows alphabetically with a member-id tiebreak', () => {
    const rows = buildSummaryRows({
      members: [
        member({ id: 'b', name: 'ada' }),
        member({ id: 'a', name: 'Ada' }),
        member({ id: 'c', name: 'Zoe' }),
      ],
      shifts: [],
      dayOffs: [],
      weekKey,
    })

    expect(rows.map((row) => row.memberId)).toEqual(['a', 'b', 'c'])
  })

  it('marks days without shifts as OFF', () => {
    const rows = buildSummaryRows({ members: [member()], shifts: [], dayOffs: [], weekKey })

    expect(rows[0].isVacation).toBe(false)
    expect(rows[0].cells.monday).toEqual({ kind: 'off' })
    expect(rows[0].cells.sunday).toEqual({ kind: 'off' })
  })

  it('renders one labelled shift', () => {
    const rows = buildSummaryRows({
      members: [member()],
      shifts: [shift('s1', 'member-1', 'monday', 540, 720)],
      dayOffs: [],
      weekKey,
    })

    expect(rows[0].cells.monday).toEqual({
      kind: 'shifts',
      shifts: [{ id: 's1', startMinute: 540, endMinute: 720, label: '09:00–12:00' }],
    })
  })

  it('renders two shifts sorted by start time', () => {
    const rows = buildSummaryRows({
      members: [member()],
      shifts: [
        shift('late', 'member-1', 'monday', 840, 1080),
        shift('early', 'member-1', 'monday', 540, 720),
      ],
      dayOffs: [],
      weekKey,
    })

    const cell = rows[0].cells.monday
    expect(cell.kind).toBe('shifts')
    if (cell.kind !== 'shifts') return
    expect(cell.shifts.map((item) => item.id)).toEqual(['early', 'late'])
  })

  it('lets an explicit day off override a shift', () => {
    const rows = buildSummaryRows({
      members: [member()],
      shifts: [shift('s1', 'member-1', 'monday', 540, 720)],
      dayOffs: [dayOff('member-1', 'monday')],
      weekKey,
    })

    expect(rows[0].cells.monday).toEqual({ kind: 'off' })
  })

  it('marks a vacation row and hides shifts', () => {
    const rows = buildSummaryRows({
      members: [member({ holidays: vacationHoliday() })],
      shifts: [shift('s1', 'member-1', 'monday', 540, 720)],
      dayOffs: [],
      weekKey,
    })

    expect(rows[0].isVacation).toBe(true)
    expect(Object.values(rows[0].cells)).toEqual(
      Array.from({ length: 7 }, () => ({ kind: 'vacations' })),
    )
  })

  it('ignores shifts for members that are not shown', () => {
    const rows = buildSummaryRows({
      members: [member()],
      shifts: [shift('orphan', 'missing', 'monday', 540, 720)],
      dayOffs: [],
      weekKey,
    })

    expect(rows[0].cells.monday).toEqual({ kind: 'off' })
  })
})

describe('summaryRowUnits', () => {
  function row(overrides: Partial<SummaryRow> = {}): SummaryRow {
    return {
      memberId: 'member-1',
      name: 'Ada',
      isVacation: false,
      cells: {
        monday: { kind: 'off' },
        tuesday: { kind: 'off' },
        wednesday: { kind: 'off' },
        thursday: { kind: 'off' },
        friday: { kind: 'off' },
        saturday: { kind: 'off' },
        sunday: { kind: 'off' },
      },
      ...overrides,
    }
  }

  it('counts one unit for a single shift', () => {
    const value = row({
      cells: {
        monday: { kind: 'shifts', shifts: [{ id: 's1', startMinute: 540, endMinute: 720, label: '' }] },
        tuesday: { kind: 'off' },
        wednesday: { kind: 'off' },
        thursday: { kind: 'off' },
        friday: { kind: 'off' },
        saturday: { kind: 'off' },
        sunday: { kind: 'off' },
      },
    })

    expect(summaryRowUnits([value])).toBe(1)
  })

  it('counts two side-by-side shifts as one unit', () => {
    const value = row({
      cells: {
        monday: {
          kind: 'shifts',
          shifts: [
            { id: 's1', startMinute: 540, endMinute: 720, label: '' },
            { id: 's2', startMinute: 840, endMinute: 960, label: '' },
          ],
        },
        tuesday: { kind: 'off' },
        wednesday: { kind: 'off' },
        thursday: { kind: 'off' },
        friday: { kind: 'off' },
        saturday: { kind: 'off' },
        sunday: { kind: 'off' },
      },
    })

    expect(summaryRowUnits([value])).toBe(1)
  })

  it('counts three shifts on one day as two units', () => {
    const value = row({
      cells: {
        monday: {
          kind: 'shifts',
          shifts: [
            { id: 's1', startMinute: 540, endMinute: 660, label: '' },
            { id: 's2', startMinute: 720, endMinute: 840, label: '' },
            { id: 's3', startMinute: 900, endMinute: 1020, label: '' },
          ],
        },
        tuesday: { kind: 'off' },
        wednesday: { kind: 'off' },
        thursday: { kind: 'off' },
        friday: { kind: 'off' },
        saturday: { kind: 'off' },
        sunday: { kind: 'off' },
      },
    })

    expect(summaryRowUnits([value])).toBe(2)
  })

  it('counts a vacation row as one unit', () => {
    expect(summaryRowUnits([row({ isVacation: true })])).toBe(1)
  })
})

describe('computeSummaryPrintZoom', () => {
  it('returns 1 up to the threshold', () => {
    expect(computeSummaryPrintZoom(SUMMARY_PRINT_MAX_ROW_UNITS)).toBe(1)
    expect(computeSummaryPrintZoom(0)).toBe(1)
  })

  it('scales down above the threshold', () => {
    expect(computeSummaryPrintZoom(60)).toBe(0.5)
  })

  it('never drops below the minimum zoom', () => {
    expect(computeSummaryPrintZoom(100)).toBe(SUMMARY_PRINT_MIN_ZOOM)
  })
})
