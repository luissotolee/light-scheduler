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
  active: boolean
  startDate: string
  endDate?: string
}

export interface NewTeamMember {
  name: string
  duty: Duty
  contract: Contract
  weeklyHours: number
  holidays?: HolidayWeek[]
  email?: string
  phone?: string
  startDate?: string
}

export interface EmployeeCsvRecord extends NewTeamMember {
  active?: boolean
  endDate?: string
}

export interface EmployeeFormInput {
  name: string
  duty: unknown
  contract: unknown
  weeklyHours: unknown
  email: string
  phone: string
  holidays?: HolidayWeek[]
  startDate?: string
}

export interface EmployeeFormErrors {
  name?: string
  duty?: string
  contract?: string
  weeklyHours?: string
  email?: string
  phone?: string
  holidays?: string
  startDate?: string
}

export type EmployeeFormValidation =
  { ok: true; value: NewTeamMember } | { ok: false; errors: EmployeeFormErrors; message: string }

export interface Shift {
  id: string
  memberId: string
  /**
   * The calendar day the shift starts on. Times are wall-clock local minutes.
   */
  weekday: Weekday
  /**
   * Minutes since midnight when the shift starts.
   */
  startMinute: number
  /**
   * Minutes since midnight when the shift ends. May exceed 1440 (up to 1500,
   * i.e. 25:00) to represent a shift that ends on the next calendar day.
   */
  endMinute: number
}

export interface NewShift {
  memberId: string
  weekday: Weekday
  start: string
  end: string
}

export interface DayOff {
  memberId: string
  weekday: Weekday
}

export interface WeekSchedule {
  weekKey: WeekKey
  shifts: Shift[]
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export type RowError = { row: number; message: string }

export type Validated<T> = { ok: true; data: T[] } | { ok: false; errors: RowError[] }
