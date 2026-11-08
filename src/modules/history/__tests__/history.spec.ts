import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useHistoryStore } from '@/modules/history/stores/history'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { Shift } from '@/types'

const shift: Shift = {
  id: 'shift-1',
  memberId: 'member-1',
  weekday: 'monday',
  startMinute: 540,
  endMinute: 720,
}

describe('history store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with the current week available and nothing selected', () => {
    const store = useHistoryStore()
    const workspace = useWorkspaceStore()

    expect(store.selectedWeekKey).toBeNull()
    expect(store.availableWeeks).toEqual([workspace.currentWeekKey])
    expect(store.selectedWeekShifts).toEqual([])
    expect(store.archivedCount).toBe(0)
  })

  it('sorts archived weeks together with the current week', () => {
    const store = useHistoryStore()
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-09')
    workspace.setShiftsForWeek('2026-10-26', [shift])
    workspace.setShiftsForWeek('2026-11-02', [])

    expect(store.availableWeeks).toEqual(['2026-10-26', '2026-11-02', '2026-11-09'])
    expect(store.archivedCount).toBe(2)
  })

  it('selects a week and exposes its shifts', () => {
    const store = useHistoryStore()
    const workspace = useWorkspaceStore()
    workspace.setShiftsForWeek('2026-11-02', [shift])

    store.selectWeek('2026-11-02')
    expect(store.selectedWeekShifts).toEqual([shift])

    store.selectWeek('2026-12-07')
    expect(store.selectedWeekShifts).toEqual([])

    store.selectWeek(null)
    expect(store.selectedWeekShifts).toEqual([])
  })
})
