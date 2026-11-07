<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import { formatWeekRange } from '@/shared/utils/calendar'
import { formatMinutesToHhmm } from '@/shared/utils/shifts'

const store = useSchedulerStore()
const { currentWeekKey, currentWeekShifts, shiftCount } = storeToRefs(store)

const weekRangeLabel = computed(() => formatWeekRange(currentWeekKey.value))
</script>

<template>
  <section class="scheduler">
    <PageHeader
      title="Scheduler"
      description="Create and manage daily shifts at a weekly cadence for your employees."
    >
      <template #actions>
        <button type="button" class="scheduler__button" data-test="add-shift" disabled>
          Add shift
        </button>
      </template>
    </PageHeader>

    <div class="scheduler__toolbar">
      <button
        type="button"
        class="scheduler__button"
        data-test="previous-week"
        @click="store.goToPreviousWeek"
      >
        Previous week
      </button>

      <div class="scheduler__week">
        <strong>{{ weekRangeLabel }}</strong>
        <span class="scheduler__count">Shifts this week: {{ shiftCount }}</span>
      </div>

      <button
        type="button"
        class="scheduler__button"
        data-test="next-week"
        @click="store.goToNextWeek"
      >
        Next week
      </button>
    </div>

    <EmptyState
      v-if="currentWeekShifts.length === 0"
      title="No shifts this week yet"
      description="Shift editing is coming next. The weekly view is already wired to the shared schedule data."
    />

    <ul v-else class="scheduler__shifts">
      <li v-for="shift in currentWeekShifts" :key="shift.id" class="scheduler__shift">
        <span class="scheduler__shift-day">{{ shift.weekday }}</span>
        <span>
          {{ formatMinutesToHhmm(shift.startMinute) }}–{{ formatMinutesToHhmm(shift.endMinute) }}
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.scheduler {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scheduler__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.scheduler__week {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
}

.scheduler__count {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.scheduler__button {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.scheduler__button:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.scheduler__button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.scheduler__button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.scheduler__shifts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.scheduler__shift {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.scheduler__shift-day {
  text-transform: capitalize;
  color: var(--color-muted);
}
</style>
