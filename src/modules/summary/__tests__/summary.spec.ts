import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSummaryStore } from '@/modules/summary/stores/summary'
import { useLocaleStore } from '@/shared/stores/locale'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { Shift, TeamMember } from '@/types'
import { getWeekKey } from '@/shared/utils/calendar'

const weekKey = '2026-11-02'

const ada: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
  name: 'Ada',
  duty: 'employee',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [],
  active: true,
  startDate: '2025-01-01',
}

const mondayShift: Shift = {
  id: 'shift-1',
  memberId: 'member-1',
  weekday: 'monday',
  startMinute: 540,
  endMinute: 720,
}

describe('useSummaryStore', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
    setActivePinia(createPinia())
  })

  function seed() {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    workspace.setCurrentWeekKey(weekKey)
    workspace.setShiftsForWeek(weekKey, [mondayShift])
    return workspace
  }

  it('mirrors the shared workspace week', () => {
    const workspace = seed()
    const store = useSummaryStore()

    expect(store.currentWeekKey).toBe(weekKey)
    workspace.setCurrentWeekKey('2026-11-09')
    expect(store.currentWeekKey).toBe('2026-11-09')
  })

  it('builds day headers for the selected week', () => {
    seed()
    const store = useSummaryStore()

    expect(store.dayHeaders).toEqual([
      { weekday: 'monday', dayOfMonth: 2 },
      { weekday: 'tuesday', dayOfMonth: 3 },
      { weekday: 'wednesday', dayOfMonth: 4 },
      { weekday: 'thursday', dayOfMonth: 5 },
      { weekday: 'friday', dayOfMonth: 6 },
      { weekday: 'saturday', dayOfMonth: 7 },
      { weekday: 'sunday', dayOfMonth: 8 },
    ])
  })

  it('derives rows from workspace members, shifts and days off', () => {
    seed()
    const store = useSummaryStore()

    expect(store.rows).toHaveLength(1)
    expect(store.rows[0].memberId).toBe('member-1')
    expect(store.rows[0].cells.monday).toEqual({
      kind: 'shifts',
      shifts: [{ id: 'shift-1', startMinute: 540, endMinute: 720, label: '09:00–12:00' }],
    })
    expect(store.rows[0].cells.tuesday).toEqual({ kind: 'off' })
  })

  it('moves the shared week backwards and forwards', () => {
    const workspace = seed()
    const store = useSummaryStore()

    store.goToNextWeek()
    expect(workspace.currentWeekKey).toBe('2026-11-09')

    store.goToPreviousWeek()
    expect(workspace.currentWeekKey).toBe(weekKey)
  })

  it('returns to the current week', () => {
    const workspace = seed()
    const store = useSummaryStore()

    store.goToNextWeek()
    store.goToCurrentWeek()

    expect(workspace.currentWeekKey).toBe(getWeekKey(new Date()))
  })

  it('localizes the week range live', async () => {
    seed()
    const store = useSummaryStore()

    expect(store.weekRangeLabel).toBe('Nov 2 – Nov 8, 2026')

    useLocaleStore().setLocale('es')
    expect(store.weekRangeLabel).toBe('2 nov – 8 nov, 2026')
  })

  it('uses full zoom for a small roster', () => {
    seed()
    const store = useSummaryStore()

    expect(store.printZoom).toBe(1)
  })

  it('reduces zoom for a large roster', () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers(
      Array.from({ length: 61 }, (_, index) => ({
        ...ada,
        id: `member-${index}`,
        name: `Member ${String(index).padStart(2, '0')}`,
      })),
    )
    workspace.setCurrentWeekKey(weekKey)
    workspace.setShiftsForWeek(
      weekKey,
      Array.from({ length: 61 }, (_, index) => ({
        ...mondayShift,
        id: `shift-${index}`,
        memberId: `member-${index}`,
      })),
    )

    const store = useSummaryStore()

    expect(store.printZoom).toBe(0.5)
  })
})
