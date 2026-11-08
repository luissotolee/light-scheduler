import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { HolidayWeek, NewTeamMember, TeamMember } from '@/types'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { todayIsoDate } from '@/shared/utils/calendar'
import { MAX_HOLIDAY_WEEKS, normalizeHolidays, validateEmployeeForm } from '@/shared/utils/employee'
import { createId } from '@/shared/utils/id'

interface EmployeesStatus {
  loading: boolean
  error: string | null
}

interface PendingAction {
  kind: 'remove' | 'deactivate'
  id: string
}

export const useEmployeesStore = defineStore('employees', () => {
  const search = ref('')
  const selectedId = ref<string | null>(null)
  const status = ref<EmployeesStatus>({ loading: false, error: null })
  const formVisible = ref(false)
  const editingId = ref<string | null>(null)
  const holidayVisible = ref(false)
  const holidayTargetId = ref<string | null>(null)
  const confirmVisible = ref(false)
  const pendingAction = ref<PendingAction | null>(null)
  const detailsVisible = ref(false)
  const detailsTargetId = ref<string | null>(null)

  function workspace() {
    return useWorkspaceStore()
  }

  function setError(error: string | null): void {
    status.value = { loading: false, error }
  }

  const count = computed(() => workspace().members.length)

  const filteredMembers = computed(() => {
    const query = search.value.trim().toLowerCase()
    if (!query) return workspace().members
    return workspace().members.filter((member) => member.name.toLowerCase().includes(query))
  })

  const selectedMember = computed(() => {
    if (!selectedId.value) return null
    return workspace().members.find((member) => member.id === selectedId.value) ?? null
  })

  const editingMember = computed(() => {
    if (!editingId.value) return null
    return workspace().members.find((member) => member.id === editingId.value) ?? null
  })

  const holidayTarget = computed(() => {
    if (!holidayTargetId.value) return null
    return workspace().members.find((member) => member.id === holidayTargetId.value) ?? null
  })

  const detailsTarget = computed(() => {
    if (!detailsTargetId.value) return null
    return workspace().members.find((member) => member.id === detailsTargetId.value) ?? null
  })

  const pendingMember = computed(() => {
    const action = pendingAction.value
    if (!action) return null
    return workspace().findMember(action.id) ?? null
  })

  function addMember(payload: NewTeamMember): TeamMember | null {
    const result = validateEmployeeForm({
      name: payload.name,
      duty: payload.duty,
      contract: payload.contract,
      weeklyHours: payload.weeklyHours,
      email: payload.email ?? '',
      phone: payload.phone ?? '',
      holidays: payload.holidays ?? [],
      startDate: payload.startDate,
    })

    if (!result.ok) {
      setError(result.message)
      return null
    }

    const value = result.value
    const member: TeamMember = {
      id: createId(),
      name: value.name,
      duty: value.duty,
      contract: value.contract,
      weeklyHours: value.weeklyHours,
      holidays: value.holidays ?? [],
      active: true,
      startDate: value.startDate ?? todayIsoDate(),
      ...(value.phone ? { phone: value.phone } : {}),
      ...(value.email ? { email: value.email } : {}),
    }
    workspace().upsertMember(member)
    setError(null)
    return member
  }

  function updateMember(id: string, patch: Partial<NewTeamMember>): boolean {
    const member = workspace().findMember(id)
    if (!member) return false

    const result = validateEmployeeForm({
      name: patch.name ?? member.name,
      duty: patch.duty ?? member.duty,
      contract: patch.contract ?? member.contract,
      weeklyHours: patch.weeklyHours ?? member.weeklyHours,
      holidays: patch.holidays ?? member.holidays,
      email: patch.email ?? member.email ?? '',
      phone: patch.phone ?? member.phone ?? '',
      startDate: patch.startDate ?? member.startDate,
    })

    if (!result.ok) {
      setError(result.message)
      return false
    }

    const value = result.value
    workspace().upsertMember({
      id,
      name: value.name,
      duty: value.duty,
      contract: value.contract,
      weeklyHours: value.weeklyHours,
      holidays: value.holidays ?? [],
      active: member.active,
      startDate: value.startDate ?? member.startDate,
      ...(member.endDate ? { endDate: member.endDate } : {}),
      ...(value.phone ? { phone: value.phone } : {}),
      ...(value.email ? { email: value.email } : {}),
    })
    setError(null)
    return true
  }

  function setHolidays(id: string, holidays: HolidayWeek[]): void {
    const member = workspace().findMember(id)
    if (!member) return

    const normalized = normalizeHolidays(holidays)
    if (normalized.length > MAX_HOLIDAY_WEEKS) {
      setError('At most 6 holiday weeks are allowed')
      return
    }

    workspace().upsertMember({ ...member, holidays: normalized })
    setError(null)
  }

  function deactivateMember(id: string): void {
    const member = workspace().findMember(id)
    if (!member || !member.active) return

    const today = todayIsoDate()
    const endDate = member.startDate > today ? member.startDate : today
    workspace().upsertMember({ ...member, active: false, endDate })
  }

  function reactivateMember(id: string): void {
    const member = workspace().findMember(id)
    if (!member || member.active) return

    workspace().upsertMember({
      id: member.id,
      name: member.name,
      duty: member.duty,
      contract: member.contract,
      weeklyHours: member.weeklyHours,
      holidays: member.holidays,
      active: true,
      startDate: member.startDate,
      ...(member.email ? { email: member.email } : {}),
      ...(member.phone ? { phone: member.phone } : {}),
    })
  }

  function requestRemove(id: string): void {
    if (!workspace().findMember(id)) return
    pendingAction.value = { kind: 'remove', id }
    confirmVisible.value = true
  }

  function requestDeactivate(id: string): void {
    if (!workspace().findMember(id)) return
    pendingAction.value = { kind: 'deactivate', id }
    confirmVisible.value = true
  }

  function confirmAction(): void {
    const action = pendingAction.value
    if (action?.kind === 'remove') removeMember(action.id)
    if (action?.kind === 'deactivate') deactivateMember(action.id)
    cancelAction()
  }

  function cancelAction(): void {
    confirmVisible.value = false
    pendingAction.value = null
  }

  function openDetails(id: string): void {
    detailsTargetId.value = id
    detailsVisible.value = true
  }

  function closeDetails(): void {
    detailsVisible.value = false
    detailsTargetId.value = null
  }

  function removeMember(id: string): void {
    workspace().removeMember(id)
    if (selectedId.value === id) selectedId.value = null
    if (editingId.value === id) closeForm()
    if (holidayTargetId.value === id) closeHolidays()
    if (detailsTargetId.value === id) closeDetails()
    if (pendingAction.value?.id === id) cancelAction()
  }

  function select(id: string | null): void {
    selectedId.value = id
  }

  function setSearch(value: string): void {
    search.value = value
  }

  function openCreate(): void {
    setError(null)
    editingId.value = null
    formVisible.value = true
  }

  function openEdit(id: string): void {
    if (!workspace().findMember(id)) return
    setError(null)
    editingId.value = id
    formVisible.value = true
  }

  function closeForm(): void {
    formVisible.value = false
    editingId.value = null
  }

  function submitForm(payload: NewTeamMember): void {
    if (editingId.value) {
      if (updateMember(editingId.value, payload)) closeForm()
      return
    }

    const added = addMember(payload)
    if (added) {
      search.value = ''
      closeForm()
    }
  }

  function openHolidays(id: string): void {
    holidayTargetId.value = id
    holidayVisible.value = true
  }

  function closeHolidays(): void {
    holidayVisible.value = false
    holidayTargetId.value = null
  }

  function loadMembers(members: TeamMember[]): void {
    workspace().setMembers(members)
    resetUi()
  }

  function resetUi(): void {
    setError(null)
    search.value = ''
    selectedId.value = null
    cancelAction()
    closeForm()
    closeHolidays()
    closeDetails()
  }

  return {
    search,
    selectedId,
    status,
    formVisible,
    editingId,
    holidayVisible,
    holidayTargetId,
    confirmVisible,
    pendingAction,
    detailsVisible,
    detailsTargetId,
    count,
    filteredMembers,
    selectedMember,
    editingMember,
    holidayTarget,
    detailsTarget,
    pendingMember,
    addMember,
    updateMember,
    setHolidays,
    deactivateMember,
    reactivateMember,
    requestRemove,
    requestDeactivate,
    confirmAction,
    cancelAction,
    openDetails,
    closeDetails,
    removeMember,
    select,
    setSearch,
    openCreate,
    openEdit,
    closeForm,
    submitForm,
    openHolidays,
    closeHolidays,
    loadMembers,
    resetUi,
  }
})
