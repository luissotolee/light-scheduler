import { describe, expect, it } from 'vitest'
import type { Shift, TeamMember } from '@/types'
import {
  buildWeeklyHoursGroups,
  formatDiff,
  formatHours,
  initialsOf,
  minutesToHours,
  sumShiftMinutes,
} from '@/modules/scheduler/utils/hours'

function makeMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'member-1',
    empId: 'EMP-0001',
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
