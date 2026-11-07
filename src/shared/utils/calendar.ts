import type { HolidayWeek, HolidayWeekOption, WeekKey } from '@/types'

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function parseLocalIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date)
  const offset = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - offset)
  start.setHours(0, 0, 0, 0)
  return start
}

export function getWeekKey(date: Date): WeekKey {
  return toLocalIsoDate(startOfWeek(date))
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

function formatWeekRangeShort(weekKey: WeekKey): string {
  const start = parseLocalIsoDate(weekKey)
  const end = addDays(start, 6)
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${formatter.format(start)} – ${formatter.format(end)}`
}

export function formatWeekRange(weekKey: WeekKey): string {
  const start = parseLocalIsoDate(weekKey)
  const end = addDays(start, 6)
  return `${formatWeekRangeShort(weekKey)}, ${end.getFullYear()}`
}

export function getIsoWeek(date: Date): { year: number; week: number } {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)

  const yearStart = Date.UTC(target.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((target.getTime() - yearStart) / 86400000 + 1) / 7)

  return { year: target.getUTCFullYear(), week }
}

export function getIsoWeekStart(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4)
  const dayNum = jan4.getDay() || 7
  const weekOneMonday = new Date(year, 0, 4 - (dayNum - 1))
  weekOneMonday.setHours(0, 0, 0, 0)
  return addDays(weekOneMonday, (week - 1) * 7)
}

export function getIsoWeeksInYear(year: number): number {
  return getIsoWeek(new Date(year, 11, 28)).week
}

export function getIsoWeeksForYear(year: number): HolidayWeekOption[] {
  const weeks = getIsoWeeksInYear(year)
  return Array.from({ length: weeks }, (_, index) => {
    const week = index + 1
    const weekKey = getWeekKey(getIsoWeekStart(year, week))
    return { year, week, label: `Week ${week} — ${formatWeekRangeShort(weekKey)}` }
  })
}

export function holidayToWeekKey(holiday: HolidayWeek): WeekKey {
  return getWeekKey(getIsoWeekStart(holiday.year, holiday.week))
}
