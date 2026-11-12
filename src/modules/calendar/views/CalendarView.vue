<template>
  <section class="calendar">
    <PageHeader
      :title="t('calendar.title')"
      :description="t('calendar.description')"
      description-tooltip
    />

    <section class="calendar__import" aria-labelledby="calendar-import-title">
      <h2 id="calendar-import-title" class="calendar__import-title">
        {{ t('calendar.importTitle') }}
      </h2>

      <div class="calendar__toolbar">
        <div class="calendar__field">
          <label class="calendar__label" for="calendar-country">{{ t('calendar.country') }}</label>
          <Select
            v-model="countryDraft"
            input-id="calendar-country"
            :options="countryOptions"
            option-label="label"
            option-value="value"
            filter
            :placeholder="
              countries.length === 0
                ? t('calendar.loadingOptions')
                : t('calendar.countryPlaceholder')
            "
            data-test="calendar-country"
            @change="handleCountryChange"
          />
        </div>

        <div class="calendar__field">
          <label class="calendar__label" for="calendar-region">{{ t('calendar.region') }}</label>
          <Select
            v-model="regionDraft"
            input-id="calendar-region"
            :options="regionOptions"
            option-label="label"
            option-value="value"
            :disabled="!countryDraft"
            :placeholder="t('calendar.regionPlaceholder')"
            data-test="calendar-region"
          />
        </div>

        <div class="calendar__field">
          <label class="calendar__label" for="calendar-year">{{ t('calendar.year') }}</label>
          <Select
            v-model="yearDraft"
            input-id="calendar-year"
            :options="yearOptions"
            option-label="label"
            option-value="value"
            data-test="calendar-year"
          />
        </div>

        <span
          v-if="publicEntries.length > 0"
          v-tooltip.top="publicHolidaysTooltip"
          class="calendar__holiday-count"
          tabindex="0"
          :aria-label="publicHolidaysAriaLabel"
          data-test="calendar-public-holiday-count"
        >
          <i class="pi pi-star-fill" aria-hidden="true" />
          <span class="calendar__holiday-count-label">
            {{ t('calendar.importedSuccessfully') }}
          </span>
        </span>

        <div class="calendar__actions">
          <Button
            v-tooltip.top="isFetching ? t('calendar.fetching') : t('calendar.fetchTooltip')"
            type="button"
            icon="pi pi-globe"
            :label="isFetching ? t('calendar.fetching') : t('calendar.fetch')"
            :aria-label="isFetching ? t('calendar.fetching') : t('calendar.fetch')"
            :disabled="isFetching || !countryDraft"
            data-test="calendar-fetch"
            @click="handleFetch"
          />
          <Button
            v-tooltip.top="t('calendar.clearFetchedTooltip')"
            type="button"
            icon="pi pi-trash"
            :label="t('calendar.clearFetched')"
            severity="secondary"
            outlined
            :aria-label="t('calendar.clearFetched')"
            :disabled="!hasPublicEntries"
            data-test="calendar-clear-fetched"
            @click="clearFetchedVisible = true"
          />
        </div>
      </div>
    </section>

    <p
      v-if="status.state === 'error' && statusMessage"
      class="calendar__status"
      :class="statusClass"
      role="status"
      data-test="calendar-fetch-status"
    >
      {{ statusMessage }}
    </p>

    <div class="calendar__layout">
      <div class="calendar__calendar">
        <div class="calendar__month-bar">
          <div class="calendar__month-nav">
            <Button
              v-tooltip.top="t('calendar.month.previous')"
              type="button"
              icon="pi pi-chevron-left"
              text
              rounded
              size="small"
              :aria-label="t('calendar.month.previous')"
              data-test="calendar-previous-month"
              @click="shiftMonth(-1)"
            />
            <strong class="calendar__month-label" data-test="calendar-month-label">{{
              monthLabel
            }}</strong>
            <Button
              v-tooltip.top="t('calendar.month.next')"
              type="button"
              icon="pi pi-chevron-right"
              text
              rounded
              size="small"
              :aria-label="t('calendar.month.next')"
              data-test="calendar-next-month"
              @click="shiftMonth(1)"
            />
          </div>
          <div class="calendar__month-actions">
            <Button
              type="button"
              :label="t('calendar.addEntry')"
              icon="pi pi-plus"
              size="small"
              data-test="calendar-add-entry"
              @click="openAdd"
            />
          </div>
        </div>

        <CalendarMonthGrid
          :month="visibleMonth"
          :entries="data.entries"
          :selected-date="selectedDate"
          @select="selectDay"
          @add="openAddForDate"
        />
      </div>

      <aside class="calendar__panel">
        <div class="calendar__panel-header">
          <h2 class="calendar__panel-title">{{ listTitle }}</h2>
          <span class="calendar__count">{{ countLabel }}</span>
        </div>

        <EmptyState
          v-if="data.entries.length === 0"
          :title="t('calendar.emptyTitle')"
          :description="t('calendar.emptyDescription')"
        />
        <p v-else-if="monthEntries.length === 0" class="calendar__empty">
          {{ t('calendar.list.empty') }}
        </p>
        <CalendarEntryList
          v-else
          :entries="monthEntries"
          @edit="openEdit"
          @remove="handleRemoveRequest"
        />
      </aside>
    </div>

    <CalendarEntryFormDialog
      :visible="dialogVisible"
      :entry="editingEntry"
      :default-date="selectedDate"
      :error="formError"
      @update:visible="handleDialogVisible"
      @submit="handleSubmit"
    />

    <ConfirmActionDialog
      :visible="removeTarget !== null"
      :header="t('calendar.confirm.removeHeader')"
      :message="removeMessage"
      :confirm-label="t('calendar.confirm.removeLabel')"
      @update:visible="handleRemoveVisible"
      @confirm="confirmRemove"
    />

    <ConfirmActionDialog
      :visible="clearFetchedVisible"
      :header="t('calendar.clearFetchedHeader')"
      :message="t('calendar.clearFetchedMessage')"
      :confirm-label="t('calendar.clearFetchedLabel')"
      @update:visible="clearFetchedVisible = $event"
      @confirm="confirmClearFetched"
    />

    <Toast />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import ConfirmActionDialog from '@/shared/components/ConfirmActionDialog.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import CalendarEntryFormDialog from '@/modules/calendar/components/CalendarEntryFormDialog.vue'
