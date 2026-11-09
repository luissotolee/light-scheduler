<template>
  <section class="scheduler">
    <PageHeader
      :title="t('scheduler.title')"
      :description="t('scheduler.description')"
      description-tooltip
    />

    <div class="scheduler__toolbar-wrapper">
      <div class="scheduler__toolbar">
        <Button
          type="button"
          icon="pi pi-chevron-left"
          size="small"
          text
          rounded
          :aria-label="t('scheduler.previousWeek')"
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
          :aria-label="t('scheduler.nextWeek')"
          data-test="next-week"
          @click="store.goToNextWeek"
        />
      </div>
    </div>

    <p v-if="errorMessage" class="scheduler__error" role="alert">{{ errorMessage }}</p>

    <div class="scheduler__content">
      <div class="scheduler__day-header" data-test="scheduler-day-header">
        <h2 class="scheduler__selected-day" data-test="scheduler-selected-day">
          {{ selectedDayLabel }}
        </h2>
        <div class="scheduler__actions">
          <Button
            v-tooltip.top="t('scheduler.clearAll')"
            type="button"
            icon="pi pi-trash"
            size="small"
            text
            rounded
            severity="danger"
            :aria-label="t('scheduler.clearAll')"
            data-test="restart-week"
            @click="openRestartConfirm"
          />
        </div>
      </div>

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
    </div>

    <WeeklyHoursTable :groups="weeklyHoursGroups" />

    <ConfirmActionDialog
      :visible="resetDialogVisible"
      :header="t('scheduler.confirm.restartHeader')"
      :message="t('scheduler.confirm.restartMessage')"
      :confirm-label="t('scheduler.confirm.restartLabel')"
      severity="danger"
      data-test="restart-confirm-dialog"
      @update:visible="handleResetVisibility"
      @confirm="confirmReset"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import ConfirmActionDialog from '@/shared/components/ConfirmActionDialog.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import WeekdayTabs from '@/modules/scheduler/components/WeekdayTabs.vue'
import ShiftGrid from '@/modules/scheduler/components/ShiftGrid.vue'
import WeeklyHoursTable from '@/modules/scheduler/components/WeeklyHoursTable.vue'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import type { ShiftRangeInput, ShiftResizeInput } from '@/modules/scheduler/types'
import { useI18n } from '@/shared/i18n'
import {
  WEEKDAY_ORDER,
  formatFullDate,
  formatWeekRange,
  weekdayDayOfMonth,
} from '@/shared/utils/calendar'
import { buildDaySlots } from '@/shared/utils/shifts'

const store = useSchedulerStore()
const {
  currentWeekKey,
  dayRows,
  error,
  selectedWeekday,
  selectedWeekdayDate,
  weeklyHoursGroups,
} = storeToRefs(store)
const { t, locale } = useI18n()

const weekdayOptions = computed(() =>
  WEEKDAY_ORDER.map((value) => ({
    value,
    label: t(`weekday.${value}`),
    dayOfMonth: weekdayDayOfMonth(currentWeekKey.value, value),
  })),
)
const selectedDayLabel = computed(() => formatFullDate(selectedWeekdayDate.value, locale.value))
const weekRangeLabel = computed(() => formatWeekRange(currentWeekKey.value, locale.value))
const errorMessage = computed(() => (error.value ? t(error.value) : ''))
const slots = buildDaySlots()
const resetDialogVisible = ref(false)

function openRestartConfirm(): void {
  resetDialogVisible.value = true
}

function handleResetVisibility(visible: boolean): void {
  resetDialogVisible.value = visible
}

function confirmReset(): void {
  store.resetCurrentWeek()
  resetDialogVisible.value = false
}

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
  gap: 0.25rem;
}

.scheduler__toolbar-wrapper {
  display: flex;
  justify-content: center;
}

.scheduler__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.scheduler__week {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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

.scheduler__content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.scheduler__day-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  column-gap: 0.5rem;
  min-height: 2rem;
  padding: 0 0.25rem;
}

.scheduler__selected-day {
  grid-column: 2;
  min-width: 0;
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.25;
  text-align: center;
  overflow-wrap: anywhere;
}

.scheduler__actions {
  grid-column: 3;
  display: flex;
  justify-content: flex-end;
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
