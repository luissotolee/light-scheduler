<template>
  <ul class="calendar-entry-list" data-test="calendar-entry-list">
    <li
      v-for="entry in entries"
      :key="entry.id"
      class="calendar-entry-list__item"
      :data-test="`calendar-entry-${entry.id}`"
    >
      <div class="calendar-entry-list__body">
        <span class="calendar-entry-list__date">{{ formatIsoDate(entry.date, locale) }}</span>
        <span class="calendar-entry-list__name">{{ entry.name }}</span>
        <span class="calendar-entry-list__tags">
          <span class="calendar-entry-list__kind" :class="`calendar-entry-list__kind--${entry.kind}`">
            {{ t(calendarKindLabelKey(entry.kind)) }}
          </span>
          <span v-if="entry.kind === 'public_holiday'" class="calendar-entry-list__fetched">
            {{ t('calendar.fetchedBadge') }}
          </span>
        </span>
      </div>

      <div class="calendar-entry-list__actions">
        <Button
          v-if="entry.kind !== 'public_holiday'"
          v-tooltip.top="t('calendar.entry.editAria', { name: entry.name })"
          type="button"
          icon="pi pi-pencil"
          size="small"
          text
          rounded
          :aria-label="t('calendar.entry.editAria', { name: entry.name })"
          data-test="calendar-entry-edit"
          :data-entry-id="entry.id"
          @click="emit('edit', entry.id)"
        />
        <Button
          v-tooltip.top="t('calendar.entry.removeAria', { name: entry.name })"
          type="button"
          icon="pi pi-trash"
          size="small"
          text
          rounded
          severity="danger"
          :aria-label="t('calendar.entry.removeAria', { name: entry.name })"
          data-test="calendar-entry-remove"
          :data-entry-id="entry.id"
          @click="emit('remove', entry.id)"
        />
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import type { CalendarEntry } from '@/types'
import { useI18n } from '@/shared/i18n'
import { formatIsoDate } from '@/shared/utils/calendar'
import { calendarKindLabelKey } from '@/shared/utils/calendarEntries'

defineProps<{
  entries: CalendarEntry[]
}>()

const emit = defineEmits<{
  edit: [id: string]
  remove: [id: string]
}>()

const { t, locale } = useI18n()
</script>

<style scoped>
.calendar-entry-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.calendar-entry-list__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.calendar-entry-list__body {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.6rem;
  min-width: 0;
}

.calendar-entry-list__date {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.calendar-entry-list__name {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.calendar-entry-list__tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.calendar-entry-list__kind,
.calendar-entry-list__fetched {
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.calendar-entry-list__kind--public_holiday,
.calendar-entry-list__kind--custom_holiday {
  background: var(--color-vacation-bg);
  color: var(--color-vacation-text);
}

.calendar-entry-list__kind--custom_event {
  background: var(--color-surface-alt);
  color: var(--color-accent);
}

.calendar-entry-list__fetched {
  border: 1px solid var(--color-border);
  color: var(--color-muted);
}

.calendar-entry-list__actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.125rem;
}
</style>
