import type { Locale } from '@/shared/i18n'
import { messages, translate } from '@/shared/i18n'
import { formatHolidayWeekLabel } from '@/shared/utils/calendar'
import {
  drawTextAt,
  fitText,
  pdfColor,
  pdfNumber,
  assemblePdf,
} from '@/shared/utils/pdf'
import { downloadBlob } from '@/shared/utils/download'
import { HOLIDAY_EXPORT_COLUMNS } from '@/modules/employees/utils/holidayExport'
import type { HolidayExportRows } from '@/modules/employees/types'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 28
const TABLE_WIDTH = PAGE_WIDTH - MARGIN * 2
const EMPLOYEE_COLUMN_WIDTH = 132
const WEEK_COLUMN_WIDTH = (TABLE_WIDTH - EMPLOYEE_COLUMN_WIDTH) / HOLIDAY_EXPORT_COLUMNS
const TITLE_SIZE = 14
const HEADER_SIZE = 8
const BODY_SIZE = 7
const HEADER_HEIGHT = 22
const ROW_HEIGHT = 20
const CELL_PADDING = 3
const GRID_WIDTH = 0.5
const TITLE_GAP = 12
const LABEL_SEPARATOR = ' — '

const COLORS = {
  headerFill: [0.843, 0.89, 0.945] as const,
  employeeFill: [0.929, 0.953, 0.976] as const,
  grid: [0.35, 0.35, 0.35] as const,
}

export interface HolidayPdfInput {
  rows: HolidayExportRows
  year: number
  locale: Locale
}

function splitLabel(label: string): string[] {
  const separatorIndex = label.indexOf(LABEL_SEPARATOR)
  if (separatorIndex === -1) return [label]

  const head = label.slice(0, separatorIndex).trim()
  const tail = label.slice(separatorIndex + LABEL_SEPARATOR.length).trim()
  return [head, tail]
}

function drawTitle(ops: string[], input: HolidayPdfInput): number {
  const title = translate(messages[input.locale], 'employees.exportHolidays.pdfTitle', {
    year: input.year,
  })

  const centerY = PAGE_HEIGHT - MARGIN - TITLE_SIZE
  ops.push(...drawTextAt(PAGE_WIDTH / 2, centerY, title, TITLE_SIZE, true, 'center'))
  return centerY - TITLE_SIZE / 2 - TITLE_GAP
}

function drawHeader(ops: string[], input: HolidayPdfInput, top: number): number {
  const bottom = top - HEADER_HEIGHT

  ops.push(pdfColor(COLORS.headerFill, 'rg'))
  ops.push(
    `${pdfNumber(MARGIN)} ${pdfNumber(bottom)} ${pdfNumber(TABLE_WIDTH)} ${pdfNumber(HEADER_HEIGHT)} re f`,
  )

  const centerY = top - HEADER_HEIGHT / 2
  const employeeHeader = translate(
    messages[input.locale],
    'employees.exportHolidays.employeeColumn',
  )
  ops.push(
    ...drawTextAt(MARGIN + CELL_PADDING, centerY, employeeHeader, HEADER_SIZE, true, 'left'),
  )

  for (let index = 0; index < HOLIDAY_EXPORT_COLUMNS; index += 1) {
    const centerX = MARGIN + EMPLOYEE_COLUMN_WIDTH + WEEK_COLUMN_WIDTH * index + WEEK_COLUMN_WIDTH / 2
    const label = translate(messages[input.locale], 'employees.exportHolidays.weekColumn', {
      number: index + 1,
    })
    ops.push(...drawTextAt(centerX, centerY, label, HEADER_SIZE, true, 'center'))
  }

  ops.push(pdfColor(COLORS.grid, 'RG'))
  ops.push(`${pdfNumber(GRID_WIDTH)} w`)
  ops.push(
    `${pdfNumber(MARGIN)} ${pdfNumber(bottom)} ${pdfNumber(TABLE_WIDTH)} ${pdfNumber(HEADER_HEIGHT)} re S`,
  )
  const employeeDivider = MARGIN + EMPLOYEE_COLUMN_WIDTH
  ops.push(`${pdfNumber(employeeDivider)} ${pdfNumber(bottom)} m ${pdfNumber(employeeDivider)} ${pdfNumber(top)} l S`)
  for (let index = 1; index < HOLIDAY_EXPORT_COLUMNS; index += 1) {
    const x = MARGIN + EMPLOYEE_COLUMN_WIDTH + WEEK_COLUMN_WIDTH * index
    ops.push(`${pdfNumber(x)} ${pdfNumber(bottom)} m ${pdfNumber(x)} ${pdfNumber(top)} l S`)
  }

  return bottom
}

