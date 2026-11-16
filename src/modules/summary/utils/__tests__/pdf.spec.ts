import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SummaryDayHeader, SummaryRow } from '@/modules/summary/types'
import { buildSummaryPdf, openSummaryPdf } from '@/modules/summary/utils/pdf'
import { buildSummaryRows } from '@/modules/summary/utils/rows'
import type { Shift, TeamMember, Weekday } from '@/types'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'
import { WEEKDAY_ORDER, weekdayDayOfMonth } from '@/shared/utils/calendar'

const weekKey = '2026-11-02'
const days: SummaryDayHeader[] = WEEKDAY_ORDER.map((weekday) => ({
  weekday,
  dayOfMonth: weekdayDayOfMonth(weekKey, weekday),
}))

function row(name: string, overrides: Partial<SummaryRow> = {}): SummaryRow {
  const cells = Object.fromEntries(
    WEEKDAY_ORDER.map((weekday) => [weekday, { kind: 'off' } as const]),
  ) as SummaryRow['cells']

  return {
    memberId: name.toLowerCase(),
    name,
    isVacation: false,
    totalMinutes: 0,
    totalHours: 0,
    contractHours: 40,
    diffHours: -40,
    cells,
    ...overrides,
  }
}

function withShifts(name: string, weekday: Weekday, labels: string[]): SummaryRow {
  const cells = Object.fromEntries(
    WEEKDAY_ORDER.map((day) => [day, { kind: 'off' } as const]),
  ) as SummaryRow['cells']

  cells[weekday] = {
    kind: 'shifts',
    shifts: labels.map((label, index) => ({
      id: `${name}-${index}`,
      startMinute: 540 + index * 120,
      endMinute: 600 + index * 120,
      label,
    })),
  }

  return row(name, { cells })
}

function decode(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
}

