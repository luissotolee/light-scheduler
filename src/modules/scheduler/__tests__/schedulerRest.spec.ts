import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { Shift, TeamMember } from '@/types'

const WEEK = '2026-11-02'
const PREV_WEEK = '2026-10-26'
const NEXT_WEEK = '2026-11-09'

function makeMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'ada',
    empId: 'EMP-0001',
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

function makeShift(
  id: string,
  weekday: Shift['weekday'],
  startMinute: number,
  endMinute: number,
  memberId = 'ada',
): Shift {
  return { id, memberId, weekday, startMinute, endMinute }
}

describe('scheduler rest warning', () => {
  let store: ReturnType<typeof useSchedulerStore>
  let workspace: ReturnType<typeof useWorkspaceStore>

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    store = useSchedulerStore()
    workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey(WEEK)
    workspace.setMembers([makeMember({ id: 'ada', name: 'Ada' }), makeMember({ id: 'bo', name: 'Bo' })])
  })

  function seed(weekKey: string, shifts: Shift[]): void {
    workspace.setShiftsForWeek(weekKey, shifts)
  }

  it('warns and defers the change when the previous shift leaves less than twelve hours', () => {
    const previous = makeShift('previous', 'sunday', 1260, 1500)
    seed(PREV_WEEK, [previous])

    const added = store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 780 })

    expect(added).toBeNull()
    expect(store.currentWeekShifts).toEqual([])
    expect(store.pendingRestWarning).not.toBeNull()
    expect(store.pendingRestWarning?.memberName).toBe('Ada')
    expect(store.pendingRestWarning?.conflicts[0]).toMatchObject({
      shift: previous,
      weekKey: PREV_WEEK,
      restMinutes: 480,
    })
    expect(store.error).toBeNull()

    store.confirmRestWarning()

    expect(store.pendingRestWarning).toBeNull()
    expect(store.currentWeekShifts).toHaveLength(1)
    expect(store.currentWeekShifts[0]).toMatchObject({ startMinute: 540, endMinute: 780 })
  })

  it('discards the planned change when the warning is cancelled', () => {
    seed(PREV_WEEK, [makeShift('previous', 'sunday', 1260, 1500)])

    store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 780 })
    store.cancelRestWarning()

    expect(store.pendingRestWarning).toBeNull()
    expect(store.currentWeekShifts).toEqual([])
    expect(store.error).toBeNull()
  })

  it('commits immediately when the rest is exactly twelve hours', () => {
    seed(PREV_WEEK, [makeShift('previous', 'sunday', 540, 1260)])

    const added = store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 780 })

    expect(added).not.toBeNull()
    expect(store.pendingRestWarning).toBeNull()
    expect(store.currentWeekShifts).toHaveLength(1)
  })

  it('does not warn for same-day split shifts', () => {
    seed(WEEK, [makeShift('early', 'monday', 540, 780)])

    const added = store.addShiftRange({ memberId: 'ada', startMinute: 1260, endMinute: 1500 })

    expect(added).not.toBeNull()
    expect(store.pendingRestWarning).toBeNull()
    expect(store.currentWeekShifts).toHaveLength(2)
  })

  it('ignores shifts of other employees', () => {
    seed(PREV_WEEK, [makeShift('previous', 'sunday', 1260, 1500, 'bo')])

    const added = store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 780 })

    expect(added).not.toBeNull()
    expect(store.pendingRestWarning).toBeNull()
  })

  it('warns when resizing a shift into the next week', () => {
    const sunday = makeShift('sunday', 'sunday', 1200, 1320)
    seed(WEEK, [sunday])
    seed(NEXT_WEEK, [makeShift('monday', 'monday', 540, 780)])

    const resized = store.updateShiftRange({ id: sunday.id, startMinute: 1200, endMinute: 1500 })

    expect(resized).toBeNull()
    expect(store.currentWeekShifts).toEqual([sunday])
    expect(store.pendingRestWarning?.conflicts[0]).toMatchObject({
      shift: expect.objectContaining({ id: 'monday' }),
      weekKey: NEXT_WEEK,
      restMinutes: 480,
    })

    store.confirmRestWarning()

    expect(store.currentWeekShifts).toHaveLength(1)
    expect(store.currentWeekShifts[0]).toMatchObject({ startMinute: 1200, endMinute: 1500 })
  })

  it('warns when moving a shift to another employee', () => {
    const source = makeShift('source', 'monday', 540, 780)
    seed(WEEK, [source])
    seed(PREV_WEEK, [makeShift('previous', 'sunday', 1260, 1500, 'bo')])

    const moved = store.moveShiftToMember({
      id: source.id,
      memberId: 'bo',
      startMinute: 540,
      endMinute: 780,
    })

    expect(moved).toBeNull()
    expect(store.currentWeekShifts).toEqual([source])
    expect(store.pendingRestWarning?.memberId).toBe('bo')

    store.confirmRestWarning()

    expect(store.currentWeekShifts).toHaveLength(1)
    expect(store.currentWeekShifts[0]).toMatchObject({ id: source.id, memberId: 'bo' })
  })

  it('warns against the merged range, not the original shift', () => {
    const existing = makeShift('existing', 'monday', 1200, 1320)
    const tuesday = makeShift('tuesday', 'tuesday', 540, 780)
    seed(WEEK, [existing, tuesday])

    const merged = store.addShiftRange({ memberId: 'ada', startMinute: 1260, endMinute: 1380 })

    expect(merged).toBeNull()
    expect(store.currentWeekShifts).toEqual([existing, tuesday])
    expect(store.pendingRestWarning?.candidate).toMatchObject({ startMinute: 1200, endMinute: 1380 })

    store.confirmRestWarning()

    expect(store.currentWeekShifts).toHaveLength(2)
    expect(store.currentWeekShifts.find((shift) => shift.weekday === 'monday')).toMatchObject({
      startMinute: 1200,
      endMinute: 1380,
    })
  })

  it('warns for the relocated shift when the row is at the shift cap', () => {
    const first = makeShift('first', 'monday', 540, 600)
    const second = makeShift('second', 'monday', 720, 780)
    seed(WEEK, [first, second])
    seed(PREV_WEEK, [makeShift('previous', 'sunday', 1260, 1500)])

    const relocated = store.addShiftRange({ memberId: 'ada', startMinute: 660, endMinute: 720 })

    expect(relocated).toBeNull()
    expect(store.currentWeekShifts).toEqual([first, second])
    expect(store.pendingRestWarning?.candidate).toMatchObject({ id: 'second' })

    store.confirmRestWarning()

    expect(store.currentWeekShifts).toHaveLength(2)
    expect(store.currentWeekShifts.find((shift) => shift.id === 'second')).toMatchObject({
      startMinute: 660,
      endMinute: 720,
    })
  })

  it('applies the string update path through the same warning', () => {
    const monday = makeShift('monday', 'monday', 720, 960)
    seed(WEEK, [monday])
    seed(PREV_WEEK, [makeShift('previous', 'sunday', 1260, 1380)])

    store.updateShift(monday.id, { start: '09:00' })

    expect(store.pendingRestWarning).not.toBeNull()
    expect(store.currentWeekShifts[0]).toMatchObject({ startMinute: 720, endMinute: 960 })

    store.confirmRestWarning()

    expect(store.currentWeekShifts[0]).toMatchObject({ startMinute: 540, endMinute: 960 })
  })

  it('clears a pending warning when navigating weeks', () => {
    seed(PREV_WEEK, [makeShift('previous', 'sunday', 1260, 1500)])
    store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 780 })
    expect(store.pendingRestWarning).not.toBeNull()

    store.goToNextWeek()

    expect(store.pendingRestWarning).toBeNull()
    expect(store.currentWeekShifts).toEqual([])
  })

  it('clears a pending warning when resetting the week', () => {
    seed(PREV_WEEK, [makeShift('previous', 'sunday', 1260, 1500)])
    store.addShiftRange({ memberId: 'ada', startMinute: 540, endMinute: 780 })

    store.resetCurrentWeek()

    expect(store.pendingRestWarning).toBeNull()
  })

  it('treats confirm and cancel without a pending warning as no-ops', () => {
    seed(WEEK, [makeShift('monday', 'monday', 540, 780)])

    store.confirmRestWarning()
    store.cancelRestWarning()

    expect(store.currentWeekShifts).toHaveLength(1)
    expect(store.pendingRestWarning).toBeNull()
  })
})
