import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Shift, TeamMember, WeekKey } from '@/types'
import { getWeekKey } from '@/shared/utils/calendar'

export const useWorkspaceStore = defineStore('workspace', () => {
  const members = ref<TeamMember[]>([])
  const schedules = ref<Record<WeekKey, Shift[]>>({})
  const currentWeekKey = ref<WeekKey>(getWeekKey(new Date()))
  const dataLoaded = ref(false)
  const schemaVersion = 1

  const memberCount = computed(() => members.value.length)
  const currentWeekShifts = computed(() => schedules.value[currentWeekKey.value] ?? [])
  const hasAnyData = computed(
    () => members.value.length > 0 || Object.keys(schedules.value).length > 0,
  )

  function setMembers(loaded: TeamMember[]): void {
    members.value = loaded
  }

  function upsertMember(member: TeamMember): void {
    const index = members.value.findIndex((item) => item.id === member.id)
    if (index === -1) {
      members.value = [...members.value, member]
      return
    }
    members.value = members.value.map((item) => (item.id === member.id ? member : item))
  }

  function removeMember(id: string): void {
    members.value = members.value.filter((member) => member.id !== id)
  }

  function findMember(id: string): TeamMember | undefined {
    return members.value.find((member) => member.id === id)
  }

  function setShiftsForWeek(weekKey: WeekKey, shifts: Shift[]): void {
    schedules.value = { ...schedules.value, [weekKey]: shifts }
  }

  function setCurrentWeekKey(weekKey: WeekKey): void {
    currentWeekKey.value = weekKey
  }

  function markLoaded(): void {
    dataLoaded.value = true
  }

  function reset(): void {
    members.value = []
    schedules.value = {}
    currentWeekKey.value = getWeekKey(new Date())
    dataLoaded.value = false
  }

  return {
    members,
    schedules,
    currentWeekKey,
    dataLoaded,
    schemaVersion,
    memberCount,
    currentWeekShifts,
    hasAnyData,
    setMembers,
    upsertMember,
    removeMember,
    findMember,
    setShiftsForWeek,
    setCurrentWeekKey,
    markLoaded,
    reset,
  }
})
