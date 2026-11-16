import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { HolidayWeek, NewTeamMember, SickLeave, TeamMember } from '@/types'
import type { MessageKey } from '@/shared/i18n/messages/en'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { holidayToWeekKey, todayIsoDate, weekdayIsoDate } from '@/shared/utils/calendar'
import {
  createEmpId,
  exceedsHolidayLimit,
  normalizeHolidays,
  validateEmployeeForm,
} from '@/shared/utils/employee'
import { DEFAULT_CONTRACT_HOURS_PERIOD } from '@/shared/utils/contractHours'
import { createId } from '@/shared/utils/id'
import { isDateInSickLeaves, normalizeSickLeaves } from '@/shared/utils/sickness'

interface EmployeesStatus {
  loading: boolean
  error: MessageKey | null
}

type PendingAction =
  | { kind: 'remove' | 'deactivate'; id: string }
  | { kind: 'holidays'; id: string; holidays: HolidayWeek[] }
  | { kind: 'sickness'; id: string; leaves: SickLeave[] }

export const useEmployeesStore = defineStore('employees', () => {
  const search = ref('')
  const selectedId = ref<string | null>(null)
  const status = ref<EmployeesStatus>({ loading: false, error: null })
  const formVisible = ref(false)
  const editingId = ref<string | null>(null)
  const holidayVisible = ref(false)
  const holidayTargetId = ref<string | null>(null)
  const sicknessVisible = ref(false)
  const sicknessTargetId = ref<string | null>(null)
  const confirmVisible = ref(false)
  const pendingAction = ref<PendingAction | null>(null)
  const detailsVisible = ref(false)
  const detailsTargetId = ref<string | null>(null)
  const manageVisible = ref(false)
  const manageTargetId = ref<string | null>(null)
  const hideInactive = ref(false)
  const exportVisible = ref(false)

  function workspace() {
    return useWorkspaceStore()
  }

  function setError(error: MessageKey | null): void {
    status.value = { loading: false, error }
  }

  function setHideInactive(value: boolean): void {
    hideInactive.value = value
  }

  function openExport(): void {
    exportVisible.value = true
  }

  function closeExport(): void {
    exportVisible.value = false
  }

  function resetUi(): void {
    setError(null)
    search.value = ''
    selectedId.value = null
    cancelAction()
    closeForm()
    closeHolidays()
    closeSickness()
    closeDetails()
    closeManage()
    hideInactive.value = false
    closeExport()
  }

  const activeCount = computed(() => workspace().members.filter((member) => member.active).length)
  const totalCount = computed(() => workspace().members.length)

  const count = computed(() => workspace().members.length)

  const filteredMembers = computed(() => {
    const query = search.value.trim().toLowerCase()
    return workspace().members.filter((member) => {
      if (hideInactive.value && !member.active) return false
      return !query || member.name.toLowerCase().includes(query)
    })
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

  const sicknessTarget = computed(() => {
    if (!sicknessTargetId.value) return null
    return workspace().members.find((member) => member.id === sicknessTargetId.value) ?? null
  })

  const detailsTarget = computed(() => {
    if (!detailsTargetId.value) return null
    return workspace().members.find((member) => member.id === detailsTargetId.value) ?? null
  })

  const manageTarget = computed(() => {
    if (!manageTargetId.value) return null
    return workspace().members.find((member) => member.id === manageTargetId.value) ?? null
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
      contractHoursPeriod: payload.contractHoursPeriod,
      email: payload.email ?? '',
      phone: payload.phone ?? '',
      comment: payload.comment ?? '',
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
      contractHoursPeriod: value.contractHoursPeriod,
      holidays: value.holidays ?? [],
      sickLeaves: [],
      active: true,
      startDate: value.startDate ?? todayIsoDate(),
      ...(value.phone ? { phone: value.phone } : {}),
      ...(value.email ? { email: value.email } : {}),
      ...(value.comment ? { comment: value.comment } : {}),
      empId: createEmpId(workspace().members.map((m) => m.empId)),
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
      contractHoursPeriod: patch.contractHoursPeriod ?? member.contractHoursPeriod,
      holidays: patch.holidays ?? member.holidays,
      email: patch.email ?? member.email ?? '',
      phone: patch.phone ?? member.phone ?? '',
      comment: patch.comment ?? member.comment ?? '',
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
      contractHoursPeriod: value.contractHoursPeriod,
      holidays: value.holidays ?? [],
      sickLeaves: member.sickLeaves ?? [],
      active: member.active,
      startDate: value.startDate ?? member.startDate,
      ...(member.endDate ? { endDate: member.endDate } : {}),
      ...(value.phone ? { phone: value.phone } : {}),
      ...(value.email ? { email: value.email } : {}),
      ...(value.comment ? { comment: value.comment } : {}),
      empId: member.empId,
    })
    setError(null)
    return true
  }

  function hasShiftsForHolidays(id: string, holidays: HolidayWeek[]): boolean {
    const weekKeys = new Set(holidays.map(holidayToWeekKey))
    return [...weekKeys].some((weekKey) =>
      (workspace().schedules[weekKey] ?? []).some((shift) => shift.memberId === id),
    )
  }

  function setHolidays(id: string, holidays: HolidayWeek[]): void {
    const member = workspace().findMember(id)
    if (!member) return

    const normalized = normalizeHolidays(holidays)
    if (exceedsHolidayLimit(normalized)) {
      setError('errors.maxHolidays')
      return
    }

    workspace().upsertMember({ ...member, holidays: normalized })
    workspace().removeMemberShiftsForWeeks(
      id,
      normalized.map((holiday) => holidayToWeekKey(holiday)),
    )
    setError(null)
  }

  function requestSetHolidays(id: string, holidays: HolidayWeek[]): void {
    const member = workspace().findMember(id)
    if (!member) return

    const normalized = normalizeHolidays(holidays)
    if (exceedsHolidayLimit(normalized)) {
      setError('errors.maxHolidays')
      return
    }

    if (hasShiftsForHolidays(id, normalized)) {
      pendingAction.value = { kind: 'holidays', id, holidays: normalized }
      confirmVisible.value = true
      setError(null)
      return
    }

    setHolidays(id, normalized)
  }

  function hasShiftsForSickLeaves(id: string, leaves: readonly SickLeave[]): boolean {
    if (leaves.length === 0) return false

    for (const [weekKey, shifts] of Object.entries(workspace().schedules)) {
      for (const shift of shifts) {
        if (shift.memberId !== id) continue
        const date = weekdayIsoDate(weekKey, shift.weekday)
        if (isDateInSickLeaves(leaves, date)) return true
      }
    }

    return false
  }

  function setSickLeaves(id: string, leaves: SickLeave[]): void {
    const member = workspace().findMember(id)
    if (!member) return

    const normalized = normalizeSickLeaves(leaves)
    workspace().upsertMember({ ...member, sickLeaves: normalized })
    workspace().removeMemberShiftsForSickLeaves(id, normalized)
    setError(null)
  }

  function requestSetSickLeaves(id: string, leaves: SickLeave[]): void {
    const member = workspace().findMember(id)
    if (!member) return

    const normalized = normalizeSickLeaves(leaves)
    if (hasShiftsForSickLeaves(id, normalized)) {
      pendingAction.value = { kind: 'sickness', id, leaves: normalized }
      confirmVisible.value = true
      setError(null)
      return
    }

    setSickLeaves(id, normalized)
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
      contractHoursPeriod: member.contractHoursPeriod ?? DEFAULT_CONTRACT_HOURS_PERIOD,
      holidays: member.holidays,
      sickLeaves: member.sickLeaves ?? [],
      active: true,
      startDate: member.startDate,
      ...(member.email ? { email: member.email } : {}),
      ...(member.phone ? { phone: member.phone } : {}),
      ...(member.comment ? { comment: member.comment } : {}),
      empId: member.empId,
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
    if (action?.kind === 'holidays') setHolidays(action.id, action.holidays)
    if (action?.kind === 'sickness') setSickLeaves(action.id, action.leaves)
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

  function openManage(id: string): void {
    if (!workspace().findMember(id)) return
    manageTargetId.value = id
    manageVisible.value = true
  }

  function closeManage(): void {
    manageVisible.value = false
    manageTargetId.value = null
  }

  function removeMember(id: string): void {
    workspace().removeMember(id)
    if (selectedId.value === id) selectedId.value = null
    if (editingId.value === id) closeForm()
    if (holidayTargetId.value === id) closeHolidays()
    if (sicknessTargetId.value === id) closeSickness()
    if (detailsTargetId.value === id) closeDetails()
    if (manageTargetId.value === id) closeManage()
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

  function openSickness(id: string): void {
    if (!workspace().findMember(id)) return
    sicknessTargetId.value = id
    sicknessVisible.value = true
  }

  function closeSickness(): void {
    sicknessVisible.value = false
    sicknessTargetId.value = null
  }

  function loadMembers(members: TeamMember[]): void {
    workspace().setMembers(members)
    resetUi()
  }


  return {
    search,
    selectedId,
    status,
    formVisible,
    editingId,
    holidayVisible,
    holidayTargetId,
    sicknessVisible,
    sicknessTargetId,
    confirmVisible,
    pendingAction,
    detailsVisible,
    detailsTargetId,
    manageVisible,
    manageTargetId,
    hideInactive,
    exportVisible,
    count,
    filteredMembers,
    selectedMember,
    editingMember,
    holidayTarget,
    sicknessTarget,
    detailsTarget,
    manageTarget,
    pendingMember,
    activeCount,
    totalCount,
    addMember,
    updateMember,
    setHolidays,
    requestSetHolidays,
    setSickLeaves,
    requestSetSickLeaves,
    deactivateMember,
    reactivateMember,
    requestRemove,
    requestDeactivate,
    confirmAction,
    cancelAction,
    openDetails,
    closeDetails,
    openManage,
    closeManage,
    removeMember,
    select,
    setSearch,
    openCreate,
    openEdit,
    closeForm,
    submitForm,
    openHolidays,
    closeHolidays,
    openSickness,
    closeSickness,
    openExport,
    closeExport,
    loadMembers,
    resetUi,
    setHideInactive,
  }
})
