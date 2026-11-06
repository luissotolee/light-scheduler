import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEmployeesStore } from '@/stores/employees'
import { useWorkspaceStore } from '@/stores/workspace'
import type { TeamMember } from '@/types'

const ada: TeamMember = { id: 'member-1', name: 'Ada', email: 'ada@example.com' }
const bo: TeamMember = { id: 'member-2', name: 'Bo' }

describe('employees store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with no employees and an idle status', () => {
    const store = useEmployeesStore()

    expect(store.search).toBe('')
    expect(store.selectedId).toBeNull()
    expect(store.status).toEqual({ loading: false, error: null })
    expect(store.count).toBe(0)
    expect(store.filteredMembers).toEqual([])
    expect(store.selectedMember).toBeNull()
  })

  it('adds a trimmed member without an empty email', () => {
    const store = useEmployeesStore()

    const added = store.addMember({ name: '  Ada  ', email: '  ' })

    expect(added?.name).toBe('Ada')
    expect(added?.email).toBeUndefined()
    expect(added?.id).toBeTruthy()
    expect(store.count).toBe(1)
    expect(store.status).toEqual({ loading: false, error: null })
  })

  it('adds an email when provided', () => {
    const store = useEmployeesStore()

    const added = store.addMember({ name: 'Ada', email: ' ada@example.com ' })

    expect(added?.email).toBe('ada@example.com')
  })

  it('rejects a blank name', () => {
    const store = useEmployeesStore()

    expect(store.addMember({ name: '   ' })).toBeNull()
    expect(store.count).toBe(0)
    expect(store.status.error).toBe('Name is required')
  })

  it('updates a member with trimmed values', () => {
    const store = useEmployeesStore()
    store.addMember({ name: 'Ada', email: 'ada@example.com' })
    const id = store.filteredMembers[0].id

    store.updateMember(id, { name: '  Ada Lovelace  ', email: ' ' })

    expect(store.filteredMembers[0]).toEqual({ id, name: 'Ada Lovelace' })
    expect(store.status.error).toBeNull()
  })

  it('keeps the existing email when the patch omits it', () => {
    const store = useEmployeesStore()
    store.addMember({ name: 'Ada', email: 'ada@example.com' })
    const id = store.filteredMembers[0].id

    store.updateMember(id, { name: 'Ada Lovelace' })

    expect(store.filteredMembers[0].email).toBe('ada@example.com')
  })

  it('rejects a blank update name', () => {
    const store = useEmployeesStore()
    store.addMember({ name: 'Ada' })
    const id = store.filteredMembers[0].id

    store.updateMember(id, { name: '   ' })

    expect(store.filteredMembers[0].name).toBe('Ada')
    expect(store.status.error).toBe('Name is required')
  })

  it('ignores updates for unknown ids', () => {
    const store = useEmployeesStore()
    store.addMember({ name: 'Ada' })

    store.updateMember('missing', { name: 'Nobody' })

    expect(store.filteredMembers[0].name).toBe('Ada')
    expect(store.status.error).toBeNull()
  })

  it('removes a member and clears a matching selection', () => {
    const store = useEmployeesStore()
    store.addMember({ name: 'Ada' })
    const id = store.filteredMembers[0].id
    store.select(id)

    store.removeMember(id)

    expect(store.count).toBe(0)
    expect(store.selectedId).toBeNull()
  })

  it('keeps an unrelated selection when removing another member', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    store.select(ada.id)

    store.removeMember(bo.id)

    expect(store.selectedId).toBe(ada.id)
  })

  it('filters members case-insensitively by name or email', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])

    store.setSearch('ADA')
    expect(store.filteredMembers).toEqual([ada])

    store.setSearch('ada@example.com')
    expect(store.filteredMembers).toEqual([ada])

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
