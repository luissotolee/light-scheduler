import { describe, expect, it } from 'vitest'
import type { DayRow } from '@/modules/scheduler/types'
import {
  buildHourGroups,
  buildHourlyHeadcounts,
  countPeakEmployees,
} from '@/modules/scheduler/utils/headcount'
import type { Shift, TeamMember } from '@/types'
import { buildDaySlots } from '@/shared/utils/shifts'

function member(id: string, name: string): TeamMember {
  return {
    id,
    empId: `EMP-${id}`,
    name,
    duty: 'employee',
    contract: 'fulltime',
    weeklyHours: 40,
    holidays: [],
    active: true,
    startDate: '2026-01-01',
  }
}

const ada = member('1', 'Ada')
const bo = member('2', 'Bo')
const cy = member('3', 'Cy')

let shiftCounter = 0

function bar(memberId: string, startMinute: number, endMinute: number): Shift {
  shiftCounter += 1
  return {
    id: `shift-${shiftCounter}`,
    memberId,
    weekday: 'monday',
    startMinute,
    endMinute,
  }
}

function row(
  teamMember: TeamMember,
  bars: Shift[],
  overrides: Partial<DayRow> = {},
): DayRow {
  return {
    member: teamMember,
    bars,
    dailyHours: 0,
    isOff: false,
    isHoliday: false,
    daysOffCount: 0,
    ...overrides,
  }
}

function countAt(rows: DayRow[], label: string, slotMinutes = 30, start = 540, end = 1500): number {
  const slots = buildDaySlots({ startMinute: start, endMinute: end, slotMinutes })
  const hour = buildHourlyHeadcounts(rows, slots).find((group) => group.label === label)
  return hour?.count ?? -1
}

describe('buildHourGroups', () => {
  it('groups the default window into 16 consecutive hour groups', () => {
    const groups = buildHourGroups(buildDaySlots())

    expect(groups).toHaveLength(16)
    expect(groups[0]).toMatchObject({
      label: '09',
      span: 2,
      isNextDay: false,
      startMinute: 540,
      endMinute: 600,
    })
    expect(groups[groups.length - 1]).toMatchObject({
      label: '00',
      span: 2,
      isNextDay: true,
      startMinute: 1440,
      endMinute: 1500,
    })
    expect(new Set(groups.map((group) => group.key)).size).toBe(groups.length)
  })

  it('uses the actual slot bounds for a partial first hour', () => {
    const groups = buildHourGroups(
      buildDaySlots({ startMinute: 570, endMinute: 660, slotMinutes: 30 }),
    )

    expect(groups[0]).toMatchObject({ label: '09', span: 1, startMinute: 570, endMinute: 600 })
    expect(groups[1]).toMatchObject({ label: '10', span: 2, startMinute: 600, endMinute: 660 })
  })
})

describe('countPeakEmployees', () => {
  it('counts one employee working across the hour', () => {
    const rows = [row(ada, [bar(ada.id, 600, 660)])]

    expect(countPeakEmployees(rows, 600, 660)).toBe(1)
  })

  it('counts two employees starting at the same half hour as two', () => {
    const rows = [
      row(ada, [bar(ada.id, 630, 690)]),
      row(bo, [bar(bo.id, 630, 690)]),
    ]

    expect(countPeakEmployees(rows, 600, 660)).toBe(2)
  })

  it('does not count a hand-off at the same minute as simultaneous', () => {
    const rows = [
      row(ada, [bar(ada.id, 540, 630)]),
      row(bo, [bar(bo.id, 630, 720)]),
    ]

    expect(countPeakEmployees(rows, 600, 660)).toBe(1)
  })

  it('uses the peak instant rather than the union of everyone who worked', () => {
    const rows = [
      row(ada, [bar(ada.id, 600, 615)]),
      row(bo, [bar(bo.id, 615, 630)]),
    ]

    expect(countPeakEmployees(rows, 600, 660)).toBe(1)
  })

  it('does not count a shift that ends when the hour starts', () => {
    const rows = [row(ada, [bar(ada.id, 540, 600)])]

    expect(countPeakEmployees(rows, 600, 660)).toBe(0)
  })

  it('merges adjacent bars for one employee without double counting', () => {
    const rows = [row(ada, [bar(ada.id, 600, 630), bar(ada.id, 630, 660)])]

    expect(countPeakEmployees(rows, 600, 660)).toBe(1)
  })

  it('skips employees who are off or on holiday', () => {
    const rows = [
      row(ada, [bar(ada.id, 600, 660)], { isOff: true }),
      row(bo, [bar(bo.id, 600, 660)], { isHoliday: true }),
      row(cy, []),
    ]

    expect(countPeakEmployees(rows, 600, 660)).toBe(0)
  })
})

describe('buildHourlyHeadcounts', () => {
  it('returns zero for every hour when there are no shifts', () => {
    const rows = [row(ada, []), row(bo, [])]

    expect(buildHourlyHeadcounts(rows, buildDaySlots()).every((hour) => hour.count === 0)).toBe(
      true,
    )
  })

  it('returns the same counts for 15 and 30 minute slots', () => {
    const rows = [
      row(ada, [bar(ada.id, 570, 945)]),
      row(bo, [bar(bo.id, 630, 900)]),
    ]

    const halfHour = buildHourlyHeadcounts(rows, buildDaySlots())
    const quarterHour = buildHourlyHeadcounts(rows, buildDaySlots({
      startMinute: 540,
      endMinute: 1500,
      slotMinutes: 15,
    }))

    expect(quarterHour.map((hour) => hour.count)).toEqual(
      halfHour.map((hour) => hour.count),
    )
  })

  it('only measures the visible part of a partial first hour', () => {
    const spanning = [row(ada, [bar(ada.id, 540, 600)])]
    const beforeWindow = [row(ada, [bar(ada.id, 540, 570)])]

    expect(countAt(spanning, '09', 30, 570, 660)).toBe(1)
    expect(countAt(beforeWindow, '09', 30, 570, 660)).toBe(0)
  })

  it('counts next-day hours across midnight', () => {
    const rows = [row(ada, [bar(ada.id, 1410, 1500)])]

    expect(countAt(rows, '23', 30, 1320, 1500)).toBe(1)
    expect(countAt(rows, '00', 30, 1320, 1500)).toBe(1)
  })
})
