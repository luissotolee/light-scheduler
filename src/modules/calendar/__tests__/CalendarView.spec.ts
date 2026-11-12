import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

const providerMock = vi.hoisted(() => ({
  countryCodes: vi.fn(),
  regions: vi.fn(),
  holidays: vi.fn(),
}))

vi.mock('@/modules/calendar/utils/holidayProvider', () => ({
  holidayProvider: providerMock,
}))

import CalendarView from '@/modules/calendar/views/CalendarView.vue'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { useLocaleStore } from '@/shared/stores/locale'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'
import { createDefaultCalendarData } from '@/shared/utils/calendarEntries'
import { todayIsoDate } from '@/shared/utils/calendar'
import type { CalendarEntry } from '@/types'

function customEntry(overrides: Partial<CalendarEntry> = {}): CalendarEntry {
  return {
    id: 'entry-1',
    date: todayIsoDate(),
    name: 'Team day',
    kind: 'custom_event',
    ...overrides,
  }
}

function yearTotal(year: string, count: number): string {
  return en['calendar.publicHolidayYearCount']
    .replace('{year}', year)
    .replace('{count}', String(count))
}

function importedTooltip(years: string): string {
  return en['calendar.publicHolidaysImportedTooltip'].replace('{years}', years)
}

describe('CalendarView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
    pinia = createPinia()
    setActivePinia(pinia)
    providerMock.countryCodes.mockResolvedValue(['ES', 'US'])
    providerMock.regions.mockResolvedValue([{ code: 'AN', name: 'Andalucía' }])
    providerMock.holidays.mockResolvedValue([
      { date: `${new Date().getFullYear()}-01-01`, name: 'New Year' },
    ])
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  function mountView() {
    return mount(CalendarView, {
      global: {
        plugins: [pinia, PrimeVue, ToastService],
        stubs: { teleport: true },
        directives: { tooltip: Tooltip },
      },
    })
  }

  it('renders the toolbar and empty state', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain(en['calendar.title'])
    expect(wrapper.text()).toContain(en['calendar.emptyTitle'])
    expect(wrapper.find('[data-test="calendar-country"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="calendar-region"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="calendar-year"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="calendar-fetch"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="calendar-fetch"]').text()).toBe('')
    expect(wrapper.find('[data-test="calendar-fetch"]').attributes('aria-label')).toBe(
      en['calendar.fetch'],
    )
    expect(wrapper.find('[data-test="calendar-clear-fetched"]').text()).toBe('')
    expect(wrapper.find('[data-test="calendar-clear-fetched"]').attributes('aria-label')).toBe(
      en['calendar.clearFetched'],
    )
    expect(wrapper.find('[data-test="calendar-add-entry"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="calendar-month-grid"]').exists()).toBe(true)
  })

  it('fetches public holidays for the stored selection', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCalendar({ country: 'ES', region: 'AN', entries: [] })
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('[data-test="calendar-fetch"]').trigger('click')
    await flushPromises()

    expect(providerMock.holidays).toHaveBeenCalledWith({
      country: 'ES',
      region: 'AN',
      year: new Date().getFullYear(),
      locale: 'en',
    })
    expect(workspace.calendar.entries).toHaveLength(1)
    expect(workspace.calendar.entries[0]).toMatchObject({
      name: 'New Year',
      kind: 'public_holiday',
      countryCode: 'ES',
      region: 'AN',
    })
    expect(wrapper.find('[data-test="calendar-fetch-status"]').exists()).toBe(false)
    const year = String(new Date().getFullYear())
    expect(wrapper.find('[data-test="calendar-public-holiday-count"]').text()).toBe('')
    expect(
      wrapper.find('[data-test="calendar-public-holiday-count"]').attributes('aria-label'),
    ).toBe(importedTooltip(yearTotal(year, 1)))
  })

  it('summarizes imported public holidays per year in the indicator tooltip', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCalendar({
      country: 'ES',
      region: null,
      entries: [
        customEntry({ id: 'holiday-1', date: '2025-01-01', kind: 'public_holiday' }),
        customEntry({ id: 'holiday-2', date: '2025-05-01', kind: 'public_holiday' }),
        customEntry({ id: 'holiday-3', date: '2026-01-01', kind: 'public_holiday' }),
      ],
    })
    const wrapper = mountView()
    await flushPromises()

    expect(
      wrapper.find('[data-test="calendar-public-holiday-count"]').attributes('aria-label'),
    ).toBe(importedTooltip(`${yearTotal('2025', 2)}, ${yearTotal('2026', 1)}`))
  })

  it('shows a fetch error', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCalendar({ country: 'ES', region: null, entries: [] })
    providerMock.holidays.mockRejectedValue(new Error('network'))
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('[data-test="calendar-fetch"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="calendar-fetch-status"]').text()).toBe(
      en['calendar.fetchFailed'],
    )
    expect(workspace.calendar).toEqual({ country: 'ES', region: null, entries: [] })
  })

  it('adds a custom entry from the dialog', async () => {
    const workspace = useWorkspaceStore()
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('[data-test="calendar-add-entry"]').trigger('click')
    await nextTick()

    await wrapper.find('[data-test="calendar-entry-name"]').setValue('Company anniversary')
    await wrapper.find('[data-test="calendar-entry-form"]').trigger('submit')
    await nextTick()

    expect(workspace.calendar.entries).toHaveLength(1)
    expect(workspace.calendar.entries[0]).toMatchObject({
      date: todayIsoDate(),
      name: 'Company anniversary',
      kind: 'custom_event',
    })
    expect(wrapper.find('[data-test="calendar-entry-list"]').text()).toContain(
      'Company anniversary',
    )
    expect(wrapper.find('[data-test="calendar-entry-form"]').exists()).toBe(false)
  })

  it('opens the add form for the double-clicked day', async () => {
    const workspace = useWorkspaceStore()
    const targetDate = `${todayIsoDate().slice(0, 7)}-15`
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find(`[data-test="calendar-day-${targetDate}"]`).trigger('dblclick')
    await nextTick()

    await wrapper.find('[data-test="calendar-entry-name"]').setValue('Double click event')
    await wrapper.find('[data-test="calendar-entry-form"]').trigger('submit')
    await nextTick()

    expect(workspace.calendar.entries[0]).toMatchObject({
      date: targetDate,
      name: 'Double click event',
      kind: 'custom_event',
    })
  })

  it('edits an existing custom entry', async () => {
    const workspace = useWorkspaceStore()
    const existing = customEntry({ name: 'Old name' })
    workspace.setCalendar({ ...createDefaultCalendarData(), entries: [existing] })
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find(`[data-test="calendar-edit-${existing.id}"]`).trigger('click')
    await nextTick()

    await wrapper.find('[data-test="calendar-entry-name"]').setValue('New name')
    await wrapper.find('[data-test="calendar-entry-form"]').trigger('submit')
    await nextTick()

    expect(workspace.calendar.entries[0]).toMatchObject({
      id: existing.id,
      name: 'New name',
    })
  })

  it('removes an entry after confirmation', async () => {
    const workspace = useWorkspaceStore()
    const existing = customEntry()
    workspace.setCalendar({ ...createDefaultCalendarData(), entries: [existing] })
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find(`[data-test="calendar-remove-${existing.id}"]`).trigger('click')
    await nextTick()

    expect(wrapper.find('[data-test="confirm-message"]').text()).toBe(
      en['calendar.confirm.removeMessage'].replace('{name}', existing.name),
    )

    await wrapper.find('[data-test="confirm-accept"]').trigger('click')
    await nextTick()

    expect(workspace.calendar.entries).toEqual([])
  })

  it('clears fetched holidays while keeping custom entries', async () => {
    const workspace = useWorkspaceStore()
    const custom = customEntry({ id: 'custom-1' })
    const holiday = customEntry({
      id: 'public-1',
      name: 'Holiday',
      kind: 'public_holiday',
      countryCode: 'ES',
    })
    workspace.setCalendar({
      country: 'ES',
      region: null,
      entries: [custom, holiday],
    })
    const wrapper = mountView()
    await flushPromises()

    await wrapper.find('[data-test="calendar-clear-fetched"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-test="confirm-accept"]').trigger('click')
    await nextTick()

    expect(workspace.calendar.entries).toEqual([custom])
    expect(wrapper.find('[data-test="calendar-public-holiday-count"]').exists()).toBe(false)
  })

  it('translates the page live', async () => {
    const wrapper = mountView()
    await flushPromises()

    useLocaleStore().setLocale('es')
    await nextTick()

    expect(wrapper.text()).toContain(es['calendar.title'])
    expect(wrapper.text()).toContain(es['calendar.emptyTitle'])
  })
})
