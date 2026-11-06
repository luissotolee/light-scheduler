export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type WeekKey = string

export interface TeamMember {
  id: string
  name: string
  email?: string
}

export interface NewTeamMember {
  name: string
  email?: string
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
