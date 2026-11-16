import type { ContractHoursPeriod, HolidayWeek, TeamMember, WeekKey } from '@/types'
import { addDays, getIsoWeekStart, isoDateToDate, toLocalIsoDate } from '@/shared/utils/calendar'

export const CONTRACT_HOURS_PERIODS: readonly ContractHoursPeriod[] = ['week', 'month', 'year']

export const DEFAULT_CONTRACT_HOURS_PERIOD: ContractHoursPeriod = 'week'

export const WEEKS_PER_YEAR = 52
export const MONTHS_PER_YEAR = 12
export const DAYS_PER_WEEK = 7
export const HOURS_PER_DAY = 24

export const MAX_WEEKLY_CONTRACT_HOURS = DAYS_PER_WEEK * HOURS_PER_DAY
export const MAX_MONTHLY_CONTRACT_HOURS = 31 * HOURS_PER_DAY
export const MAX_YEARLY_CONTRACT_HOURS = 366 * HOURS_PER_DAY

export interface ContractMonth {
  year: number
  /** Zero-based month index, matching `Date#getMonth`. */
  month: number
  startIso: string
  endIso: string
}

export function isContractHoursPeriod(value: unknown): value is ContractHoursPeriod {
  return value === 'week' || value === 'month' || value === 'year'
}

export function parseContractHoursPeriod(value: unknown): ContractHoursPeriod | null {
  return isContractHoursPeriod(value) ? value : null
}

export function maxContractHours(period: ContractHoursPeriod): number {
  if (period === 'month') return MAX_MONTHLY_CONTRACT_HOURS
  if (period === 'year') return MAX_YEARLY_CONTRACT_HOURS
  return MAX_WEEKLY_CONTRACT_HOURS
}

export function parseContractHoursAmount(
  value: unknown,
  period: ContractHoursPeriod = DEFAULT_CONTRACT_HOURS_PERIOD,
): number | null {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value.trim())
        : Number.NaN

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > maxContractHours(period)) return null
  return parsed
}

export function contractHoursPeriodOf(
  member: Pick<TeamMember, 'contractHoursPeriod'>,
): ContractHoursPeriod {
  return member.contractHoursPeriod ?? DEFAULT_CONTRACT_HOURS_PERIOD
}

export function weeklyHoursFromContract(
  amount: number,
  period: ContractHoursPeriod = DEFAULT_CONTRACT_HOURS_PERIOD,
): number {
  if (period === 'month') return (amount * MONTHS_PER_YEAR) / WEEKS_PER_YEAR
  if (period === 'year') return amount / WEEKS_PER_YEAR
  return amount
}

export function monthlyHoursFromContract(
  amount: number,
  period: ContractHoursPeriod = DEFAULT_CONTRACT_HOURS_PERIOD,
): number {
  if (period === 'month') return amount
  if (period === 'year') return amount / MONTHS_PER_YEAR
  return (amount * WEEKS_PER_YEAR) / MONTHS_PER_YEAR
}

export function yearlyHoursFromContract(
  amount: number,
  period: ContractHoursPeriod = DEFAULT_CONTRACT_HOURS_PERIOD,
): number {
  if (period === 'year') return amount
  if (period === 'month') return amount * MONTHS_PER_YEAR
  return amount * WEEKS_PER_YEAR
}

/**
 * The contract month is the calendar month of the Monday that starts the given
 * week. Weeks are Monday-based, so a week that starts on the last day of a
 * month still belongs to that month, and a week that starts on the first day of
 * a month belongs to the new month.
 */
export function contractMonthForWeek(weekKey: WeekKey): ContractMonth {
  const monday = isoDateToDate(weekKey)
  const year = monday.getFullYear()
  const month = monday.getMonth()

  return {
    year,
    month,
    startIso: toLocalIsoDate(new Date(year, month, 1)),
    endIso: toLocalIsoDate(new Date(year, month + 1, 0)),
  }
}

export function isIsoDateInContractMonth(isoDate: string, month: ContractMonth): boolean {
  return isoDate >= month.startIso && isoDate <= month.endIso
}

export function hasHolidayInContractMonth(
  holidays: readonly HolidayWeek[],
  month: ContractMonth,
): boolean {
  return holidays.some((holiday) => {
    const weekStart = getIsoWeekStart(holiday.year, holiday.week)
    const weekEnd = addDays(weekStart, 6)
    return (
      toLocalIsoDate(weekStart) <= month.endIso && toLocalIsoDate(weekEnd) >= month.startIso
    )
  })
}
