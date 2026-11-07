import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { WeekKey } from '@/types'
import { useWorkspaceStore } from '@/shared/stores/workspace'

export const useHistoryStore = defineStore('history', () => {
  const selectedWeekKey = ref<WeekKey | null>(null)

  function workspace() {
    return useWorkspaceStore()
  }

  const availableWeeks = computed(() =>
    [...new Set([...Object.keys(workspace().schedules), workspace().currentWeekKey])].sort(),
  )

  const selectedWeekShifts = computed(() => {
    if (!selectedWeekKey.value) return []
    return workspace().schedules[selectedWeekKey.value] ?? []
  })

  const archivedCount = computed(() => Object.keys(workspace().schedules).length)

  function selectWeek(weekKey: WeekKey | null): void {
    selectedWeekKey.value = weekKey
  }

  return {
    selectedWeekKey,
    availableWeeks,
    selectedWeekShifts,
    archivedCount,
    selectWeek,
  }
})
