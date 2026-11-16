import type { ContractHoursPeriod, Duty, Shift, TeamMember, WeekKey } from '@/types'
import { weekdayIsoDate } from '@/shared/utils/calendar'
import {
  contractHoursPeriodOf,
  contractMonthForWeek,
  hasHolidayInContractMonth,
  isIsoDateInContractMonth,
  monthlyHoursFromContract,
  weeklyHoursFromContract,
} from '@/shared/utils/contractHours'
import type { ContractMonth } from '@/shared/utils/contractHours'
import { DUTY_SORT_ORDER, compareNames, initialsOf } from '@/shared/utils/employee'
import { minutesToHours, sumShiftMinutes } from '@/shared/utils/hours'

export { initialsOf, minutesToHours, sumShiftMinutes }
export { formatDiff, formatHours } from '@/shared/utils/hours'

export interface MonthlyHoursRow {
  currentHours: number
  contractHours: number
  diffHours: number
  hasHoliday: boolean
}

export interface WeeklyHoursRow {
  memberId: string
  name: string
  initials: string
  currentHours: number
  contractHours: number
  diffHours: number
  contractHoursAmount: number
  contractHoursPeriod: ContractHoursPeriod
  monthlyHours: MonthlyHoursRow | null
}

export interface WeeklyHoursGroup {
  duty: Duty
  rows: WeeklyHoursRow[]
}

function monthlyMinutesByMember(
  schedules: Readonly<Record<WeekKey, Shift[]>>,
  month: ContractMonth,
): Map<string, number> {
  const minutesByMember = new Map<string, number>()

  for (const [weekKey, shifts] of Object.entries(schedules)) {
    for (const shift of shifts) {
      if (!isIsoDateInContractMonth(weekdayIsoDate(weekKey, shift.weekday), month)) continue

      const current = minutesByMember.get(shift.memberId) ?? 0
      minutesByMember.set(shift.memberId, current + (shift.endMinute - shift.startMinute))
    }
  }

  return minutesByMember
}

export function buildWeeklyHoursGroups(
  members: readonly TeamMember[],
  shifts: readonly Shift[],
  schedules: Readonly<Record<WeekKey, Shift[]>> = {},
  weekKey?: WeekKey,
): WeeklyHoursGroup[] {
  const minutesByMember = new Map<string, number>()
  for (const shift of shifts) {
    const current = minutesByMember.get(shift.memberId) ?? 0
    minutesByMember.set(shift.memberId, current + (shift.endMinute - shift.startMinute))
  }

  const month = weekKey ? contractMonthForWeek(weekKey) : null
  const monthlyMinutes = month ? monthlyMinutesByMember(schedules, month) : null

  const rowsByDuty = new Map<Duty, WeeklyHoursRow[]>()
  for (const member of members) {
    const period = contractHoursPeriodOf(member)
    const currentHours = minutesToHours(minutesByMember.get(member.id) ?? 0)
    const contractHours = weeklyHoursFromContract(member.weeklyHours, period)

    let monthlyHours: MonthlyHoursRow | null = null
    if (month && monthlyMinutes) {
      const monthlyCurrentHours = minutesToHours(monthlyMinutes.get(member.id) ?? 0)
      const monthlyContractHours = monthlyHoursFromContract(member.weeklyHours, period)
      monthlyHours = {
        currentHours: monthlyCurrentHours,
        contractHours: monthlyContractHours,
        diffHours: monthlyCurrentHours - monthlyContractHours,
        hasHoliday: hasHolidayInContractMonth(member.holidays, month),
      }
    }

    const rows = rowsByDuty.get(member.duty) ?? []
    rows.push({
      memberId: member.id,
      name: member.name,
      initials: initialsOf(member.name),
      currentHours,
      contractHours,
      diffHours: currentHours - contractHours,
      contractHoursAmount: member.weeklyHours,
      contractHoursPeriod: period,
      monthlyHours,
    })
    rowsByDuty.set(member.duty, rows)
  }

  const groups: WeeklyHoursGroup[] = []
  for (const duty of DUTY_SORT_ORDER) {
    const rows = rowsByDuty.get(duty)
    if (!rows || rows.length === 0) continue
    rows.sort((a, b) => compareNames(a.name, b.name) || a.memberId.localeCompare(b.memberId))
    groups.push({ duty, rows })
  }

  return groups
}
