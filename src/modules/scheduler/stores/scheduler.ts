import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { NewShift, Shift, Weekday, WeekKey } from '@/types'
import type { DayRow, ShiftRangeInput, ShiftResizeInput } from '@/modules/scheduler/types'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { addWeeks, getWeekKey, weekdayIsoDate } from '@/shared/utils/calendar'
import { createId } from '@/shared/utils/id'
import {
  formatMinutesToHhmm,
  mergeOverlappingRanges,
  normalizeGridRange,
  toShiftMinutes,
} from '@/shared/utils/shifts'
import {
  buildWeeklyHoursGroups,
  compareMembersByDuty,
  minutesToHours,
  sumShiftMinutes,
} from '@/modules/scheduler/utils/hours'
import { MAX_DAYS_OFF, countDaysOffByMember } from '@/modules/scheduler/utils/off'

function dateFromWeekKey(weekKey: WeekKey): Date {
  const [year, month, day] = weekKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const useSchedulerStore = defineStore('scheduler', () => {
  const draft = ref<NewShift | null>(null)
  const error = ref<string | null>(null)
  const selectedWeekday = ref<Weekday>('monday')

  function workspace() {
    return useWorkspaceStore()
  }

  const currentWeekKey = computed(() => workspace().currentWeekKey)
  const currentWeekShifts = computed(() => workspace().currentWeekShifts)
  const currentWeekDayOffs = computed(() => workspace().currentWeekDayOffs)
  const members = computed(() => workspace().activeMembers)

  const dayOffCounts = computed(() => countDaysOffByMember(currentWeekDayOffs.value))

  const selectedWeekdayDate = computed(() =>
    weekdayIsoDate(currentWeekKey.value, selectedWeekday.value),
  )
  const dayMembers = computed(() =>
    workspace().members.filter(
      (member) => member.active && member.startDate <= selectedWeekdayDate.value,
    ),
  )
  const selectedWeekdayShifts = computed(() =>
    currentWeekShifts.value.filter((shift) => shift.weekday === selectedWeekday.value),
  )
  const dayRows = computed<DayRow[]>(() =>
    dayMembers.value
      .map((member) => {
        const bars = selectedWeekdayShifts.value.filter((shift) => shift.memberId === member.id)
        const isOff = currentWeekDayOffs.value.some(
          (off) => off.memberId === member.id && off.weekday === selectedWeekday.value,
        )
        return {
          member,
          bars,
          dailyHours: minutesToHours(sumShiftMinutes(bars)),
          isOff,
          daysOffCount: dayOffCounts.value.get(member.id) ?? 0,
        }
      })
      .sort((a, b) => compareMembersByDuty(a.member, b.member)),
  )
  const weeklyHoursGroups = computed(() =>
    buildWeeklyHoursGroups(workspace().activeMembers, currentWeekShifts.value),
  )

  function selectWeekday(weekday: Weekday): void {
    selectedWeekday.value = weekday
  }

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

  function mergeCandidate(candidate: Shift, mode: 'create' | 'update'): Shift {
    const others = currentWeekShifts.value.filter(
      (shift) =>
        shift.id !== candidate.id &&
        shift.memberId === candidate.memberId &&
        shift.weekday === candidate.weekday,
    )
    const { range, mergedIndexes } = mergeOverlappingRanges(candidate, others)
    const absorbedIds = new Set(mergedIndexes.map((index) => others[index].id))
    const survivor: Shift = { ...candidate, ...range }

    const next =
      mode === 'create'
        ? [...currentWeekShifts.value.filter((shift) => !absorbedIds.has(shift.id)), survivor]
        : currentWeekShifts.value
            .map((shift) => {
              if (shift.id === candidate.id) return survivor
              if (absorbedIds.has(shift.id)) return null
              return shift
            })
            .filter((shift): shift is Shift => shift !== null)

    workspace().setShiftsForWeek(currentWeekKey.value, next)
    error.value = null
    return survivor
  }

  function addShift(payload: NewShift): Shift | null {
    const range = toShiftMinutes(payload.start, payload.end)
    if (!range) {
      error.value = 'Shift times must be valid and start before end'
      return null
    }

    const candidate: Shift = {
      id: createId(),
      memberId: payload.memberId,
      weekday: payload.weekday,
      ...range,
    }

    return mergeCandidate(candidate, 'create')
  }

  function addShiftRange(input: ShiftRangeInput): Shift | null {
    const range = normalizeGridRange(input.startMinute, input.endMinute)
    if (!range) {
      error.value = 'Shift must be at least 30 minutes within 09:00–01:00'
      return null
    }

    const candidate: Shift = {
      id: createId(),
      memberId: input.memberId,
      weekday: selectedWeekday.value,
      ...range,
    }

    return mergeCandidate(candidate, 'create')
  }

  function updateShiftRange(input: ShiftResizeInput): Shift | null {
    const existing = currentWeekShifts.value.find((shift) => shift.id === input.id)
    if (!existing) return null

    const range = normalizeGridRange(input.startMinute, input.endMinute)
    if (!range) {
      error.value = 'Shift must be at least 30 minutes within 09:00–01:00'
      return null
    }

    const candidate: Shift = { ...existing, ...range }

    return mergeCandidate(candidate, 'update')
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

    const candidate: Shift = {
      id,
      memberId: patch.memberId ?? existing.memberId,
      weekday: patch.weekday ?? existing.weekday,
      ...range,
    }

    mergeCandidate(candidate, 'update')
  }

  function clearError(): void {
    error.value = null
  }

  function daysOffCountFor(memberId: string): number {
    return dayOffCounts.value.get(memberId) ?? 0
  }

  function toggleDayOff(memberId: string): void {
    const member = workspace().members.find((item) => item.id === memberId)
    if (!member || !member.active) return

    const current = currentWeekDayOffs.value
    const alreadyOff = current.some(
      (off) => off.memberId === memberId && off.weekday === selectedWeekday.value,
    )

    if (alreadyOff) {
      workspace().setDayOffsForWeek(
        currentWeekKey.value,
        current.filter(
          (off) => !(off.memberId === memberId && off.weekday === selectedWeekday.value),
        ),
      )
      error.value = null
      return
    }

    if (daysOffCountFor(memberId) >= MAX_DAYS_OFF) {
      error.value = 'At most 2 days off are allowed per week'
      return
    }

    workspace().setDayOffsForWeek(currentWeekKey.value, [
      ...current,
      { memberId, weekday: selectedWeekday.value },
    ])
    error.value = null
  }

  return {
    draft,
    error,
    selectedWeekday,
    currentWeekKey,
    currentWeekShifts,
    currentWeekDayOffs,
    dayOffCounts,
    members,
    selectedWeekdayDate,
    dayMembers,
    selectedWeekdayShifts,
    dayRows,
    weeklyHoursGroups,
    setWeekKey,
    goToNextWeek,
    goToPreviousWeek,
    selectWeekday,
    addShift,
    addShiftRange,
    updateShiftRange,
    removeShift,
    updateShift,
    clearError,
    daysOffCountFor,
    toggleDayOff,
  }
})
