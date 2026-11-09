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

export interface SummaryShiftsCell {
  kind: 'shifts'
  shifts: SummaryShift[]
}

export type SummaryCell = SummaryVacationCell | SummaryOffCell | SummaryShiftsCell

export interface SummaryRow {
  memberId: string
  name: string
  isVacation: boolean
  cells: Record<Weekday, SummaryCell>
}

export interface SummaryDayHeader {
  weekday: Weekday
  dayOfMonth: number
}