import CalendarEntryList from '@/modules/calendar/components/CalendarEntryList.vue'
import CalendarMonthGrid from '@/modules/calendar/components/CalendarMonthGrid.vue'
import { useCalendarStore } from '@/modules/calendar/stores/calendar'
import { countryLabel } from '@/modules/calendar/utils/countries'
import { holidayProvider, type HolidayRegionOption } from '@/modules/calendar/utils/holidayProvider'
import { useI18n } from '@/shared/i18n'
import type { CalendarEntry, NewCalendarEntry } from '@/types'
import { intlLocale, isoDateToDate, toLocalIsoDate, todayIsoDate } from '@/shared/utils/calendar'

const store = useCalendarStore()
const { data, isFetching, publicEntries, status } = storeToRefs(store)
const { t, tc, locale } = useI18n()
const toast = useToast()

const now = new Date()
const visibleMonth = ref(toLocalIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)))
const selectedDate = ref(todayIsoDate())
const yearDraft = ref(now.getFullYear())
const countryDraft = ref('')
const regionDraft = ref('')
const countries = ref<string[]>([])
const regions = ref<HolidayRegionOption[]>([])

const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')
const removeTarget = ref<CalendarEntry | null>(null)
const clearFetchedVisible = ref(false)

const countryOptions = computed(() =>
  countries.value
    .map((code) => ({ label: countryLabel(code, locale.value), value: code }))
    .sort((a, b) => a.label.localeCompare(b.label, intlLocale(locale.value))),
)

