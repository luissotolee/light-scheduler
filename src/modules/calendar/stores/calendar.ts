import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CalendarEntry, NewCalendarEntry } from '@/types'
import type { Locale } from '@/shared/i18n'
import type { MessageKey } from '@/shared/i18n/messages/en'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import {
  calendarEntryKey,
  normalizeCalendarEntries,
  validateCalendarEntryInput,
} from '@/shared/utils/calendarEntries'
import { createId } from '@/shared/utils/id'
import {
  holidayProvider as defaultHolidayProvider,
  type HolidayProvider,
} from '@/modules/calendar/utils/holidayProvider'

export interface CalendarStatus {
  state: 'idle' | 'success' | 'error'
  key: MessageKey | null
  params?: Record<string, string | number>
}

export interface FetchHolidaysInput {
  country: string
  region: string | null
  year: number
}

export const useCalendarStore = defineStore('calendar', () => {
  const status = ref<CalendarStatus>({ state: 'idle', key: null })
  const isFetching = ref(false)

  function workspace() {
    return useWorkspaceStore()
  }

  const data = computed(() => workspace().calendar)
  const publicEntries = computed(() =>
    data.value.entries.filter((entry) => entry.kind === 'public_holiday'),
  )
  const customEntries = computed(() =>
    data.value.entries.filter((entry) => entry.kind !== 'public_holiday'),
  )
  const count = computed(() => data.value.entries.length)

  function resetStatus(): void {
    status.value = { state: 'idle', key: null }
  }

  async function fetchHolidays(
    input: FetchHolidaysInput,
    locale: Locale,
    provider: HolidayProvider = defaultHolidayProvider,
  ): Promise<boolean> {
    const country = input.country.trim().toUpperCase()
    const region = input.region?.trim() ? input.region.trim().toUpperCase() : null

    if (country === '') {
      status.value = { state: 'error', key: 'calendar.noCountry' }
      return false
    }

    isFetching.value = true

    try {
      const fetched = await provider.holidays({
        country,
        region,
        year: input.year,
        locale,
      })

      const current = data.value
      const sameSelection = current.country === country && current.region === region
      const baseEntries = sameSelection
        ? current.entries.filter(
            (entry) =>
              !(entry.kind === 'public_holiday' && entry.date.startsWith(`${input.year}-`)),
          )
        : current.entries.filter((entry) => entry.kind !== 'public_holiday')

      const entries: CalendarEntry[] = fetched.map((holiday) => ({
        id: createId(),
        date: holiday.date,
        name: holiday.name,
        kind: 'public_holiday',
        countryCode: country,
        ...(region ? { region } : {}),
      }))

      workspace().setCalendar({
        country,
        region,
        entries: normalizeCalendarEntries([...baseEntries, ...entries]),
      })

      status.value =
        fetched.length === 0
          ? { state: 'success', key: 'calendar.noneFound' }
          : {
              state: 'success',
              key: 'calendar.fetched',
              params: { count: fetched.length, year: input.year },
            }

      return true
    } catch {
      status.value = { state: 'error', key: 'calendar.fetchFailed' }
      return false
    } finally {
      isFetching.value = false
    }
  }

  function clearFetched(): void {
    const current = data.value
    workspace().setCalendar({
      country: current.country,
      region: current.region,
      entries: current.entries.filter((entry) => entry.kind !== 'public_holiday'),
    })
    status.value = { state: 'success', key: 'calendar.cleared' }
  }

  function addCustomEntry(input: NewCalendarEntry): CalendarEntry | null {
    const validation = validateCalendarEntryInput(input)
    if (!validation.ok) {
      status.value = { state: 'error', key: validation.message }
      return null
    }

    const value = validation.value
    const candidate: CalendarEntry = {
      id: createId(),
      date: value.date,
      name: value.name,
      kind: value.kind,
    }
    const current = data.value

    if (
      current.entries.some(
        (entry) =>
          entry.kind !== 'public_holiday' &&
          calendarEntryKey(entry) === calendarEntryKey(candidate),
      )
    ) {
      status.value = { state: 'error', key: 'errors.duplicateCalendarEntry' }
      return null
    }

    workspace().setCalendar({
      ...current,
      entries: normalizeCalendarEntries([...current.entries, candidate]),
    })
    status.value = { state: 'idle', key: null }
    return candidate
  }

  function updateCustomEntry(id: string, input: NewCalendarEntry): boolean {
    const current = data.value
    const existing = current.entries.find((entry) => entry.id === id)
    if (!existing || existing.kind === 'public_holiday') return false

    const validation = validateCalendarEntryInput(input)
    if (!validation.ok) {
      status.value = { state: 'error', key: validation.message }
      return false
    }

    const value = validation.value
    const candidate: CalendarEntry = {
      id,
      date: value.date,
      name: value.name,
      kind: value.kind,
    }

    if (
      current.entries.some(
        (entry) =>
          entry.id !== id &&
          entry.kind !== 'public_holiday' &&
          calendarEntryKey(entry) === calendarEntryKey(candidate),
      )
    ) {
      status.value = { state: 'error', key: 'errors.duplicateCalendarEntry' }
      return false
    }

    workspace().setCalendar({
      ...current,
      entries: normalizeCalendarEntries(
        current.entries.map((entry) => (entry.id === id ? candidate : entry)),
      ),
    })
    status.value = { state: 'idle', key: null }
    return true
  }

  function removeEntry(id: string): void {
    const current = data.value
    workspace().setCalendar({
      ...current,
      entries: current.entries.filter((entry) => entry.id !== id),
    })
    status.value = { state: 'idle', key: null }
  }

  return {
    status,
    isFetching,
    data,
    publicEntries,
    customEntries,
    count,
    fetchHolidays,
    clearFetched,
    addCustomEntry,
    updateCustomEntry,
    removeEntry,
    resetStatus,
  }
})
