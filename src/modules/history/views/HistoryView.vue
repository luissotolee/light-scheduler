<template>
  <section class="history">
    <PageHeader :title="t('history.title')" :description="t('history.description')" />

    <EmptyState
      v-if="availableWeeks.length === 0"
      :title="t('history.emptyTitle')"
      :description="t('history.emptyDescription')"
    />

    <div v-else class="history__weeks">
      <ul class="history__list">
        <li v-for="weekKey in availableWeeks" :key="weekKey">
          <button
            type="button"
            class="history__week"
            :aria-pressed="selectedWeekKey === weekKey"
            @click="store.selectWeek(weekKey)"
          >
            {{ formatWeekRange(weekKey, locale) }}
          </button>
        </li>
      </ul>

      <p class="history__selected" data-test="selected-count">
        {{ t('history.selectedCount', { count: selectedWeekShifts.length }) }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useHistoryStore } from '@/modules/history/stores/history'
import { useI18n } from '@/shared/i18n'
import { formatWeekRange } from '@/shared/utils/calendar'

const store = useHistoryStore()
const { availableWeeks, selectedWeekKey, selectedWeekShifts } = storeToRefs(store)
const { t, locale } = useI18n()
</script>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history__weeks {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.history__week {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.history__week:hover,
.history__week[aria-pressed='true'] {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.history__week:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.history__selected {
  margin: 0;
  color: var(--color-muted);
}
</style>