const regionOptions = computed(() => [
  { label: t('calendar.regionNone'), value: '' },
  ...regions.value.map((region) => ({ label: region.name, value: region.code })),
])

const yearOptions = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 11 }, (_, index) => {
    const year = current - 5 + index
    return { label: String(year), value: year }
  })
})

const monthLabel = computed(() =>
  new Intl.DateTimeFormat(intlLocale(locale.value), {
    month: 'long',
    year: 'numeric',
  }).format(isoDateToDate(visibleMonth.value)),
)

const monthEntries = computed(() =>
  data.value.entries.filter((entry) => entry.date.slice(0, 7) === visibleMonth.value.slice(0, 7)),
)

const listTitle = computed(() => t('calendar.list.title', { month: monthLabel.value }))
const countLabel = computed(() =>
  tc('calendar.countOne', 'calendar.countMany', monthEntries.value.length, {
    count: monthEntries.value.length,
  }),
)
const publicHolidayYearTotals = computed(() => {
  const totals = new Map<string, number>()
  for (const entry of publicEntries.value) {
    const year = entry.date.slice(0, 4)
    totals.set(year, (totals.get(year) ?? 0) + 1)
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => t('calendar.publicHolidayYearCount', { year, count }))
    .join(', ')
})

const publicHolidaysTooltip = computed(() => publicHolidayYearTotals.value)
const publicHolidaysAriaLabel = computed(
  () => `${t('calendar.importedSuccessfully')} — ${publicHolidaysTooltip.value}`,
)

const statusMessage = computed(() =>
  status.value.key ? t(status.value.key, status.value.params) : '',
)
const statusClass = computed(() =>
  status.value.state === 'error' ? 'calendar__status--error' : '',
)

const editingEntry = computed(() =>
  editingId.value
    ? (data.value.entries.find((entry) => entry.id === editingId.value) ?? null)
    : null,
)

const hasPublicEntries = computed(() => publicEntries.value.length > 0)

const removeMessage = computed(() =>
  removeTarget.value ? t('calendar.confirm.removeMessage', { name: removeTarget.value.name }) : '',
)

function initializeDrafts(): void {
  countryDraft.value = data.value.country ?? ''
  regionDraft.value = data.value.region ?? ''
  yearDraft.value = Number(visibleMonth.value.slice(0, 4))
}

async function loadOptions(): Promise<void> {
  try {
    countries.value = await holidayProvider.countryCodes(locale.value)
    if (countryDraft.value) {
      regions.value = await holidayProvider.regions(countryDraft.value, locale.value)
    }
  } catch {
    status.value = { state: 'error', key: 'calendar.fetchFailed' }
  }
}

function handleCountryChange(event: { value?: unknown }): void {
  const value = typeof event.value === 'string' ? event.value : countryDraft.value
  countryDraft.value = value
  regionDraft.value = ''
  regions.value = []
  if (value) {
    holidayProvider
      .regions(value, locale.value)
      .then((options) => {
        regions.value = options
      })
      .catch(() => {
        regions.value = []
      })
  }
}

async function handleFetch(): Promise<void> {
  const ok = await store.fetchHolidays(
    {
      country: countryDraft.value,
      region: regionDraft.value === '' ? null : regionDraft.value,
      year: yearDraft.value,
    },
    locale.value,
  )

  if (!ok) return

  showStatusToast()

  if (visibleMonth.value.slice(0, 4) !== String(yearDraft.value)) {
    visibleMonth.value = `${yearDraft.value}-01-01`
  }
}

function showStatusToast(): void {
  if (status.value.state !== 'success' || !status.value.key) return

  toast.add({
    severity: status.value.key === 'calendar.noneFound' ? 'info' : 'success',
    summary: t(status.value.key, status.value.params),
    life: 4000,
  })
}

