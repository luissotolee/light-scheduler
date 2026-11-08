import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { DayOff, Shift, TeamMember, WeekKey } from '@/types'
import { getWeekKey } from '@/shared/utils/calendar'

export const useWorkspaceStore = defineStore('workspace', () => {
  const members = ref<TeamMember[]>([])
  const schedules = ref<Record<WeekKey, Shift[]>>({})
  const dayOffs = ref<Record<WeekKey, DayOff[]>>({})
  const currentWeekKey = ref<WeekKey>(getWeekKey(new Date()))
  const dataLoaded = ref(false)
  const schemaVersion = 1

  const memberCount = computed(() => members.value.length)
  const activeMembers = computed(() => members.value.filter((member) => member.active))
  const currentWeekShifts = computed(() => schedules.value[currentWeekKey.value] ?? [])
  const currentWeekDayOffs = computed(() => dayOffs.value[currentWeekKey.value] ?? [])
  const hasAnyData = computed(
    () =>
      members.value.length > 0 ||
      Object.keys(schedules.value).length > 0 ||
      Object.keys(dayOffs.value).length > 0,
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

    const nextSchedules: Record<WeekKey, Shift[]> = {}
    for (const [weekKey, shifts] of Object.entries(schedules.value)) {
      const remaining = shifts.filter((shift) => shift.memberId !== id)
      if (remaining.length > 0) nextSchedules[weekKey] = remaining
    }
    schedules.value = nextSchedules

    const nextDayOffs: Record<WeekKey, DayOff[]> = {}
    for (const [weekKey, offs] of Object.entries(dayOffs.value)) {
      const remaining = offs.filter((off) => off.memberId !== id)
      if (remaining.length > 0) nextDayOffs[weekKey] = remaining
    }
    dayOffs.value = nextDayOffs
  }

  function findMember(id: string): TeamMember | undefined {
    return members.value.find((member) => member.id === id)
  }

  function setShiftsForWeek(weekKey: WeekKey, shifts: Shift[]): void {
    schedules.value = { ...schedules.value, [weekKey]: shifts }
  }

  function setDayOffsForWeek(weekKey: WeekKey, offs: DayOff[]): void {
    if (offs.length === 0) {
      const nextDayOffs = { ...dayOffs.value }
      delete nextDayOffs[weekKey]
      dayOffs.value = nextDayOffs
      return
    }
    dayOffs.value = { ...dayOffs.value, [weekKey]: offs }
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
    dayOffs.value = {}
    currentWeekKey.value = getWeekKey(new Date())
    dataLoaded.value = false
  }

  return {
    members,
    schedules,
    dayOffs,
    currentWeekKey,
    dataLoaded,
    schemaVersion,
    memberCount,
    activeMembers,
    currentWeekShifts,
    currentWeekDayOffs,
    hasAnyData,
    setMembers,
    upsertMember,
    removeMember,
    findMember,
    setShiftsForWeek,
    setDayOffsForWeek,
    setCurrentWeekKey,
    markLoaded,
    reset,
  }
})
