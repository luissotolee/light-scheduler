import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SICK_LEAVES,
  isDateInSickLeaves,
  isMemberSickOnDate,
  isMemberSickOnWeekday,
  isSickLeave,
  isValidSickLeaveRange,
  normalizeSickLeaves,
  overlapsSickLeave,
  parseSickLeaves,
  sickLeavesOf,
  sickLeaveCoversDate,
} from '@/shared/utils/sickness'
import type { TeamMember } from '@/types'

const leave = { id: 'sick-1', startDate: '2026-11-04', endDate: '2026-11-06' }

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'member-1',
    empId: 'EMP-0001',
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

describe('sickness utils', () => {
  it('exposes an empty default and treats a missing list as none', () => {
    expect(DEFAULT_SICK_LEAVES).toEqual([])
    expect(sickLeavesOf(member())).toEqual([])
    expect(sickLeavesOf(member({ sickLeaves: [leave] }))).toEqual([leave])
  })

  it('validates sick leave records', () => {
    expect(isSickLeave(leave)).toBe(true)
    expect(isSickLeave({ ...leave, id: '' })).toBe(false)
    expect(isSickLeave({ ...leave, startDate: 'nope' })).toBe(false)
    expect(isSickLeave({ ...leave, endDate: '2026-11-01' })).toBe(false)
    expect(isSickLeave(null)).toBe(false)
  })

  it('parses missing lists as empty and rejects malformed lists', () => {
    expect(parseSickLeaves(undefined)).toEqual([])
    expect(parseSickLeaves([])).toEqual([])
    expect(parseSickLeaves([leave])).toEqual([leave])
    expect(parseSickLeaves('nope')).toBeNull()
    expect(parseSickLeaves([{ ...leave, startDate: 'nope' }])).toBeNull()
    expect(parseSickLeaves([leave, { ...leave, startDate: '2026-11-07', endDate: '2026-11-08' }])).toBeNull()
  })

  it('normalizes by start then end date', () => {
    const later = { id: 'b', startDate: '2026-12-01', endDate: '2026-12-02' }
    const sameStartEarlierEnd = { id: 'c', startDate: '2026-11-04', endDate: '2026-11-05' }

    expect(normalizeSickLeaves([later, leave, sameStartEarlierEnd])).toEqual([
      sameStartEarlierEnd,
      leave,
      later,
    ])
  })

  it('covers inclusive date ranges', () => {
    expect(sickLeaveCoversDate(leave, '2026-11-03')).toBe(false)
    expect(sickLeaveCoversDate(leave, '2026-11-04')).toBe(true)
    expect(sickLeaveCoversDate(leave, '2026-11-06')).toBe(true)
    expect(sickLeaveCoversDate(leave, '2026-11-07')).toBe(false)
  })

  it('detects sickness on a date and weekday', () => {
    const sick = member({ sickLeaves: [leave] })

    expect(isMemberSickOnDate(sick, '2026-11-05')).toBe(true)
    expect(isMemberSickOnDate(sick, '2026-11-08')).toBe(false)
    expect(isMemberSickOnWeekday(sick, '2026-11-02', 'wednesday')).toBe(true)
    expect(isMemberSickOnWeekday(sick, '2026-11-02', 'tuesday')).toBe(false)
    expect(isDateInSickLeaves([leave], '2026-11-06')).toBe(true)
  })

  it('validates ranges and detects overlaps', () => {
    expect(isValidSickLeaveRange('2026-11-04', '2026-11-06')).toBe(true)
    expect(isValidSickLeaveRange('2026-11-06', '2026-11-04')).toBe(false)
    expect(isValidSickLeaveRange('nope', '2026-11-04')).toBe(false)

    expect(overlapsSickLeave([leave], '2026-11-06', '2026-11-08')).toBe(true)
    expect(overlapsSickLeave([leave], '2026-11-07', '2026-11-08')).toBe(false)
  })
})
