<template>
  <AppDialog
    :visible="visible"
    modal
    :header="title"
    class="calendar-entry-form-dialog"
    @update:visible="emit('update:visible', $event)"
  >
    <form
      class="calendar-entry-form"
      data-test="calendar-entry-form"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <div class="calendar-entry-form__field">
        <label class="calendar-entry-form__label" for="calendar-entry-date">
          {{ t('calendar.form.date') }}
        </label>
        <DatePicker
          v-model="form.date"
          input-id="calendar-entry-date"
          date-format="yy-mm-dd"
          show-icon
          class="calendar-entry-form__date"
          data-test="calendar-entry-date"
          :aria-invalid="dateError ? 'true' : undefined"
          :aria-describedby="dateError ? 'calendar-entry-date-error' : undefined"
        />
        <small
          v-if="dateError"
          id="calendar-entry-date-error"
          class="calendar-entry-form__error"
          data-test="calendar-entry-date-error"
        >
          {{ dateError }}
        </small>
      </div>

      <div class="calendar-entry-form__field">
        <label class="calendar-entry-form__label" for="calendar-entry-name">
          {{ t('calendar.form.name') }}
        </label>
        <InputText
          id="calendar-entry-name"
          v-model="form.name"
          autocomplete="off"
          required
          aria-required="true"
          data-test="calendar-entry-name"
          :placeholder="t('calendar.form.namePlaceholder')"
          :aria-invalid="nameError ? 'true' : undefined"
          :aria-describedby="nameError ? 'calendar-entry-name-error' : undefined"
        />
        <small
          v-if="nameError"
          id="calendar-entry-name-error"
          class="calendar-entry-form__error"
          data-test="calendar-entry-name-error"
        >
          {{ nameError }}
        </small>
      </div>

      <div class="calendar-entry-form__field">
        <label class="calendar-entry-form__label" for="calendar-entry-kind">
          {{ t('calendar.form.kind') }}
        </label>
        <Select
          v-model="form.kind"
          input-id="calendar-entry-kind"
          :options="kindOptions"
          option-label="label"
          option-value="value"
          required
          aria-required="true"
          data-test="calendar-entry-kind"
          :aria-invalid="kindError ? 'true' : undefined"
          :aria-describedby="kindError ? 'calendar-entry-kind-error' : undefined"
        />
        <small
          v-if="kindError"
          id="calendar-entry-kind-error"
          class="calendar-entry-form__error"
          data-test="calendar-entry-kind-error"
        >
          {{ kindError }}
        </small>
      </div>

      <small v-if="error" class="calendar-entry-form__error" role="alert" data-test="calendar-entry-error">
        {{ error }}
      </small>

      <div class="calendar-entry-form__actions">
        <Button
          type="button"
          :label="t('common.cancel')"
          severity="secondary"
          data-test="calendar-entry-cancel"
          @click="emit('update:visible', false)"
        />
        <Button type="submit" :label="t('common.save')" data-test="calendar-entry-save" />
      </div>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import AppDialog from '@/shared/components/AppDialog.vue'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import type { CalendarEntry, NewCalendarEntry } from '@/types'
import { useI18n } from '@/shared/i18n'
import { isoDateToDate, toLocalIsoDate } from '@/shared/utils/calendar'
import {
  validateCalendarEntryInput,
  type CalendarEntryInputErrors,
} from '@/shared/utils/calendarEntries'

const props = defineProps<{
  visible: boolean
  entry: CalendarEntry | null
  defaultDate?: string
  error?: string
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  submit: [input: NewCalendarEntry]
}>()

const { t } = useI18n()

const form = reactive<{
  date: Date | null
  name: string
  kind: NewCalendarEntry['kind']
}>({
  date: new Date(),
  name: '',
  kind: 'custom_event',
})

const submitted = ref(false)

const kindOptions = computed(() => [
  { label: t('calendar.form.kindHoliday'), value: 'custom_holiday' as const },
  { label: t('calendar.form.kindEvent'), value: 'custom_event' as const },
])

const validation = computed(() =>
  validateCalendarEntryInput({
    date: form.date ? toLocalIsoDate(form.date) : null,
    name: form.name,
    kind: form.kind,
  }),
)

const errors = computed<CalendarEntryInputErrors>(() =>
  validation.value.ok ? {} : validation.value.errors,
)

const visibleErrors = computed<CalendarEntryInputErrors>(() => (submitted.value ? errors.value : {}))

function errorText(key: CalendarEntryInputErrors[keyof CalendarEntryInputErrors]): string {
  return key ? t(key) : ''
}

const dateError = computed(() => errorText(visibleErrors.value.date))
const nameError = computed(() => errorText(visibleErrors.value.name))
const kindError = computed(() => errorText(visibleErrors.value.kind))

const title = computed(() =>
  props.entry ? t('calendar.form.editTitle') : t('calendar.form.addTitle'),
)

function resetForm(): void {
  submitted.value = false
  form.date = props.entry
    ? isoDateToDate(props.entry.date)
    : props.defaultDate
      ? isoDateToDate(props.defaultDate)
      : new Date()
  form.name = props.entry?.name ?? ''
  form.kind = props.entry?.kind === 'custom_holiday' ? 'custom_holiday' : 'custom_event'
}

watch(
  [() => props.visible, () => props.entry, () => props.defaultDate],
  ([visible]) => {
    if (visible) resetForm()
  },
  { immediate: true },
)

function handleSubmit(): void {
  submitted.value = true
  if (validation.value.ok) {
    emit('submit', validation.value.value)
  }
}
</script>

<style scoped>
.calendar-entry-form-dialog {
  width: min(28rem, 92vw);
}

.calendar-entry-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.calendar-entry-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.calendar-entry-form__label {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.calendar-entry-form__date {
  width: 100%;
}

.calendar-entry-form__error {
  color: var(--color-danger);
  font-size: 0.8rem;
}

.calendar-entry-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .calendar-entry-form-dialog {
    width: 100vw;
  }

  .calendar-entry-form__actions {
    position: sticky;
    bottom: 0;
    z-index: 2;
    padding: 0.75rem 0 calc(0.25rem + var(--safe-area-bottom));
    background: var(--color-surface);
  }
}
</style>
