<template>
  <div class="shift-grid" data-test="shift-grid">
    <div class="shift-grid__header" aria-hidden="true">
      <div class="shift-grid__corner">Employee</div>
      <div class="shift-grid__hours" data-test="shift-grid-hours">Hours</div>
      <div class="shift-grid__slots">
        <span
          v-for="slot in slots"
          :key="slot.index"
          class="shift-grid__slot"
          :class="{ 'shift-grid__slot--next-day': slot.isNextDay }"
        >
          {{ slot.label }}
        </span>
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

    <p v-else class="shift-grid__empty">No active employees are available on this day.</p>
  </div>
</template>

<script setup lang="ts">
import type { DaySlot } from '@/shared/utils/shifts'
import type { DayRow, ShiftRangeInput, ShiftResizeInput } from '@/modules/scheduler/types'
import ShiftRow from '@/modules/scheduler/components/ShiftRow.vue'

defineProps<{
  rows: DayRow[]
  slots: DaySlot[]
}>()

const emit = defineEmits<{
  create: [input: ShiftRangeInput]
  resize: [input: ShiftResizeInput]
  remove: [id: string]
  toggleOff: [memberId: string]
}>()
</script>

<style scoped>
.shift-grid {
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.shift-grid__header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  height: var(--grid-header-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.shift-grid__corner {
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

.shift-grid__slots {
  display: flex;
  flex: 1;
  min-width: 0;
}

.shift-grid__slot {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 0.68rem;
  white-space: nowrap;
}

.shift-grid__slot--next-day {
  background: var(--color-inactive-bg);
  color: var(--color-accent);
}

.shift-grid__empty {
  margin: 0;
  padding: 1.25rem;
  color: var(--color-muted);
}
</style>
