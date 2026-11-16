<template>
  <AppDialog
    :visible="visible"
    :header="t('summary.settings.title')"
    class="summary-settings-dialog"
    @update:visible="emit('update:visible', $event)"
  >
    <form class="summary-settings" data-test="summary-settings-form" @submit.prevent="handleSave">
      <p class="summary-settings__description">{{ t('summary.settings.description') }}</p>

      <div class="summary-settings__field">
        <p v-if="isPhone" class="summary-settings__hint">
          {{ t('summary.settings.showWeeklyHoursTooltip') }}
        </p>
        <div class="summary-settings__toggle">
          <div class="summary-settings__label-row">
            <label class="summary-settings__label" for="summary-settings-show-hours">
              {{ t('summary.settings.showWeeklyHours') }}
            </label>
            <span
              v-tooltip.top="t('summary.settings.showWeeklyHoursTooltip')"
              class="summary-settings__info"
              role="img"
              :aria-label="t('summary.settings.showWeeklyHoursTooltip')"
              tabindex="0"
              data-test="summary-settings-info"
            >
              <i class="pi pi-info-circle" aria-hidden="true" />
            </span>
          </div>
          <ToggleSwitch
            v-model="form.showWeeklyHours"
            input-id="summary-settings-show-hours"
            :pt="{ input: { 'data-test': 'summary-settings-show-hours' } }"
          />
        </div>
      </div>

      <div class="summary-settings__actions">
        <Button
          type="button"
          :label="t('common.cancel')"
          severity="secondary"
          data-test="summary-settings-cancel"
          @click="emit('update:visible', false)"
        />
        <Button
          type="submit"
          :label="t('common.save')"
          data-test="summary-settings-save"
        />
      </div>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import AppDialog from '@/shared/components/AppDialog.vue'
import type { SummarySettings } from '@/types'
import { useI18n } from '@/shared/i18n'
import { useIsPhone } from '@/shared/composables/useIsPhone'

const props = defineProps<{
  visible: boolean
  settings: SummarySettings
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  save: [settings: SummarySettings]
}>()

const { t } = useI18n()
const isPhone = useIsPhone()

const form = reactive<SummarySettings>({ ...props.settings })

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    form.showWeeklyHours = props.settings.showWeeklyHours
  },
  { immediate: true },
)

function handleSave(): void {
  emit('save', { ...form })
}
</script>

<style scoped>
.summary-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: min(20rem, 100%);
}

.summary-settings-dialog :deep(.p-dialog-content) {
  max-height: calc(100dvh - 10rem);
  overflow-y: auto;
}

.summary-settings__description,
.summary-settings__hint {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.85rem;
}

.summary-settings__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.summary-settings__label {
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
}

.summary-settings__label-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.summary-settings__info {
  display: inline-flex;
  align-items: center;
  color: var(--color-muted);
  font-size: 0.9rem;
  cursor: help;
}

.summary-settings__info:hover,
.summary-settings__info:focus-visible {
  color: var(--color-accent);
}

.summary-settings__info:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.summary-settings__toggle {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
}

.summary-settings__toggle .summary-settings__label {
  cursor: pointer;
}

.summary-settings__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .summary-settings {
    min-width: 0;
  }

  .summary-settings-dialog {
    width: 100vw;
  }

  .summary-settings-dialog :deep(.p-dialog-content) {
    max-height: none;
  }

  .summary-settings__actions {
    position: sticky;
    bottom: 0;
    z-index: 2;
    padding: 0.75rem 0 calc(0.25rem + var(--safe-area-bottom));
    background: var(--color-surface);
  }
}
</style>
