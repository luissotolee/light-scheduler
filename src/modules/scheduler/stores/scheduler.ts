import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { NewShift, Shift, Weekday, WeekKey } from '@/types'
import type { MessageKey } from '@/shared/i18n/messages/en'
import type {
  DayRow,
  SchedulerError,
  ShiftRangeInput,
  ShiftResizeInput,
} from '@/modules/scheduler/types'
import { useSchedulerSettingsStore } from '@/modules/scheduler/stores/schedulerSettings'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { addWeeks, getWeekKey, weekdayIsoDate } from '@/shared/utils/calendar'
import { createId } from '@/shared/utils/id'
import {
  formatExtendedMinutes,
  formatMinutesToHhmm,
  mergeOverlappingRanges,
  normalizeGridRange,
  toShiftMinutes,
} from '@/shared/utils/shifts'
import {
  buildWeeklyHoursGroups,
  minutesToHours,
  sumShiftMinutes,
} from '@/modules/scheduler/utils/hours'
import { compareMembersByDuty, isMemberInWeek } from '@/shared/utils/employee'
import { countDaysOffByMember } from '@/modules/scheduler/utils/off'
import { closestShiftIndex, MAX_SHIFTS_PER_ROW } from '@/modules/scheduler/utils/grid'

function dateFromWeekKey(weekKey: WeekKey): Date {
  const [year, month, day] = weekKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const useSchedulerStore = defineStore('scheduler', () => {
  const draft = ref<NewShift | null>(null)
  const error = ref<SchedulerError | null>(null)
  const selectedWeekday = ref<Weekday>('monday')

  function workspace() {
    return useWorkspaceStore()
  }

  function schedulerSettings() {
    return useSchedulerSettingsStore()
  }

  const schedulingWindow = computed(() => schedulerSettings().schedulingWindow)

  function setError(key: MessageKey, params?: Record<string, string | number>): void {
    error.value = { key, params }
  }

  function setShiftRangeError(): void {
    const window = schedulingWindow.value
    setError('errors.shiftRange', {
      min: window.slotMinutes,
      start: formatExtendedMinutes(window.startMinute),
      end: formatExtendedMinutes(window.endMinute),
    })
  }

  const currentWeekKey = computed(() => workspace().currentWeekKey)
  const currentWeekShifts = computed(() => workspace().currentWeekShifts)
  const currentWeekDayOffs = computed(() => workspace().currentWeekDayOffs)
  const members = computed(() => workspace().activeMembers)

  const dayOffCounts = computed(() => countDaysOffByMember(currentWeekDayOffs.value))

  const selectedWeekdayDate = computed(() =>
    weekdayIsoDate(currentWeekKey.value, selectedWeekday.value),
  )
  const weekEndDate = computed(() => weekdayIsoDate(currentWeekKey.value, 'sunday'))
  const weekMembers = computed(() =>
    workspace().activeMembers.filter((member) =>
      isMemberInWeek(member, currentWeekKey.value, weekEndDate.value),
    ),
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
    buildWeeklyHoursGroups(weekMembers.value, currentWeekShifts.value),
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

    if (mode === 'create' && mergedIndexes.length === 0 && others.length >= MAX_SHIFTS_PER_ROW) {
      const closestIndex = closestShiftIndex(range, others)
      if (closestIndex !== -1) {
        const closest = others[closestIndex]
        const relocated: Shift = {
          ...closest,
          startMinute: range.startMinute,
          endMinute: range.endMinute,
        }
        workspace().setShiftsForWeek(
          currentWeekKey.value,
          currentWeekShifts.value.map((s) => (s.id === closest.id ? relocated : s)),
        )
        error.value = null
        return relocated
      }
    }

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
      setError('errors.shiftTimes')
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
    const range = normalizeGridRange(
      input.startMinute,
      input.endMinute,
      schedulingWindow.value,
    )
    if (!range) {
      setShiftRangeError()
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

    const range = normalizeGridRange(
      input.startMinute,
      input.endMinute,
      schedulingWindow.value,
    )
    if (!range) {
      setShiftRangeError()
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

  function resetCurrentWeek(): void {
    workspace().setShiftsForWeek(currentWeekKey.value, [])
    workspace().setDayOffsForWeek(currentWeekKey.value, [])
    error.value = null
  }

  function updateShift(id: string, patch: Partial<NewShift>): void {
    const existing = currentWeekShifts.value.find((shift) => shift.id === id)
    if (!existing) return

    const start = patch.start ?? formatMinutesToHhmm(existing.startMinute)
    const end = patch.end ?? formatMinutesToHhmm(existing.endMinute)
    const range = toShiftMinutes(start, end)
    if (!range) {
      setError('errors.shiftTimes')
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

    workspace().setDayOffsForWeek(currentWeekKey.value, [
      ...current,
      { memberId, weekday: selectedWeekday.value },
    ])

    // A day off takes precedence over a shift: clear any shifts already
    // scheduled for this member on the selected weekday.
    workspace().setShiftsForWeek(
      currentWeekKey.value,
      currentWeekShifts.value.filter(
        (shift) => !(shift.memberId === memberId && shift.weekday === selectedWeekday.value),
      ),
    )
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
    weekEndDate,
    weekMembers,
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
    resetCurrentWeek,
    updateShift,
    clearError,
    daysOffCountFor,
    toggleDayOff,
  }
})
