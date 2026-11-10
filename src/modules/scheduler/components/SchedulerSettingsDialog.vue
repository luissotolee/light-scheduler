<template>
  <Dialog
    :visible="visible"
    modal
    :header="t('scheduler.settings.title')"
    class="scheduler-settings-dialog"
    @update:visible="emit('update:visible', $event)"
  >
    <form
      class="scheduler-settings"
      data-test="scheduler-settings-form"
      novalidate
      @submit.prevent="handleSave"
    >
      <p class="scheduler-settings__description">
        {{ t('scheduler.settings.description') }}
      </p>

      <div class="scheduler-settings__times">
        <TimePickerField
          v-model="form.startTime"
          :label="t('scheduler.settings.start')"
          :minute-step="form.slotMinutes"
          id-prefix="settings-start"
        />
        <TimePickerField
          v-model="form.endTime"
          :label="t('scheduler.settings.end')"
          :minute-step="form.slotMinutes"
          id-prefix="settings-end"
        />
      </div>

      <p v-if="endsNextDay" class="scheduler-settings__hint" data-test="settings-next-day">
        {{ t('scheduler.settings.nextDay') }}
      </p>

      <div class="scheduler-settings__field">
        <span class="scheduler-settings__label">{{ t('scheduler.settings.rate') }}</span>
        <SelectButton
          :model-value="form.slotMinutes"
          :options="rateOptions"
          option-label="label"
          option-value="value"
          :aria-label="t('scheduler.settings.rate')"
          data-test="settings-rate"
          @update:model-value="handleRateChange"
        >
          <template #option="{ option }">
            <span :data-test="`settings-rate-${option.value}`">{{ option.label }}</span>
          </template>
        </SelectButton>
      </div>

      <p class="scheduler-settings__hint">{{ t('scheduler.settings.outsideWindow') }}</p>

      <p v-if="errorMessage" class="scheduler-settings__error" role="alert" data-test="settings-error">
        {{ errorMessage }}
      </p>

      <div class="scheduler-settings__actions">
        <Button
          type="button"
          :label="t('common.cancel')"
          severity="secondary"
          data-test="settings-cancel"
          @click="emit('update:visible', false)"
        />
        <Button
          type="submit"
          :label="t('common.save')"
          :disabled="!validation.ok"
          data-test="settings-save"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import SelectButton from 'primevue/selectbutton'
import TimePickerField from '@/modules/scheduler/components/TimePickerField.vue'
import type { SchedulerSettings, SlotMinutes } from '@/modules/scheduler/types'
import {
  isSlotMinutes,
  snapTimeToStep,
  validateSchedulerSettings,
} from '@/modules/scheduler/utils/settings'
import { parseTimeToMinutes } from '@/shared/utils/shifts'
import { useI18n } from '@/shared/i18n'

const props = defineProps<{
  visible: boolean
  settings: SchedulerSettings
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  save: [settings: SchedulerSettings]
}>()

const { t } = useI18n()

const form = reactive<SchedulerSettings>({ ...props.settings })

const rateOptions = computed(() => [
  { label: t('scheduler.settings.rate30'), value: 30 as SlotMinutes },
  { label: t('scheduler.settings.rate15'), value: 15 as SlotMinutes },
])

const validation = computed(() => validateSchedulerSettings(form))
const errorMessage = computed(() =>
  validation.value.ok ? '' : t(validation.value.error),
)

const endsNextDay = computed(() => {
  const start = parseTimeToMinutes(form.startTime)
  const end = parseTimeToMinutes(form.endTime)
  return start !== null && end !== null && end < start
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    form.startTime = snapTimeToStep(props.settings.startTime, props.settings.slotMinutes)
    form.endTime = snapTimeToStep(props.settings.endTime, props.settings.slotMinutes)
    form.slotMinutes = props.settings.slotMinutes
  },
  { immediate: true },
)

function handleRateChange(value: unknown): void {
  if (!isSlotMinutes(value)) return
  form.slotMinutes = value
  form.startTime = snapTimeToStep(form.startTime, value)
  form.endTime = snapTimeToStep(form.endTime, value)
}

function handleSave(): void {
  if (!validation.value.ok) return
  emit('save', { ...validation.value.value })
}
</script>

<style scoped>
.scheduler-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: min(20rem, 100%);
}

.scheduler-settings-dialog :deep(.p-dialog-content) {
  max-height: calc(100dvh - 10rem);
  overflow-y: auto;
}

.scheduler-settings__description,
.scheduler-settings__hint {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.85rem;
}

.scheduler-settings__times {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.scheduler-settings__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.scheduler-settings__label {
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
}

.scheduler-settings__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.85rem;
}

.scheduler-settings__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media screen and (max-height: 899px) {
  .scheduler-settings {
    gap: 0.75rem;
  }

  .scheduler-settings__times {
    gap: 0.75rem;
  }
}
</style>
