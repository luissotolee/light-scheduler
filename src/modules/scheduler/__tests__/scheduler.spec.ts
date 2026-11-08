import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { DayOff, NewShift, Shift, TeamMember } from '@/types'

const baseShift: NewShift = {
  memberId: 'member-1',
  weekday: 'monday',
  start: '09:00',
  end: '12:00',
}

describe('scheduler store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('exposes the workspace current week and members', () => {
    const store = useSchedulerStore()
    const workspace = useWorkspaceStore()
    const member: TeamMember = {
      id: 'member-1',
      name: 'Ada',
      duty: 'employee',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [],
      active: true,
      startDate: '2025-01-15',
    }
    workspace.setMembers([member])

    expect(store.currentWeekKey).toBe(workspace.currentWeekKey)
    expect(store.currentWeekShifts).toEqual([])
    expect(store.members).toEqual([member])
    expect(store.currentWeekShifts).toHaveLength(0)
    expect(store.draft).toBeNull()
    expect(store.error).toBeNull()
  })

  it('excludes inactive members from scheduling', () => {
    const store = useSchedulerStore()
    const workspace = useWorkspaceStore()
    const active: TeamMember = {
      id: 'member-1',
      name: 'Ada',
      duty: 'employee',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [],
      active: true,
      startDate: '2025-01-15',
    }
    const inactive: TeamMember = {
      id: 'member-2',
      name: 'Bo',
      duty: 'employee',
      contract: 'part_time',
      weeklyHours: 20,
      holidays: [],
      active: false,
      startDate: '2020-01-01',
      endDate: '2026-11-08',
    }
    workspace.setMembers([active, inactive])

    expect(store.members).toEqual([active])
  })

  it('sets the shared week key', () => {
    const store = useSchedulerStore()
    const workspace = useWorkspaceStore()

    store.setWeekKey('2026-11-02')

    expect(store.currentWeekKey).toBe('2026-11-02')
    expect(workspace.currentWeekKey).toBe('2026-11-02')
  })

  it('moves one week forward and backward', () => {
    const store = useSchedulerStore()
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')

    store.goToNextWeek()
    expect(store.currentWeekKey).toBe('2026-11-09')

    store.goToPreviousWeek()
    expect(store.currentWeekKey).toBe('2026-11-02')

    store.goToPreviousWeek()
    expect(store.currentWeekKey).toBe('2026-10-26')
  })

  it('adds a shift using canonical minutes', () => {
    const store = useSchedulerStore()
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')

    const shift = store.addShift(baseShift)

    expect(shift).not.toBeNull()
    expect(shift?.startMinute).toBe(540)
    expect(shift?.endMinute).toBe(720)
    expect(store.currentWeekShifts).toHaveLength(1)
    expect(workspace.schedules['2026-11-02']).toEqual([shift])
    expect(store.error).toBeNull()
  })

  it('rejects invalid times', () => {
    const store = useSchedulerStore()

    expect(store.addShift({ ...baseShift, start: '9:00' })).toBeNull()
    expect(store.addShift({ ...baseShift, start: '12:00', end: '09:00' })).toBeNull()
    expect(store.currentWeekShifts).toHaveLength(0)
    expect(store.error).toBe('errors.shiftTimes')
  })

  it('merges overlapping shifts for the same member and weekday into one survivor', () => {
    const store = useSchedulerStore()
    const first = store.addShift(baseShift)

    const merged = store.addShift({ ...baseShift, start: '11:00', end: '13:00' })

    expect(merged).not.toBeNull()
    expect(merged?.id).not.toBe(first?.id)
    expect(merged).toMatchObject({ startMinute: 540, endMinute: 780 })
    expect(store.currentWeekShifts).toHaveLength(1)
    expect(store.currentWeekShifts).toEqual([merged])
    expect(store.error).toBeNull()
  })

  it('allows touching ranges and other members or weekdays', () => {
    const store = useSchedulerStore()
    store.addShift(baseShift)

    expect(store.addShift({ ...baseShift, start: '12:00', end: '13:00' })).not.toBeNull()
    expect(store.addShift({ ...baseShift, memberId: 'member-2' })).not.toBeNull()
    expect(store.addShift({ ...baseShift, weekday: 'tuesday' })).not.toBeNull()
    expect(store.currentWeekShifts).toHaveLength(4)
  })

  it('merges a chain of overlapping shifts into a single survivor', () => {
    const store = useSchedulerStore()
    const first = store.addShift(baseShift)
    const second = store.addShift({ ...baseShift, start: '13:00', end: '15:00' })

    const merged = store.addShift({ ...baseShift, start: '11:00', end: '14:00' })

    expect(merged).toMatchObject({ startMinute: 540, endMinute: 900 })
    expect(store.currentWeekShifts).toHaveLength(1)
    expect(store.currentWeekShifts).toEqual([merged])
    expect(store.currentWeekShifts[0].id).not.toBe(first?.id)
    expect(store.currentWeekShifts[0].id).not.toBe(second?.id)
    expect(store.error).toBeNull()
  })

  it('removes a shift and ignores unknown ids', () => {
    const store = useSchedulerStore()
    const shift = store.addShift(baseShift)

    store.removeShift('missing')
    expect(store.currentWeekShifts).toHaveLength(1)

    store.removeShift(shift!.id)
    expect(store.currentWeekShifts).toHaveLength(0)
  })

  it('updates and revalidates a shift', () => {
    const store = useSchedulerStore()
    const shift = store.addShift(baseShift)

    store.updateShift(shift!.id, { start: '10:00', end: '11:00' })

    expect(store.currentWeekShifts[0]).toMatchObject({ startMinute: 600, endMinute: 660 })
    expect(store.error).toBeNull()
  })

  it('rejects invalid shift updates', () => {
    const store = useSchedulerStore()
    const shift = store.addShift(baseShift)

    store.updateShift(shift!.id, { start: '13:00', end: '12:00' })

    expect(store.currentWeekShifts[0]).toMatchObject({ startMinute: 540, endMinute: 720 })
    expect(store.error).toBe('errors.shiftTimes')
  })

  it('merges an update overlap into the edited shift and drops the absorbed shift', () => {
    const store = useSchedulerStore()
    const first = store.addShift(baseShift)
    const second = store.addShift({ ...baseShift, start: '12:00', end: '13:00' })

    store.updateShift(second!.id, { start: '11:00' })

    const survivor = store.currentWeekShifts[0]
    expect(store.currentWeekShifts).toHaveLength(1)
    expect(survivor.id).toBe(second!.id)
    expect(survivor.id).not.toBe(first!.id)
    expect(survivor).toMatchObject({ startMinute: 540, endMinute: 780 })
    expect(store.error).toBeNull()
  })

  it('moves a shift to another member and weekday', () => {
    const store = useSchedulerStore()
    const shift = store.addShift(baseShift)

    store.updateShift(shift!.id, { memberId: 'member-2', weekday: 'friday' })

    expect(store.currentWeekShifts[0]).toMatchObject({
      memberId: 'member-2',
      weekday: 'friday',
      startMinute: 540,
      endMinute: 720,
    })
    expect(store.error).toBeNull()
  })

  it('ignores updates for unknown shifts and clears errors', () => {
    const store = useSchedulerStore()
    store.addShift({ ...baseShift, start: 'invalid' })
    expect(store.error).not.toBeNull()

    store.updateShift('missing', { start: '10:00' })
    store.clearError()

    expect(store.error).toBeNull()
  })
})

function makeMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'member-1',
    name: 'Ada',
    duty: 'employee',
    contract: 'fulltime',
    weeklyHours: 40,
    holidays: [],
    active: true,
    startDate: '2026-01-01',
    ...overrides,
  }
}

describe('scheduler weekday grid', () => {
  let store: ReturnType<typeof useSchedulerStore>
  let workspace: ReturnType<typeof useWorkspaceStore>

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    store = useSchedulerStore()
    workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
  })

  it('selects a weekday and derives its calendar date', () => {
    expect(store.selectedWeekday).toBe('monday')
    expect(store.selectedWeekdayDate).toBe('2026-11-02')

    store.selectWeekday('wednesday')

    expect(store.selectedWeekday).toBe('wednesday')
    expect(store.selectedWeekdayDate).toBe('2026-11-04')
  })

  it('filters day members by active state and start date', () => {
    const mondayStart = makeMember({ id: 'monday', startDate: '2026-11-02' })
    const tuesdayStart = makeMember({ id: 'tuesday', startDate: '2026-11-03' })
    const inactive = makeMember({ id: 'inactive', active: false, startDate: '2020-01-01' })
    const future = makeMember({ id: 'future', startDate: '2026-11-10' })
    workspace.setMembers([mondayStart, tuesdayStart, inactive, future])

    expect(store.dayMembers.map((member) => member.id)).toEqual(['monday'])

    store.selectWeekday('tuesday')
    expect(store.dayMembers.map((member) => member.id)).toEqual(['monday', 'tuesday'])

    store.selectWeekday('monday')
    workspace.setCurrentWeekKey('2026-11-09')
    expect(store.dayMembers.map((member) => member.id)).toEqual(['monday', 'tuesday'])

    store.selectWeekday('tuesday')
    expect(store.dayMembers.map((member) => member.id)).toEqual(['monday', 'tuesday', 'future'])
  })

  it('orders day rows by duty then name', () => {
    workspace.setMembers([
      makeMember({ id: 'employee-b', name: 'Bea Employee', duty: 'employee' }),
      makeMember({ id: 'employee-a', name: 'Ada Employee', duty: 'employee' }),
      makeMember({ id: 'manager', name: 'Max Manager', duty: 'manager' }),
      makeMember({ id: 'assistant', name: 'Al Assistant', duty: 'assistant' }),
      makeMember({ id: 'head', name: 'Hana Head', duty: 'head_manager' }),
    ])

    expect(store.dayRows.map((row) => row.member.id)).toEqual([
      'head',
      'assistant',
      'manager',
      'employee-a',
      'employee-b',
    ])
  })

  it('builds day rows with only the selected weekday bars', () => {
    const ada = makeMember({ id: 'ada' })
    const bo = makeMember({ id: 'bo' })
    const shifts: Shift[] = [
      { id: 's1', memberId: 'ada', weekday: 'monday', startMinute: 540, endMinute: 600 },
      { id: 's2', memberId: 'bo', weekday: 'monday', startMinute: 600, endMinute: 660 },
      { id: 's3', memberId: 'ada', weekday: 'tuesday', startMinute: 540, endMinute: 600 },
    ]
    workspace.setMembers([ada, bo])
    workspace.setShiftsForWeek('2026-11-02', shifts)

    expect(store.dayRows.map((row) => row.member.id)).toEqual(['ada', 'bo'])
    expect(store.dayRows[0].bars).toEqual([shifts[0]])
    expect(store.dayRows[1].bars).toEqual([shifts[1]])
    expect(store.dayRows[0].dailyHours).toBe(1)
    expect(store.dayRows[1].dailyHours).toBe(1)
    expect(store.selectedWeekdayShifts).toEqual([shifts[0], shifts[1]])

    store.selectWeekday('tuesday')
    expect(store.dayRows[0].bars).toEqual([shifts[2]])
    expect(store.dayRows[1].bars).toEqual([])
    expect(store.dayRows[0].dailyHours).toBe(1)
    expect(store.dayRows[1].dailyHours).toBe(0)
  })

  it('adds a snapped shift range to the selected weekday', () => {
    const shift = store.addShiftRange({ memberId: 'ada', startMinute: 545, endMinute: 605 })

    expect(shift).toMatchObject({
      memberId: 'ada',
      weekday: 'monday',
      startMinute: 540,
      endMinute: 600,
    })
    expect(store.currentWeekShifts).toEqual([shift])
    expect(workspace.schedules['2026-11-02']).toEqual([shift])
    expect(store.error).toBeNull()
  })

  it('rejects too-short ranges but merges overlapping ones', () => {
    expect(store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 550 })).toBeNull()
    expect(store.error).toBe('errors.shiftRange')

    store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 600 })

    const merged = store.addShiftRange({ memberId: 'ada', startMinute: 570, endMinute: 630 })

    expect(merged).toMatchObject({ startMinute: 540, endMinute: 630 })
    expect(store.error).toBeNull()
    expect(store.currentWeekShifts).toHaveLength(1)
  })

  it('adds cross-midnight ranges and merges them with touching or overlapping neighbours', () => {
    const late = store.addShiftRange({ memberId: 'ada', startMinute: 1440, endMinute: 1500 })

    expect(late).toMatchObject({ weekday: 'monday', startMinute: 1440, endMinute: 1500 })
    expect(
      store.addShiftRange({ memberId: 'ada', startMinute: 1410, endMinute: 1440 }),
    ).not.toBeNull()

    const merged = store.addShiftRange({ memberId: 'ada', startMinute: 1410, endMinute: 1470 })

    expect(merged).toMatchObject({ startMinute: 1410, endMinute: 1500 })
    expect(store.error).toBeNull()
    expect(store.currentWeekShifts).toHaveLength(1)
  })

  it('moves and resizes a shift range', () => {
    const shift = store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 720 })

    const updated = store.updateShiftRange({
      id: shift!.id,
      startMinute: 605,
      endMinute: 665,
    })

    expect(updated).toMatchObject({ id: shift!.id, startMinute: 600, endMinute: 660 })
    expect(store.currentWeekShifts).toEqual([updated])
    expect(store.error).toBeNull()
  })

  it('allows self-overlap and merges a resize into another shift', () => {
    const first = store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 720 })
    const second = store.addShiftRange({ memberId: 'ada', startMinute: 720, endMinute: 780 })

    expect(
      store.updateShiftRange({ id: first!.id, startMinute: 540, endMinute: 720 }),
    ).not.toBeNull()
    expect(store.currentWeekShifts).toHaveLength(2)

    const merged = store.updateShiftRange({
      id: first!.id,
      startMinute: 600,
      endMinute: 750,
    })

    expect(merged).toMatchObject({ id: first!.id, startMinute: 600, endMinute: 780 })
    expect(store.currentWeekShifts).toHaveLength(1)
    expect(store.currentWeekShifts.find((shift) => shift.id === first!.id)).toMatchObject({
      startMinute: 600,
      endMinute: 780,
    })
    expect(store.currentWeekShifts.some((shift) => shift.id === second!.id)).toBe(false)
    expect(store.error).toBeNull()
  })

  it('rejects invalid updates and ignores unknown ids', () => {
    const shift = store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 720 })

    expect(store.updateShiftRange({ id: shift!.id, startMinute: 540, endMinute: 550 })).toBeNull()
    expect(store.error).toBe('errors.shiftRange')

    expect(store.updateShiftRange({ id: 'missing', startMinute: 540, endMinute: 600 })).toBeNull()
    expect(store.currentWeekShifts[0]).toMatchObject({ startMinute: 540, endMinute: 720 })
  })

  it('updates a shift into the next day', () => {
    const shift = store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 600 })

    const updated = store.updateShiftRange({
      id: shift!.id,
      startMinute: 1440,
      endMinute: 1500,
    })

    expect(updated).toMatchObject({ startMinute: 1440, endMinute: 1500 })
  })
})

