import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { HolidayWeek, NewTeamMember, TeamMember } from '@/types'
import { useWorkspaceStore } from '@/stores/workspace'
import {
  MAX_HOLIDAY_WEEKS,
  isContract,
  isDuty,
  isValidEmail,
  isValidPhone,
  normalizeHolidays,
  parseWeeklyHours,
} from '@/utils/employee'
import { createId } from '@/utils/id'

interface EmployeesStatus {
  loading: boolean
  error: string | null
}

export const useEmployeesStore = defineStore('employees', () => {
  const search = ref('')
  const selectedId = ref<string | null>(null)
  const status = ref<EmployeesStatus>({ loading: false, error: null })
  const formVisible = ref(false)
  const editingId = ref<string | null>(null)
  const holidayVisible = ref(false)
  const holidayTargetId = ref<string | null>(null)

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
    return workspace().members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        (member.email ?? '').toLowerCase().includes(query),
    )
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

  function addMember(payload: NewTeamMember): TeamMember | null {
    const name = payload.name.trim()
    if (!name) {
      setError('Name is required')
      return null
    }

    const phone = payload.phone?.trim()
    if (phone && !isValidPhone(phone)) {
      setError('Phone is invalid')
      return null
    }

    if (!isDuty(payload.duty)) {
      setError('Duty is invalid')
      return null
    }

    if (!isContract(payload.contract)) {
      setError('Contract is invalid')
      return null
    }

    const weeklyHours = parseWeeklyHours(payload.weeklyHours)
    if (weeklyHours === null) {
      setError('Weekly hours must be between 0 and 168')
      return null
    }

    const holidays = normalizeHolidays(payload.holidays ?? [])
    if (holidays.length > MAX_HOLIDAY_WEEKS) {
      setError('At most 6 holiday weeks are allowed')
      return null
    }

    const email = payload.email?.trim()
    if (email && !isValidEmail(email)) {
      setError('Email is invalid')
      return null
    }

    const member: TeamMember = {
      id: createId(),
      name,
      duty: payload.duty,
      contract: payload.contract,
      weeklyHours,
      holidays,
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
    }
    workspace().upsertMember(member)
    setError(null)
    return member
  }

  function updateMember(id: string, patch: Partial<NewTeamMember>): void {
    const member = workspace().findMember(id)
    if (!member) return

    const name = (patch.name ?? member.name).trim()
    if (!name) {
      setError('Name is required')
      return
    }

    const phone = patch.phone === undefined ? member.phone : patch.phone.trim() || undefined
    if (phone && !isValidPhone(phone)) {
      setError('Phone is invalid')
      return
    }

    const duty = patch.duty ?? member.duty
    if (!isDuty(duty)) {
      setError('Duty is invalid')
      return
    }

    const contract = patch.contract ?? member.contract
    if (!isContract(contract)) {
      setError('Contract is invalid')
      return
    }

    const weeklyHours = parseWeeklyHours(patch.weeklyHours ?? member.weeklyHours)
    if (weeklyHours === null) {
      setError('Weekly hours must be between 0 and 168')
      return
    }

    const holidays = normalizeHolidays(patch.holidays ?? member.holidays)
    if (holidays.length > MAX_HOLIDAY_WEEKS) {
      setError('At most 6 holiday weeks are allowed')
      return
    }

    const email = patch.email === undefined ? member.email : patch.email.trim()
    if (email && !isValidEmail(email)) {
      setError('Email is invalid')
      return
    }

    workspace().upsertMember({
      id,
      name,
      duty,
      contract,
      weeklyHours,
      holidays,
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
    })
    setError(null)
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

  function removeMember(id: string): void {
    workspace().removeMember(id)
    if (selectedId.value === id) selectedId.value = null
    if (editingId.value === id) closeForm()
    if (holidayTargetId.value === id) closeHolidays()
  }

  function select(id: string | null): void {
    selectedId.value = id
  }

  function setSearch(value: string): void {
    search.value = value
  }

  function openCreate(): void {
    editingId.value = null
    formVisible.value = true
  }

  function openEdit(id: string): void {
    editingId.value = id
    formVisible.value = true
  }

  function closeForm(): void {
    formVisible.value = false
    editingId.value = null
  }

  function submitForm(payload: NewTeamMember): void {
    if (editingId.value) {
      updateMember(editingId.value, payload)
      if (!status.value.error) closeForm()
      return
    }

    const added = addMember(payload)
    if (added) closeForm()
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
  }

  return {
    search,
    selectedId,
    status,
    formVisible,
    editingId,
    holidayVisible,
    holidayTargetId,
    count,
    filteredMembers,
    selectedMember,
    editingMember,
    holidayTarget,
    addMember,
    updateMember,
    setHolidays,
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
  }
})
