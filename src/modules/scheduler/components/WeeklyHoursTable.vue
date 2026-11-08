<template>
  <section class="weekly-hours" data-test="weekly-hours">
    <h2 class="weekly-hours__title">Weekly hours</h2>

    <div v-if="groups.length > 0" class="weekly-hours__scroll">
      <table class="weekly-hours__table">
        <caption class="weekly-hours__caption visually-hidden">
          Weekly scheduled and contract hours per employee
        </caption>
        <thead>
          <tr>
            <th scope="col" rowspan="2" class="weekly-hours__corner">
              <span class="visually-hidden">Metric</span>
            </th>
            <th
              v-for="group in groups"
              :key="`group-${group.duty}`"
              scope="colgroup"
              :colspan="group.rows.length"
              class="weekly-hours__group"
              :data-test="`weekly-hours-group-${group.duty}`"
            >
              {{ group.label }}
            </th>
          </tr>
          <tr>
            <th
              v-for="row in flatRows"
              :key="row.memberId"
              v-tooltip.top="row.name"
              scope="col"
              class="weekly-hours__col weekly-hours__name"
              :title="row.name"
              :data-test="`weekly-hours-row-${row.memberId}`"
            >
              {{ row.initials }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr data-test="weekly-hours-metric-current">
            <th scope="row" class="weekly-hours__metric">Current</th>
            <td
              v-for="row in flatRows"
              :key="row.memberId"
              class="weekly-hours__col"
              :data-test="`weekly-hours-row-${row.memberId}-current`"
            >
              {{ formatHours(row.currentHours) }}
            </td>
          </tr>
          <tr data-test="weekly-hours-metric-contract">
            <th scope="row" class="weekly-hours__metric">Contract</th>
            <td
              v-for="row in flatRows"
              :key="row.memberId"
              class="weekly-hours__col"
              :data-test="`weekly-hours-row-${row.memberId}-contract`"
            >
              {{ formatHours(row.contractHours) }}
            </td>
          </tr>
          <tr data-test="weekly-hours-metric-diff">
            <th scope="row" class="weekly-hours__metric">Diff</th>
            <td
              v-for="row in flatRows"
              :key="row.memberId"
              class="weekly-hours__col"
              :class="diffClass(row.diffHours)"
              :data-test="`weekly-hours-row-${row.memberId}-diff`"
            >
              {{ formatDiff(row.diffHours) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="weekly-hours__empty">No active employees.</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WeeklyHoursGroup, WeeklyHoursRow } from '@/modules/scheduler/utils/hours'
import { formatDiff, formatHours } from '@/modules/scheduler/utils/hours'

const props = defineProps<{
  groups: WeeklyHoursGroup[]
}>()

const flatRows = computed<WeeklyHoursRow[]>(() => props.groups.flatMap((group) => group.rows))

function diffClass(hours: number): string[] {
  const rounded = Math.round(hours * 10) / 10
  if (rounded < 0) return ['weekly-hours__diff--negative']
  if (rounded === 0) return ['weekly-hours__diff--zero']
  return []
}
</script>

<style scoped>
.weekly-hours {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.weekly-hours__title {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
}

.weekly-hours__scroll {
  overflow-x: auto;
}

.weekly-hours__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.weekly-hours__table th,
.weekly-hours__table td {
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid var(--color-border);
  text-align: center;
  white-space: nowrap;
}

.weekly-hours__table thead th {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.weekly-hours__group {
  background: var(--color-surface-alt);
}

.weekly-hours__col {
  min-width: 4.25rem;
}

.weekly-hours__corner,
.weekly-hours__metric {
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: left;
  min-width: 5rem;
  background: var(--color-surface);
}

.weekly-hours__metric {
  position: sticky;
  left: 0;
}

.weekly-hours__diff--negative {
  color: var(--color-danger);
}

.weekly-hours__diff--zero {
  color: var(--color-muted);
}

.weekly-hours__empty {
  margin: 0;
  color: var(--color-muted);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