describe('scheduler days off', () => {
  let store: ReturnType<typeof useSchedulerStore>
  let workspace: ReturnType<typeof useWorkspaceStore>

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    store = useSchedulerStore()
    workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([
      makeMember({ id: 'member-1' }),
      makeMember({ id: 'member-2', name: 'Bo', duty: 'assistant' }),
    ])
  })

  function rowFor(memberId: string) {
    return store.dayRows.find((row) => row.member.id === memberId)
  }

  it('toggles a day off on and off for the selected weekday', () => {
    store.toggleDayOff('member-1')

    expect(store.currentWeekDayOffs).toEqual([{ memberId: 'member-1', weekday: 'monday' }])
    expect(store.daysOffCountFor('member-1')).toBe(1)
    expect(rowFor('member-1')).toMatchObject({ isOff: true, daysOffCount: 1 })
    expect(rowFor('member-2')).toMatchObject({ isOff: false, daysOffCount: 0 })
    expect(store.error).toBeNull()

    store.toggleDayOff('member-1')

    expect(store.currentWeekDayOffs).toEqual([])
    expect(store.daysOffCountFor('member-1')).toBe(0)
    expect(rowFor('member-1')).toMatchObject({ isOff: false, daysOffCount: 0 })
    expect(store.error).toBeNull()
  })

  it("clears the member's existing shifts on the selected weekday when marked off", () => {
    const mondayMemberOne: Shift = {
      id: 'monday-member-1',
      memberId: 'member-1',
      weekday: 'monday',
      startMinute: 540,
      endMinute: 720,
    }
    const mondayMemberTwo: Shift = {
      id: 'monday-member-2',
      memberId: 'member-2',
      weekday: 'monday',
      startMinute: 540,
      endMinute: 720,
    }
    const tuesdayMemberOne: Shift = {
      id: 'tuesday-member-1',
      memberId: 'member-1',
      weekday: 'tuesday',
      startMinute: 540,
      endMinute: 720,
    }
    workspace.setShiftsForWeek('2026-11-02', [
      mondayMemberOne,
      mondayMemberTwo,
      tuesdayMemberOne,
    ])

    store.toggleDayOff('member-1')

    expect(store.currentWeekDayOffs).toEqual([{ memberId: 'member-1', weekday: 'monday' }])
    expect(store.currentWeekShifts.map((shift) => shift.id)).not.toContain('monday-member-1')
    expect(store.currentWeekShifts.map((shift) => shift.id)).toContain('monday-member-2')
    expect(rowFor('member-1')).toMatchObject({ isOff: true, bars: [] })

    store.selectWeekday('tuesday')

    expect(rowFor('member-1')?.bars).toHaveLength(1)
  })

  it('does not restore cleared shifts when the day off is toggled back off', () => {
    const mondayMemberOne: Shift = {
      id: 'monday-member-1',
      memberId: 'member-1',
      weekday: 'monday',
      startMinute: 540,
      endMinute: 720,
    }
    workspace.setShiftsForWeek('2026-11-02', [mondayMemberOne])

    store.toggleDayOff('member-1')
    store.toggleDayOff('member-1')

    expect(store.currentWeekDayOffs).toEqual([])
    expect(store.currentWeekShifts).toEqual([])
  })

  it('allows more than two days off in a week without reporting an error', () => {
    store.toggleDayOff('member-1')
    store.selectWeekday('tuesday')
    store.toggleDayOff('member-1')
    store.selectWeekday('wednesday')
    store.toggleDayOff('member-1')

    expect(store.currentWeekDayOffs).toHaveLength(3)
    expect(store.daysOffCountFor('member-1')).toBe(3)
    expect(rowFor('member-1')).toMatchObject({ isOff: true, daysOffCount: 3 })
    expect(store.error).toBeNull()
  })

  it('allows un-marking a day off after reaching the minimum', () => {
    store.toggleDayOff('member-1')
    store.selectWeekday('tuesday')
    store.toggleDayOff('member-1')

    store.selectWeekday('monday')
    store.toggleDayOff('member-1')

    expect(store.daysOffCountFor('member-1')).toBe(1)
    expect(rowFor('member-1')?.isOff).toBe(false)
    expect(store.error).toBeNull()
  })

  it('scopes the disabled day to the selected weekday while the weekly count persists', () => {
    store.toggleDayOff('member-1')

    store.selectWeekday('tuesday')
    expect(rowFor('member-1')).toMatchObject({ isOff: false, daysOffCount: 1 })

    store.selectWeekday('monday')
    expect(rowFor('member-1')).toMatchObject({ isOff: true, daysOffCount: 1 })
  })

  it('sums days off across the whole week', () => {
    store.toggleDayOff('member-1')
    store.selectWeekday('tuesday')
    store.toggleDayOff('member-1')
    store.selectWeekday('wednesday')

    expect(store.currentWeekDayOffs).toHaveLength(2)
    expect(rowFor('member-1')).toMatchObject({ isOff: false, daysOffCount: 2 })
  })

  it('isolates day offs by week', () => {
    store.toggleDayOff('member-1')

    store.goToNextWeek()

    expect(store.currentWeekKey).toBe('2026-11-09')
    expect(store.currentWeekDayOffs).toEqual([])
    expect(rowFor('member-1')).toMatchObject({ isOff: false, daysOffCount: 0 })
    expect(workspace.dayOffs).toEqual({
      '2026-11-02': [{ memberId: 'member-1', weekday: 'monday' }],
    })

    store.goToPreviousWeek()
    expect(store.currentWeekDayOffs).toEqual([{ memberId: 'member-1', weekday: 'monday' }])
    expect(rowFor('member-1')).toMatchObject({ isOff: true, daysOffCount: 1 })
  })

  it('ignores unknown and inactive members', () => {
    store.toggleDayOff('missing')
    expect(store.currentWeekDayOffs).toEqual([])
    expect(store.daysOffCountFor('missing')).toBe(0)

    workspace.setMembers([makeMember({ id: 'member-1' }), makeMember({ id: 'gone', active: false })])
    store.toggleDayOff('gone')

    expect(store.currentWeekDayOffs).toEqual([])
    expect(store.error).toBeNull()
  })
})

