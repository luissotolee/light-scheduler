import { describe, expect, it } from 'vitest'
import { exportYearOptions, buildHolidayExportRows } from '@/modules/employees/utils/holidayExport'
import type { TeamMember, HolidayWeek } from '@/types'

describe('exportYearOptions', () => {
  it('returns current year and next year by default', () => {
    const options = exportYearOptions()
    expect(options).toEqual([new Date().getFullYear(), new Date().getFullYear() + 1])
  })

  it('accepts a custom date', () => {
    const options = exportYearOptions(new Date('2023-06-15'))
    expect(options).toEqual([2023, 2024])
  })
})

describe('buildHolidayExportRows', () => {
  const mockMembers: TeamMember[] = [
    {
      id: 'employee-b',
      empId: 'EMP-0002',
      name: 'Bea Employee',
      duty: 'employee',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [{ year: 2026, week: 20 }, { year: 2026, week: 21 }, { year: 2027, week: 15 }],
      active: true,
      startDate: '2025-01-01',
    },
    {
      id: 'employee-a',
      empId: 'EMP-0003',
      name: 'Ada Employee',
      duty: 'employee',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [{ year: 2026, week: 29 }],
      active: true,
      startDate: '2025-01-01',
    },
    {
      id: 'manager',
      empId: 'EMP-0004',
      name: 'Max Manager',
      duty: 'manager',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [{ year: 2026, week: 10 }],
      active: true,
      startDate: '2025-01-01',
    },
    {
      id: 'assistant',
      empId: 'EMP-0005',
      name: 'Al Assistant',
      duty: 'assistant',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [{ year: 2026, week: 5 }],
      active: true,
      startDate: '2025-01-01',
    },
    {
      id: 'head',
      empId: 'EMP-0006',
      name: 'Hana Head',
      duty: 'head_manager',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [{ year: 2026, week: 15 }],
      active: true,
      startDate: '2025-01-01',
    },
    {
      id: 'inactive',
      empId: 'EMP-0007',
      name: 'Inactive User',
      duty: 'employee',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [],
      active: false,
      startDate: '2025-01-01',
    },
  ]

  it('filters out inactive employees', () => {
    const rows = buildHolidayExportRows(mockMembers, 2026)
    const memberIds = rows.map((row) => row.memberId)

    expect(memberIds).toContain('head')
    expect(memberIds).toContain('assistant')
    expect(memberIds).toContain('manager')
    expect(memberIds).toContain('employee-a')
    expect(memberIds).toContain('employee-b')
    expect(memberIds).not.toContain('inactive')
  })

  it('includes only holidays for the specified year', () => {
    const rows = buildHolidayExportRows(mockMembers, 2026)
    const adaRow = rows.find((row) => row.memberId === 'employee-a')

    expect(adaRow).toBeDefined()
    expect(adaRow?.weeks).toEqual([{ year: 2026, week: 29 }])

    const beaRow = rows.find((row) => row.memberId === 'employee-b')
    expect(beaRow?.weeks).toEqual([
      { year: 2026, week: 20 },
      { year: 2026, week: 21 },
    ])
  })

  it('excludes holidays from other years', () => {
    const rows = buildHolidayExportRows(mockMembers, 2026)
    const beaRow = rows.find((row) => row.memberId === 'employee-b')

    expect(beaRow?.weeks).not.toContainEqual({ year: 2027, week: 15 })
  })

  it('normalizes and deduplicates holidays', () => {
    const memberWithDupes: TeamMember = {
      id: 'dup-member',
      empId: 'EMP-0008',
      name: 'Duplicate Member',
      duty: 'employee',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [
        { year: 2026, week: 20 },
        { year: 2026, week: 20 },
        { year: 2026, week: 20 },
        { year: 2026, week: 21 },
      ],
      active: true,
      startDate: '2025-01-01',
    }

    const rows = buildHolidayExportRows([memberWithDupes], 2026)
    const row = rows[0]

    expect(row.weeks).toHaveLength(2)
    expect(row.weeks).toEqual([
      { year: 2026, week: 20 },
      { year: 2026, week: 21 },
    ])
  })

  it('respects the MAX_HOLIDAY_WEEKS_PER_YEAR limit in tests', () => {
    const manyHolidays: HolidayWeek[] = Array.from({ length: 10 }, (_, i) => ({
      year: 2026,
      week: i + 1,
    }))

    const memberWithMany: TeamMember = {
      id: 'many-holidays',
      empId: 'EMP-0009',
      name: 'Many Holidays Member',
      duty: 'employee',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: manyHolidays,
      active: true,
      startDate: '2025-01-01',
    }

    const rows = buildHolidayExportRows([memberWithMany], 2026)
    const row = rows[0]

    expect(row.weeks).toHaveLength(6)
  })

  it('orders employees by duty (head_manager → assistant → manager → employee), then name, then id', () => {
    const rows = buildHolidayExportRows(mockMembers, 2026)
    const memberIds = rows.map((row) => row.memberId)

    expect(memberIds).toEqual(['head', 'assistant', 'manager', 'employee-a', 'employee-b'])
  })

  it('includes members with no holidays for the year', () => {
    const memberNoHolidays: TeamMember = {
      id: 'no-holidays',
      empId: 'EMP-0010',
      name: 'No Holidays',
      duty: 'employee',
      contract: 'fulltime',
      weeklyHours: 40,
      holidays: [],
      active: true,
      startDate: '2025-01-01',
    }

    const rows = buildHolidayExportRows([memberNoHolidays], 2026)
    const row = rows[0]

    expect(row.weeks).toEqual([])
  })
})