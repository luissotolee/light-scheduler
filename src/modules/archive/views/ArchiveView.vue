<template>
  <section class="archive">
    <PageHeader
      :title="t('archive.title')"
      :description="t('archive.description')"
      description-tooltip
    />

    <div class="archive__panel">
      <h2 class="archive__heading">{{ t('archive.exportHeading') }}</h2>
      <p class="archive__copy">{{ t('archive.exportCopy') }}</p>
      <div class="archive__actions">
        <button
          type="button"
          class="archive__button"
          data-test="export-backup"
          :disabled="!canExportBackup"
          @click="handleExport"
        >
          {{ t('archive.exportBackup') }}
        </button>
        <span
          v-if="exportStatusText"
          v-tooltip.top="exportStatusText"
          class="archive__status"
          :class="`archive__status--${status.state}`"
          role="status"
          tabindex="0"
          data-test="status"
        >
          <i
            class="pi archive__status-icon"
            :class="status.state === 'error' ? 'pi-exclamation-circle' : 'pi-check-circle'"
            aria-hidden="true"
          />
          <span class="archive__sr">{{ exportStatusText }}</span>
        </span>
      </div>
    </div>

    <div class="archive__panel">
      <h2 class="archive__heading">{{ t('archive.importHeading') }}</h2>
      <p class="archive__copy">{{ t('archive.importCopy') }}</p>
      <div class="archive__actions">
        <input
          ref="backupFileInput"
          class="archive__file"
          type="file"
          accept=".gz,application/gzip,application/x-gzip"
          data-test="backup-file"
          @change="handleBackupFile"
        />
        <button
          type="button"
          class="archive__button"
          data-test="upload-backup"
          @click="openBackupPicker"
        >
          {{ t('archive.uploadBackup') }}
        </button>
        <span
          v-if="restoreStatusText"
          v-tooltip.top="restoreStatusText"
          class="archive__status"
          :class="`archive__status--${status.state}`"
          role="status"
          tabindex="0"
          data-test="status"
        >
          <i
            class="pi archive__status-icon"
            :class="status.state === 'error' ? 'pi-exclamation-circle' : 'pi-check-circle'"
            aria-hidden="true"
          />
          <span class="archive__sr">{{ restoreStatusText }}</span>
        </span>
      </div>
    </div>

    <ConfirmActionDialog
      :visible="backupImportVisible"
      :header="t('archive.confirm.backupHeader')"
      :message="t('archive.confirm.backupMessage')"
      :confirm-label="t('archive.confirm.backupLabel')"
      severity="danger"
      data-test="backup-import-confirm"
      @update:visible="handleBackupImportVisibility"
      @confirm="store.confirmBackupImport"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/shared/components/PageHeader.vue'
import ConfirmActionDialog from '@/shared/components/ConfirmActionDialog.vue'
import { useArchiveStore } from '@/modules/archive/stores/archive'
import { useI18n } from '@/shared/i18n'
import { formatCsvStatus } from '@/shared/utils/csv'

const store = useArchiveStore()
const { status, canExportBackup, backupImportVisible } = storeToRefs(store)
const { t, tc } = useI18n()
const backupFileInput = ref<HTMLInputElement | null>(null)
const lastAction = ref<'export' | 'restore' | null>(null)

const statusText = computed(() => formatCsvStatus(status.value, t, tc))
const exportStatusText = computed(() => (lastAction.value === 'export' ? statusText.value : ''))
const restoreStatusText = computed(() => (lastAction.value === 'restore' ? statusText.value : ''))

function handleExport(): void {
  lastAction.value = 'export'
  store.exportBackup()
}

function openBackupPicker(): void {
  store.resetStatus()
  backupFileInput.value?.click()
}

async function handleBackupFile(event: Event): Promise<void> {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return

  const file = target.files?.[0]
  target.value = ''
  if (!file) return

  lastAction.value = 'restore'
  await store.prepareBackupImport(file)
}

function handleBackupImportVisibility(visible: boolean): void {
  if (!visible) store.cancelBackupImport()
}
</script>

<style scoped>
.archive {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.archive__panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.archive__heading {
  margin: 0;
  font-size: 1.1rem;
}

.archive__copy {
  margin: 0;
  color: var(--color-muted);
}

.archive__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.archive__file {
  display: none;
}

.archive__button {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.archive__button:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.archive__button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.archive__button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.archive__status {
  display: inline-flex;
  align-items: center;
  align-self: center;
  color: var(--color-muted);
  font-size: 1rem;
  cursor: help;
}

.archive__status--success {
  color: var(--color-accent);
}

.archive__status--error {
  color: var(--color-danger);
}

.archive__status:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.archive__sr {
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
