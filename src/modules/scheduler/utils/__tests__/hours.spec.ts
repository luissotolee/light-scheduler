import { describe, expect, it } from 'vitest'
import type { Duty, Shift, TeamMember, WeekKey } from '@/types'
import {
  buildWeeklyHoursGroups,
  compareMembersByDuty,
  compareNames,
  dutyRank,
  formatDiff,
  formatHours,
  initialsOf,
  isMemberInWeek,
  minutesToHours,
  sumShiftMinutes,
} from '@/modules/scheduler/utils/hours'

function makeMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'member-1',
    name: 'Ada Lovelace',
    duty: 'employee',
    contract: 'fulltime',
    weeklyHours: 40,
    holidays: [],
    active: true,
    startDate: '2026-01-01',
    ...overrides,
  }
}

function makeShift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 'shift-1',
    memberId: 'member-1',
    weekday: 'monday',
    startMinute: 540,
    endMinute: 720,
    ...overrides,
  }
}

describe('initialsOf', () => {
  it('uses the first letter of each whitespace-separated word', () => {
    expect(initialsOf('Jane Doe')).toBe('JD')
    expect(initialsOf('John Michael Doe')).toBe('JMD')
    expect(initialsOf('ada')).toBe('A')
  })

  it('returns an empty string for empty or whitespace-only names', () => {
    expect(initialsOf('')).toBe('')
    expect(initialsOf('   ')).toBe('')
  })
})

describe('sumShiftMinutes', () => {
  it('sums the duration of every shift, including cross-midnight ones', () => {
    expect(
      sumShiftMinutes([
        makeShift({ startMinute: 540, endMinute: 720 }),
        makeShift({ id: 'shift-2', startMinute: 1410, endMinute: 1500 }),
      ]),
    ).toBe(270)
  })

  it('returns zero for no shifts', () => {
    expect(sumShiftMinutes([])).toBe(0)
  })
})

describe('minutesToHours', () => {
  it('converts minutes to hours', () => {
    expect(minutesToHours(0)).toBe(0)
    expect(minutesToHours(90)).toBe(1.5)
    expect(minutesToHours(2400)).toBe(40)
  })
})

describe('formatHours', () => {
  it('always formats with one decimal place', () => {
    expect(formatHours(37.5)).toBe('37.5')
    expect(formatHours(40)).toBe('40.0')
    expect(formatHours(0)).toBe('0.0')
  })

  it('rounds to one decimal place', () => {
    expect(formatHours(37.44)).toBe('37.4')
    expect(formatHours(37.45)).toBe('37.5')
  })
})

describe('formatDiff', () => {
  it('formats zero, positive, and negative differences', () => {
    expect(formatDiff(0)).toBe('0.0')
    expect(formatDiff(2.5)).toBe('+2.5')
    expect(formatDiff(-2.5)).toBe('-2.5')
    expect(formatDiff(2)).toBe('+2.0')
    expect(formatDiff(-2)).toBe('-2.0')
  })

  it('treats values that round to zero as zero', () => {
    expect(formatDiff(0.04)).toBe('0.0')
    expect(formatDiff(-0.04)).toBe('0.0')
  })
})

describe('dutyRank', () => {
  it('orders duties head manager, assistant, manager, employee', () => {
    expect(dutyRank('head_manager')).toBe(0)
    expect(dutyRank('assistant')).toBe(1)
    expect(dutyRank('manager')).toBe(2)
    expect(dutyRank('employee')).toBe(3)
  })

  it('sorts unknown duties last', () => {
    expect(dutyRank('unknown' as Duty)).toBe(4)
  })
})

describe('compareNames', () => {
  it('compares names case-insensitively', () => {
    expect(compareNames('ada', 'Ada')).toBe(0)
    expect(compareNames('Ada', 'Bo')).toBeLessThan(0)
    expect(compareNames('Bo', 'Ada')).toBeGreaterThan(0)
  })
})