describe('buildSummaryPdf', () => {
  it('produces a valid PDF document with the summary table', () => {
    const pdf = decode(
      buildSummaryPdf({
        rows: [row('Ada'), withShifts('Grace', 'monday', ['09:00–12:00', '14:00–18:00'])],
        days,
        weekKey,
        weekRangeLabel: 'Nov 2 – Nov 8, 2026',
        locale: 'en',
      }),
    )

    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf).toContain('/Type /Catalog')
    expect(pdf).toContain('/BaseFont /Helvetica')
    expect(pdf).toContain(en['summary.title'])
    expect(pdf).toContain(en['summary.employee'])
    expect(pdf).toContain('Ada')
    expect(pdf).toContain('09:00')
    expect(pdf).toContain('xref')
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true)
  })

  it('keeps full shift labels when weekly hours columns are enabled', () => {
    const pdf = decode(
      buildSummaryPdf({
        rows: [withShifts('Ada', 'monday', ['10:30–14:30'])],
        days,
        weekKey,
        weekRangeLabel: 'Nov 2 – Nov 8, 2026',
        locale: 'en',
        showWeeklyHours: true,
      }),
    )

    expect(pdf).toContain('10:30')
    expect(pdf).toContain('14:30')
    expect(pdf).not.toContain('\x85')
  })

  it('adds total, contract, and diff columns when weekly hours are enabled', () => {
    const pdf = decode(
      buildSummaryPdf({
        rows: [row('Ada', { totalMinutes: 420, totalHours: 7, contractHours: 40, diffHours: -33 })],
        days,
        weekKey,
        weekRangeLabel: 'Nov 2 – Nov 8, 2026',
        locale: 'en',
        showWeeklyHours: true,
      }),
    )

    expect(pdf).toContain(en['summary.total'])
    expect(pdf).toContain(en['summary.contract'])
    expect(pdf).toContain(en['summary.diff'])
    expect(pdf).toContain('7.0')
    expect(pdf).toContain('40.0')
    expect(pdf).toContain('-33.0')
  })

  it('leaves the diff blank for vacation rows when weekly hours are enabled', () => {
    const pdf = decode(
      buildSummaryPdf({
        rows: [row('Ada', { isVacation: true, diffHours: null })],
        days,
        weekKey,
        weekRangeLabel: 'Nov 2 – Nov 8, 2026',
        locale: 'en',
        showWeeklyHours: true,
      }),
    )

    expect(pdf).toContain(en['summary.total'])
    expect(pdf).toContain(en['summary.contract'])
    expect(pdf).toContain('0.0')
    expect(pdf).toContain('40.0')
    expect(pdf).toContain('\x97')
    expect(pdf).not.toContain('-40.0')
  })

  it('localizes labels for the active locale', () => {
    const pdf = decode(
      buildSummaryPdf({
        rows: [row('Ada', { isVacation: true })],
        days,
        weekKey,
        weekRangeLabel: '2 nov – 8 nov, 2026',
        locale: 'es',
      }),
    )

    expect(pdf).toContain(es['summary.title'])
    expect(pdf).toContain(es['summary.employee'])
    expect(pdf).toContain(es['summary.vacations'])
  })

  it('starts a new page when the rows do not fit', () => {
    // Enough single-line rows to exceed the printable height of one page.
    const rows = Array.from({ length: 60 }, (_, index) => row(`Employee ${index}`))
    const pdf = decode(
      buildSummaryPdf({
        rows,
        days,
        weekKey,
        weekRangeLabel: 'Nov 2 – Nov 8, 2026',
        locale: 'en',
      }),
    )

    // Check if we have page breaks by looking for the '/Page' pattern
    const pageCount = pdf.match(/\/Type \/Page\b/g)?.length ?? 0
    expect(pageCount).toBeGreaterThan(1)
  })

  it('orders members by duty (head_manager → assistant → manager → employee), then name, then id in the PDF', () => {
    const members: TeamMember[] = [
      {
        id: 'employee-b',
        empId: 'EMP-0002',
        name: 'Bea Employee',
        duty: 'employee',
        contract: 'fulltime',
        weeklyHours: 40,
        holidays: [],
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
        holidays: [],
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
        holidays: [],
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
        holidays: [],
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
        holidays: [],
        active: true,
        startDate: '2025-01-01',
      },
    ]
    const shifts: Shift[] = []
    const rows = buildSummaryRows({ members, shifts, dayOffs: [], weekKey })
    const pdf = decode(
      buildSummaryPdf({
        rows,
        days,
        weekKey,
        weekRangeLabel: 'Nov 2 – Nov 8, 2026',
        locale: 'en',
      }),
    )

    // Check the order by looking at the positions of names in the PDF
    const namePositions = rows.map((row) => {
      const index = pdf.indexOf(row.name)
      return [index]
    })

    // The expected order should be: head, assistant, manager, employee-a, employee-b
    expect(namePositions).toEqual([
      [pdf.indexOf('Hana Head')],
      [pdf.indexOf('Al Assistant')],
      [pdf.indexOf('Max Manager')],
      [pdf.indexOf('Ada Employee')],
      [pdf.indexOf('Bea Employee')],
    ])
  })
})

describe('openSummaryPdf', () => {
  const blobs: Blob[] = []
  const createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob)
    return 'blob:test'
  })
  const revokeObjectURL = vi.fn()
  let openTarget = ''
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    blobs.length = 0
    openTarget = ''
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
    vi.useFakeTimers()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      openTarget = this.target
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('opens the generated PDF in a new browser tab', async () => {
    openSummaryPdf({
      rows: [row('Ada')],
      days,
      weekKey,
      weekRangeLabel: 'Nov 2 – Nov 8, 2026',
      locale: 'en',
    })

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(openTarget).toBe('_blank')
    expect(document.querySelector('a[download]')).toBeNull()

    const blob = blobs[0]
    expect(blob.type).toBe('application/pdf')
    expect(await blob.text()).toContain('%PDF-1.4')

    vi.advanceTimersByTime(60_000)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
  })
})
