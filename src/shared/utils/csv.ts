import type { MessageKey } from '@/shared/i18n/messages/en'

export type CsvStatusState = 'idle' | 'success' | 'error'

export type CsvStatusMessage =
  | { kind: 'simple'; code: MessageKey; params?: Record<string, string | number> }
  | { kind: 'rowError'; row: number; messageCode: MessageKey }

export interface CsvStatus {
  state: CsvStatusState
  message: CsvStatusMessage | null
}

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string

export type TranslatePlural = (
  oneKey: MessageKey,
  otherKey: MessageKey,
  count: number,
  params?: Record<string, string | number>,
) => string

export function formatCsvStatus(
  status: CsvStatus,
  t: Translate,
  tc: TranslatePlural,
): string {
  const message = status.message
  if (!message) return ''

  if (message.kind === 'rowError') {
    return t('archive.rowError', { row: message.row, message: t(message.messageCode) })
  }

  if (message.code === 'archive.importedOne' || message.code === 'archive.importedMany') {
    const count = Number(message.params?.count ?? 0)
    return tc('archive.importedOne', 'archive.importedMany', count, message.params)
  }

  if (
    message.code === 'archive.schedulesImportedOne' ||
    message.code === 'archive.schedulesImportedMany'
  ) {
    const count = Number(message.params?.count ?? 0)
    return tc(
      'archive.schedulesImportedOne',
      'archive.schedulesImportedMany',
      count,
      message.params,
    )
  }

  return t(message.code, message.params)
}

export type CsvParseResult =
  | { ok: true; headers: string[]; rows: string[][] }
  | { ok: false; error: MessageKey }

export function inferDelimiter(text: string): string {
  const firstLine = text.split('\n', 1)[0] ?? ''
  if (firstLine.includes(',')) return ','
  if (firstLine.includes(';')) return ';'
  if (firstLine.includes('\t')) return '\t'
  return ','
}

export function parseCsv(input: string): CsvParseResult {
  const text = input.replace(/^\uFEFF/, '')
  if (!text.trim()) return { ok: false, error: 'csv.empty' }

  const delimiter = inferDelimiter(text)
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      record.push(field)
      field = ''
    } else if (char === '\n') {
      record.push(field)
      records.push(record)
      record = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (inQuotes) return { ok: false, error: 'csv.unterminated' }

  if (field.length > 0 || record.length > 0) {
    record.push(field)
    records.push(record)
  }

  const nonEmpty = records.filter((row) => row.some((cell) => cell.trim() !== ''))
  if (nonEmpty.length === 0) return { ok: false, error: 'csv.empty' }

  const [headers, ...rows] = nonEmpty
  return { ok: true, headers, rows }
}

export function toCsv(headers: string[], rows: (string | number | boolean)[][]): string {
  const escape = (cell: string | number | boolean): string => {
    const value = String(cell)
    return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  }
  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')
}