describe('compareMembersByDuty', () => {
  function member(id: string, name: string, duty: Duty) {
    return { id, name, duty }
  }

  it('orders members by role priority', () => {
    const members = [
      member('e', 'Eve', 'employee'),
      member('m', 'Max', 'manager'),
      member('a', 'Al', 'assistant'),
      member('h', 'Hana', 'head_manager'),
    ]

    expect(members.sort(compareMembersByDuty).map((entry) => entry.id)).toEqual([
      'h',
      'a',
      'm',
      'e',
    ])
  })

  it('orders alphabetically, case-insensitively, within a role', () => {
    const members = [
      member('c', 'cy', 'manager'),
      member('b', 'Ada', 'manager'),
      member('a', 'bo', 'manager'),
    ]

    expect(members.sort(compareMembersByDuty).map((entry) => entry.id)).toEqual(['b', 'a', 'c'])
  })

  it('breaks name ties by id', () => {
    const members = [member('b', 'Ada', 'manager'), member('a', 'Ada', 'manager')]

    expect(members.sort(compareMembersByDuty).map((entry) => entry.id)).toEqual(['a', 'b'])
  })

  it('sorts unknown duties last', () => {
    const members = [
      member('unknown', 'Zed', 'unknown' as Duty),
      member('known', 'Ada', 'employee'),
    ]

    expect(members.sort(compareMembersByDuty).map((entry) => entry.id)).toEqual([
      'known',
      'unknown',
    ])
  })
})

describe('isMemberInWeek', () => {
  const weekStart: WeekKey = '2026-11-02'
  const weekEnd: WeekKey = '2026-11-08'

  function member(overrides: Partial<Pick<TeamMember, 'startDate' | 'endDate'>> = {}) {
    return {
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

describe('buildWeeklyHoursGroups', () => {
  it('groups rows in duty order and omits empty groups', () => {
    const members = [
      makeMember({ id: 'employee', name: 'Eve Employee', duty: 'employee' }),
      makeMember({ id: 'assistant', name: 'Al Assistant', duty: 'assistant', weeklyHours: 20 }),
      makeMember({ id: 'manager', name: 'Max Manager', duty: 'manager' }),
    ]

    const groups = buildWeeklyHoursGroups(members, [])

    expect(groups.map((group) => group.duty)).toEqual(['assistant', 'manager', 'employee'])
    expect(groups.some((group) => group.duty === 'head_manager')).toBe(false)
  })

  it('sorts members alphabetically within a group', () => {
    const members = [
      makeMember({ id: 'b', name: 'Bea Second', duty: 'manager' }),
      makeMember({ id: 'a', name: 'Ada First', duty: 'manager' }),
      makeMember({ id: 'c', name: 'Cy Third', duty: 'manager' }),
    ]

    const groups = buildWeeklyHoursGroups(members, [])

    expect(groups[0].rows.map((row) => row.memberId)).toEqual(['a', 'b', 'c'])
  })

  it('sums shifts per member and derives current, contract, and diff hours', () => {
    const members = [
      makeMember({ id: 'ada', name: 'Ada Lovelace', duty: 'manager', weeklyHours: 40 }),
      makeMember({ id: 'bo', name: 'Bo Chen', duty: 'assistant', weeklyHours: 20 }),
    ]
    const shifts = [
      makeShift({ id: 's1', memberId: 'ada', startMinute: 540, endMinute: 720 }),
      makeShift({
        id: 's2',
        memberId: 'ada',
        weekday: 'tuesday',
        startMinute: 600,
        endMinute: 720,
      }),
      makeShift({
        id: 's3',
        memberId: 'bo',
        weekday: 'friday',
        startMinute: 1410,
        endMinute: 1500,
      }),
    ]

    const groups = buildWeeklyHoursGroups(members, shifts)

    expect(groups[0].rows[0]).toEqual({
      memberId: 'bo',
      name: 'Bo Chen',
      initials: 'BC',
      currentHours: 1.5,
      contractHours: 20,
      diffHours: -18.5,
    })
    expect(groups[1].rows[0]).toEqual({
      memberId: 'ada',
      name: 'Ada Lovelace',
      initials: 'AL',
      currentHours: 5,
      contractHours: 40,
      diffHours: -35,
    })
  })

  it('includes inactive members because filtering belongs to the store', () => {
    const members = [
      makeMember({ id: 'active', name: 'Active One', duty: 'employee' }),
      makeMember({ id: 'inactive', name: 'Inactive One', duty: 'employee', active: false }),
    ]

    const groups = buildWeeklyHoursGroups(members, [])

    expect(groups[0].rows.map((row) => row.memberId)).toEqual(['active', 'inactive'])
  })
})
