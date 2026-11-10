<template>
  <fieldset class="time-picker">
    <legend class="time-picker__label">{{ label }}</legend>
    <div class="time-picker__controls">
      <Select
        :model-value="hourValue"
        :options="hourOptions"
        option-label="label"
        option-value="value"
        :aria-label="t('scheduler.settings.hour')"
        :data-test="`${idPrefix}-hour`"
        @update:model-value="updateHour"
      />
      <span class="time-picker__separator" aria-hidden="true">:</span>
      <Select
        :model-value="minuteValue"
        :options="minuteOptions"
        option-label="label"
        option-value="value"
        :aria-label="t('scheduler.settings.minutes')"
        :data-test="`${idPrefix}-minute`"
        @update:model-value="updateMinute"
      />
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Select from 'primevue/select'
import type { SlotMinutes } from '@/modules/scheduler/types'
import { formatMinutesToHhmm, parseTimeToMinutes } from '@/shared/utils/shifts'
import { useI18n } from '@/shared/i18n'

const props = defineProps<{
  modelValue: string
  label: string
  minuteStep: SlotMinutes
  idPrefix: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

interface TimeOption {
  label: string
  value: number
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

const hourOptions: TimeOption[] = Array.from({ length: 24 }, (_, hour) => ({
  label: pad(hour),
  value: hour,
}))

const minuteOptions = computed<TimeOption[]>(() => {
  const options: TimeOption[] = []
  for (let minute = 0; minute < 60; minute += props.minuteStep) {
    options.push({ label: pad(minute), value: minute })
  }
  return options
})

const parsedMinute = computed(() => parseTimeToMinutes(props.modelValue) ?? 0)

const hourValue = computed(() => Math.floor(parsedMinute.value / 60))

const minuteValue = computed(() => {
  const minute = parsedMinute.value % 60
  return minute - (minute % props.minuteStep)
})

function emitValue(hour: number, minute: number): void {
  emit('update:modelValue', formatMinutesToHhmm(hour * 60 + minute))
}

function updateHour(value: unknown): void {
  const hour = Number(value)
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return
  emitValue(hour, minuteValue.value)
}

function updateMinute(value: unknown): void {
  const minute = Number(value)
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return
  emitValue(hourValue.value, minute)
}
</script>

<style scoped>
.time-picker {
  margin: 0;
  padding: 0;
  border: 0;
}

.time-picker__label {
  padding: 0;
  margin-bottom: 0.35rem;
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
}

.time-picker__controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.time-picker__separator {
  color: var(--color-muted);
  font-weight: 600;
}
</style>
