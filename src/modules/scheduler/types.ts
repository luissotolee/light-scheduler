import type { SchedulerSettings, Shift, SlotMinutes, TeamMember } from '@/types'
import type { MessageKey } from '@/shared/i18n/messages/en'

export type { SchedulerSettings, SlotMinutes }

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
  isHoliday: boolean
  daysOffCount: number
}

export interface SchedulerError {
  key: MessageKey
  params?: Record<string, string | number>
}
