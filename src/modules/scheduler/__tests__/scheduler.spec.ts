import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { NewShift, TeamMember } from '@/types'

const baseShift: NewShift = {
  memberId: 'member-1',
  weekday: 'monday',
  start: '09:00',
  end: '12:00',
}

describe('scheduler store', () => {
  beforeEach(() => {
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
    }
    workspace.setMembers([member])

    expect(store.currentWeekKey).toBe(workspace.currentWeekKey)
    expect(store.currentWeekShifts).toEqual([])
    expect(store.members).toEqual([member])
    expect(store.shiftCount).toBe(0)
    expect(store.draft).toBeNull()
    expect(store.error).toBeNull()
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
    expect(store.shiftCount).toBe(1)
    expect(workspace.schedules['2026-11-02']).toEqual([shift])
    expect(store.error).toBeNull()
  })

  it('rejects invalid times', () => {
    const store = useSchedulerStore()

    expect(store.addShift({ ...baseShift, start: '9:00' })).toBeNull()
    expect(store.addShift({ ...baseShift, start: '12:00', end: '09:00' })).toBeNull()
    expect(store.shiftCount).toBe(0)
    expect(store.error).toBe('Shift times must be valid and start before end')
  })

  it('rejects overlapping shifts for the same member and weekday', () => {
    const store = useSchedulerStore()
    store.addShift(baseShift)

    const overlap = store.addShift({ ...baseShift, start: '11:00', end: '13:00' })

    expect(overlap).toBeNull()
    expect(store.shiftCount).toBe(1)
    expect(store.error).toBe('Shift overlaps an existing shift for this member')
  })

  it('allows touching ranges and other members or weekdays', () => {
    const store = useSchedulerStore()
    store.addShift(baseShift)

    expect(store.addShift({ ...baseShift, start: '12:00', end: '13:00' })).not.toBeNull()
    expect(store.addShift({ ...baseShift, memberId: 'member-2' })).not.toBeNull()
    expect(store.addShift({ ...baseShift, weekday: 'tuesday' })).not.toBeNull()
    expect(store.shiftCount).toBe(4)
  })

  it('removes a shift and ignores unknown ids', () => {
    const store = useSchedulerStore()
    const shift = store.addShift(baseShift)

    store.removeShift('missing')
    expect(store.shiftCount).toBe(1)

    store.removeShift(shift!.id)
    expect(store.shiftCount).toBe(0)
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
    expect(store.error).toBe('Shift times must be valid and start before end')
  })

  it('rejects update overlaps while ignoring the edited shift', () => {
    const store = useSchedulerStore()
    store.addShift(baseShift)
    const second = store.addShift({ ...baseShift, start: '12:00', end: '13:00' })

    store.updateShift(second!.id, { start: '11:00' })

    expect(store.currentWeekShifts[1]).toMatchObject({ startMinute: 720, endMinute: 780 })
    expect(store.error).toBe('Shift overlaps an existing shift for this member')
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
