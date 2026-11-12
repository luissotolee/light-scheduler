<template>
  <div class="calendar-grid" role="group" :aria-label="monthLabel" data-test="calendar-month-grid">
    <span
      v-for="header in weekdayHeaders"
      :key="header"
      class="calendar-grid__weekday"
      aria-hidden="true"
    >
      {{ header }}
    </span>

    <button
      v-for="day in days"
      :key="day.iso"
      type="button"
      class="calendar-grid__day"
      :class="{
        'calendar-grid__day--outside': day.outside,
        'calendar-grid__day--today': day.iso === today,
        'calendar-grid__day--selected': day.iso === selectedDate,
      }"
      :aria-label="dayAria(day.iso)"
      :aria-pressed="day.iso === selectedDate"
      :data-test="`calendar-day-${day.iso}`"
      @click="emit('select', day.iso)"
      @dblclick="emit('add', day.iso)"
    >
      <span class="calendar-grid__day-number" data-test="calendar-cell">{{
        day.number
      }}</span>
      <span v-if="entriesFor(day.iso).length > 0" class="calendar-grid__markers" aria-hidden="true">
        <span
          v-for="entry in entriesFor(day.iso)"
          :key="entry.id"
          class="calendar-grid__marker"
          :class="`calendar-grid__marker--${entry.kind}`"
        />
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalendarEntry } from '@/types'
import { useI18n } from '@/shared/i18n'
import {
  addDays,
  formatFullDate,
  intlLocale,
  isoDateToDate,
  toLocalIsoDate,
  todayIsoDate,
} from '@/shared/utils/calendar'

const props = defineProps<{
  month: string
  entries: CalendarEntry[]
  selectedDate?: string
}>()

const emit = defineEmits<{
  select: [isoDate: string]
  add: [isoDate: string]
}>()

const { t, locale } = useI18n()
const today = todayIsoDate()

const monthLabel = computed(() =>
  new Intl.DateTimeFormat(intlLocale(locale.value), {
    month: 'long',
    year: 'numeric',
  }).format(isoDateToDate(props.month)),
)

const weekdayHeaders = computed(() => {
  const formatter = new Intl.DateTimeFormat(intlLocale(locale.value), { weekday: 'short' })
  const monday = new Date(2024, 0, 1)
  return Array.from({ length: 7 }, (_, index) => formatter.format(addDays(monday, index)))
})

const days = computed(() => {
  const first = isoDateToDate(props.month)
  const monthIndex = first.getMonth()
  const offset = (first.getDay() + 6) % 7
  const start = addDays(first, -offset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index)
    return {
      iso: toLocalIsoDate(date),
      number: date.getDate(),
      outside: date.getMonth() !== monthIndex,
    }
  })
})

function entriesFor(isoDate: string): CalendarEntry[] {
  return props.entries.filter((entry) => entry.date === isoDate)
}

function dayAria(isoDate: string): string {
  const date = formatFullDate(isoDate, locale.value)
  const names = entriesFor(isoDate).map((entry) => entry.name)
  return names.length > 0 ? t('calendar.dayAria', { date, entries: names.join(', ') }) : date
}
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.25rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.calendar-grid__weekday {
  padding: 0.25rem;
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}

.calendar-grid__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.2rem;
  min-height: 3.25rem;
  padding: 0.35rem 0.25rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.calendar-grid__day:hover {
  border-color: var(--color-border);
  background: var(--color-surface-alt);
}

.calendar-grid__day:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.calendar-grid__day--outside {
  color: var(--color-muted);
  opacity: 0.55;
}

.calendar-grid__day--today .calendar-grid__day-number {
  color: var(--color-accent);
  font-weight: 700;
}

.calendar-grid__day--selected {
  border-color: var(--color-accent);
  background: var(--color-shift-bar);
}

.calendar-grid__day-number {
  font-size: 0.85rem;
}

.calendar-grid__markers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.15rem;
}

.calendar-grid__marker {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: var(--color-muted);
}

.calendar-grid__marker--public_holiday,
.calendar-grid__marker--custom_holiday {
  background: var(--color-vacation-text);
}

.calendar-grid__marker--custom_event {
  background: var(--color-accent);
}

@media (max-width: 40rem) {
  .calendar-grid {
    gap: 0.125rem;
    padding: 0.5rem;
  }

  .calendar-grid__day {
    min-height: 2.75rem;
    padding: 0.25rem 0.1rem;
  }
}
</style>
