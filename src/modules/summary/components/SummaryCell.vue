<template>
  <span v-if="cell.kind === 'off'" class="summary-cell summary-cell--off" data-test="summary-off">
    {{ t('summary.off') }}
  </span>
  <div
    v-else-if="cell.kind === 'shifts'"
    class="summary-cell summary-cell--shifts"
    :data-count="cell.shifts.length"
  >
    <span v-for="shift in cell.shifts" :key="shift.id" class="summary-cell__shift">
      {{ shift.label }}
    </span>
  </div>
  <span v-else class="summary-cell summary-cell--vacations">
    {{ t('summary.vacations') }}
  </span>
</template>

<script setup lang="ts">
import type { SummaryCell } from '@/modules/summary/types'
import { useI18n } from '@/shared/i18n'

defineProps<{ cell: SummaryCell }>()

const { t } = useI18n()
</script>

<style scoped>
.summary-cell {
  display: block;
  padding: 0.125rem 0.25rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
  white-space: nowrap;
}

.summary-cell--off {
  display: inline-block;
  min-width: 2.5rem;
  border-radius: var(--radius-sm);
  background: var(--color-summary-off-bg);
  color: var(--color-summary-off-text);
  letter-spacing: 0.04em;
}

.summary-cell--shifts {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.125rem;
  align-items: center;
}

.summary-cell__shift {
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-cell__shift + .summary-cell__shift {
  border-top: 1px solid var(--color-summary-border);
  padding-top: 0.25rem;
}

.summary-cell--vacations {
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

@media screen and (max-height: 899px) {
  .summary-cell {
    padding: 0.05rem 0.15rem;
  }

  .summary-cell--off {
    min-width: 2rem;
  }
}

@media print {
  .summary-cell {
    padding: 0;
    font-size: 7.5pt;
  }

  .summary-cell--off {
    min-width: 0;
    background: transparent;
    color: var(--color-sheet-off-text);
  }

  .summary-cell--shifts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-cell__shift + .summary-cell__shift {
    border-top: 0;
    border-left: 1px solid #000;
    padding-top: 0;
    padding-left: 0.25rem;
  }
}
</style>