describe('scheduler reset current week', () => {
  let store: ReturnType<typeof useSchedulerStore>
  let workspace: ReturnType<typeof useWorkspaceStore>

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    store = useSchedulerStore()
    workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([makeMember({ id: 'member-1' })])
  })

  it('clears the current week shifts and days off and clears the error', () => {
    store.addShift({ ...baseShift, weekday: 'tuesday' })
    store.toggleDayOff('member-1')
    store.addShift({ ...baseShift, start: 'invalid' })

    expect(store.currentWeekShifts).toHaveLength(1)
    expect(store.currentWeekDayOffs).toHaveLength(1)
    expect(store.error).toBe('errors.shiftTimes')

    store.resetCurrentWeek()

    expect(store.currentWeekShifts).toEqual([])
    expect(store.currentWeekDayOffs).toEqual([])
    expect(store.error).toBeNull()
    expect(workspace.schedules['2026-11-02']).toEqual([])
    expect(workspace.dayOffs['2026-11-02']).toBeUndefined()
  })

  it('keeps other weeks and team members intact', () => {
    const otherShift: Shift = {
      id: 'other-shift',
      memberId: 'member-1',
      weekday: 'friday',
      startMinute: 540,
      endMinute: 660,
    }
    const otherOff: DayOff = { memberId: 'member-1', weekday: 'friday' }
    workspace.setShiftsForWeek('2026-11-09', [otherShift])
    workspace.setDayOffsForWeek('2026-11-09', [otherOff])
    store.addShift(baseShift)
    store.toggleDayOff('member-1')

    store.resetCurrentWeek()

    expect(workspace.schedules['2026-11-09']).toEqual([otherShift])
    expect(workspace.dayOffs['2026-11-09']).toEqual([otherOff])
    expect(workspace.members).toEqual([makeMember({ id: 'member-1' })])
  })

  it('keeps the selected week and weekday', () => {
    store.selectWeekday('wednesday')

    store.resetCurrentWeek()

    expect(store.currentWeekKey).toBe('2026-11-02')
    expect(store.selectedWeekday).toBe('wednesday')
  })
})

