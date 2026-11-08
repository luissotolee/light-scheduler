<template>
  <section class="scheduler">
    <PageHeader
      title="Scheduler"
      description="Click a cell for a 3-hour shift, drag to choose a custom range, drag a bar's edges to adjust, right-click a bar to remove it."
      description-tooltip
    />

    <div class="scheduler__toolbar">
      <Button
        type="button"
        icon="pi pi-chevron-left"
        size="small"
        text
        rounded
        aria-label="Previous week"
        data-test="previous-week"
        @click="store.goToPreviousWeek"
      />

      <div class="scheduler__week">
        <strong>{{ weekRangeLabel }}</strong>
      </div>

      <Button
        type="button"
        icon="pi pi-chevron-right"
        size="small"
        text
        rounded
        aria-label="Next week"
        data-test="next-week"
        @click="store.goToNextWeek"
      />
    </div>

    <h2 class="scheduler__selected-day" data-test="scheduler-selected-day">
      {{ selectedDayLabel }}
    </h2>

    <p v-if="error" class="scheduler__error" role="alert">{{ error }}</p>

    <div class="scheduler__layout">
      <WeekdayTabs
        :model-value="selectedWeekday"
        :weekdays="weekdayOptions"
        @update:model-value="store.selectWeekday"
      />

      <ShiftGrid
        :rows="dayRows"
        :slots="slots"
        @create="handleCreate"
        @resize="handleResize"
        @remove="handleRemove"
        @toggle-off="store.toggleDayOff"
      />
    </div>

    <WeeklyHoursTable :groups="weeklyHoursGroups" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import PageHeader from '@/shared/components/PageHeader.vue'
import WeekdayTabs from '@/modules/scheduler/components/WeekdayTabs.vue'
import ShiftGrid from '@/modules/scheduler/components/ShiftGrid.vue'
import WeeklyHoursTable from '@/modules/scheduler/components/WeeklyHoursTable.vue'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import type { ShiftRangeInput, ShiftResizeInput } from '@/modules/scheduler/types'
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  formatFullDate,
  formatWeekRange,
  weekdayDayOfMonth,
} from '@/shared/utils/calendar'
import { buildDaySlots } from '@/shared/utils/shifts'

const store = useSchedulerStore()
const { currentWeekKey, dayRows, error, selectedWeekday, selectedWeekdayDate, weeklyHoursGroups } =
  storeToRefs(store)

const weekdayOptions = computed(() =>
  WEEKDAY_ORDER.map((value) => ({
    value,
    label: WEEKDAY_LABELS[value],
    dayOfMonth: weekdayDayOfMonth(currentWeekKey.value, value),
  })),
)
const selectedDayLabel = computed(() => formatFullDate(selectedWeekdayDate.value))
const slots = buildDaySlots()

const weekRangeLabel = computed(() => formatWeekRange(currentWeekKey.value))

function handleCreate(input: ShiftRangeInput): void {
  store.addShiftRange(input)
}

function handleResize(input: ShiftResizeInput): void {
  store.updateShiftRange(input)
}

function handleRemove(id: string): void {
  store.removeShift(id)
}
</script>

<style scoped>
.scheduler {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.scheduler__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-self: center;
  justify-content: center;
  gap: 0.75rem;
  max-width: 100%;
  padding: 0.5rem 0.75rem;
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

.scheduler__selected-day {
  margin: 0;
  font-size: 1.1rem;
  text-align: center;
}

.scheduler__error {
  margin: 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  background: var(--color-inactive-bg);
  color: var(--color-danger);
}

.scheduler__layout {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  min-width: 0;
}

.scheduler__layout > :last-child {
  flex: 1;
  min-width: 0;
}
</style>
