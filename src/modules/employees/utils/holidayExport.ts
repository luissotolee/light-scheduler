import type { TeamMember } from '@/types'
import { MAX_HOLIDAY_WEEKS_PER_YEAR } from '@/shared/utils/employee'
import { compareMembersByDuty, normalizeHolidays } from '@/shared/utils/employee'
import type { HolidayExportRow, HolidayExportRows } from '@/modules/employees/types'

export const HOLIDAY_EXPORT_COLUMNS = MAX_HOLIDAY_WEEKS_PER_YEAR

export function exportYearOptions(now?: Date): readonly [number, number] {
  const currentYear = now?.getFullYear() ?? new Date().getFullYear()
  return [currentYear, currentYear + 1]
}

export function buildHolidayExportRows(
  members: readonly TeamMember[],
  year: number,
): HolidayExportRows {
  return [...members]
    .filter((member) => member.active)
    .sort((a, b) => compareMembersByDuty(a, b))
    .map((member): HolidayExportRow => {
      const weeks = normalizeHolidays(member.holidays ?? [])
        .filter((holiday) => holiday.year === year)
        .sort((a, b) => a.week - b.week)
        .slice(0, HOLIDAY_EXPORT_COLUMNS)

      return {
        memberId: member.id,
        name: member.name,
        weeks,
      }
    })
}
