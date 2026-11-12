import { describe, expect, it } from 'vitest'
import type { CalendarEntry } from '@/types'
import {
  MAX_CALENDAR_NAME_LENGTH,
  calendarEntryKey,
  calendarKindLabelKey,
  createDefaultCalendarData,
  entriesForDate,
  isCalendarEntry,
  isCalendarEntryKind,
  isCustomCalendarKind,
  normalizeCalendarEntries,
  parseCalendarData,
  validateCalendarEntryInput,
} from '@/shared/utils/calendarEntries'
function entry(overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    id: 'entry-1',
    date: '2026-11-03',
    name: 'Holiday',
    kind: 'custom_holiday',
    ...overrides,
  }
}

describe('calendarEntries', () => {
  it('creates fresh default data objects', () => {
    const first = createDefaultCalendarData()
    const second = createDefaultCalendarData()

    expect(first).toEqual(createDefaultCalendarData())
    expect(first).not.toBe(second)
    expect(first.entries).not.toBe(second.entries)
  })

  it('recognizes calendar entry kinds', () => {
    expect(isCalendarEntryKind('public_holiday')).toBe(true)
    expect(isCalendarEntryKind('custom_holiday')).toBe(true)
    expect(isCalendarEntryKind('custom_event')).toBe(true)
    expect(isCalendarEntryKind('bank_holiday')).toBe(false)
    expect(isCalendarEntryKind(null)).toBe(false)

    expect(isCustomCalendarKind('custom_holiday')).toBe(true)
    expect(isCustomCalendarKind('custom_event')).toBe(true)
    expect(isCustomCalendarKind('public_holiday')).toBe(false)
  })

  it('validates calendar entries', () => {
    expect(isCalendarEntry(entry())).toBe(true)
    expect(isCalendarEntry(entry({ countryCode: 'ES', region: 'AN' }))).toBe(true)

    expect(isCalendarEntry(null)).toBe(false)
    expect(isCalendarEntry({ ...entry(), id: '' })).toBe(false)
    expect(isCalendarEntry({ ...entry(), date: 'nope' })).toBe(false)
    expect(isCalendarEntry({ ...entry(), name: '   ' })).toBe(false)
    expect(isCalendarEntry({ ...entry(), name: 'x'.repeat(MAX_CALENDAR_NAME_LENGTH + 1) })).toBe(
      false,
    )
    expect(isCalendarEntry({ ...entry(), kind: 'other' })).toBe(false)
    expect(isCalendarEntry({ ...entry(), countryCode: 1 })).toBe(false)
    expect(isCalendarEntry({ ...entry(), region: 1 })).toBe(false)
  })

  it('parses calendar data tolerantly', () => {
    expect(parseCalendarData(undefined)).toEqual(createDefaultCalendarData())
    expect(parseCalendarData(null)).toBeNull()
    expect(parseCalendarData('nope')).toBeNull()
    expect(parseCalendarData({})).toEqual(createDefaultCalendarData())
    expect(parseCalendarData({ country: 'ES', region: 'AN' })).toEqual({
      country: 'ES',
      region: 'AN',
      entries: [],
    })
    expect(parseCalendarData({ country: '', region: '  ', entries: [] })).toEqual(
      createDefaultCalendarData(),
    )
    expect(parseCalendarData({ country: 1 })).toBeNull()
    expect(parseCalendarData({ region: 1 })).toBeNull()
    expect(parseCalendarData({ entries: 'nope' })).toBeNull()
    expect(parseCalendarData({ entries: [{}] })).toBeNull()
    expect(
      parseCalendarData({
        entries: [entry(), entry({ id: 'entry-2' })],
        futureField: 'ignored',
      }),
    ).toEqual({
      country: null,
      region: null,
      entries: [entry(), entry({ id: 'entry-2' })],
    })
    expect(parseCalendarData({ entries: [entry(), entry()] })).toBeNull()
  })

  it('normalizes and sorts entries', () => {
    const entries = [
      entry({ id: 'b', name: '  Beta  ', date: '2026-11-04', kind: 'custom_event' }),
      entry({ id: 'a', name: 'Alpha', date: '2026-11-04', kind: 'public_holiday' }),
      entry({ id: 'c', name: 'Alpha', date: '2026-11-03', kind: 'custom_holiday' }),
      entry({ id: 'dup', name: 'Alpha', date: '2026-11-04', kind: 'public_holiday' }),
    ]

    expect(normalizeCalendarEntries(entries)).toEqual([
      entry({ id: 'c', name: 'Alpha', date: '2026-11-03', kind: 'custom_holiday' }),
      entry({ id: 'a', name: 'Alpha', date: '2026-11-04', kind: 'public_holiday' }),
      entry({ id: 'b', name: 'Beta', date: '2026-11-04', kind: 'custom_event' }),
    ])
  })

  it('builds stable keys and filters entries by date', () => {
    expect(calendarEntryKey(entry({ name: '  Holiday  ' }))).toBe(
      calendarEntryKey(entry({ name: 'holiday' })),
    )

    const data = {
      country: null,
      region: null,
      entries: [entry({ id: 'a' }), entry({ id: 'b', date: '2026-11-04' })],
    }

    expect(entriesForDate(data, '2026-11-03').map((item) => item.id)).toEqual(['a'])
    expect(entriesForDate(data, '2026-11-04').map((item) => item.id)).toEqual(['b'])
    expect(entriesForDate(data, '2026-11-05')).toEqual([])
  })

  it('maps kinds to label keys', () => {
    expect(calendarKindLabelKey('public_holiday')).toBe('calendar.kind.public_holiday')
    expect(calendarKindLabelKey('custom_holiday')).toBe('calendar.kind.custom_holiday')
    expect(calendarKindLabelKey('custom_event')).toBe('calendar.kind.custom_event')
  })

  it('validates custom entry input', () => {
    const valid = validateCalendarEntryInput({
      date: '2026-11-03',
      name: '  Team day  ',
      kind: 'custom_event',
    })
    expect(valid).toEqual({
      ok: true,
      value: { date: '2026-11-03', name: 'Team day', kind: 'custom_event' },
    })

    expect(
      validateCalendarEntryInput({ date: 'nope', name: 'Day', kind: 'custom_event' }),
    ).toMatchObject({ ok: false, message: 'errors.invalidCalendarDate' })
    expect(
      validateCalendarEntryInput({ date: '2026-11-03', name: '  ', kind: 'custom_event' }),
    ).toMatchObject({ ok: false, message: 'errors.requiredName' })
    expect(
      validateCalendarEntryInput({
        date: '2026-11-03',
        name: 'x'.repeat(MAX_CALENDAR_NAME_LENGTH + 1),
        kind: 'custom_event',
      }),
    ).toMatchObject({ ok: false, message: 'errors.calendarNameTooLong' })
    expect(
      validateCalendarEntryInput({
        date: '2026-11-03',
        name: 'Day',
        kind: 'public_holiday',
      }),
    ).toMatchObject({ ok: false, message: 'errors.invalidCalendarKind' })
  })
})
