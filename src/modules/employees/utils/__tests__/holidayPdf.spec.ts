import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildHolidayPdf, saveHolidayPdf } from '@/modules/employees/utils/holidayPdf'
import type { HolidayExportRows } from '@/modules/employees/types'

function decode(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
}

const rows: HolidayExportRows = [
  {
    memberId: 'emp-1',
    name: 'Ada Employee',
    weeks: [
      { year: 2026, week: 20 },
      { year: 2026, week: 21 },
    ],
  },
  {
    memberId: 'emp-2',
    name: 'Bea Employee',
    weeks: [],
  },
]

describe('buildHolidayPdf', () => {
  it('produces a valid PDF with the employee holiday table', () => {
    const pdf = decode(buildHolidayPdf({ rows, year: 2026, locale: 'en' }))

    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf).toContain('/Type /Catalog')
    expect(pdf).toContain('/Type /Page')
    expect(pdf).toContain('Ada Employee')
    expect(pdf).toContain('Bea Employee')
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true)
  })

  it('renders the localized title with the year', () => {
    const english = decode(buildHolidayPdf({ rows, year: 2026, locale: 'en' }))
    const spanish = decode(buildHolidayPdf({ rows, year: 2026, locale: 'es' }))

    expect(english).toContain('Employee Holidays 2026')
    expect(spanish).toContain('Vacaciones de Empleados 2026')
  })

  it('renders the employee and week column headers', () => {
    const english = decode(buildHolidayPdf({ rows, year: 2026, locale: 'en' }))
    const spanish = decode(buildHolidayPdf({ rows, year: 2026, locale: 'es' }))

    expect(english).toContain('Employee')
    for (let week = 1; week <= 6; week += 1) {
      expect(english).toContain(`Week ${week}`)
    }

    expect(spanish).toContain('Empleado')
    for (let week = 1; week <= 6; week += 1) {
      expect(spanish).toContain(`Semana ${week}`)
    }
  })

  it('uses the holiday selector week label format', () => {
    const english = decode(buildHolidayPdf({ rows, year: 2026, locale: 'en' }))
    const spanish = decode(buildHolidayPdf({ rows, year: 2026, locale: 'es' }))

    expect(english).toContain('Week 20')
    expect(english).toContain('May 11')
    expect(english).toContain('May 17')

    expect(spanish).toContain('Semana 20')
    expect(spanish).toContain('may')
  })

  it('starts a new page when the rows do not fit', () => {
    const manyRows = Array.from({ length: 60 }, (_, index) => ({
      memberId: `emp-${index}`,
      name: `Employee ${index + 1}`,
      weeks: [],
    }))

    const pdf = decode(buildHolidayPdf({ rows: manyRows, year: 2026, locale: 'en' }))
    const pageCount = pdf.match(/\/Type \/Page\b/g)?.length ?? 0

    expect(pageCount).toBeGreaterThan(1)
  })
})

describe('saveHolidayPdf', () => {
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

  it('downloads the English filename and PDF blob', async () => {
    saveHolidayPdf({ rows, year: 2026, locale: 'en' })

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
    expect(downloadName).toBe('holidays_employees_2026.pdf')

    const blob = blobs[0]
    expect(blob.type).toBe('application/pdf')
    expect(await blob.text()).toContain('%PDF-1.4')
  })

  it('uses the Spanish filename', () => {
    saveHolidayPdf({ rows, year: 2026, locale: 'es' })

    expect(downloadName).toBe('vacaciones_empleados_2026.pdf')
  })
})
