import type { Locale } from '@/shared/i18n'
import { messages, translate } from '@/shared/i18n'
import type { MessageKey } from '@/shared/i18n'
import type { SummaryDayHeader, SummaryRow } from '@/modules/summary/types'
import type { WeekKey } from '@/types'
import { formatOrdinal, isoDateToDate } from '@/shared/utils/calendar'
import { downloadBlob } from '@/shared/utils/download'
import { pdfNumber, pdfColor, drawTextAt, fitText, assemblePdf } from '@/shared/utils/pdf'

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
    ...drawTextAt(
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
    ...drawTextAt(PAGE_WIDTH / 2, y - RANGE_SIZE, input.weekRangeLabel, RANGE_SIZE, false, 'center'),
  )
  y -= RANGE_SIZE + 10

  const headerBottom = y - HEADER_HEIGHT
  layout.ops.push(pdfColor(COLORS.headerFill, 'rg'))
  layout.ops.push(
    `${pdfNumber(MARGIN)} ${pdfNumber(headerBottom)} ${pdfNumber(TABLE_WIDTH)} ${pdfNumber(HEADER_HEIGHT)} re f`,
  )

  const blockCenter = y - HEADER_HEIGHT / 2
  layout.ops.push(
    ...drawTextAt(
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
      ...drawTextAt(
        centerX,
        blockCenter + 4.5,
        translate(messages[input.locale], `weekday.${day.weekday}` as MessageKey),
        HEADER_SIZE,
        true,
        'center',
      ),
    )
    layout.ops.push(
      ...drawTextAt(
        centerX,
        blockCenter - 4,
        formatOrdinal(day.dayOfMonth, input.locale),
        HEADER_DATE_SIZE,
        false,
        'center',
      ),
    )
  })

  layout.ops.push(pdfColor(COLORS.grid, 'RG'))
  layout.ops.push(`${pdfNumber(GRID_WIDTH)} w`)
  layout.ops.push(
    `${pdfNumber(MARGIN)} ${pdfNumber(headerBottom)} ${pdfNumber(TABLE_WIDTH)} ${pdfNumber(HEADER_HEIGHT)} re S`,
  )
  for (let index = 1; index < input.days.length; index += 1) {
    const x = MARGIN + EMPLOYEE_COLUMN_WIDTH + DAY_COLUMN_WIDTH * index
    layout.ops.push(`${pdfNumber(x)} ${pdfNumber(headerBottom)} m ${pdfNumber(x)} ${pdfNumber(y)} l S`)
  }
  const employeeDivider = MARGIN + EMPLOYEE_COLUMN_WIDTH
  layout.ops.push(
    `${pdfNumber(employeeDivider)} ${pdfNumber(headerBottom)} m ${pdfNumber(employeeDivider)} ${pdfNumber(y)} l S`,
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
    layout.ops.push(pdfColor(COLORS.vacationFill, 'rg'))
    layout.ops.push(`${pdfNumber(MARGIN)} ${pdfNumber(bottom)} ${pdfNumber(TABLE_WIDTH)} ${pdfNumber(height)} re f`)
  } else {
    layout.ops.push(pdfColor(COLORS.employeeFill, 'rg'))
    layout.ops.push(
      `${pdfNumber(MARGIN)} ${pdfNumber(bottom)} ${pdfNumber(EMPLOYEE_COLUMN_WIDTH)} ${pdfNumber(height)} re f`,
    )
  }

  layout.ops.push(pdfColor(COLORS.grid, 'RG'))
  layout.ops.push(`${pdfNumber(GRID_WIDTH)} w`)
  layout.ops.push(`${pdfNumber(MARGIN)} ${pdfNumber(bottom)} ${pdfNumber(EMPLOYEE_COLUMN_WIDTH)} ${pdfNumber(height)} re S`)

  const employeeName = fitText(
    row.name,
    EMPLOYEE_COLUMN_WIDTH - CELL_PADDING * 2,
    BODY_BOLD_SIZE,
    true,
  )
  layout.ops.push(
    ...drawTextAt(
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
      `${pdfNumber(MARGIN + EMPLOYEE_COLUMN_WIDTH)} ${pdfNumber(bottom)} ${pdfNumber(TABLE_WIDTH - EMPLOYEE_COLUMN_WIDTH)} ${pdfNumber(height)} re S`,
    )
    layout.ops.push(
      ...drawTextAt(
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
      layout.ops.push(pdfColor(COLORS.offFill, 'rg'))
      layout.ops.push(`${pdfNumber(x)} ${pdfNumber(bottom)} ${pdfNumber(DAY_COLUMN_WIDTH)} ${pdfNumber(height)} re f`)
    }

    layout.ops.push(`${pdfNumber(x)} ${pdfNumber(bottom)} ${pdfNumber(DAY_COLUMN_WIDTH)} ${pdfNumber(height)} re S`)

    const centerX = x + DAY_COLUMN_WIDTH / 2
    const centerY = (top + bottom) / 2
    const maxWidth = DAY_COLUMN_WIDTH - CELL_PADDING * 2

    if (cell.kind === 'off') {
      layout.ops.push(...drawTextAt(centerX, centerY, labels.off, BODY_SIZE, false, 'center'))
    } else if (cell.kind === 'shifts') {
      const lines = cell.shifts.map((shift) => fitText(shift.label, maxWidth, BODY_SIZE))
      const blockHeight = lines.length * LINE_HEIGHT
      lines.forEach((line, lineIndex) => {
        const lineCenter = centerY + blockHeight / 2 - (lineIndex + 0.5) * LINE_HEIGHT
        layout.ops.push(...drawTextAt(centerX, lineCenter, line, BODY_SIZE, false, 'center'))
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

  return assemblePdf(layout.pages, PAGE_WIDTH, PAGE_HEIGHT)
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
