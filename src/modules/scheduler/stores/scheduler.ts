import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { NewShift, Shift, WeekKey } from '@/types'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { addWeeks, getWeekKey } from '@/shared/utils/calendar'
import { createId } from '@/shared/utils/id'
import { formatMinutesToHhmm, shiftsOverlap, toShiftMinutes } from '@/shared/utils/shifts'

function dateFromWeekKey(weekKey: WeekKey): Date {
  const [year, month, day] = weekKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const useSchedulerStore = defineStore('scheduler', () => {
  const draft = ref<NewShift | null>(null)
  const error = ref<string | null>(null)

  function workspace() {
    return useWorkspaceStore()
  }

  const currentWeekKey = computed(() => workspace().currentWeekKey)
  const currentWeekShifts = computed(() => workspace().currentWeekShifts)
  const members = computed(() => workspace().activeMembers)
  const shiftCount = computed(() => currentWeekShifts.value.length)

  function moveWeek(delta: number): void {
    const nextDate = addWeeks(dateFromWeekKey(currentWeekKey.value), delta)
    workspace().setCurrentWeekKey(getWeekKey(nextDate))
    error.value = null
  }

  function setWeekKey(weekKey: WeekKey): void {
    workspace().setCurrentWeekKey(weekKey)
    error.value = null
  }

  function goToNextWeek(): void {
    moveWeek(1)
  }

  function goToPreviousWeek(): void {
    moveWeek(-1)
  }

  function findOverlap(
    candidate: {
      memberId: string
      weekday: Shift['weekday']
      startMinute: number
      endMinute: number
    },
    ignoreId?: string,
  ): boolean {
    return currentWeekShifts.value.some(
      (shift) =>
        shift.id !== ignoreId &&
        shift.memberId === candidate.memberId &&
        shift.weekday === candidate.weekday &&
        shiftsOverlap(shift, candidate),
    )
  }

  function addShift(payload: NewShift): Shift | null {
    const range = toShiftMinutes(payload.start, payload.end)
    if (!range) {
      error.value = 'Shift times must be valid and start before end'
      return null
    }

    const candidate = {
      memberId: payload.memberId,
      weekday: payload.weekday,
      ...range,
    }

    if (findOverlap(candidate)) {
      error.value = 'Shift overlaps an existing shift for this member'
      return null
    }

    const shift: Shift = { id: createId(), ...candidate }
    workspace().setShiftsForWeek(currentWeekKey.value, [...currentWeekShifts.value, shift])
    error.value = null
    return shift
  }

  function removeShift(id: string): void {
    workspace().setShiftsForWeek(
      currentWeekKey.value,
      currentWeekShifts.value.filter((shift) => shift.id !== id),
    )
  }

  function updateShift(id: string, patch: Partial<NewShift>): void {
    const existing = currentWeekShifts.value.find((shift) => shift.id === id)
    if (!existing) return

    const start = patch.start ?? formatMinutesToHhmm(existing.startMinute)
    const end = patch.end ?? formatMinutesToHhmm(existing.endMinute)
    const range = toShiftMinutes(start, end)
    if (!range) {
      error.value = 'Shift times must be valid and start before end'
      return
    }

    const candidate = {
      id,
      memberId: patch.memberId ?? existing.memberId,
      weekday: patch.weekday ?? existing.weekday,
      ...range,
    }

    if (findOverlap(candidate, id)) {
      error.value = 'Shift overlaps an existing shift for this member'
      return
    }

    workspace().setShiftsForWeek(
      currentWeekKey.value,
      currentWeekShifts.value.map((shift) => (shift.id === id ? candidate : shift)),
    )
    error.value = null
  }

  function clearError(): void {
    error.value = null
  }

  return {
    draft,
    error,
    currentWeekKey,
    currentWeekShifts,
    members,
    shiftCount,
    setWeekKey,
    goToNextWeek,
    goToPreviousWeek,
    addShift,
    removeShift,
    updateShift,
    clearError,
  }
})
