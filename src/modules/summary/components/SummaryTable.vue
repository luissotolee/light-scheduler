<template>
  <div class="summary-table-wrapper">
    <table class="summary-table" data-test="summary-table">
      <caption class="visually-hidden">
        {{ t('summary.caption', { range: weekRangeLabel }) }}
      </caption>
      <colgroup>
        <col class="summary-table__col summary-table__col--employee" />
        <col v-for="day in days" :key="day.weekday" class="summary-table__col" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" class="summary-table__employee-header">
            {{ t('summary.employee') }}
          </th>
          <th
            v-for="day in days"
            :key="day.weekday"
            scope="col"
            class="summary-table__day-header"
          >
            <span class="summary-table__weekday">
              {{ t(`weekday.${day.weekday}` as MessageKey) }}
            </span>
            <span class="summary-table__date">
              {{ formatOrdinal(day.dayOfMonth, localeStore.locale) }}
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.memberId"
          :class="{ 'summary-table__row--vacation': row.isVacation }"
          :data-test="`summary-row-${row.memberId}`"
        >
          <th scope="row" class="summary-table__employee">
            <button
              type="button"
              class="summary-table__name-button"
              :data-test="`summary-details-${row.memberId}`"
              :aria-label="t('employees.detailsFor', { name: row.name })"
              @click="emit('details', row.memberId)"
            >
              {{ row.name }}
            </button>
          </th>

          <template v-if="row.isVacation">
            <td
              :colspan="days.length"
              class="summary-table__vacation"
              data-test="summary-vacation"
            >
              {{ t('summary.vacations') }}
            </td>
          </template>

          <template v-else>
            <td
              v-for="day in days"
              :key="day.weekday"
              :class="[
                'summary-table__cell',
                `summary-table__cell--${row.cells[day.weekday].kind}`,
              ]"
              :data-test="`summary-cell-${row.memberId}-${day.weekday}`"
            >
              <SummaryCell :cell="row.cells[day.weekday]" />
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { SummaryDayHeader, SummaryRow } from '@/modules/summary/types'
import type { MessageKey } from '@/shared/i18n'
import SummaryCell from '@/modules/summary/components/SummaryCell.vue'
import { useI18n } from '@/shared/i18n'
import { useLocaleStore } from '@/shared/stores/locale'
import { formatOrdinal } from '@/shared/utils/calendar'

defineProps<{
  rows: SummaryRow[]
  days: SummaryDayHeader[]
  weekRangeLabel: string
}>()

const emit = defineEmits<{
  details: [memberId: string]
}>()

const { t } = useI18n()
const localeStore = useLocaleStore()
</script>

<style scoped>
.summary-table-wrapper {
  overflow-x: auto;
  border-radius: var(--radius-sm);
}

.summary-table {
  width: 100%;
  min-width: 64rem;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 0.875rem;
  color: var(--color-summary-text);
  background: var(--color-summary-bg);
}

.summary-table__col--employee {
  width: 14rem;
}

.summary-table th,
.summary-table td {
  border: 1px solid var(--color-summary-border);
  padding: 0.35rem 0.4rem;
  text-align: center;
  vertical-align: middle;
}

.summary-table thead th {
  background: var(--color-summary-header-bg);
  color: var(--color-summary-header-text);
}

.summary-table thead .summary-table__employee-header {
  background: var(--color-summary-employee-header-bg);
}

.summary-table__employee-header,
.summary-table__employee {
  text-align: left;
}

.summary-table__employee {
  font-weight: 600;
  overflow-wrap: anywhere;
  background: var(--color-summary-employee-bg);
}

.summary-table__name-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.summary-table__name-button:hover {
  color: var(--color-accent);
  text-decoration: underline;
}

.summary-table__name-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.summary-table__day-header {
  font-weight: 600;
}

.summary-table__weekday,
.summary-table__date {
  display: block;
}

.summary-table__date {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-summary-muted);
}

.summary-table__row--vacation {
  background: var(--color-summary-vacation-bg);
}

.summary-table__row--vacation .summary-table__employee {
  background: var(--color-summary-vacation-bg);
}

.summary-table__vacation {
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-summary-vacation-text);
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

@media screen and (max-height: 899px) {
  .summary-table {
    font-size: 0.8rem;
  }

  .summary-table th,
  .summary-table td {
    padding: 0.2rem 0.3rem;
  }

  .summary-table__date {
    font-size: 0.68rem;
  }
}

@media print {
  .summary-table-wrapper {
    overflow: visible;
  }

  .summary-table {
    min-width: 0;
    font-size: 8pt;
    color: #000;
    background: #fff;
    break-inside: avoid;
  }

  .summary-table__col--employee {
    width: 32mm;
  }

  .summary-table th,
  .summary-table td {
    border-color: #000;
    padding: 1mm 1.2mm;
  }

  .summary-table tr {
    break-inside: avoid;
  }

  .summary-table thead th {
    font-size: 7pt;
    background: var(--color-sheet-header-bg);
    color: #000;
  }

  .summary-table thead .summary-table__employee-header {
    background: var(--color-sheet-employee-bg);
  }

  .summary-table__employee {
    background: var(--color-sheet-employee-bg);
  }

  .summary-table__name-button {
    color: #000;
    cursor: default;
  }

  .summary-table__cell--off {
    background: var(--color-sheet-off-bg);
  }

  .summary-table__date {
    color: #000;
  }

  .summary-table__row--vacation {
    background: #fef3c7 !important;
  }

  .summary-table__row--vacation .summary-table__employee {
    background: #fef3c7 !important;
  }

  .summary-table__vacation {
    color: #92400e !important;
  }
}
</style>
