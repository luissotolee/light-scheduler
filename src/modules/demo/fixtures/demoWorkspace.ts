import type { TeamMember, Shift, DayOff, WeekKey } from '@/types'
import type { PersistedWorkspace } from '@/shared/utils/persistence'
import { WORKSPACE_SCHEMA_VERSION } from '@/shared/utils/persistence'
import { getWeekKey, addWeeks } from '@/shared/utils/calendar'
import { createId } from '@/shared/utils/id'
import { MOCK_EMPLOYEES } from '@/shared/fixtures/employees'

function buildShiftsForWeek(_weekKey: WeekKey, baseMembers: TeamMember[]): Shift[] {
  const shifts: Shift[] = []
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

  baseMembers.forEach((member, memberIndex) => {
    allDays.forEach((weekday, dayIndex) => {
      if (memberIndex === 3 && weekday === 'saturday') return
      if (memberIndex === 4 && weekday === 'friday') return

      const startHour = 9 + (memberIndex % 3)
      const duration = 4 + (dayIndex % 4)
      const startMinute = startHour * 60
      const endMinute = startMinute + duration * 60

      if (startMinute >= 0 && endMinute <= 1500 && startMinute < endMinute) {
        shifts.push({
          id: createId(),
          memberId: member.id,
          weekday,
          startMinute,
          endMinute,
        })
      }
    })
  })

  return shifts
}

function buildDayOffsForWeek(_weekKey: WeekKey, baseMembers: TeamMember[]): DayOff[] {
  const dayOffs: DayOff[] = []

  if (baseMembers.length > 2) {
    dayOffs.push({
      memberId: baseMembers[2].id,
      weekday: 'wednesday',
    })
  }

  if (baseMembers.length > 0) {
    dayOffs.push({
      memberId: baseMembers[0].id,
      weekday: 'sunday',
    })
  }

  return dayOffs
}

export function buildDemoWorkspace(now: Date = new Date()): PersistedWorkspace {
  const currentWeekKey = getWeekKey(now)
  const prevWeekKey = getWeekKey(addWeeks(now, -1))
  const nextWeekKey = getWeekKey(addWeeks(now, 1))

  const activeMembers = MOCK_EMPLOYEES.filter((m) => m.active)

  const schedules: Record<WeekKey, Shift[]> = {
    [currentWeekKey]: buildShiftsForWeek(currentWeekKey, activeMembers),
    [prevWeekKey]: buildShiftsForWeek(prevWeekKey, activeMembers),
    [nextWeekKey]: buildShiftsForWeek(nextWeekKey, activeMembers),
  }

  const dayOffs: Record<WeekKey, DayOff[]> = {
    [currentWeekKey]: buildDayOffsForWeek(currentWeekKey, activeMembers),
    [prevWeekKey]: buildDayOffsForWeek(prevWeekKey, activeMembers),
    [nextWeekKey]: buildDayOffsForWeek(nextWeekKey, activeMembers),
  }

  return {
    version: WORKSPACE_SCHEMA_VERSION,
    members: MOCK_EMPLOYEES,
    schedules,
    dayOffs,
    currentWeekKey,
  }
}