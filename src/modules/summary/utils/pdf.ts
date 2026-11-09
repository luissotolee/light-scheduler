import type { Locale } from '@/shared/i18n'
import { messages, translate } from '@/shared/i18n'
import type { MessageKey } from '@/shared/i18n'
import type { SummaryDayHeader, SummaryRow } from '@/modules/summary/types'
import type { WeekKey } from '@/types'
import { formatOrdinal, isoDateToDate } from '@/shared/utils/calendar'
import { downloadBlob } from '@/shared/utils/download'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 28
const TABLE_WIDTH = PAGE_WIDTH - MARGIN * 2
const EMPLOYEE_COLUMN_WIDTH = 105
const DAY_COLUMN_WIDTH = (TABLE_WIDTH - EMPLOYEE_COLUMN_WIDTH) / 7
const TITLE_SIZE = 12
const RANGE_SIZE = 9
const HEADER_SIZE = 7.5
const HEADER_DATE_SIZE = 6.5
const BODY_SIZE = 7
const BODY_BOLD_SIZE = 7.5
const HEADER_HEIGHT = 24
const MIN_ROW_HEIGHT = 18
const LINE_HEIGHT = 8.5
const CELL_PADDING = 2.5
const GRID_WIDTH = 0.5

const COLORS = {
  grid: [0.35, 0.35, 0.35] as const,
  headerFill: [0.843, 0.89, 0.945] as const,
  employeeFill: [0.929, 0.953, 0.976] as const,
  offFill: [0.886, 0.914, 0.941] as const,
  vacationFill: [0.996, 0.953, 0.78] as const,
}

const WIN_ANSI_SPECIAL: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  ƒ: 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  ˆ: 0x88,
  '‰': 0x89,
  Š: 0x8a,
  '‹': 0x8b,
  Œ: 0x8c,
  Ž: 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  š: 0x9a,
  '›': 0x9b,
  œ: 0x9c,
  ž: 0x9e,
  Ÿ: 0x9f,
}

function encodeWinAnsi(text: string): string {
  let encoded = ''
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 63
    if (codePoint === 0xa0) {
      encoded += ' '
    } else if (codePoint > 0x1f && codePoint < 0x100) {
      encoded += String.fromCharCode(codePoint)
    } else {
      encoded += String.fromCharCode(WIN_ANSI_SPECIAL[char] ?? 63)
    }
  }
  return encoded
}

function escapePdfText(text: string): string {
  return text.replace(/[\\()]/g, (match) => `\\${match}`)
}

function charWidth(char: string): number {
  if (char === ' ') return 0.28
  if ('iljtfr'.includes(char)) return 0.3
  if ('mwMW'.includes(char)) return 0.85
  if (char >= 'A' && char <= 'Z') return 0.68
  if (char >= '0' && char <= '9') return 0.56
  return 0.55
}

function textWidth(text: string, size: number, bold = false): number {
  let units = 0
  for (const char of text) units += charWidth(char)
  return units * size * (bold ? 1.06 : 1)
}

function fitText(text: string, maxWidth: number, size: number, bold = false): string {
  if (textWidth(text, size, bold) <= maxWidth) return text

  let result = ''
  for (const char of text) {
    if (textWidth(`${result}${char}…`, size, bold) > maxWidth) break
    result += char
  }
  return result ? `${result}…` : ''
}

function num(value: number): string {
  return value.toFixed(2)
}

function color(values: readonly number[], operator: 'rg' | 'RG'): string {
  return `${values.map((value) => num(value)).join(' ')} ${operator}`
}

function drawAt(
  x: number,
  centerY: number,
  text: string,
  size: number,
  bold: boolean,
  align: 'left' | 'center',
): string[] {
  const font = bold ? 'F2' : 'F1'
  const baseline = centerY - size * 0.35
  const startX = align === 'center' ? x - textWidth(text, size, bold) / 2 : x
  return [
    'BT',
    `/${font} ${num(size)} Tf`,
    '0 0 0 rg',
    `1 0 0 1 ${num(startX)} ${num(baseline)} Tm`,
    `(${escapePdfText(encodeWinAnsi(text))}) Tj`,
    'ET',
  ]
}

function rowHeight(row: SummaryRow, days: readonly SummaryDayHeader[]): number {
  if (row.isVacation) return MIN_ROW_HEIGHT

  let lines = 1
  for (const day of days) {
    const cell = row.cells[day.weekday]
    if (cell.kind === 'shifts') lines = Math.max(lines, cell.shifts.length)
  }
  return Math.max(MIN_ROW_HEIGHT, lines * LINE_HEIGHT + 7)
}

