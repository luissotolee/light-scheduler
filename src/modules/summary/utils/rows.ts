import type { DayOff, Shift, TeamMember, WeekKey, Weekday } from '@/types'
import type { SummaryCell, SummaryRow } from '@/modules/summary/types'
import { WEEKDAY_ORDER, weekdayIsoDate } from '@/shared/utils/calendar'
import {
  contractHoursPeriodOf,
  weeklyHoursFromContract,
} from '@/shared/utils/contractHours'
import {
  compareMembersByDuty,
  isMemberInWeek,
  isMemberOnHoliday,
} from '@/shared/utils/employee'
import { minutesToHours, sumShiftMinutes } from '@/shared/utils/hours'
import { formatExtendedMinutes } from '@/shared/utils/shifts'
import { isMemberSickOnDate } from '@/shared/utils/sickness'

export const SUMMARY_PRINT_MAX_ROW_UNITS = 30
export const SUMMARY_PRINT_MIN_ZOOM = 0.5

export function formatShiftRange(shift: Pick<Shift, 'startMinute' | 'endMinute'>): string {
  return `${formatExtendedMinutes(shift.startMinute)}–${formatExtendedMinutes(shift.endMinute)}`
}

export function isVacationWeek(member: Pick<TeamMember, 'holidays'>, weekKey: WeekKey): boolean {
  return isMemberOnHoliday(member, weekKey)
}

function cellKey(memberId: string, weekday: Weekday): string {
  return `${memberId}:${weekday}`
}

export function buildSummaryRows(params: {
  members: readonly TeamMember[]
  shifts: readonly Shift[]
  dayOffs: readonly DayOff[]
  weekKey: WeekKey
}): SummaryRow[] {
  const { members, shifts, dayOffs, weekKey } = params
  const weekEnd = weekdayIsoDate(weekKey, 'sunday')

  const dayOffKeys = new Set(dayOffs.map((off) => cellKey(off.memberId, off.weekday)))

  const shiftsByDay = new Map<string, Shift[]>()
  const shiftsByMember = new Map<string, Shift[]>()
  for (const shift of shifts) {
    const key = cellKey(shift.memberId, shift.weekday)
    const existing = shiftsByDay.get(key)
    if (existing) existing.push(shift)
    else shiftsByDay.set(key, [shift])

    const memberShifts = shiftsByMember.get(shift.memberId)
    if (memberShifts) memberShifts.push(shift)
    else shiftsByMember.set(shift.memberId, [shift])
  }

  return members
    .filter((member) => isMemberInWeek(member, weekKey, weekEnd))
    .sort(compareMembersByDuty) // Same role/name ordering as the scheduler so summary, PDF, and print agree.
    .map((member) => {
      const isVacation = isVacationWeek(member, weekKey)
      const cells = {} as Record<Weekday, SummaryCell>
      const sickWeekdays = new Set<Weekday>()

      for (const weekday of WEEKDAY_ORDER) {
        if (isVacation) {
          cells[weekday] = { kind: 'vacations' }
          continue
        }

        if (isMemberSickOnDate(member, weekdayIsoDate(weekKey, weekday))) {
          sickWeekdays.add(weekday)
          cells[weekday] = { kind: 'sick' }
          continue
        }

        const key = cellKey(member.id, weekday)
        const dayShifts = shiftsByDay.get(key) ?? []

        if (dayOffKeys.has(key) || dayShifts.length === 0) {
          cells[weekday] = { kind: 'off' }
          continue
        }

        cells[weekday] = {
          kind: 'shifts',
          shifts: [...dayShifts]
            .sort((a, b) => a.startMinute - b.startMinute)
            .map((shift) => ({
              id: shift.id,
              startMinute: shift.startMinute,
              endMinute: shift.endMinute,
              label: formatShiftRange(shift),
            })),
        }
      }

      const totalMinutes = isVacation
        ? 0
        : sumShiftMinutes(
            (shiftsByMember.get(member.id) ?? []).filter(
              (shift) => !sickWeekdays.has(shift.weekday),
            ),
          )
      const totalHours = minutesToHours(totalMinutes)
      const contractHours = weeklyHoursFromContract(
        member.weeklyHours,
        contractHoursPeriodOf(member),
      )

      return {
        memberId: member.id,
        name: member.name,
        isVacation,
        cells,
        totalMinutes,
        totalHours,
        contractHours,
        diffHours: isVacation ? null : totalHours - contractHours,
      }
    })
}

export function summaryRowUnits(rows: readonly SummaryRow[]): number {
  return rows.reduce((total, row) => {
    if (row.isVacation) return total + 1

    const maxShifts = Math.max(
      0,
      ...WEEKDAY_ORDER.map((weekday) => {
        const cell = row.cells[weekday]
        return cell.kind === 'shifts' ? cell.shifts.length : 0
      }),
    )

    return total + Math.ceil(Math.max(1, maxShifts) / 2)
  }, 0)
}

export function computeSummaryPrintZoom(rowUnits: number): number {
  if (rowUnits <= SUMMARY_PRINT_MAX_ROW_UNITS) return 1
  return Math.max(SUMMARY_PRINT_MIN_ZOOM, SUMMARY_PRINT_MAX_ROW_UNITS / rowUnits)
}
