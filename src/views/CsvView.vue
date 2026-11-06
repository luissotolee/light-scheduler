<script setup lang="ts">
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import { useCsvStore } from '@/stores/csv'

const store = useCsvStore()
const { status, canExportMembers, canExportSchedule } = storeToRefs(store)
</script>

<template>
  <section class="csv">
    <PageHeader
      title="CSV I/O"
      description="Export employees and weekly schedules, or import files to resume work later."
    />

    <div class="csv__panel">
      <h2 class="csv__heading">Export</h2>
      <p class="csv__copy">
        Download the current workspace data as CSV. Files use UTF-8 with a byte-order mark so
        spreadsheet tools open them correctly.
      </p>
      <div class="csv__actions">
        <button
          type="button"
          class="csv__button"
          data-test="export-employees"
          :disabled="!canExportMembers"
          @click="store.exportMembers"
        >
          Export Employees
        </button>
        <button
          type="button"
          class="csv__button"
          data-test="export-schedule"
          :disabled="!canExportSchedule"
          @click="store.exportSchedule"
        >
          Export Schedule
        </button>
      </div>
    </div>

    <div class="csv__panel">
      <h2 class="csv__heading">Import</h2>
      <p class="csv__copy">Uploading employees and schedules is coming soon.</p>
      <div class="csv__actions">
        <button type="button" class="csv__button" data-test="upload-employees" disabled>
          Upload Employees
        </button>
        <button type="button" class="csv__button" data-test="upload-schedule" disabled>
          Upload Schedule
        </button>
      </div>
    </div>

    <p
      v-if="status.message"
      class="csv__status"
      :class="`csv__status--${status.state}`"
      data-test="status"
      role="status"
    >
      {{ status.message }}
    </p>
  </section>
</template>

<style scoped>
.csv {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.csv__panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.csv__heading {
  margin: 0;
  font-size: 1.1rem;
}

.csv__copy {
  margin: 0;
  color: var(--color-muted);
}

.csv__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.csv__button {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.csv__button:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.csv__button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.csv__button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.csv__status {
  margin: 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
}

.csv__status--success {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.csv__status--error {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
</style>
