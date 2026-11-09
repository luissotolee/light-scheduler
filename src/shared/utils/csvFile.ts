import type { MessageKey } from '@/shared/i18n/messages/en'

export const MAX_CSV_BYTES = 5 * 1024 * 1024

export type CsvFileReadResult =
  | { ok: true; text: string }
  | { ok: false; error: MessageKey }

export async function readCsvFile(file: File): Promise<CsvFileReadResult> {
  if (file.size > MAX_CSV_BYTES) {
    return { ok: false, error: 'csv.tooLarge' }
  }

  try {
    return { ok: true, text: await file.text() }
  } catch {
    return { ok: false, error: 'csv.unreadable' }
  }
}
