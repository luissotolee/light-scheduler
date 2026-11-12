import type {
  CalendarData,
  CalendarEntry,
  CalendarEntryKind,
  NewCalendarEntry,
} from '@/types'
import type { MessageKey } from '@/shared/i18n/messages/en'
import { parseIsoDate } from '@/shared/utils/calendar'

export const MAX_CALENDAR_NAME_LENGTH = 200

export const DEFAULT_CALENDAR_DATA: Readonly<CalendarData> = {
  country: null,
  region: null,
  entries: [],
}

const KINDS: readonly CalendarEntryKind[] = [
  'public_holiday',
  'custom_holiday',
  'custom_event',
]

const CUSTOM_KINDS: readonly NewCalendarEntry['kind'][] = ['custom_holiday', 'custom_event']

const KIND_ORDER: Record<CalendarEntryKind, number> = {
  public_holiday: 0,
  custom_holiday: 1,
  custom_event: 2,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseNullableCode(value: unknown): { ok: boolean; value: string | null } {
  if (value === undefined || value === null) return { ok: true, value: null }
  if (typeof value !== 'string') return { ok: false, value: null }

  const trimmed = value.trim()
  return { ok: true, value: trimmed === '' ? null : trimmed }
}

export function createDefaultCalendarData(): CalendarData {
  return { country: null, region: null, entries: [] }
}

export function isCalendarEntryKind(value: unknown): value is CalendarEntryKind {
  return typeof value === 'string' && KINDS.includes(value as CalendarEntryKind)
}

export function isCustomCalendarKind(value: unknown): value is NewCalendarEntry['kind'] {
  return typeof value === 'string' && CUSTOM_KINDS.includes(value as NewCalendarEntry['kind'])
}

export function isCalendarEntry(value: unknown): value is CalendarEntry {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || value.id.trim() === '') return false
  if (parseIsoDate(value.date) === null) return false
  if (typeof value.name !== 'string') return false

  const name = value.name.trim()
  if (name === '' || name.length > MAX_CALENDAR_NAME_LENGTH) return false
  if (!isCalendarEntryKind(value.kind)) return false
  if (value.countryCode !== undefined && typeof value.countryCode !== 'string') return false
  if (value.region !== undefined && typeof value.region !== 'string') return false

  return true
}

export function parseCalendarData(value: unknown): CalendarData | null {
  if (value === undefined) return createDefaultCalendarData()
  if (!isRecord(value)) return null

  const country = parseNullableCode(value.country)
  if (!country.ok) return null

  const region = parseNullableCode(value.region)
  if (!region.ok) return null

  const entries: CalendarEntry[] = []
  const entryIds = new Set<string>()

  if (value.entries !== undefined) {
    if (!Array.isArray(value.entries)) return null

    for (const item of value.entries) {
      if (!isCalendarEntry(item)) return null
      if (entryIds.has(item.id)) return null
      entryIds.add(item.id)

      entries.push({
        id: item.id,
        date: item.date,
        name: item.name.trim(),
        kind: item.kind,
        ...(item.countryCode !== undefined ? { countryCode: item.countryCode } : {}),
        ...(item.region !== undefined ? { region: item.region } : {}),
      })
    }
  }

  return { country: country.value, region: region.value, entries }
}

export function calendarEntryKey(entry: CalendarEntry): string {
  return [
    entry.date,
    entry.kind,
    entry.name.trim().toLowerCase(),
    entry.countryCode ?? '',
    entry.region ?? '',
  ].join('|')
}

export function normalizeCalendarEntries(entries: readonly CalendarEntry[]): CalendarEntry[] {
  const seen = new Set<string>()
  const result: CalendarEntry[] = []

  for (const entry of entries) {
    const normalized: CalendarEntry = { ...entry, name: entry.name.trim() }
    const key = calendarEntryKey(normalized)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }

  return result.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1

    const kindDelta = KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
    if (kindDelta !== 0) return kindDelta

    if (a.name !== b.name) return a.name < b.name ? -1 : 1
    if ((a.countryCode ?? '') !== (b.countryCode ?? '')) {
      return (a.countryCode ?? '') < (b.countryCode ?? '') ? -1 : 1
    }
    if ((a.region ?? '') !== (b.region ?? '')) {
      return (a.region ?? '') < (b.region ?? '') ? -1 : 1
    }
    return 0
  })
}

export function entriesForDate(data: CalendarData, isoDate: string): CalendarEntry[] {
  return data.entries.filter((entry) => entry.date === isoDate)
}

export function calendarKindLabelKey(kind: CalendarEntryKind): MessageKey {
  switch (kind) {
    case 'public_holiday':
      return 'calendar.kind.public_holiday'
    case 'custom_holiday':
      return 'calendar.kind.custom_holiday'
    case 'custom_event':
      return 'calendar.kind.custom_event'
  }
}

export interface CalendarEntryInputErrors {
  date?: MessageKey
  name?: MessageKey
  kind?: MessageKey
}

export type CalendarEntryValidation =
  | { ok: true; value: NewCalendarEntry }
  | { ok: false; errors: CalendarEntryInputErrors; message: MessageKey }

export function validateCalendarEntryInput(input: {
  date: unknown
  name: unknown
  kind: unknown
}): CalendarEntryValidation {
  const errors: CalendarEntryInputErrors = {}

  const date = parseIsoDate(input.date)
  if (date === null) errors.date = 'errors.invalidCalendarDate'

  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (name === '') {
    errors.name = 'errors.requiredName'
  } else if (name.length > MAX_CALENDAR_NAME_LENGTH) {
    errors.name = 'errors.calendarNameTooLong'
  }

  if (!isCustomCalendarKind(input.kind)) errors.kind = 'errors.invalidCalendarKind'

  if (errors.date || errors.name || errors.kind) {
    return {
      ok: false,
      errors,
      message: errors.date ?? errors.name ?? errors.kind ?? 'errors.invalidCalendarEntry',
    }
  }

  return {
    ok: true,
    value: {
      date: date as string,
      name,
      kind: input.kind as NewCalendarEntry['kind'],
    },
  }
}
