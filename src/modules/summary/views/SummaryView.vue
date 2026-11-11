<template>
  <section class="summary">
    <div class="summary__screen-only">
      <PageHeader
        :title="t('summary.title')"
        :description="t('summary.description')"
        description-tooltip
      >
        <template #actions>
          <Button
            type="button"
            icon="pi pi-print"
            severity="secondary"
            outlined
            :label="t('summary.print')"
            data-test="print-summary"
            @click="printSummary"
          />
          <Button
            type="button"
            icon="pi pi-file-pdf"
            :label="t('summary.savePdf')"
            data-test="save-summary-pdf"
            @click="savePdf"
          />
        </template>
      </PageHeader>

      <div class="summary__toolbar" role="group" :aria-label="t('summary.title')">
        <Button
          v-tooltip.top="t('summary.previousWeekTooltip')"
          type="button"
          icon="pi pi-chevron-left"
          text
          rounded
          :aria-label="t('summary.previousWeek')"
          data-test="summary-previous-week"
          @click="store.goToPreviousWeek"
        />
        <button
          v-tooltip.top="t('weekPicker.open')"
          type="button"
          class="summary__week"
          :aria-label="t('weekPicker.open')"
          aria-live="polite"
          data-test="summary-week-label"
          @click="weekPickerVisible = true"
        >
          {{ weekRangeLabel }}
        </button>
        <Button
          v-tooltip.top="t('summary.nextWeekTooltip')"
          type="button"
          icon="pi pi-chevron-right"
          text
          rounded
          :aria-label="t('summary.nextWeek')"
          data-test="summary-next-week"
          @click="store.goToNextWeek"
        />
        <Button
          type="button"
          :label="t('summary.thisWeek')"
          text
          size="small"
          data-test="summary-this-week"
          @click="store.goToCurrentWeek"
        />
      </div>
    </div>

    <div class="summary__sheet" :style="{ '--summary-print-zoom': String(printZoom) }">
      <header class="summary__sheet-header">
        <h2 class="summary__sheet-title">{{ t('summary.title') }}</h2>
        <p class="summary__sheet-range">{{ weekRangeLabel }}</p>
      </header>

      <SummaryTable
        v-if="rows.length > 0"
        :rows="rows"
        :days="dayHeaders"
        :week-range-label="weekRangeLabel"
        @details="openDetails"
      />
      <EmptyState
        v-else
        :title="t('summary.emptyTitle')"
        :description="t('summary.emptyDescription')"
      />
    </div>

    <EmployeeDetailsDialog
      :visible="detailsVisible"
      :member="detailsTarget"
      @update:visible="handleDetailsVisibility"
    />

    <HolidayWeeksDialog
      mode="week"
      :visible="weekPickerVisible"
      :current-week="currentWeekKey"
      @update:visible="weekPickerVisible = $event"
      @select="store.setWeekKey"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import EmployeeDetailsDialog from '@/shared/components/EmployeeDetailsDialog.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import HolidayWeeksDialog from '@/shared/components/HolidayWeeksDialog.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import SummaryTable from '@/modules/summary/components/SummaryTable.vue'
import { useSummaryStore } from '@/modules/summary/stores/summary'
import { saveSummaryPdf } from '@/modules/summary/utils/pdf'
import { useI18n } from '@/shared/i18n'
import { useWorkspaceStore } from '@/shared/stores/workspace'

const store = useSummaryStore()
const workspaceStore = useWorkspaceStore()
const { rows, dayHeaders, weekRangeLabel, printZoom, currentWeekKey } = storeToRefs(store)
const { t, locale } = useI18n()

const detailsTargetId = ref<string | null>(null)
const weekPickerVisible = ref(false)
const detailsTarget = computed(() =>
  detailsTargetId.value ? (workspaceStore.findMember(detailsTargetId.value) ?? null) : null,
)
const detailsVisible = computed(() => detailsTarget.value !== null)

function openDetails(memberId: string): void {
  detailsTargetId.value = memberId
}

function handleDetailsVisibility(visible: boolean): void {
  if (!visible) detailsTargetId.value = null
}

function printSummary(): void {
  window.print()
}

function savePdf(): void {
  saveSummaryPdf({
    rows: rows.value,
    days: dayHeaders.value,
    weekKey: currentWeekKey.value,
    weekRangeLabel: weekRangeLabel.value,
    locale: locale.value,
  })
}
</script>

<style scoped>
.summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-stack);
}

.summary__toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.summary__week {
  margin: 0;
  min-width: 14rem;
  padding: 0.125rem 0.5rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  font-family: inherit;
  text-align: center;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
}

.summary__week:hover {
  color: var(--color-accent);
}

.summary__week:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.summary__sheet {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.summary__sheet-header {
  display: none;
}

@media screen and (max-height: 899px) {
  .summary__sheet {
    padding: 0.5rem;
  }

  .summary__week {
    min-width: 12rem;
    font-size: 0.95rem;
  }
}

@media print {
  .summary__screen-only {
    display: none !important;
  }

  .summary {
    display: block;
  }

  .summary__sheet {
    width: calc(100% / var(--summary-print-zoom, 1));
    zoom: var(--summary-print-zoom, 1);
    padding: 0;
    border: 0;
    border-radius: 0;
    background: #fff;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .summary__sheet-header {
    display: block;
    margin-bottom: 2mm;
    text-align: center;
  }

  .summary__sheet-title {
    margin: 0;
    font-size: 12pt;
  }

  .summary__sheet-range {
    margin: 0;
    font-size: 9pt;
  }
}
</style>
