import type { SchedulerSettings, Shift, SlotMinutes, TeamMember, WeekKey } from '@/types'
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

export interface ShiftMoveInput {
  id: string
  memberId: string
  startMinute: number
  endMinute: number
}

export interface ShiftMoveDrag {
  id: string
  startMinute: number
  endMinute: number
  clientY: number
}

export interface DayRow {
  member: TeamMember
  bars: Shift[]
  dailyHours: number
  isOff: boolean
  isHoliday: boolean
  isSick: boolean
  daysOffCount: number
}

export interface SchedulerError {
  key: MessageKey
  params?: Record<string, string | number>
}

export interface RestConflict {
  shift: Shift
  weekKey: WeekKey
  restMinutes: number
}

export interface PendingRestWarning {
  memberId: string
  memberName: string
  candidate: Shift
  weekKey: WeekKey
  conflicts: RestConflict[]
}
