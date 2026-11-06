export type Weekday =
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export type WeekKey = string

export type Duty = 'manager' | 'employee' | 'assistant' | 'head_manager'

export type Contract = 'fulltime' | 'part_time' | 'weekends'

export interface HolidayWeek {
  year: number
  week: number
}

export interface HolidayWeekOption {
  year: number
  week: number
  label: string
}

export interface TeamMember {
  id: string
  name: string
  duty: Duty
  contract: Contract
  weeklyHours: number
  holidays: HolidayWeek[]
  email?: string
  phone?: string
}

export interface NewTeamMember {
  name: string
  duty: Duty
  contract: Contract
  weeklyHours: number
  holidays?: HolidayWeek[]
  email?: string
  phone?: string
}

export interface Shift {
  id: string
  memberId: string
  weekday: Weekday
  startMinute: number
  endMinute: number
}

export interface NewShift {
  memberId: string
  weekday: Weekday
  start: string
  end: string
}

export interface WeekSchedule {
  weekKey: WeekKey
  shifts: Shift[]
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export type RowError = { row: number; message: string }

export type Validated<T> = { ok: true; data: T[] } | { ok: false; errors: RowError[] }