function drawRow(
  ops: string[],
  input: HolidayPdfInput,
  row: HolidayExportRows[number],
  top: number,
): number {
  const bottom = top - ROW_HEIGHT

  ops.push(pdfColor(COLORS.employeeFill, 'rg'))
  ops.push(
    `${pdfNumber(MARGIN)} ${pdfNumber(bottom)} ${pdfNumber(EMPLOYEE_COLUMN_WIDTH)} ${pdfNumber(ROW_HEIGHT)} re f`,
  )

  ops.push(pdfColor(COLORS.grid, 'RG'))
  ops.push(`${pdfNumber(GRID_WIDTH)} w`)
  ops.push(
    `${pdfNumber(MARGIN)} ${pdfNumber(bottom)} ${pdfNumber(EMPLOYEE_COLUMN_WIDTH)} ${pdfNumber(ROW_HEIGHT)} re S`,
  )

  const name = fitText(row.name, EMPLOYEE_COLUMN_WIDTH - CELL_PADDING * 2, BODY_SIZE, true)
  ops.push(
    ...drawTextAt(
      MARGIN + CELL_PADDING,
      top - ROW_HEIGHT / 2,
      name,
      BODY_SIZE,
      true,
      'left',
    ),
  )

  for (let index = 0; index < HOLIDAY_EXPORT_COLUMNS; index += 1) {
    const x = MARGIN + EMPLOYEE_COLUMN_WIDTH + WEEK_COLUMN_WIDTH * index
    const centerX = x + WEEK_COLUMN_WIDTH / 2

    const holiday = row.weeks[index]
    if (holiday) {
      const lines = splitLabel(formatHolidayWeekLabel(holiday, input.locale))
        .map((line) => fitText(line, WEEK_COLUMN_WIDTH - CELL_PADDING * 2, BODY_SIZE))
        .filter((line) => line.length > 0)

      if (lines.length === 1) {
        ops.push(...drawTextAt(centerX, top - ROW_HEIGHT / 2, lines[0], BODY_SIZE, false, 'center'))
      } else {
        ops.push(...drawTextAt(centerX, top - ROW_HEIGHT / 2 + 3, lines[0], BODY_SIZE, false, 'center'))
        ops.push(...drawTextAt(centerX, top - ROW_HEIGHT / 2 - 3, lines[1], BODY_SIZE, false, 'center'))
      }
    }

    ops.push(`${pdfNumber(x)} ${pdfNumber(bottom)} ${pdfNumber(WEEK_COLUMN_WIDTH)} ${pdfNumber(ROW_HEIGHT)} re S`)
  }

  return bottom
}

export function buildHolidayPdf(input: HolidayPdfInput): Uint8Array<ArrayBuffer> {
  const pages: string[][] = []
  let ops: string[] = []
  let y = drawTitle(ops, input)
  y = drawHeader(ops, input, y)

  for (const row of input.rows) {
    if (y - ROW_HEIGHT < MARGIN) {
      pages.push(ops)
      ops = []
      y = drawTitle(ops, input)
      y = drawHeader(ops, input, y)
    }

    y = drawRow(ops, input, row, y)
  }

  pages.push(ops)
  return assemblePdf(pages, PAGE_WIDTH, PAGE_HEIGHT)
}

export function saveHolidayPdf(input: HolidayPdfInput): void {
  const bytes = buildHolidayPdf(input)
  const prefix = translate(messages[input.locale], 'employees.exportHolidays.filePrefix')
  const filename = `${prefix}_${input.year}.pdf`

  downloadBlob(filename, new Blob([bytes], { type: 'application/pdf' }))
}
