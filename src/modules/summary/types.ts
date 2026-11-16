import type { Weekday } from '@/types'

export interface SummaryShift {
  id: string
  startMinute: number
  endMinute: number
  label: string
}

export interface SummaryVacationCell {
  kind: 'vacations'
}

export interface SummaryOffCell {
  kind: 'off'
}

export interface SummarySickCell {
  kind: 'sick'
}

export interface SummaryShiftsCell {
  kind: 'shifts'
  shifts: SummaryShift[]
}

export type SummaryCell = SummaryVacationCell | SummaryOffCell | SummarySickCell | SummaryShiftsCell

export interface SummaryRow {
  memberId: string
  name: string
  isVacation: boolean
  cells: Record<Weekday, SummaryCell>
  totalMinutes: number
  totalHours: number
  contractHours: number
  diffHours: number | null
}

export interface SummaryDayHeader {
  weekday: Weekday
  dayOfMonth: number
}