interface PdfLayout {
  ops: string[]
  pages: string[][]
  y: number
}

function beginPage(layout: PdfLayout, input: SummaryPdfInput): void {
  if (layout.ops.length > 0) layout.pages.push(layout.ops)
  layout.ops = []

  let y = PAGE_HEIGHT - MARGIN

  layout.ops.push(
    ...drawAt(
      PAGE_WIDTH / 2,
      y - TITLE_SIZE,
      translate(messages[input.locale], 'summary.title'),
      TITLE_SIZE,
      true,
      'center',
    ),
  )
  y -= TITLE_SIZE + 4

  layout.ops.push(
    ...drawAt(PAGE_WIDTH / 2, y - RANGE_SIZE, input.weekRangeLabel, RANGE_SIZE, false, 'center'),
  )
  y -= RANGE_SIZE + 10

  const headerBottom = y - HEADER_HEIGHT
  layout.ops.push(color(COLORS.headerFill, 'rg'))
  layout.ops.push(
    `${num(MARGIN)} ${num(headerBottom)} ${num(TABLE_WIDTH)} ${num(HEADER_HEIGHT)} re f`,
  )

  const blockCenter = y - HEADER_HEIGHT / 2
  layout.ops.push(
    ...drawAt(
      MARGIN + CELL_PADDING,
      blockCenter,
      translate(messages[input.locale], 'summary.employee'),
      HEADER_SIZE,
      true,
      'left',
    ),
  )

  input.days.forEach((day, index) => {
    const centerX = MARGIN + EMPLOYEE_COLUMN_WIDTH + DAY_COLUMN_WIDTH * index + DAY_COLUMN_WIDTH / 2
    layout.ops.push(
      ...drawAt(
        centerX,
        blockCenter + 4.5,
        translate(messages[input.locale], `weekday.${day.weekday}` as MessageKey),
        HEADER_SIZE,
        true,
        'center',
      ),
    )
    layout.ops.push(
      ...drawAt(
        centerX,
        blockCenter - 4,
        formatOrdinal(day.dayOfMonth, input.locale),
        HEADER_DATE_SIZE,
        false,
        'center',
      ),
    )
  })

  layout.ops.push(color(COLORS.grid, 'RG'))
  layout.ops.push(`${num(GRID_WIDTH)} w`)
  layout.ops.push(
    `${num(MARGIN)} ${num(headerBottom)} ${num(TABLE_WIDTH)} ${num(HEADER_HEIGHT)} re S`,
  )
  for (let index = 1; index < input.days.length; index += 1) {
    const x = MARGIN + EMPLOYEE_COLUMN_WIDTH + DAY_COLUMN_WIDTH * index
    layout.ops.push(`${num(x)} ${num(headerBottom)} m ${num(x)} ${num(y)} l S`)
  }
  const employeeDivider = MARGIN + EMPLOYEE_COLUMN_WIDTH
  layout.ops.push(
    `${num(employeeDivider)} ${num(headerBottom)} m ${num(employeeDivider)} ${num(y)} l S`,
  )

  layout.y = headerBottom
}

