<template>
  <div class="shift-grid" data-test="shift-grid">
    <div class="shift-grid__header" aria-hidden="true">
      <div class="shift-grid__corner">{{ t('shiftGrid.employee') }}</div>
      <div class="shift-grid__hours" data-test="shift-grid-hours">{{ t('shiftGrid.hours') }}</div>
      <div class="shift-grid__time-header">
        <div class="shift-grid__time-row shift-grid__time-row--hours">
          <span
            v-for="hour in hourLabels"
            :key="hour.key"
            class="shift-grid__time-cell"
            :class="{ 'shift-grid__time-cell--next-day': hour.isNextDay }"
            :style="hourCellStyle(hour.span)"
          >
            {{ hour.label }}
          </span>
        </div>
        <div class="shift-grid__time-row shift-grid__time-row--minutes">
          <span
            v-for="slot in slots"
            :key="slot.index"
            class="shift-grid__time-cell"
            :class="{ 'shift-grid__time-cell--next-day': slot.isNextDay }"
            :style="slotCellStyle()"
          >
            {{ slot.minuteLabel }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="rows.length > 0" class="shift-grid__body">
      <ShiftRow
        v-for="row in rows"
        :key="row.member.id"
        :row="row"
        :slots="slots"
        @create="emit('create', $event)"
        @resize="emit('resize', $event)"
        @remove="emit('remove', $event)"
        @toggle-off="emit('toggleOff', $event)"
      />
    </div>

    <p v-else class="shift-grid__empty">{{ t('shiftGrid.empty') }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DaySlot } from '@/shared/utils/shifts'
import type { DayRow, ShiftRangeInput, ShiftResizeInput } from '@/modules/scheduler/types'
import ShiftRow from '@/modules/scheduler/components/ShiftRow.vue'
import { useI18n } from '@/shared/i18n'

const props = defineProps<{
  rows: DayRow[]
  slots: DaySlot[]
}>()

const emit = defineEmits<{
  create: [input: ShiftRangeInput]
  resize: [input: ShiftResizeInput]
  remove: [id: string]
  toggleOff: [memberId: string]
}>()

const { t } = useI18n()

const slotWidthPercent = computed(() => 100 / props.slots.length)

function hourCellStyle(span: number): Record<string, string> {
  return { flex: `0 0 ${span * slotWidthPercent.value}%` }
}

function slotCellStyle(): Record<string, string> {
  return { flex: `0 0 ${slotWidthPercent.value}%` }
}

interface HourGroup {
  key: string
  label: string
  span: number
  isNextDay: boolean
}

const hourLabels = computed<HourGroup[]>(() => {
  const groups: HourGroup[] = []
  let current = ''
  for (const slot of props.slots) {
    if (slot.hourLabel !== current) {
      groups.push({
        key: `${slot.hourLabel}-${slot.index}`,
        label: slot.hourLabel,
        span: 1,
        isNextDay: slot.isNextDay,
      })
      current = slot.hourLabel
    } else {
      groups[groups.length - 1].span += 1
    }
  }
  return groups
})
</script>

<style scoped>
.shift-grid {
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}

.shift-grid__header {
  display: grid;
  grid-template-columns: var(--grid-name-width) var(--grid-hours-width) 1fr;
  grid-template-rows: repeat(2, 1fr);
  height: calc(var(--grid-header-height) * 2);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.shift-grid__corner {
  grid-row: 1 / 3;
  position: sticky;
  left: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  width: var(--grid-name-width);
  min-width: var(--grid-name-width);
  padding: 0 0.75rem;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.shift-grid__hours {
  grid-row: 1 / 3;
  position: sticky;
  left: var(--grid-name-width);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--grid-hours-width);
  min-width: var(--grid-hours-width);
  padding: 0 0.5rem;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.shift-grid__time-header {
  grid-column: 3;
  grid-row: 1 / 3;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.shift-grid__time-row {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
}

.shift-grid__time-row:first-child {
  border-bottom: 1px solid var(--color-border);
}

.shift-grid__time-cell {
  flex: 0 0 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.shift-grid__time-cell--next-day {
  background: var(--color-inactive-bg);
  color: var(--color-accent);
}

.shift-grid__empty {
  margin: 0;
  padding: 1.25rem;
  color: var(--color-muted);
}
</style>