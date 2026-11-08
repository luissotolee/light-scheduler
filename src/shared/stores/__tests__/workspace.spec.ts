import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { DayOff, Shift, TeamMember } from '@/types'
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
const dayOff: DayOff = { memberId: member.id, weekday: 'monday' }

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
    expect(store.dayOffs).toEqual({})
    expect(store.currentWeekDayOffs).toEqual([])
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

  it('removes the member shifts from every week and drops empty week keys', () => {
    const store = useWorkspaceStore()
    const otherMember: TeamMember = { ...member, id: 'member-2', name: 'Bo' }
    const otherShift: Shift = { ...shift, id: 'shift-2', memberId: otherMember.id }
    const secondAdaShift: Shift = { ...shift, id: 'shift-3', weekday: 'tuesday' }

    store.setMembers([member, otherMember])
    store.setShiftsForWeek('2026-10-26', [shift, otherShift])
    store.setShiftsForWeek('2026-11-02', [secondAdaShift])

    store.removeMember(member.id)

    expect(store.members).toEqual([otherMember])
    expect(store.schedules).toEqual({ '2026-10-26': [otherShift] })
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

  it('stores day offs per week and exposes the current week', () => {
    const store = useWorkspaceStore()

    store.setDayOffsForWeek('2026-10-26', [dayOff])

    expect(store.dayOffs['2026-10-26']).toEqual([dayOff])
    expect(store.currentWeekDayOffs).toEqual([])

    store.setCurrentWeekKey('2026-10-26')
    expect(store.currentWeekDayOffs).toEqual([dayOff])
    expect(store.hasAnyData).toBe(true)
  })

  it('drops the week key when a week has no day offs left', () => {
    const store = useWorkspaceStore()
    store.setDayOffsForWeek('2026-10-26', [dayOff])

    store.setDayOffsForWeek('2026-10-26', [])

    expect(store.dayOffs).toEqual({})
    expect(store.hasAnyData).toBe(false)
  })

  it('removes the member day offs from every week and drops empty week keys', () => {
    const store = useWorkspaceStore()
    const otherMember: TeamMember = { ...member, id: 'member-2', name: 'Bo' }
    const otherDayOff: DayOff = { memberId: otherMember.id, weekday: 'friday' }
    const secondAdaDayOff: DayOff = { memberId: member.id, weekday: 'tuesday' }

    store.setMembers([member, otherMember])
    store.setDayOffsForWeek('2026-10-26', [dayOff, otherDayOff])
    store.setDayOffsForWeek('2026-11-02', [secondAdaDayOff])

    store.removeMember(member.id)

    expect(store.members).toEqual([otherMember])
    expect(store.dayOffs).toEqual({ '2026-10-26': [otherDayOff] })
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
    store.setDayOffsForWeek('2026-10-26', [dayOff])
    store.setCurrentWeekKey('2026-10-26')
    store.markLoaded()

    store.reset()

    expect(store.members).toEqual([])
    expect(store.schedules).toEqual({})
    expect(store.dayOffs).toEqual({})
    expect(store.currentWeekKey).toBe(getWeekKey(new Date()))
    expect(store.dataLoaded).toBe(false)
  })
})