function drawRow(
  layout: PdfLayout,
  row: SummaryRow,
  days: readonly SummaryDayHeader[],
  labels: { off: string; vacations: string },
): void {
  const height = rowHeight(row, days)
  const top = layout.y
  const bottom = top - height

  if (row.isVacation) {
    layout.ops.push(color(COLORS.vacationFill, 'rg'))
    layout.ops.push(`${num(MARGIN)} ${num(bottom)} ${num(TABLE_WIDTH)} ${num(height)} re f`)
  } else {
    layout.ops.push(color(COLORS.employeeFill, 'rg'))
    layout.ops.push(
      `${num(MARGIN)} ${num(bottom)} ${num(EMPLOYEE_COLUMN_WIDTH)} ${num(height)} re f`,
    )
  }

  layout.ops.push(color(COLORS.grid, 'RG'))
  layout.ops.push(`${num(GRID_WIDTH)} w`)
  layout.ops.push(`${num(MARGIN)} ${num(bottom)} ${num(EMPLOYEE_COLUMN_WIDTH)} ${num(height)} re S`)

  const employeeName = fitText(
    row.name,
    EMPLOYEE_COLUMN_WIDTH - CELL_PADDING * 2,
    BODY_BOLD_SIZE,
    true,
  )
  layout.ops.push(
    ...drawAt(
      MARGIN + CELL_PADDING,
      (top + bottom) / 2,
      employeeName,
      BODY_BOLD_SIZE,
      true,
      'left',
    ),
  )

  if (row.isVacation) {
    layout.ops.push(
      `${num(MARGIN + EMPLOYEE_COLUMN_WIDTH)} ${num(bottom)} ${num(TABLE_WIDTH - EMPLOYEE_COLUMN_WIDTH)} ${num(height)} re S`,
    )
    layout.ops.push(
      ...drawAt(
        MARGIN + EMPLOYEE_COLUMN_WIDTH + (TABLE_WIDTH - EMPLOYEE_COLUMN_WIDTH) / 2,
        (top + bottom) / 2,
        labels.vacations,
        BODY_BOLD_SIZE,
        true,
        'center',
      ),
    )
    layout.y = bottom
    return
  }

  days.forEach((day, index) => {
    const x = MARGIN + EMPLOYEE_COLUMN_WIDTH + DAY_COLUMN_WIDTH * index
    const cell = row.cells[day.weekday]

    if (cell.kind === 'off') {
      layout.ops.push(color(COLORS.offFill, 'rg'))
      layout.ops.push(`${num(x)} ${num(bottom)} ${num(DAY_COLUMN_WIDTH)} ${num(height)} re f`)
    }

    layout.ops.push(`${num(x)} ${num(bottom)} ${num(DAY_COLUMN_WIDTH)} ${num(height)} re S`)

    const centerX = x + DAY_COLUMN_WIDTH / 2
    const centerY = (top + bottom) / 2
    const maxWidth = DAY_COLUMN_WIDTH - CELL_PADDING * 2

    if (cell.kind === 'off') {
      layout.ops.push(...drawAt(centerX, centerY, labels.off, BODY_SIZE, false, 'center'))
    } else if (cell.kind === 'shifts') {
      const lines = cell.shifts.map((shift) => fitText(shift.label, maxWidth, BODY_SIZE))
      const blockHeight = lines.length * LINE_HEIGHT
      lines.forEach((line, lineIndex) => {
        const lineCenter = centerY + blockHeight / 2 - (lineIndex + 0.5) * LINE_HEIGHT
        layout.ops.push(...drawAt(centerX, lineCenter, line, BODY_SIZE, false, 'center'))
      })
    }
  })

  layout.y = bottom
}

export interface SummaryPdfInput {
  rows: readonly SummaryRow[]
  days: readonly SummaryDayHeader[]
  weekKey: WeekKey
  weekRangeLabel: string
  locale: Locale
}

export function buildSummaryPdf(input: SummaryPdfInput): Uint8Array<ArrayBuffer> {
  const layout: PdfLayout = { ops: [], pages: [], y: 0 }
  beginPage(layout, input)

  const labels = {
    off: translate(messages[input.locale], 'summary.off'),
    vacations: translate(messages[input.locale], 'summary.vacations'),
  }

  for (const row of input.rows) {
    if (layout.y - rowHeight(row, input.days) < MARGIN) beginPage(layout, input)
    drawRow(layout, row, input.days, labels)
  }

  if (layout.ops.length > 0) layout.pages.push(layout.ops)

  return assemblePdf(layout.pages)
}

function assemblePdf(pages: readonly string[][]): Uint8Array<ArrayBuffer> {
  const objects: string[] = []
  const pageObjectStart = 5
  const kids = pages.map((_, index) => `${pageObjectStart + index * 2} 0 R`).join(' ')

  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  objects.push(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  )

  pages.forEach((ops, index) => {
    const pageObjectId = pageObjectStart + index * 2
    const contentObjectId = pageObjectId + 1
    const content = ops.join('\n')
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(PAGE_WIDTH)} ${num(PAGE_HEIGHT)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
    )
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
  })

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []

  objects.forEach((body, index) => {
    const id = index + 1
    offsets[id] = pdf.length
    pdf += `${id} 0 obj\n${body}\nendobj\n`
  })

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (let id = 1; id <= objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  const bytes = new Uint8Array(new ArrayBuffer(pdf.length))
  for (let index = 0; index < pdf.length; index += 1) {
    bytes[index] = pdf.charCodeAt(index) & 0xff
  }
  return bytes
}

function summaryPdfFilename(input: SummaryPdfInput): string {
  const weekStart = isoDateToDate(input.weekKey)
  const yearMonth = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`
  const day = formatOrdinal(weekStart.getDate(), input.locale)
  const label = translate(messages[input.locale], 'summary.pdfFileLabel')
  return `${yearMonth}_${label}_${day}.pdf`
}

export function saveSummaryPdf(input: SummaryPdfInput): void {
  const bytes = buildSummaryPdf(input)
  downloadBlob(summaryPdfFilename(input), new Blob([bytes], { type: 'application/pdf' }))
}
