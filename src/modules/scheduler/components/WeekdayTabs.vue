<template>
  <nav
    class="weekday-tabs"
    :aria-label="t('scheduler.weekdays')"
    role="tablist"
    :aria-orientation="isPhone ? 'horizontal' : 'vertical'"
    data-test="weekday-tabs"
  >
    <button
      v-for="weekday in weekdays"
      :key="weekday.value"
      type="button"
      role="tab"
      class="weekday-tabs__tab"
      :class="{ 'weekday-tabs__tab--active': weekday.value === modelValue }"
      :aria-selected="weekday.value === modelValue"
      :aria-label="isPhone ? tabAria(weekday) : undefined"
      :tabindex="weekday.value === modelValue ? 0 : -1"
      :data-test="`weekday-tab-${weekday.value}`"
      @click="emit('update:modelValue', weekday.value)"
    >
      <span
        v-if="weekday.entries.length > 0"
        class="weekday-tabs__calendar"
        :title="markerTitle(weekday)"
        :data-test="`weekday-calendar-marker-${weekday.value}`"
        aria-hidden="true"
      ><i
        v-if="hasHoliday(weekday)"
        class="pi pi-star-fill weekday-tabs__calendar-holiday"
      /><i
        v-if="hasEvent(weekday)"
        class="pi pi-calendar weekday-tabs__calendar-event"
      /><span v-if="weekday.entries.length > 2" class="weekday-tabs__calendar-count">{{
        weekday.entries.length
      }}</span></span><span
        v-if="weekday.entries.length > 0"
        class="weekday-tabs__sr"
      >{{ t('scheduler.calendar.markerAria', { entries: markerTitle(weekday) }) }}</span
      ><span class="weekday-tabs__label">{{
        isPhone ? weekdayInitial(weekday.label) : weekday.label
      }}</span>{{ ' ' }}<span class="weekday-tabs__day">{{
        formatOrdinal(weekday.dayOfMonth, locale)
      }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { CalendarEntry, Weekday } from '@/types'
import { useI18n } from '@/shared/i18n'
import { formatOrdinal, weekdayInitial } from '@/shared/utils/calendar'
import { calendarKindLabelKey } from '@/shared/utils/calendarEntries'
import { useIsPhone } from '@/shared/composables/useIsPhone'

interface WeekdayTab {
  value: Weekday
  label: string
  dayOfMonth: number
  entries: CalendarEntry[]
}

defineProps<{
  modelValue: Weekday
  weekdays: WeekdayTab[]
}>()

const emit = defineEmits<{
  'update:modelValue': [weekday: Weekday]
}>()

const { t, locale } = useI18n()
const isPhone = useIsPhone()

function hasHoliday(weekday: WeekdayTab): boolean {
  return weekday.entries.some(
    (entry) => entry.kind === 'public_holiday' || entry.kind === 'custom_holiday',
  )
}

function hasEvent(weekday: WeekdayTab): boolean {
  return weekday.entries.some((entry) => entry.kind === 'custom_event')
}

function markerTitle(weekday: WeekdayTab): string {
  return weekday.entries
    .map((entry) => `${t(calendarKindLabelKey(entry.kind))}: ${entry.name}`)
    .join(' · ')
}

function tabAria(weekday: WeekdayTab): string {
  const base = `${weekday.label} ${formatOrdinal(weekday.dayOfMonth, locale.value)}`
  if (weekday.entries.length === 0) return base
  return `${base}, ${t('scheduler.calendar.markerAria', { entries: markerTitle(weekday) })}`
}
</script>

<style scoped>
.weekday-tabs {
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
  min-width: 8.5rem;
  padding: 0.375rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.weekday-tabs__tab {
  position: relative;
  padding: 0.4rem 0.6rem;
  padding-left: calc(0.6rem - 2px);
  border: 1px solid transparent;
  border-left: 3px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.weekday-tabs__tab:hover {
  border-color: var(--color-border);
  color: var(--color-text);
}

.weekday-tabs__tab--active {
  border-color: var(--color-accent);
  border-left: 3px solid var(--color-accent);
  background: var(--color-shift-bar);
  color: var(--color-accent);
  font-weight: 700;
}

.weekday-tabs__tab--active .weekday-tabs__day {
  color: var(--color-accent);
  font-weight: 600;
}

.weekday-tabs__tab:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.weekday-tabs__calendar {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  margin-right: 0.2rem;
  vertical-align: baseline;
}

.weekday-tabs__calendar-holiday {
  color: var(--color-vacation-text);
  font-size: 0.7rem;
}

.weekday-tabs__calendar-event {
  color: var(--color-accent);
  font-size: 0.7rem;
}

.weekday-tabs__calendar-count {
  font-size: 0.65rem;
  font-weight: 600;
}

.weekday-tabs__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.weekday-tabs__day {
  color: var(--color-muted);
  font-weight: 400;
}

@media screen and (max-height: 899px) {
  .weekday-tabs {
    min-width: 7.5rem;
    gap: 0.125rem;
    padding: 0.25rem;
  }

  .weekday-tabs__tab {
    padding: 0.28rem 0.5rem;
    padding-left: calc(0.5rem - 2px);
  }
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .weekday-tabs {
    flex-direction: row;
    gap: 0.2rem;
    width: 100%;
    min-width: 0;
    padding: 0.3rem;
    overflow-x: auto;
    overscroll-behavior: contain;
    scroll-snap-type: x proximity;
  }

  .weekday-tabs__tab {
    display: inline-flex;
    flex: 1 0 auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    min-width: 2.5rem;
    min-height: 2.9rem;
    padding: 0.3rem 0.45rem;
    border-left-width: 1px;
    border-radius: var(--radius-sm);
    text-align: center;
    scroll-snap-align: start;
  }

  .weekday-tabs__tab--active {
    border-left-width: 1px;
  }

  .weekday-tabs__label {
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .weekday-tabs__calendar {
    position: absolute;
    top: 0.15rem;
    right: 0.25rem;
    margin-right: 0;
  }

  .weekday-tabs__day {
    font-size: 0.7rem;
  }
}
</style>
