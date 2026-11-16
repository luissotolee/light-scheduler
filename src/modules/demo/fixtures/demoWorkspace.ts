import type { CalendarData, HolidayWeek, TeamMember, Shift, DayOff, WeekKey } from '@/types'
import type { PersistedWorkspace } from '@/shared/utils/persistence'
import { WORKSPACE_SCHEMA_VERSION } from '@/shared/utils/persistence'
import {
  addDays,
  addWeeks,
  getIsoWeek,
  getIsoWeekStart,
  getWeekKey,
  isoDateToDate,
  weekdayIsoDate,
} from '@/shared/utils/calendar'
import { DEFAULT_CONTRACT_HOURS_PERIOD } from '@/shared/utils/contractHours'
import { normalizeHolidays } from '@/shared/utils/employee'
import { createId } from '@/shared/utils/id'
import { MOCK_EMPLOYEES } from '@/shared/fixtures/employees'

const HOLIDAY_MEMBER_ID = 'emp-mock-05'
const REST_WARNING_MEMBER_ID = 'emp-mock-04'
const MONTHLY_CONTRACT_MEMBER_ID = 'emp-mock-02'
const MONTH_HOLIDAY_MEMBER_ID = 'emp-mock-03'

function holidayWeekWithinMonth(referenceDate: Date): HolidayWeek {
  const current = getIsoWeek(referenceDate)
  const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0)
  const candidates = [
    getIsoWeek(addWeeks(referenceDate, -1)),
    getIsoWeek(addWeeks(referenceDate, 1)),
  ]

  for (const candidate of candidates) {
    if (candidate.year === current.year && candidate.week === current.week) continue

    const weekStart = getIsoWeekStart(candidate.year, candidate.week)
    const weekEnd = addDays(weekStart, 6)
    if (weekStart <= monthEnd && weekEnd >= monthStart) return candidate
  }

  return current
}

function buildShiftsForWeek(
  _weekKey: WeekKey,
  baseMembers: TeamMember[],
  holidayMemberIds: ReadonlySet<string> = new Set(),
): Shift[] {
  const shifts: Shift[] = []
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

  baseMembers.forEach((member, memberIndex) => {
    if (holidayMemberIds.has(member.id)) return

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

  const monthHoliday = holidayWeekWithinMonth(isoDateToDate(currentWeekKey))
  const sickDate = weekdayIsoDate(currentWeekKey, 'thursday')
  const members = MOCK_EMPLOYEES.map((member): TeamMember => {
    if (member.id === HOLIDAY_MEMBER_ID) {
      return {
        ...member,
        contractHoursPeriod: member.contractHoursPeriod ?? DEFAULT_CONTRACT_HOURS_PERIOD,
        holidays: normalizeHolidays([...member.holidays, getIsoWeek(now)]),
        sickLeaves: member.sickLeaves ?? [],
      }
    }

    if (member.id === MONTHLY_CONTRACT_MEMBER_ID) {
      return {
        ...member,
        weeklyHours: 160,
        contractHoursPeriod: 'month',
        sickLeaves: member.sickLeaves ?? [],
      }
    }

    if (member.id === MONTH_HOLIDAY_MEMBER_ID) {
      return {
        ...member,
        contractHoursPeriod: member.contractHoursPeriod ?? DEFAULT_CONTRACT_HOURS_PERIOD,
        holidays: normalizeHolidays([...member.holidays, monthHoliday]),
        sickLeaves: [{ id: 'sick-demo-01', startDate: sickDate, endDate: sickDate }],
      }
    }

    return {
      ...member,
      contractHoursPeriod: member.contractHoursPeriod ?? DEFAULT_CONTRACT_HOURS_PERIOD,
      sickLeaves: member.sickLeaves ?? [],
    }
  })
  const activeMembers = members.filter((m) => m.active)
  const holidayMemberIds = new Set([HOLIDAY_MEMBER_ID])

  const schedules: Record<WeekKey, Shift[]> = {
    [currentWeekKey]: buildShiftsForWeek(currentWeekKey, activeMembers, holidayMemberIds),
    [prevWeekKey]: buildShiftsForWeek(prevWeekKey, activeMembers),
    [nextWeekKey]: buildShiftsForWeek(nextWeekKey, activeMembers),
  }

  schedules[currentWeekKey].push({
    id: createId(),
    memberId: REST_WARNING_MEMBER_ID,
    weekday: 'sunday',
    startMinute: 21 * 60,
    endMinute: 25 * 60,
  })

  schedules[currentWeekKey] = schedules[currentWeekKey].filter(
    (shift) => !(shift.memberId === MONTH_HOLIDAY_MEMBER_ID && shift.weekday === 'thursday'),
  )

  const dayOffs: Record<WeekKey, DayOff[]> = {
    [currentWeekKey]: buildDayOffsForWeek(currentWeekKey, activeMembers),
    [prevWeekKey]: buildDayOffsForWeek(prevWeekKey, activeMembers),
    [nextWeekKey]: buildDayOffsForWeek(nextWeekKey, activeMembers),
  }

  const calendar: CalendarData = {
    country: 'ES',
    region: 'AN',
    entries: [
      {
        id: 'calendar-demo-public',
        date: weekdayIsoDate(currentWeekKey, 'tuesday'),
        name: 'Public holiday (demo)',
        kind: 'public_holiday',
        countryCode: 'ES',
        region: 'AN',
      },
      {
        id: 'calendar-demo-event',
        date: weekdayIsoDate(currentWeekKey, 'thursday'),
        name: 'Team planning day',
        kind: 'custom_event',
      },
    ],
  }

  return {
    version: WORKSPACE_SCHEMA_VERSION,
    members,
    schedules,
    dayOffs,
    currentWeekKey,
    calendar,
  }
}