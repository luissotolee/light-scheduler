import type { WeekKey } from '@/types'

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

export function formatWeekRange(weekKey: WeekKey): string {
  const start = parseLocalIsoDate(weekKey)
  const end = addDays(start, 6)
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${formatter.format(start)} – ${formatter.format(end)}, ${end.getFullYear()}`
}
