import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { formatWeekRange } from '@/shared/utils/calendar'

export const useSummaryStore = defineStore('summary', () => {
  function workspace() {
    return useWorkspaceStore()
  }

  const currentWeekKey = computed(() => workspace().currentWeekKey)
  const weekShifts = computed(() => workspace().currentWeekShifts)
  const weekRangeLabel = computed(() => formatWeekRange(currentWeekKey.value))
  const totalShifts = computed(() => weekShifts.value.length)
  const assignedMemberCount = computed(
    () => new Set(weekShifts.value.map((shift) => shift.memberId)).size,
  )

  function memberNameOf(memberId: string): string {
    return workspace().findMember(memberId)?.name ?? 'Unknown member'
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
