<script setup lang="ts">
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import { useSummaryStore } from '@/stores/summary'

const store = useSummaryStore()
const { weekRangeLabel, totalShifts, assignedMemberCount } = storeToRefs(store)

function printSummary(): void {
  window.print()
}
</script>

<template>
  <section class="summary">
    <PageHeader
      title="Summary"
      description="Review the weekly schedule and print it or save it as a PDF."
    >
      <template #actions>
        <button type="button" class="summary__button" data-test="print" @click="printSummary">
          Print
        </button>
        <button type="button" class="summary__button" data-test="save-pdf" disabled>
          Save as PDF
        </button>
      </template>
    </PageHeader>

    <p class="summary__week">{{ weekRangeLabel }}</p>

    <dl class="summary__metrics">
      <div class="summary__metric">
        <dt class="summary__metric-label">Total shifts</dt>
        <dd class="summary__metric-value" data-test="total-shifts">{{ totalShifts }}</dd>
      </div>
      <div class="summary__metric">
        <dt class="summary__metric-label">Assigned members</dt>
        <dd class="summary__metric-value" data-test="assigned-members">
          {{ assignedMemberCount }}
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary__week {
  margin: 0;
  color: var(--color-muted);
}

.summary__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
  margin: 0;
}

.summary__metric {
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.summary__metric-label {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.summary__metric-value {
  margin: 0.35rem 0 0;
  font-size: 2rem;
  font-weight: 700;
}

.summary__button {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.summary__button:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.summary__button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.summary__button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
