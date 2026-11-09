import { describe, expect, it } from 'vitest'
import type { DayOff, Shift, TeamMember } from '@/types'
import {
  isDayOff,
  isShift,
  isTeamMember,
  isWeekday,
  parsePersistedWorkspace,
  serializeWorkspace,
  WORKSPACE_SCHEMA_VERSION,
} from '@/shared/utils/persistence'
import type { PersistedWorkspace } from '@/shared/utils/persistence'

const member: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
  name: 'Ada',
  duty: 'employee',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [{ year: 2026, week: 10 }],
  email: 'ada@example.com',
  comment: 'No morning shifts',
  active: true,
  startDate: '2025-01-15',
}
const shift: Shift = {
  id: 'shift-1',
  memberId: member.id,
  weekday: 'monday',
  startMinute: 540,
  endMinute: 1020,
}
const dayOff: DayOff = { memberId: member.id, weekday: 'monday' }

const payload: Omit<PersistedWorkspace, 'version'> = {
  members: [member],
  schedules: { '2026-11-02': [shift] },
  dayOffs: { '2026-11-02': [dayOff] },
  currentWeekKey: '2026-11-02',
}

describe('persistence guards', () => {
  it('accepts every weekday and rejects other values', () => {
    for (const weekday of [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ]) {
      expect(isWeekday(weekday)).toBe(true)
    }

    expect(isWeekday('funday')).toBe(false)
    expect(isWeekday(undefined)).toBe(false)
    expect(isWeekday(1)).toBe(false)
  })

  it('validates shifts', () => {
    expect(isShift(shift)).toBe(true)
    expect(isShift({ ...shift, endMinute: 1500 })).toBe(true)

    expect(isShift(null)).toBe(false)
    expect(isShift([])).toBe(false)
    expect(isShift({ ...shift, weekday: 'funday' })).toBe(false)
    expect(isShift({ ...shift, startMinute: Number.NaN })).toBe(false)
    expect(isShift({ ...shift, startMinute: '540' })).toBe(false)
    expect(isShift({ ...shift, endMinute: null })).toBe(false)
    expect(isShift({ ...shift, endMinute: Number.POSITIVE_INFINITY })).toBe(false)
    expect(isShift({ ...shift, startMinute: -1 })).toBe(false)
    expect(isShift({ ...shift, startMinute: 600, endMinute: 600 })).toBe(false)
    expect(isShift({ ...shift, startMinute: 600, endMinute: 540 })).toBe(false)
    expect(isShift({ ...shift, endMinute: 1501 })).toBe(false)
    expect(isShift({ ...shift, id: 1 })).toBe(false)
  })

  it('validates day offs', () => {
    expect(isDayOff(dayOff)).toBe(true)

    expect(isDayOff(null)).toBe(false)
    expect(isDayOff({ memberId: 'member-1', weekday: 'funday' })).toBe(false)
    expect(isDayOff({ memberId: 1, weekday: 'monday' })).toBe(false)
  })

  it('validates team members', () => {
    expect(isTeamMember(member)).toBe(true)
    expect(isTeamMember({ ...member, email: undefined, phone: undefined })).toBe(true)
    expect(isTeamMember({ ...member, comment: undefined })).toBe(true)
    expect(isTeamMember({ ...member, endDate: undefined })).toBe(true)
    expect(isTeamMember({ ...member, phone: '+1 555 010 0000', endDate: '2026-11-08' })).toBe(true)

    expect(isTeamMember(null)).toBe(false)
    expect(isTeamMember({ ...member, id: 1 })).toBe(false)
    expect(isTeamMember({ ...member, name: undefined })).toBe(false)
    expect(isTeamMember({ ...member, duty: 'boss' })).toBe(false)
    expect(isTeamMember({ ...member, contract: 'freelance' })).toBe(false)
    expect(isTeamMember({ ...member, weeklyHours: 0 })).toBe(false)
    expect(isTeamMember({ ...member, weeklyHours: 'many' })).toBe(false)
    expect(isTeamMember({ ...member, holidays: 'none' })).toBe(false)
    expect(isTeamMember({ ...member, holidays: [{ year: 2026, week: 0 }] })).toBe(false)
    expect(isTeamMember({ ...member, holidays: [{ year: 2026, week: 53 }] })).toBe(true)
    expect(isTeamMember({ ...member, holidays: [{ year: 2027, week: 53 }] })).toBe(false)
    expect(isTeamMember({ ...member, active: 'true' })).toBe(false)
    expect(isTeamMember({ ...member, startDate: undefined })).toBe(false)
    expect(isTeamMember({ ...member, startDate: 'not-a-date' })).toBe(false)
    expect(isTeamMember({ ...member, email: 42 })).toBe(false)
    expect(isTeamMember({ ...member, comment: 42 })).toBe(false)
    expect(isTeamMember({ ...member, endDate: null })).toBe(false)
    expect(isTeamMember({ ...member, endDate: 'not-a-date' })).toBe(false)
    expect(isTeamMember({ ...member, empId: undefined })).toBe(false)
    expect(isTeamMember({ ...member, empId: '' })).toBe(false)
    expect(isTeamMember({ ...member, empId: 'not valid!' })).toBe(false)
  })
})