describe('scheduler weekly hours groups', () => {
  let store: ReturnType<typeof useSchedulerStore>
  let workspace: ReturnType<typeof useWorkspaceStore>

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    store = useSchedulerStore()
    workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
  })

  it('orders groups head managers, assistants, managers, employees', () => {
    workspace.setMembers([
      makeMember({ id: 'employee', name: 'Eve Employee', duty: 'employee', weeklyHours: 10 }),
      makeMember({ id: 'assistant', name: 'Al Assistant', duty: 'assistant', weeklyHours: 12 }),
      makeMember({ id: 'manager', name: 'Max Manager', duty: 'manager', weeklyHours: 40 }),
      makeMember({ id: 'head', name: 'Hana Head', duty: 'head_manager', weeklyHours: 40 }),
    ])

    expect(store.weeklyHoursGroups.map((group) => group.duty)).toEqual([
      'head_manager',
      'assistant',
      'manager',
      'employee',
    ])
  })

  it('computes current, contract, and diff hours per member', () => {
    workspace.setMembers([
      makeMember({ id: 'ada', name: 'Ada Lovelace', duty: 'manager', weeklyHours: 40 }),
      makeMember({ id: 'bo', name: 'Bo Chen', duty: 'assistant', weeklyHours: 20 }),
    ])
    workspace.setShiftsForWeek('2026-11-02', [
      { id: 's1', memberId: 'ada', weekday: 'monday', startMinute: 540, endMinute: 720 },
      { id: 's2', memberId: 'bo', weekday: 'tuesday', startMinute: 600, endMinute: 660 },
    ])

    const assistantRow = store.weeklyHoursGroups[0].rows[0]
    expect(assistantRow).toMatchObject({
      memberId: 'bo',
      name: 'Bo Chen',
      initials: 'BC',
      currentHours: 1,
      contractHours: 20,
      diffHours: -19,
    })

    const managerRow = store.weeklyHoursGroups[1].rows[0]
    expect(managerRow).toMatchObject({
      memberId: 'ada',
      name: 'Ada Lovelace',
      initials: 'AL',
      currentHours: 3,
      contractHours: 40,
      diffHours: -37,
    })
  })

  it('counts cross-midnight minutes and keeps members without shifts', () => {
    workspace.setMembers([
      makeMember({ id: 'ada', name: 'Ada Lovelace', duty: 'manager', weeklyHours: 40 }),
      makeMember({ id: 'bo', name: 'Bo Chen', duty: 'assistant', weeklyHours: 20 }),
    ])
    workspace.setShiftsForWeek('2026-11-02', [
      { id: 's1', memberId: 'ada', weekday: 'monday', startMinute: 1410, endMinute: 1500 },
    ])

    expect(store.weeklyHoursGroups[0].rows[0]).toMatchObject({
      memberId: 'bo',
      currentHours: 0,
      contractHours: 20,
      diffHours: -20,
    })
    expect(store.weeklyHoursGroups[1].rows[0]).toMatchObject({
      currentHours: 1.5,
      diffHours: -38.5,
    })
  })

  it('only includes active members and omits empty groups', () => {
    workspace.setMembers([
      makeMember({ id: 'ada', name: 'Ada Lovelace', duty: 'manager', weeklyHours: 40 }),
      makeMember({
        id: 'gone',
        name: 'Gone Member',
        duty: 'employee',
        active: false,
        endDate: '2026-10-30',
      }),
    ])

    expect(store.weeklyHoursGroups).toHaveLength(1)
    expect(store.weeklyHoursGroups[0].duty).toBe('manager')
    expect(store.weeklyHoursGroups[0].rows.map((row) => row.memberId)).toEqual(['ada'])
  })

  it('reacts to shifts added through the grid', () => {
    workspace.setMembers([
      makeMember({ id: 'ada', name: 'Ada Lovelace', duty: 'manager', weeklyHours: 40 }),
    ])

    expect(store.weeklyHoursGroups[0].rows[0].currentHours).toBe(0)

    store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 660 })

    expect(store.weeklyHoursGroups[0].rows[0]).toMatchObject({
      currentHours: 2,
      diffHours: -38,
    })
  })
})
