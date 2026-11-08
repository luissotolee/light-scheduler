import type { Shift, TeamMember } from '@/types'

export interface ShiftRangeInput {
  memberId: string
  startMinute: number
  endMinute: number
}

export interface ShiftResizeInput {
  id: string
  startMinute: number
  endMinute: number
}

export interface DayRow {
  member: TeamMember
  bars: Shift[]
  dailyHours: number
  isOff: boolean
  daysOffCount: number
}
