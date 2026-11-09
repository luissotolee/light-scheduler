import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SummaryDayHeader, SummaryRow } from '@/modules/summary/types'
import { buildSummaryPdf, saveSummaryPdf } from '@/modules/summary/utils/pdf'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'
import { WEEKDAY_ORDER, weekdayDayOfMonth } from '@/shared/utils/calendar'
import type { Weekday } from '@/types'

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
        weekRangeLabel: '2 nov – 8 nov, 2026',
        locale: 'es',
      }),
    )

    expect(pdf).toContain(es['summary.title'])
    expect(pdf).toContain(es['summary.employee'])
    expect(pdf).toContain(es['summary.vacations'])
  })

  it('starts a new page when the rows do not fit', () => {
    const rows = Array.from({ length: 80 }, (_, index) => row(`Employee ${index}`))
    const pdf = decode(
      buildSummaryPdf({ rows, days, weekRangeLabel: 'Nov 2 – Nov 8, 2026', locale: 'en' }),
    )

    const pageCount = pdf.match(/\/Type \/Page\b/g)?.length ?? 0
    expect(pageCount).toBeGreaterThan(1)
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

  it('downloads the generated PDF with a timestamped filename', async () => {
    saveSummaryPdf({
      rows: [row('Ada')],
      days,
      weekRangeLabel: 'Nov 2 – Nov 8, 2026',
      locale: 'en',
    })

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
    expect(downloadName).toMatch(/^summary-.*\.pdf$/)

    const blob = blobs[0]
    expect(blob.type).toBe('application/pdf')
    expect(await blob.text()).toContain('%PDF-1.4')
  })
})
