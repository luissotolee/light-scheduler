import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEmployeesStore } from '@/modules/employees/stores/employees'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { HolidayWeek, NewTeamMember, TeamMember } from '@/types'
import { WEEKLY_HOURS_ERROR } from '@/shared/utils/employee'

const ada: TeamMember = {
  id: 'member-1',
  name: 'Ada',
  duty: 'manager',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [{ year: 2026, week: 10 }],
  email: 'ada@example.com',
  phone: '+1 555 010 0000',
}
const bo: TeamMember = {
  id: 'member-2',
  name: 'Bo',
  duty: 'employee',
  contract: 'part_time',
  weeklyHours: 20,
  holidays: [],
}

const basePayload: NewTeamMember = {
  name: 'Ada',
  duty: 'employee',
  contract: 'fulltime',
  weeklyHours: 40,
  phone: '+1 555 010 0000',
}

describe('employees store', () => {
  beforeEach(() => {
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
    expect(store.count).toBe(0)
    expect(store.filteredMembers).toEqual([])
    expect(store.selectedMember).toBeNull()
    expect(store.editingMember).toBeNull()
    expect(store.holidayTarget).toBeNull()
  })

  it('adds a trimmed member with normalized holidays and no empty email', () => {
    const store = useEmployeesStore()

    const added = store.addMember({
      ...basePayload,
      name: '  Ada  ',
      email: '  ',
      holidays: [
        { year: 2026, week: 12 },
        { year: 2026, week: 10 },
        { year: 2026, week: 12 },
      ],
    })

    expect(added?.name).toBe('Ada')
    expect(added?.email).toBeUndefined()
    expect(added?.phone).toBe('+1 555 010 0000')
    expect(added?.id).toBeTruthy()
    expect(added?.duty).toBe('employee')
    expect(added?.contract).toBe('fulltime')
    expect(added?.weeklyHours).toBe(40)
    expect(added?.holidays).toEqual([
      { year: 2026, week: 10 },
      { year: 2026, week: 12 },
    ])
    expect(store.count).toBe(1)
    expect(store.status).toEqual({ loading: false, error: null })
  })

  it('adds an email when provided and defaults holidays to empty', () => {
    const store = useEmployeesStore()

    const added = store.addMember({ ...basePayload, email: ' ada@example.com ' })

    expect(added?.email).toBe('ada@example.com')
    expect(added?.holidays).toEqual([])
  })

  it('stores empty phone and email as absent values', () => {
    const store = useEmployeesStore()

    const added = store.addMember({ ...basePayload, phone: '', email: '' })

    expect(added?.phone).toBeUndefined()
    expect(added?.email).toBeUndefined()
    expect(store.filteredMembers[0].phone).toBeUndefined()
    expect(store.filteredMembers[0].email).toBeUndefined()
    expect(store.status.error).toBeNull()
  })

  it('rejects a blank name', () => {
    const store = useEmployeesStore()

    expect(store.addMember({ ...basePayload, name: '   ' })).toBeNull()
    expect(store.count).toBe(0)
    expect(store.status.error).toBe('Name is required')
  })

  it('adds a member without a phone and validates the format when provided', () => {
    const store = useEmployeesStore()

    const withoutPhone = store.addMember({ ...basePayload, phone: undefined })
    expect(withoutPhone?.phone).toBeUndefined()
    expect(store.status.error).toBeNull()

    const withBlankPhone = store.addMember({ ...basePayload, phone: '   ' })
    expect(withBlankPhone?.phone).toBeUndefined()

    expect(store.addMember({ ...basePayload, phone: '123' })).toBeNull()
    expect(store.status.error).toBe('Phone is invalid')

    expect(store.count).toBe(2)
  })

  it('rejects an invalid email when one is provided', () => {
    const store = useEmployeesStore()

    expect(store.addMember({ ...basePayload, email: 'not-an-email' })).toBeNull()
    expect(store.status.error).toBe('Email is invalid')
    expect(store.count).toBe(0)
  })

  it('rejects invalid duty and contract values', () => {
    const store = useEmployeesStore()

    // @ts-expect-error runtime guard for invalid input
    expect(store.addMember({ ...basePayload, duty: 'chef' })).toBeNull()
    expect(store.status.error).toBe('Duty is invalid')

    // @ts-expect-error runtime guard for invalid input
    expect(store.addMember({ ...basePayload, contract: 'contractor' })).toBeNull()
    expect(store.status.error).toBe('Contract is invalid')
    expect(store.count).toBe(0)
  })

  it('rejects weekly hours outside 1..168', () => {
    const store = useEmployeesStore()

    for (const weeklyHours of [0, -1, 169, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(store.addMember({ ...basePayload, weeklyHours })).toBeNull()
      expect(store.status.error).toBe(WEEKLY_HOURS_ERROR)
    }

    expect(store.addMember({ ...basePayload, weeklyHours: 168 })).not.toBeNull()
  })

  it('rejects more than six holiday weeks', () => {
    const store = useEmployeesStore()
    const holidays: HolidayWeek[] = Array.from({ length: 7 }, (_, index) => ({
      year: 2026,
      week: index + 1,
    }))

    expect(store.addMember({ ...basePayload, holidays })).toBeNull()
    expect(store.status.error).toBe('At most 6 holiday weeks are allowed')
    expect(store.count).toBe(0)
  })

  it('updates a member and preserves holidays when the patch omits them', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.updateMember(ada.id, { name: '  Ada Lovelace  ', email: ' ' })

    expect(store.filteredMembers[0]).toEqual({
      id: ada.id,
      name: 'Ada Lovelace',
      duty: 'manager',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [{ year: 2026, week: 10 }],
      phone: '+1 555 010 0000',
    })
    expect(store.status.error).toBeNull()
  })

  it('updates every editable field and normalizes holiday patches', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.updateMember(ada.id, {
      duty: 'assistant',
      contract: 'weekends',
      weeklyHours: 16,
      holidays: [
        { year: 2027, week: 2 },
        { year: 2026, week: 50 },
      ],
    })

    expect(store.filteredMembers[0]).toMatchObject({
      duty: 'assistant',
      contract: 'weekends',
      weeklyHours: 16,
      holidays: [
        { year: 2026, week: 50 },
        { year: 2027, week: 2 },
      ],
    })
  })

  it('rejects invalid updates without changing the member', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.updateMember(ada.id, { name: '   ' })
    expect(store.status.error).toBe('Name is required')

    // @ts-expect-error runtime guard for invalid input
    store.updateMember(ada.id, { duty: 'chef' })
    expect(store.status.error).toBe('Duty is invalid')

    // @ts-expect-error runtime guard for invalid input
    store.updateMember(ada.id, { contract: 'contractor' })
    expect(store.status.error).toBe('Contract is invalid')

    store.updateMember(ada.id, { weeklyHours: 0 })
    expect(store.status.error).toBe(WEEKLY_HOURS_ERROR)

    expect(store.filteredMembers[0]).toEqual(ada)
  })

  it('validates phone and email formats on update', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.updateMember(ada.id, { phone: '123' })
    expect(store.status.error).toBe('Phone is invalid')

    store.updateMember(ada.id, { email: 'not-an-email' })
    expect(store.status.error).toBe('Email is invalid')

    expect(store.filteredMembers[0]).toEqual(ada)
  })

  it('preserves the existing phone when an update omits it', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.updateMember(ada.id, { name: 'Ada Lovelace' })

    expect(store.status.error).toBeNull()
    expect(store.filteredMembers[0]).toMatchObject({
      name: 'Ada Lovelace',
      phone: ada.phone,
    })
  })

  it('removes the existing phone when an update provides a blank value', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.updateMember(ada.id, { phone: '   ' })

    expect(store.status.error).toBeNull()
    expect(store.filteredMembers[0].phone).toBeUndefined()
  })

  it('removes the existing email when an update provides a blank value', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.updateMember(ada.id, { email: '' })

    expect(store.status.error).toBeNull()
    expect(store.filteredMembers[0].email).toBeUndefined()
  })

  it('updates a legacy member without a phone', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([bo])

    store.updateMember(bo.id, { name: 'Bo Builder' })

    expect(store.status.error).toBeNull()
    expect(store.filteredMembers[0]).toMatchObject({ name: 'Bo Builder' })
    expect(store.filteredMembers[0].phone).toBeUndefined()
  })

  it('rejects updates with more than six holiday weeks', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const holidays = Array.from({ length: 7 }, (_, index) => ({
      year: 2026,
      week: index + 1,
    }))

    store.updateMember(ada.id, { holidays })

    expect(store.status.error).toBe('At most 6 holiday weeks are allowed')
    expect(store.filteredMembers[0].holidays).toEqual(ada.holidays)
  })

  it('ignores updates for unknown ids', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.updateMember('missing', { name: 'Nobody' })

    expect(store.filteredMembers[0].name).toBe('Ada')
    expect(store.status.error).toBeNull()
  })

  it('sets normalized holidays and enforces the limit', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.setHolidays(ada.id, [
      { year: 2026, week: 12 },
      { year: 2025, week: 1 },
      { year: 2026, week: 12 },
    ])

    expect(store.filteredMembers[0].holidays).toEqual([
      { year: 2025, week: 1 },
      { year: 2026, week: 12 },
    ])
    expect(store.status.error).toBeNull()

    store.setHolidays(
      ada.id,
      Array.from({ length: 7 }, (_, index) => ({ year: 2026, week: index + 1 })),
    )

    expect(store.status.error).toBe('At most 6 holiday weeks are allowed')
    expect(store.filteredMembers[0].holidays).toEqual([
      { year: 2025, week: 1 },
      { year: 2026, week: 12 },
    ])
  })

  it('ignores holiday updates for unknown ids', () => {
    const store = useEmployeesStore()

    store.setHolidays('missing', [{ year: 2026, week: 1 }])

    expect(store.holidayTarget).toBeNull()
    expect(store.status.error).toBeNull()
  })

  it('opens and closes the create and edit dialogs', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.openCreate()
    expect(store.formVisible).toBe(true)
    expect(store.editingId).toBeNull()
    expect(store.editingMember).toBeNull()

    store.openEdit(ada.id)
    expect(store.formVisible).toBe(true)
    expect(store.editingMember).toEqual(ada)

    store.openEdit('missing')
    expect(store.editingMember).toBeNull()

    store.closeForm()
    expect(store.formVisible).toBe(false)
    expect(store.editingId).toBeNull()
  })

  it('submits a new member and closes the form on success', () => {
    const store = useEmployeesStore()
    store.openCreate()

    store.submitForm(basePayload)

    expect(store.count).toBe(1)
    expect(store.formVisible).toBe(false)
    expect(store.status.error).toBeNull()
  })

  it('keeps the form open when a create submission fails', () => {
    const store = useEmployeesStore()
    store.openCreate()

    store.submitForm({ ...basePayload, name: '  ' })

    expect(store.count).toBe(0)
    expect(store.formVisible).toBe(true)
    expect(store.status.error).toBe('Name is required')
  })

  it('submits an edit and closes the form on success', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    store.openEdit(ada.id)

    store.submitForm({ ...basePayload, name: 'Ada Lovelace', weeklyHours: 36 })

    expect(store.filteredMembers[0]).toMatchObject({
      id: ada.id,
      name: 'Ada Lovelace',
      weeklyHours: 36,
      holidays: ada.holidays,
    })
    expect(store.formVisible).toBe(false)
  })

  it('keeps the form open when an edit submission fails', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    store.openEdit(ada.id)

    store.submitForm({ ...basePayload, weeklyHours: 0 })

    expect(store.formVisible).toBe(true)
    expect(store.status.error).toBe(WEEKLY_HOURS_ERROR)
  })

  it('opens and closes the holiday dialog for a target member', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])

    store.openHolidays(ada.id)

    expect(store.holidayVisible).toBe(true)
    expect(store.holidayTargetId).toBe(ada.id)
    expect(store.holidayTarget).toEqual(ada)

    store.closeHolidays()

    expect(store.holidayVisible).toBe(false)
    expect(store.holidayTargetId).toBeNull()
    expect(store.holidayTarget).toBeNull()
  })

  it('loads members from an external source', () => {
    const store = useEmployeesStore()

    store.loadMembers([ada, bo])

    expect(store.count).toBe(2)
    expect(store.filteredMembers).toEqual([ada, bo])
  })

  it('removes a member and clears a matching selection and dialogs', () => {
    const store = useEmployeesStore()
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    store.select(ada.id)
    store.openEdit(ada.id)
    store.openHolidays(ada.id)

    store.removeMember(ada.id)

    expect(store.count).toBe(0)
    expect(store.selectedId).toBeNull()
    expect(store.formVisible).toBe(false)
    expect(store.editingId).toBeNull()
    expect(store.holidayVisible).toBe(false)
    expect(store.holidayTargetId).toBeNull()
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
