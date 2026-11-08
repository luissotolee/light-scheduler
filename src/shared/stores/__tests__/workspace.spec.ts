import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { Shift, TeamMember } from '@/types'
import { getWeekKey } from '@/shared/utils/calendar'

const member: TeamMember = {
  id: 'member-1',
  name: 'Ada',
  duty: 'employee',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [],
  email: 'ada@example.com',
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

describe('workspace store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts empty with a current week and schema version', () => {
    const store = useWorkspaceStore()

    expect(store.members).toEqual([])
    expect(store.schedules).toEqual({})
    expect(store.currentWeekKey).toBe(getWeekKey(new Date()))
    expect(store.dataLoaded).toBe(false)
    expect(store.schemaVersion).toBe(1)
    expect(store.memberCount).toBe(0)
    expect(store.activeMembers).toEqual([])
    expect(store.currentWeekShifts).toEqual([])
    expect(store.hasAnyData).toBe(false)
  })

  it('exposes only active members', () => {
    const store = useWorkspaceStore()
    const inactive: TeamMember = {
      ...member,
      id: 'member-2',
      name: 'Bo',
      active: false,
      endDate: '2026-11-08',
    }
    store.setMembers([member, inactive])

    expect(store.activeMembers).toEqual([member])
  })

  it('sets members and computes whether data exists', () => {
    const store = useWorkspaceStore()

    store.setMembers([member])

    expect(store.memberCount).toBe(1)
    expect(store.hasAnyData).toBe(true)
  })

  it('upserts a new member and replaces an existing one by id', () => {
    const store = useWorkspaceStore()

    store.upsertMember(member)
    store.upsertMember({ ...member, name: 'Ada Lovelace' })

    expect(store.members).toEqual([{ ...member, name: 'Ada Lovelace' }])
  })

  it('removes a member and ignores unknown ids', () => {
    const store = useWorkspaceStore()
    store.setMembers([member])

    store.removeMember('missing')
    expect(store.members).toHaveLength(1)

    store.removeMember(member.id)
    expect(store.members).toEqual([])
  })

  it('finds members by id', () => {
    const store = useWorkspaceStore()
    store.setMembers([member])

    expect(store.findMember(member.id)).toEqual(member)
    expect(store.findMember('missing')).toBeUndefined()
  })

  it('stores shifts per week and exposes the current week', () => {
    const store = useWorkspaceStore()

    store.setShiftsForWeek('2026-10-26', [shift])

    expect(store.schedules['2026-10-26']).toEqual([shift])
    expect(store.currentWeekShifts).toEqual([])

    store.setCurrentWeekKey('2026-10-26')
    expect(store.currentWeekShifts).toEqual([shift])
    expect(store.hasAnyData).toBe(true)
  })

  it('marks data as loaded', () => {
    const store = useWorkspaceStore()

    store.markLoaded()

    expect(store.dataLoaded).toBe(true)
  })

  it('resets all state', () => {
    const store = useWorkspaceStore()
    store.setMembers([member])
    store.setShiftsForWeek('2026-10-26', [shift])
    store.setCurrentWeekKey('2026-10-26')
    store.markLoaded()

    store.reset()

    expect(store.members).toEqual([])
    expect(store.schedules).toEqual({})
    expect(store.currentWeekKey).toBe(getWeekKey(new Date()))
    expect(store.dataLoaded).toBe(false)
  })
})
