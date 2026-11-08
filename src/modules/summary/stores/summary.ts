import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useLocaleStore } from '@/shared/stores/locale'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { formatWeekRange } from '@/shared/utils/calendar'

export const useSummaryStore = defineStore('summary', () => {
  function workspace() {
    return useWorkspaceStore()
  }

  function locale() {
    return useLocaleStore()
  }

  const currentWeekKey = computed(() => workspace().currentWeekKey)
  const weekShifts = computed(() => workspace().currentWeekShifts)
  const weekRangeLabel = computed(() => formatWeekRange(currentWeekKey.value, locale().locale))
  const totalShifts = computed(() => weekShifts.value.length)
  const assignedMemberCount = computed(
    () => new Set(weekShifts.value.map((shift) => shift.memberId)).size,
  )

  function memberNameOf(memberId: string): string | null {
    return workspace().findMember(memberId)?.name ?? null
  }

  return {
    currentWeekKey,
    weekShifts,
    weekRangeLabel,
    totalShifts,
    assignedMemberCount,
    memberNameOf,
  }
})
