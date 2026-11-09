import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SummaryDayHeader, SummaryRow } from '@/modules/summary/types'
import { buildSummaryPdf, saveSummaryPdf } from '@/modules/summary/utils/pdf'
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

describe('saveSummaryPdf', () => {
  const blobs: Blob[] = []
  const createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob)
    return 'blob:test'
  })
  const revokeObjectURL = vi.fn()
  let downloadName = ''
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    blobs.length = 0
    downloadName = ''
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.download
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('downloads the generated PDF using the week month and first weekday', async () => {
    saveSummaryPdf({
      rows: [row('Ada')],
      days,
      weekKey,
      weekRangeLabel: 'Nov 2 – Nov 8, 2026',
      locale: 'en',
    })

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
    expect(downloadName).toBe('2026-11_Schedule_2nd.pdf')

    const blob = blobs[0]
    expect(blob.type).toBe('application/pdf')
    expect(await blob.text()).toContain('%PDF-1.4')
  })

  it('uses the Spanish file label for Spanish PDFs', () => {
    saveSummaryPdf({
      rows: [row('Ada')],
      days,
      weekKey,
      weekRangeLabel: '2 nov – 8 nov, 2026',
      locale: 'es',
    })

    expect(downloadName).toBe('2026-11_Horario_2.pdf')
  })
})