function shiftMonth(delta: number): void {
  const next = isoDateToDate(visibleMonth.value)
  next.setMonth(next.getMonth() + delta, 1)
  visibleMonth.value = toLocalIsoDate(next)
}

function selectDay(isoDate: string): void {
  selectedDate.value = isoDate
  const month = `${isoDate.slice(0, 7)}-01`
  if (month !== visibleMonth.value) visibleMonth.value = month
}

function openAdd(): void {
  editingId.value = null
  formError.value = ''
  dialogVisible.value = true
}

function openAddForDate(isoDate: string): void {
  selectDay(isoDate)
  openAdd()
}

function openEdit(id: string): void {
  const entry = data.value.entries.find((item) => item.id === id)
  if (!entry || entry.kind === 'public_holiday') return
  editingId.value = id
  formError.value = ''
  dialogVisible.value = true
}

function handleDialogVisible(visible: boolean): void {
  dialogVisible.value = visible
  if (!visible) {
    editingId.value = null
    formError.value = ''
  }
}

function handleSubmit(input: NewCalendarEntry): void {
  const saved = editingId.value
    ? store.updateCustomEntry(editingId.value, input)
    : store.addCustomEntry(input) !== null

  if (saved) {
    selectedDate.value = input.date
    visibleMonth.value = `${input.date.slice(0, 7)}-01`
    dialogVisible.value = false
    editingId.value = null
    formError.value = ''
    return
  }

  formError.value = status.value.key ? t(status.value.key, status.value.params) : ''
}

function handleRemoveRequest(id: string): void {
  removeTarget.value = data.value.entries.find((entry) => entry.id === id) ?? null
}

function handleRemoveVisible(visible: boolean): void {
  if (!visible) removeTarget.value = null
}

function confirmRemove(): void {
  if (removeTarget.value) store.removeEntry(removeTarget.value.id)
  removeTarget.value = null
}

function confirmClearFetched(): void {
  store.clearFetched()
  showStatusToast()
  clearFetchedVisible.value = false
}

onMounted(() => {
  initializeDrafts()
  void loadOptions()
})

watch(locale, () => {
  void loadOptions()
})
</script>

<style scoped>
.calendar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.calendar__import {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calendar__import-title {
  margin: 0;
  font-size: var(--font-size-section-title);
}

.calendar__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.calendar__field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 10rem;
}

.calendar__label {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.calendar__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.calendar__holiday-count {
  display: inline-flex;
  align-self: flex-end;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--color-accent);
  border-radius: 999px;
  background: var(--color-shift-bar);
  color: var(--color-accent);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.calendar__holiday-count .pi {
  font-size: 0.7rem;
}

.calendar__status {
  margin: 0;
  padding: 0.55rem 0.8rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-muted);
}

.calendar__status--error {
  border-color: var(--color-danger);
  background: var(--color-inactive-bg);
  color: var(--color-danger);
}

.calendar__calendar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.calendar__month-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
}

.calendar__month-nav {
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.calendar__month-actions {
  grid-column: 3;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.calendar__month-label {
  min-width: 10rem;
  font-size: 1.05rem;
  text-align: center;
}

.calendar__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(16rem, 1fr);
  align-items: start;
  gap: 1rem;
}

.calendar__panel {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}

.calendar__panel-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem;
}

.calendar__panel-title {
  margin: 0;
  font-size: 1rem;
}

.calendar__count {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.calendar__empty {
  margin: 0;
  padding: 0.75rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-muted);
  text-align: center;
}

@media (max-width: 60rem) {
  .calendar__layout {
    grid-template-columns: 1fr;
  }

  .calendar__actions {
    margin-left: 0;
  }
}

@media (max-width: 40rem) {
  .calendar__month-bar {
    grid-template-columns: 1fr;
  }

  .calendar__month-nav,
  .calendar__month-actions {
    grid-column: 1;
    justify-content: center;
  }
}
</style>
