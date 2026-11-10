import type { Shift, TeamMember } from '@/types'
import type { MessageKey } from '@/shared/i18n/messages/en'

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

export type SlotMinutes = 15 | 30

export interface SchedulerSettings {
  startTime: string
  endTime: string
  slotMinutes: SlotMinutes
}

export interface SchedulerError {
  key: MessageKey
  params?: Record<string, string | number>
}
