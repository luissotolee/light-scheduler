import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEmployeesStore } from '@/modules/employees/stores/employees'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { Shift, SickLeave, TeamMember } from '@/types'

const ada: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
  name: 'Ada',
  duty: 'manager',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [{ year: 2026, week: 10 }],
  email: 'ada@example.com',
  phone: '+1 555 010 0000',
  comment: 'No morning shifts',
  active: true,
  startDate: '2025-01-15',
}
const bo: TeamMember = {
  id: 'member-2',
  empId: 'EMP-0002',
  name: 'Bo',
  duty: 'employee',
  contract: 'part_time',
  weeklyHours: 20,
  holidays: [],
  active: true,
  startDate: '2026-02-01',
}

describe('employees store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with no employees, idle status, and closed dialogs', () => {
    const store = useEmployeesStore()

    expect(store.search).toBe('')
    expect(store.selectedId).toBeNull()
    expect(store.status).toEqual({ loading: false, error: null })
    expect(store.formVisible).toBe(false)
    expect(store.editingId).toBeNull()
    expect(store.holidayVisible).toBe(false)
    expect(store.holidayTargetId).toBeNull()
    expect(store.sicknessVisible).toBe(false)
    expect(store.sicknessTargetId).toBeNull()
    expect(store.confirmVisible).toBe(false)
    expect(store.pendingAction).toBeNull()
    expect(store.detailsVisible).toBe(false)
    expect(store.detailsTargetId).toBeNull()
    expect(store.manageVisible).toBe(false)
    expect(store.manageTargetId).toBeNull()
    expect(store.count).toBe(0)
    expect(store.filteredMembers).toEqual([])
    expect(store.selectedMember).toBeNull()
    expect(store.editingMember).toBeNull()
    expect(store.holidayTarget).toBeNull()
    expect(store.sicknessTarget).toBeNull()
    expect(store.detailsTarget).toBeNull()
    expect(store.manageTarget).toBeNull()
    expect(store.hideInactive).toBe(false)
    expect(store.exportVisible).toBe(false)
  })

  it('opens and closes the manage dialog for an existing member', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.openManage(ada.id)

    expect(store.manageVisible).toBe(true)
    expect(store.manageTargetId).toBe(ada.id)
    expect(store.manageTarget).toEqual(ada)

    store.closeManage()

    expect(store.manageVisible).toBe(false)
    expect(store.manageTargetId).toBeNull()
    expect(store.manageTarget).toBeNull()
  })

  it('ignores an unknown member when opening the manage dialog', () => {
    const store = useEmployeesStore()

    store.openManage('missing')

    expect(store.manageVisible).toBe(false)
    expect(store.manageTargetId).toBeNull()
  })

  it('closes the manage dialog when the managed member is removed', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    store.openManage(ada.id)

    store.removeMember(ada.id)

    expect(store.manageVisible).toBe(false)
    expect(store.manageTargetId).toBeNull()
  })

  it('keeps the manage dialog open when another member is removed', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    store.openManage(ada.id)

    store.removeMember(bo.id)

    expect(store.manageVisible).toBe(true)
    expect(store.manageTargetId).toBe(ada.id)
  })

  it('closes the manage dialog when the UI resets', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    store.openManage(ada.id)

    store.resetUi()

    expect(store.manageVisible).toBe(false)
    expect(store.manageTargetId).toBeNull()
  })

  it('opens and closes the holiday export dialog', () => {
    const store = useEmployeesStore()

    expect(store.exportVisible).toBe(false)

    store.openExport()
    expect(store.exportVisible).toBe(true)

    store.closeExport()
    expect(store.exportVisible).toBe(false)
  })

  it('closes the holiday export dialog when the UI resets', () => {
    const store = useEmployeesStore()

    store.openExport()
    store.resetUi()

    expect(store.exportVisible).toBe(false)
  })

  it('hides inactive employees when setHideInactive is called', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([
      { ...ada, active: false, endDate: '2026-11-01' },
      { ...bo, active: true },
    ])

    expect(store.filteredMembers).toHaveLength(2)

    store.setHideInactive(true)
    expect(store.hideInactive).toBe(true)
    expect(store.filteredMembers).toHaveLength(1)
    expect(store.filteredMembers[0].id).toBe(bo.id)
  })

  it('restores all employees when setHideInactive is called with false', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([
      { ...ada, active: false, endDate: '2026-11-01' },
      { ...bo, active: true },
    ])

    store.setHideInactive(true)
    expect(store.filteredMembers).toHaveLength(1)

    store.setHideInactive(false)
    expect(store.hideInactive).toBe(false)
    expect(store.filteredMembers).toHaveLength(2)
  })

  it('search and hideInactive compose correctly', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([
      { ...ada, active: false, endDate: '2026-11-01' },
      { ...bo, active: true },
      { id: 'member-3', empId: 'EMP-0003', name: 'Cara', duty: 'assistant', contract: 'weekends', weeklyHours: 12, holidays: [], active: false, endDate: '2026-10-01', startDate: '2025-01-01' },
    ])

    store.setHideInactive(true)
    expect(store.filteredMembers).toHaveLength(1)

    store.setSearch('Cara')
    expect(store.filteredMembers).toHaveLength(0)

    store.setSearch('')
    expect(store.filteredMembers).toHaveLength(1)
  })

  it('resetUi clears hideInactive', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.setHideInactive(true)
    expect(store.hideInactive).toBe(true)

    store.loadMembers([ada])
    expect(store.hideInactive).toBe(false)
  })

  it('keeps an unrelated selection when removing another member', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    store.select(ada.id)

    store.removeMember(bo.id)

    expect(store.selectedId).toBe(ada.id)
  })

  it('filters members case-insensitively by name only', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])

    store.setSearch('ADA')
    expect(store.filteredMembers).toEqual([ada])

    store.setSearch('ada@example.com')
    expect(store.filteredMembers).toEqual([])

    store.setSearch('zzz')
    expect(store.filteredMembers).toEqual([])

    store.setSearch('   ')
    expect(store.filteredMembers).toEqual([ada, bo])
  })

  it('selects a member and exposes it', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.select(ada.id)
    expect(store.selectedMember).toEqual(ada)

    store.select(null)
    expect(store.selectedMember).toBeNull()
  })

  it('returns null for a selected member that no longer exists', () => {
    const store = useEmployeesStore()

    store.select('missing')

    expect(store.selectedMember).toBeNull()
  })

  it('stores the contract hours period when adding and updating a member', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()

    const added = store.addMember({
      name: 'Mia Monthly',
      duty: 'employee',
      contract: 'part_time',
      weeklyHours: 160,
      contractHoursPeriod: 'month',
    })

    expect(added?.contractHoursPeriod).toBe('month')
    expect(added?.weeklyHours).toBe(160)

    expect(
      store.updateMember(added?.id ?? '', {
        weeklyHours: 120,
        contractHoursPeriod: 'year',
      }),
    ).toBe(true)

    const stored = workspace.findMember(added?.id ?? '')
    expect(stored?.weeklyHours).toBe(120)
    expect(stored?.contractHoursPeriod).toBe('year')
  })

  it('opens and closes the sick leave dialog for an existing member', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.openSickness(ada.id)

    expect(store.sicknessVisible).toBe(true)
    expect(store.sicknessTargetId).toBe(ada.id)
    expect(store.sicknessTarget).toEqual(ada)

    store.closeSickness()

    expect(store.sicknessVisible).toBe(false)
    expect(store.sicknessTargetId).toBeNull()
    expect(store.sicknessTarget).toBeNull()
  })

  it('ignores an unknown member and closes sickness on UI reset and removal', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.openSickness('missing')
    expect(store.sicknessVisible).toBe(false)

    store.openSickness(ada.id)
    store.removeMember(ada.id)
    expect(store.sicknessVisible).toBe(false)

    workspace.setMembers([ada])
    store.openSickness(ada.id)
    store.resetUi()
    expect(store.sicknessVisible).toBe(false)
  })

  it('saves sick leave ranges and keeps unrelated fields', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.setSickLeaves(ada.id, [
      { id: 'sick-b', startDate: '2026-12-01', endDate: '2026-12-02' },
      { id: 'sick-a', startDate: '2026-11-04', endDate: '2026-11-06' },
    ])

    const stored = workspace.findMember(ada.id)
    expect(stored?.sickLeaves).toEqual([
      { id: 'sick-a', startDate: '2026-11-04', endDate: '2026-11-06' },
      { id: 'sick-b', startDate: '2026-12-01', endDate: '2026-12-02' },
    ])
    expect(stored?.name).toBe(ada.name)
    expect(stored?.holidays).toEqual(ada.holidays)
  })

  it('asks for confirmation and removes shifts that fall inside the sick range', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    const mondayShift: Shift = {
      id: 'monday',
      memberId: ada.id,
      weekday: 'monday',
      startMinute: 540,
      endMinute: 600,
    }
    const thursdayShift: Shift = {
      id: 'thursday',
      memberId: ada.id,
      weekday: 'thursday',
      startMinute: 540,
      endMinute: 600,
    }
    const otherShift: Shift = {
      id: 'other',
      memberId: bo.id,
      weekday: 'thursday',
      startMinute: 540,
      endMinute: 600,
    }
    workspace.setMembers([ada, bo])
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setShiftsForWeek('2026-11-02', [mondayShift, thursdayShift, otherShift])

    const leaves: SickLeave[] = [{ id: 'sick', startDate: '2026-11-05', endDate: '2026-11-05' }]
    store.requestSetSickLeaves(ada.id, leaves)

    expect(store.confirmVisible).toBe(true)
    expect(store.pendingAction).toMatchObject({ kind: 'sickness', id: ada.id })
    expect(workspace.schedules['2026-11-02']).toHaveLength(3)

    store.confirmAction()

    expect(workspace.findMember(ada.id)?.sickLeaves).toEqual(leaves)
    expect(workspace.schedules['2026-11-02']).toEqual([mondayShift, otherShift])
    expect(store.confirmVisible).toBe(false)
  })

  it('saves a sick range without confirmation when no shifts fall inside it', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.requestSetSickLeaves(ada.id, [
      { id: 'sick', startDate: '2026-11-05', endDate: '2026-11-05' },
    ])

    expect(store.confirmVisible).toBe(false)
    expect(workspace.findMember(ada.id)?.sickLeaves).toHaveLength(1)
  })

  it('adds new members with an empty sick leave list and preserves it on edit', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()

    const added = store.addMember({
      name: 'Mia',
      duty: 'employee',
      contract: 'fulltime',
      weeklyHours: 40,
    })

    expect(added?.sickLeaves).toEqual([])

    store.setSickLeaves(added!.id, [
      { id: 'sick', startDate: '2026-11-05', endDate: '2026-11-05' },
    ])
    expect(store.updateMember(added!.id, { name: 'Mia Updated' })).toBe(true)

    const stored = workspace.findMember(added!.id)
    expect(stored?.name).toBe('Mia Updated')
    expect(stored?.sickLeaves).toEqual([
      { id: 'sick', startDate: '2026-11-05', endDate: '2026-11-05' },
    ])
  })

  it('preserves sick leave when reactivating a member', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    const leaves: SickLeave[] = [{ id: 'sick', startDate: '2026-11-05', endDate: '2026-11-05' }]
    workspace.setMembers([
      { ...bo, sickLeaves: leaves, active: false, endDate: '2026-11-01' },
    ])

    store.reactivateMember(bo.id)

    expect(workspace.findMember(bo.id)?.sickLeaves).toEqual(leaves)
  })

  it('preserves the contract hours period when reactivating a member', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([
      {
        ...bo,
        weeklyHours: 1900,
        contractHoursPeriod: 'year',
        active: false,
        endDate: '2026-11-01',
      },
    ])

    store.reactivateMember(bo.id)

    expect(workspace.findMember(bo.id)?.contractHoursPeriod).toBe('year')
    expect(workspace.findMember(bo.id)?.weeklyHours).toBe(1900)
  })
})