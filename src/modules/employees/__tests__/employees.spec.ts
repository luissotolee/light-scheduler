import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEmployeesStore } from '@/modules/employees/stores/employees'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { TeamMember } from '@/types'

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
    expect(store.detailsTarget).toBeNull()
    expect(store.manageTarget).toBeNull()
    expect(store.hideInactive).toBe(false)
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
})