describe('parsePersistedWorkspace', () => {
  it('accepts a serialized valid payload', () => {
    expect(parsePersistedWorkspace(serializeWorkspace(payload))).toEqual({
      version: WORKSPACE_SCHEMA_VERSION,
      ...payload,
    })
  })

  it('stamps the current schema version when serializing', () => {
    expect(serializeWorkspace(payload).version).toBe(WORKSPACE_SCHEMA_VERSION)
  })

  it('rejects values that are not objects', () => {
    expect(parsePersistedWorkspace(null)).toBeNull()
    expect(parsePersistedWorkspace(undefined)).toBeNull()
    expect(parsePersistedWorkspace('workspace')).toBeNull()
    expect(parsePersistedWorkspace([])).toBeNull()
  })

  it('rejects an unsupported schema version', () => {
    expect(parsePersistedWorkspace({ ...serializeWorkspace(payload), version: 99 })).toBeNull()
    expect(
      parsePersistedWorkspace({ ...serializeWorkspace(payload), version: undefined }),
    ).toBeNull()
  })

  it('rejects an invalid members collection', () => {
    expect(
      parsePersistedWorkspace({
        version: 1,
        schedules: {},
        dayOffs: {},
        currentWeekKey: '2026-11-02',
      }),
    ).toBeNull()
    expect(parsePersistedWorkspace({ ...serializeWorkspace(payload), members: [] })).not.toBeNull()
    expect(parsePersistedWorkspace({ ...serializeWorkspace(payload), members: {} })).toBeNull()
    expect(parsePersistedWorkspace({ ...serializeWorkspace(payload), members: [{}] })).toBeNull()
  })

  it('rejects invalid schedules', () => {
    const valid = serializeWorkspace(payload)

    expect(parsePersistedWorkspace({ ...valid, schedules: undefined })).toBeNull()
    expect(parsePersistedWorkspace({ ...valid, schedules: [] })).toBeNull()
    expect(parsePersistedWorkspace({ ...valid, schedules: { '2026-11-02': {} } })).toBeNull()
    expect(
      parsePersistedWorkspace({
        ...valid,
        schedules: { '2026-11-02': [{ ...shift, startMinute: 600, endMinute: 540 }] },
      }),
    ).toBeNull()
  })

  it('rejects invalid day offs', () => {
    const valid = serializeWorkspace(payload)

    expect(parsePersistedWorkspace({ ...valid, dayOffs: undefined })).toBeNull()
    expect(parsePersistedWorkspace({ ...valid, dayOffs: [] })).toBeNull()
    expect(
      parsePersistedWorkspace({
        ...valid,
        dayOffs: { '2026-11-02': [{ memberId: 'member-1', weekday: 'funday' }] },
      }),
    ).toBeNull()
  })

  it('rejects an invalid current week key', () => {
    const valid = serializeWorkspace(payload)

    expect(parsePersistedWorkspace({ ...valid, currentWeekKey: 'not-a-date' })).toBeNull()
    expect(parsePersistedWorkspace({ ...valid, currentWeekKey: undefined })).toBeNull()
  })

  it('rejects v2 members without a valid employee id', () => {
    const valid = serializeWorkspace(payload)

    expect(
      parsePersistedWorkspace({ ...valid, members: [{ ...member, empId: undefined }] }),
    ).toBeNull()
  })

  it('migrates v1 payloads with deterministic employee ids', () => {
    const legacyMember = {
      id: 'member-1',
      name: 'Ada',
      duty: 'employee',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [],
      active: true,
      startDate: '2025-01-15',
    }
    const legacy = {
      version: 1,
      members: [legacyMember, { ...legacyMember, id: 'member-2', name: 'Bo' }],
      schedules: { '2026-11-02': [shift] },
      dayOffs: { '2026-11-02': [dayOff] },
      currentWeekKey: '2026-11-02',
    }

    const first = parsePersistedWorkspace(legacy)
    const second = parsePersistedWorkspace(legacy)

    expect(first).not.toBeNull()
    expect(first?.version).toBe(WORKSPACE_SCHEMA_VERSION)
    expect(first?.members.map((item) => item.empId)).toEqual(['EMP-0001', 'EMP-0002'])
    expect(second?.members.map((item) => item.empId)).toEqual(['EMP-0001', 'EMP-0002'])
    expect(first?.schedules).toEqual(legacy.schedules)
    expect(first?.dayOffs).toEqual(legacy.dayOffs)
    expect(first?.currentWeekKey).toBe('2026-11-02')
  })

  it('preserves employee ids already present in v1 payloads', () => {
    const legacy = {
      version: 1,
      members: [
        {
          id: 'member-1',
          name: 'Ada',
          duty: 'employee',
          contract: 'fulltime',
          weeklyHours: 40,
          holidays: [],
          active: true,
          startDate: '2025-01-15',
          empId: 'EMP-0042',
        },
      ],
      schedules: {},
      dayOffs: {},
      currentWeekKey: '2026-11-02',
    }

    expect(parsePersistedWorkspace(legacy)?.members[0].empId).toBe('EMP-0042')
  })
})
