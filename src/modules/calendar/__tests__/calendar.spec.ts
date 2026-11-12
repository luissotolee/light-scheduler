import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCalendarStore } from '@/modules/calendar/stores/calendar'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { createDefaultCalendarData } from '@/shared/utils/calendarEntries'
import type { HolidayProvider } from '@/modules/calendar/utils/holidayProvider'
import type { CalendarEntry } from '@/types'

function holidayProvider(
  holidays: Array<{ date: string; name: string }> = [
    { date: '2026-01-01', name: 'New Year' },
  ],
): HolidayProvider {
  return {
    countryCodes: vi.fn(async () => ['ES', 'US']),
    regions: vi.fn(async () => []),
    holidays: vi.fn(async () => holidays),
  }
}

function entry(overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    id: 'entry-1',
    date: '2026-01-05',
    name: 'Custom day',
    kind: 'custom_holiday',
    ...overrides,
  }
}

describe('calendar store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts idle with empty data', () => {
    const store = useCalendarStore()

    expect(store.status).toEqual({ state: 'idle', key: null })
    expect(store.isFetching).toBe(false)
    expect(store.data).toEqual(createDefaultCalendarData())
    expect(store.publicEntries).toEqual([])
    expect(store.customEntries).toEqual([])
    expect(store.count).toBe(0)
  })

  it('fetches public holidays and stores them with the selection', async () => {
    const store = useCalendarStore()
    const workspace = useWorkspaceStore()
    const provider = holidayProvider()

    const ok = await store.fetchHolidays(
      { country: 'es', region: 'an', year: 2026 },
      'en',
      provider,
    )

    expect(ok).toBe(true)
    expect(provider.holidays).toHaveBeenCalledWith({
      country: 'ES',
      region: 'AN',
      year: 2026,
      locale: 'en',
    })
    expect(workspace.calendar.country).toBe('ES')
    expect(workspace.calendar.region).toBe('AN')
    expect(workspace.calendar.entries).toEqual([
      {
        id: expect.any(String),
        date: '2026-01-01',
        name: 'New Year',
        kind: 'public_holiday',
        countryCode: 'ES',
        region: 'AN',
      },
    ])
    expect(store.status).toEqual({
      state: 'success',
      key: 'calendar.fetched',
      params: { count: 1, year: 2026 },
    })
  })

  it('keeps custom entries and other years when refetching the same selection', async () => {
    const store = useCalendarStore()
    const workspace = useWorkspaceStore()
    workspace.setCalendar({
      country: 'ES',
      region: 'AN',
      entries: [
        entry({ id: 'custom-1' }),
        entry({
          id: 'old-public',
          date: '2026-02-01',
          name: 'Old public',
          kind: 'public_holiday',
          countryCode: 'ES',
          region: 'AN',
        }),
        entry({
          id: 'other-year',
          date: '2025-12-25',
          name: 'Other year',
          kind: 'public_holiday',
          countryCode: 'ES',
          region: 'AN',
        }),
      ],
    })

    await store.fetchHolidays({ country: 'ES', region: 'AN', year: 2026 }, 'en', holidayProvider())

    expect(workspace.calendar.entries.map((item) => item.id)).not.toContain('old-public')
    expect(workspace.calendar.entries.map((item) => item.id)).toContain('custom-1')
    expect(workspace.calendar.entries.map((item) => item.id)).toContain('other-year')
    expect(workspace.calendar.entries).toContainEqual(
      expect.objectContaining({ name: 'New Year', kind: 'public_holiday' }),
    )
  })

  it('drops previous public holidays when the selection changes', async () => {
    const store = useCalendarStore()
    const workspace = useWorkspaceStore()
    workspace.setCalendar({
      country: 'US',
      region: null,
      entries: [
        entry({ id: 'custom-1' }),
        entry({
          id: 'old-public',
          date: '2026-07-04',
          name: 'Old public',
          kind: 'public_holiday',
          countryCode: 'US',
        }),
      ],
    })

    await store.fetchHolidays({ country: 'ES', region: 'AN', year: 2026 }, 'en', holidayProvider())

    expect(workspace.calendar.country).toBe('ES')
    expect(workspace.calendar.region).toBe('AN')
    expect(workspace.calendar.entries.map((item) => item.id)).toContain('custom-1')
    expect(workspace.calendar.entries).toHaveLength(2)
    expect(workspace.calendar.entries).not.toContainEqual(
      expect.objectContaining({ id: 'old-public' }),
    )
  })

  it('rejects a fetch without a country', async () => {
    const store = useCalendarStore()
    const provider = holidayProvider()

    await expect(
      store.fetchHolidays({ country: '   ', region: null, year: 2026 }, 'en', provider),
    ).resolves.toBe(false)

    expect(provider.holidays).not.toHaveBeenCalled()
    expect(store.status).toEqual({ state: 'error', key: 'calendar.noCountry' })
  })

  it('reports fetch failures', async () => {
    const store = useCalendarStore()
    const provider: HolidayProvider = {
      countryCodes: vi.fn(async () => []),
      regions: vi.fn(async () => []),
      holidays: vi.fn(async () => {
        throw new Error('network')
      }),
    }

    await expect(
      store.fetchHolidays({ country: 'ES', region: null, year: 2026 }, 'en', provider),
    ).resolves.toBe(false)

    expect(store.status).toEqual({ state: 'error', key: 'calendar.fetchFailed' })
    expect(store.isFetching).toBe(false)
  })

  it('reports when no holidays are found', async () => {
    const store = useCalendarStore()

    await store.fetchHolidays(
      { country: 'ES', region: null, year: 2026 },
      'en',
      holidayProvider([]),
    )

    expect(store.status).toEqual({ state: 'success', key: 'calendar.noneFound' })
  })

  it('clears fetched holidays while keeping custom entries', () => {
    const store = useCalendarStore()
    const workspace = useWorkspaceStore()
    workspace.setCalendar({
      country: 'ES',
      region: null,
      entries: [
        entry({ id: 'custom-1' }),
        entry({ id: 'public-1', kind: 'public_holiday' }),
      ],
    })

    store.clearFetched()

    expect(workspace.calendar.entries).toEqual([
      entry({ id: 'custom-1' }),
    ])
    expect(store.status).toEqual({ state: 'success', key: 'calendar.cleared' })
  })

  it('adds a custom entry', () => {
    const store = useCalendarStore()
    const workspace = useWorkspaceStore()

    const added = store.addCustomEntry({
      date: '2026-11-03',
      name: '  Team day  ',
      kind: 'custom_event',
    })

    expect(added).toMatchObject({
      date: '2026-11-03',
      name: 'Team day',
      kind: 'custom_event',
    })
    expect(workspace.calendar.entries).toEqual([added])
    expect(store.status).toEqual({ state: 'idle', key: null })
  })

  it('rejects duplicate and invalid custom entries', () => {
    const store = useCalendarStore()
    const workspace = useWorkspaceStore()
    workspace.setCalendar({
      country: null,
      region: null,
      entries: [entry({ date: '2026-11-03', name: 'Team day', kind: 'custom_event' })],
    })

    expect(
      store.addCustomEntry({ date: '2026-11-03', name: 'Team day', kind: 'custom_event' }),
    ).toBeNull()
    expect(store.status).toEqual({ state: 'error', key: 'errors.duplicateCalendarEntry' })

    expect(
      store.addCustomEntry({ date: 'nope', name: 'Team day', kind: 'custom_event' }),
    ).toBeNull()
    expect(store.status).toEqual({ state: 'error', key: 'errors.invalidCalendarDate' })
  })

  it('updates a custom entry and rejects missing or public entries', () => {
    const store = useCalendarStore()
    const workspace = useWorkspaceStore()
    workspace.setCalendar({
      country: null,
      region: null,
      entries: [
        entry({ id: 'custom-1', date: '2026-11-03', name: 'Team day', kind: 'custom_event' }),
        entry({ id: 'public-1', date: '2026-11-04', name: 'Holiday', kind: 'public_holiday' }),
      ],
    })

    expect(
      store.updateCustomEntry('custom-1', {
        date: '2026-11-05',
        name: 'Team meeting',
        kind: 'custom_event',
      }),
    ).toBe(true)
    expect(workspace.calendar.entries).toContainEqual(
      expect.objectContaining({ id: 'custom-1', date: '2026-11-05', name: 'Team meeting' }),
    )

    expect(
      store.updateCustomEntry('public-1', {
        date: '2026-11-05',
        name: 'Nope',
        kind: 'custom_event',
      }),
    ).toBe(false)
    expect(store.updateCustomEntry('missing', {
      date: '2026-11-05',
      name: 'Nope',
      kind: 'custom_event',
    })).toBe(false)
  })

  it('rejects an update that duplicates another custom entry', () => {
    const store = useCalendarStore()
    const workspace = useWorkspaceStore()
    workspace.setCalendar({
      country: null,
      region: null,
      entries: [
        entry({ id: 'a', date: '2026-11-03', name: 'Team day', kind: 'custom_event' }),
        entry({ id: 'b', date: '2026-11-04', name: 'Other day', kind: 'custom_event' }),
      ],
    })

    expect(
      store.updateCustomEntry('b', {
        date: '2026-11-03',
        name: 'Team day',
        kind: 'custom_event',
      }),
    ).toBe(false)
    expect(store.status).toEqual({ state: 'error', key: 'errors.duplicateCalendarEntry' })
  })

  it('removes entries and resets the status', () => {
    const store = useCalendarStore()
    const workspace = useWorkspaceStore()
    workspace.setCalendar({
      country: null,
      region: null,
      entries: [entry({ id: 'a' }), entry({ id: 'b' })],
    })

    store.removeEntry('a')

    expect(workspace.calendar.entries).toEqual([entry({ id: 'b' })])
    expect(store.status).toEqual({ state: 'idle', key: null })

    store.resetStatus()
    expect(store.status).toEqual({ state: 'idle', key: null })
  })
})
