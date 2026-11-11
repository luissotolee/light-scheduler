import { computed } from 'vue'
import { defineStore } from 'pinia'
import { useLocaleStore } from '@/shared/stores/locale'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import {
  WEEKDAY_ORDER,
  addWeeks,
  formatWeekRange,
  getWeekKey,
  isoDateToDate,
  weekdayDayOfMonth,
} from '@/shared/utils/calendar'
import type { WeekKey } from '@/types'
import type { SummaryDayHeader } from '@/modules/summary/types'
import { buildSummaryRows, computeSummaryPrintZoom, summaryRowUnits } from '@/modules/summary/utils/rows'

export const useSummaryStore = defineStore('summary', () => {
  const workspaceStore = useWorkspaceStore()
  const localeStore = useLocaleStore()

  const currentWeekKey = computed(() => workspaceStore.currentWeekKey)

  const weekRangeLabel = computed(() =>
    formatWeekRange(currentWeekKey.value, localeStore.locale),
  )

  const dayHeaders = computed<SummaryDayHeader[]>(() =>
    WEEKDAY_ORDER.map((weekday) => ({
      weekday,
      dayOfMonth: weekdayDayOfMonth(currentWeekKey.value, weekday),
    })),
  )

  const rows = computed(() =>
    buildSummaryRows({
      members: workspaceStore.members,
      shifts: workspaceStore.currentWeekShifts,
      dayOffs: workspaceStore.currentWeekDayOffs,
      weekKey: currentWeekKey.value,
    }),
  )

  const printZoom = computed(() => computeSummaryPrintZoom(summaryRowUnits(rows.value)))

  function moveWeek(delta: number): void {
    const next = addWeeks(isoDateToDate(currentWeekKey.value), delta)
    workspaceStore.setCurrentWeekKey(getWeekKey(next))
  }

  function goToPreviousWeek(): void {
    moveWeek(-1)
  }

  function goToNextWeek(): void {
    moveWeek(1)
  }

  function goToCurrentWeek(): void {
    workspaceStore.setCurrentWeekKey(getWeekKey(new Date()))
  }

  function setWeekKey(weekKey: WeekKey): void {
    workspaceStore.setCurrentWeekKey(weekKey)
  }

  return {
    currentWeekKey,
    weekRangeLabel,
    dayHeaders,
    rows,
    printZoom,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    setWeekKey,
  }
})
