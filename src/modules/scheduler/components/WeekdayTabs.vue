<template>
  <nav class="weekday-tabs" aria-label="Weekdays" role="tablist" aria-orientation="vertical">
    <button
      v-for="weekday in weekdays"
      :key="weekday.value"
      type="button"
      role="tab"
      class="weekday-tabs__tab"
      :class="{ 'weekday-tabs__tab--active': weekday.value === modelValue }"
      :aria-selected="weekday.value === modelValue"
      :tabindex="weekday.value === modelValue ? 0 : -1"
      :data-test="`weekday-tab-${weekday.value}`"
      @click="emit('update:modelValue', weekday.value)"
    >
      {{ weekday.label }} <span class="weekday-tabs__day">{{ formatOrdinal(weekday.dayOfMonth) }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { Weekday } from '@/types'
import { formatOrdinal } from '@/shared/utils/calendar'

defineProps<{
  modelValue: Weekday
  weekdays: { value: Weekday; label: string; dayOfMonth: number }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [weekday: Weekday]
}>()
</script>

<style scoped>
.weekday-tabs {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 8.5rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.weekday-tabs__tab {
  padding: 0.55rem 0.75rem;
  padding-left: calc(0.75rem - 2px);
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

.weekday-tabs__day {
  color: var(--color-muted);
  font-weight: 400;
}
</style>
