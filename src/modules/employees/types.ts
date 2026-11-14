import type { HolidayWeek } from '@/types'

export interface HolidayExportRow {
  memberId: string
  name: string
  weeks: HolidayWeek[]
}

export type HolidayExportRows = HolidayExportRow[]