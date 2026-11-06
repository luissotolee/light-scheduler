import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { NewTeamMember, TeamMember } from '@/types'
import { useWorkspaceStore } from '@/stores/workspace'
import { createId } from '@/utils/id'

interface EmployeesStatus {
  loading: boolean
  error: string | null
}

export const useEmployeesStore = defineStore('employees', () => {
  const search = ref('')
  const selectedId = ref<string | null>(null)
  const status = ref<EmployeesStatus>({ loading: false, error: null })

  function workspace() {
    return useWorkspaceStore()
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

  function addMember(payload: NewTeamMember): TeamMember | null {
    const name = payload.name.trim()
    if (!name) {
      status.value = { loading: false, error: 'Name is required' }
      return null
    }

    const email = payload.email?.trim()
    const member: TeamMember = {
      id: createId(),
      name,
      ...(email ? { email } : {}),
    }
    workspace().upsertMember(member)
    status.value = { loading: false, error: null }
    return member
  }

  function updateMember(id: string, patch: Partial<TeamMember>): void {
    const member = workspace().findMember(id)
    if (!member) return

    const name = (patch.name ?? member.name).trim()
    if (!name) {
      status.value = { loading: false, error: 'Name is required' }
      return
    }

    const email = patch.email === undefined ? member.email : patch.email.trim()
    workspace().upsertMember({
      id,
      name,
      ...(email ? { email } : {}),
    })
    status.value = { loading: false, error: null }
  }

  function removeMember(id: string): void {
    workspace().removeMember(id)
    if (selectedId.value === id) selectedId.value = null
  }

  function select(id: string | null): void {
    selectedId.value = id
  }

  function setSearch(value: string): void {
    search.value = value
  }

  return {
    search,
    selectedId,
    status,
    count,
    filteredMembers,
    selectedMember,
    addMember,
    updateMember,
    removeMember,
    select,
    setSearch,
  }
})
