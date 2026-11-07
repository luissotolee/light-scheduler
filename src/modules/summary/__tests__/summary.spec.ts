import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSummaryStore } from '@/modules/summary/stores/summary'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { Shift } from '@/types'

const shifts: Shift[] = [
  {
    id: 'shift-1',
    memberId: 'member-1',
    weekday: 'monday',
    startMinute: 540,
    endMinute: 720,
  },
  {
    id: 'shift-2',
    memberId: 'member-1',
    weekday: 'tuesday',
    startMinute: 540,
    endMinute: 720,
  },
  {
    id: 'shift-3',
    memberId: 'member-2',
    weekday: 'monday',
    startMinute: 780,
    endMinute: 900,
  },
]

describe('summary store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts empty for the current week', () => {
    const store = useSummaryStore()
    const workspace = useWorkspaceStore()

    expect(store.currentWeekKey).toBe(workspace.currentWeekKey)
    expect(store.weekShifts).toEqual([])
    expect(store.totalShifts).toBe(0)
    expect(store.assignedMemberCount).toBe(0)
  })

  it('summarizes the selected week', () => {
    const store = useSummaryStore()
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([
      {
        id: 'member-1',
        name: 'Ada',
        duty: 'employee',
        contract: 'fulltime',
        weeklyHours: 40,
        holidays: [],
      },
      {
        id: 'member-2',
        name: 'Bo',
        duty: 'employee',
        contract: 'part_time',
        weeklyHours: 20,
        holidays: [],
      },
    ])
    workspace.setShiftsForWeek('2026-11-02', shifts)

    expect(store.weekRangeLabel).toBe('Nov 2 – Nov 8, 2026')
    expect(store.totalShifts).toBe(3)
    expect(store.assignedMemberCount).toBe(2)
  })

  it('resolves member names and labels unknown members', () => {
    const store = useSummaryStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([
      {
        id: 'member-1',
        name: 'Ada',
        duty: 'manager',
        contract: 'fulltime',
        weeklyHours: 40,
        holidays: [],
      },
    ])

    expect(store.memberNameOf('member-1')).toBe('Ada')
    expect(store.memberNameOf('missing')).toBe('Unknown member')
  })
})
