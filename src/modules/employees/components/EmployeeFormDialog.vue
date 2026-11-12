<template>
  <AppDialog
    :visible="visible"
    modal
    :header="title"
    class="employee-form-dialog"
    @update:visible="emit('update:visible', $event)"
  >
    <form class="employee-form" data-test="employee-form" novalidate @submit.prevent="handleSubmit">
      <div class="employee-form__field">
        <label class="employee-form__label" for="employee-name">{{ t('employees.form.name') }}</label>
        <InputText
          id="employee-name"
          v-model="form.name"
          autocomplete="off"
          required
          aria-required="true"
          data-test="employee-name-input"
          :placeholder="t('employees.form.namePlaceholder')"
          :aria-invalid="nameError ? 'true' : undefined"
          :aria-describedby="nameError ? 'employee-name-error' : undefined"
        />
        <small
          v-if="nameError"
          id="employee-name-error"
          class="employee-form__error"
          data-test="name-error"
        >
          {{ nameError }}
        </small>
      </div>

      <div class="employee-form__field">
        <label class="employee-form__label" for="employee-duty">
          {{ t('employees.form.duty') }}
        </label>
        <Select
          v-model="form.duty"
          input-id="employee-duty"
          :options="dutyOptions"
          option-label="label"
          option-value="value"
          required
          aria-required="true"
          data-test="employee-duty-select"
          :aria-invalid="dutyError ? 'true' : undefined"
          :aria-describedby="dutyError ? 'employee-duty-error' : undefined"
        />
        <small
          v-if="dutyError"
          id="employee-duty-error"
          class="employee-form__error"
          data-test="duty-error"
        >
          {{ dutyError }}
        </small>
      </div>

      <fieldset class="employee-form__field employee-form__field--full">
        <legend class="employee-form__label">{{ t('employees.form.contract') }}</legend>
        <div
          class="employee-form__radio-group"
          role="radiogroup"
          data-test="employee-contract-group"
          :aria-label="t('employees.form.contractGroup')"
          aria-required="true"
          :aria-invalid="contractError ? 'true' : undefined"
          :aria-describedby="contractError ? 'employee-contract-error' : undefined"
        >
          <div v-for="value in CONTRACTS" :key="value" class="employee-form__radio">
            <RadioButton
              v-model="form.contract"
              :input-id="`employee-contract-${value}`"
              name="contract"
              :value="value"
              required
            />
            <label class="employee-form__radio-label" :for="`employee-contract-${value}`">
              {{ t(`contract.${value}`) }}
            </label>
          </div>
        </div>
        <small
          v-if="contractError"
          id="employee-contract-error"
          class="employee-form__error"
          data-test="contract-error"
        >
          {{ contractError }}
        </small>
      </fieldset>

      <div class="employee-form__field">
        <label class="employee-form__label" for="employee-phone">
          {{ t('employees.form.phone') }}
        </label>
        <InputText
          id="employee-phone"
          v-model="form.phone"
          type="tel"
          autocomplete="tel"
          data-test="employee-phone-input"
          :placeholder="t('employees.form.phonePlaceholder')"
          :aria-invalid="phoneError ? 'true' : undefined"
          :aria-describedby="phoneError ? 'employee-phone-error' : undefined"
        />
        <small
          v-if="phoneError"
          id="employee-phone-error"
          class="employee-form__error"
          data-test="phone-error"
        >
          {{ phoneError }}
        </small>
      </div>

      <div class="employee-form__field">
        <label class="employee-form__label" for="employee-email">
          {{ t('employees.form.email') }}
        </label>
        <InputText
          id="employee-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          data-test="employee-email-input"
          :placeholder="t('employees.form.emailPlaceholder')"
          :aria-invalid="emailError ? 'true' : undefined"
          :aria-describedby="emailError ? 'employee-email-error' : undefined"
        />
        <small
          v-if="emailError"
          id="employee-email-error"
          class="employee-form__error"
          data-test="email-error"
        >
          {{ emailError }}
        </small>
      </div>

      <div class="employee-form__field">
        <label class="employee-form__label" for="employee-hours">
          {{ t('employees.form.weeklyHours') }}
        </label>
        <InputNumber
          input-id="employee-hours"
          :model-value="form.weeklyHours"
          :min="0"
          :max="168"
          :step="0.5"
          :use-grouping="false"
          required
          aria-required="true"
          data-test="employee-hours-input"
          :placeholder="t('employees.form.hoursPlaceholder')"
          :aria-invalid="hoursError ? 'true' : undefined"
          :aria-describedby="hoursError ? 'employee-hours-error' : undefined"
          @update:model-value="handleHours"
        />
        <small
          v-if="hoursError"
          id="employee-hours-error"
          class="employee-form__error"
          data-test="hours-error"
        >
          {{ hoursError }}
        </small>
      </div>

      <div class="employee-form__field">
        <label class="employee-form__label" for="employee-start-date">
          {{ t('employees.form.startDate') }}
        </label>
        <DatePicker
          v-model="form.startDate"
          input-id="employee-start-date"
          date-format="yy-mm-dd"
          show-icon
          class="employee-form__date"
          data-test="employee-start-date"
          :aria-invalid="startDateError ? 'true' : undefined"
          :aria-describedby="startDateError ? 'employee-start-date-error' : undefined"
        />
        <small
          v-if="startDateError"
          id="employee-start-date-error"
          class="employee-form__error"
          data-test="start-date-error"
        >
          {{ startDateError }}
        </small>
      </div>

      <div class="employee-form__field employee-form__field--full">
        <label class="employee-form__label" for="employee-comment">
          {{ t('employees.form.comment') }}
        </label>
        <Textarea
          id="employee-comment"
          v-model="form.comment"
          rows="3"
          data-test="employee-comment-input"
          :placeholder="t('employees.form.commentPlaceholder')"
        />
      </div>

      <small
        v-if="holidaysError"
        class="employee-form__error employee-form__field--full"
        data-test="holidays-error"
        role="alert"
      >
        {{ holidaysError }}
      </small>

      <div class="employee-form__actions employee-form__field--full">
        <Button
          type="button"
          :label="t('common.cancel')"
          severity="secondary"
          data-test="cancel"
          @click="emit('update:visible', false)"
        />
        <Button type="submit" :label="t('common.save')" data-test="submit" />
      </div>
    </form>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import AppDialog from '@/shared/components/AppDialog.vue'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import type { Contract, Duty, EmployeeFormErrors, NewTeamMember, TeamMember } from '@/types'
import { useI18n } from '@/shared/i18n'
import { isoDateToDate, toLocalIsoDate } from '@/shared/utils/calendar'
import { CONTRACTS, DUTIES, validateEmployeeForm } from '@/shared/utils/employee'

const props = defineProps<{
  visible: boolean
  member: TeamMember | null
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  submit: [payload: NewTeamMember]
}>()

const { t } = useI18n()

type FormState = {
  name: string
  duty: Duty
  contract: Contract
  weeklyHours: number | null
  email: string
  phone: string
  comment: string
  startDate: Date | null
}

const form = reactive<FormState>({
  name: '',
  duty: 'employee',
  contract: 'fulltime',
  weeklyHours: null,
  email: '',
  phone: '',
  comment: '',
  startDate: new Date(),
})

const dutyOptions = computed(() =>
  DUTIES.map((value) => ({ label: t(`duty.${value}`), value })),
)

const validation = computed(() =>
  validateEmployeeForm({
    ...form,
    holidays: props.member?.holidays ?? [],
    startDate: form.startDate ? toLocalIsoDate(form.startDate) : undefined,
  }),
)

const submitted = ref(false)

const errors = computed<EmployeeFormErrors>(() =>
  validation.value.ok ? {} : validation.value.errors,
)

const visibleErrors = computed<EmployeeFormErrors>(() => (submitted.value ? errors.value : {}))

function errorText(key: EmployeeFormErrors[keyof EmployeeFormErrors]): string {
  return key ? t(key) : ''
}

const nameError = computed(() => errorText(visibleErrors.value.name))
const dutyError = computed(() => errorText(visibleErrors.value.duty))
const phoneError = computed(() => errorText(visibleErrors.value.phone))
const emailError = computed(() => errorText(visibleErrors.value.email))
const hoursError = computed(() => errorText(visibleErrors.value.weeklyHours))
const contractError = computed(() => errorText(visibleErrors.value.contract))
const startDateError = computed(() => errorText(visibleErrors.value.startDate))
const holidaysError = computed(() => errorText(visibleErrors.value.holidays))

const title = computed(() =>
  props.member ? t('employees.form.editTitle') : t('employees.form.addTitle'),
)

function resetForm(): void {
  submitted.value = false
  form.name = props.member?.name ?? ''
  form.duty = props.member?.duty ?? 'employee'
  form.contract = props.member?.contract ?? 'fulltime'
  form.weeklyHours = props.member?.weeklyHours ?? null
  form.email = props.member?.email ?? ''
  form.phone = props.member?.phone ?? ''
  form.comment = props.member?.comment ?? ''
  form.startDate = props.member?.startDate ? isoDateToDate(props.member.startDate) : new Date()
}

watch(
  [() => props.visible, () => props.member],
  ([visible]) => {
    if (visible) resetForm()
  },
  { immediate: true },
)

function handleHours(value: number | null | undefined): void {
  form.weeklyHours = typeof value === 'number' ? value : null
}

function handleSubmit(): void {
  submitted.value = true
  if (validation.value.ok) {
    emit('submit', validation.value.value)
  }
}
</script>

<style scoped>
.employee-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  min-width: min(32rem, 90vw);
}

.employee-form-dialog {
  width: min(34rem, 92vw);
}

.employee-form-dialog :deep(.p-dialog-content) {
  max-height: calc(100dvh - 10rem);
  overflow-y: auto;
}

.employee-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.employee-form__field--full {
  grid-column: 1 / -1;
}

.employee-form__label {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.employee-form__error {
  color: var(--color-danger);
  font-size: 0.8rem;
}

.employee-form__date {
  width: 100%;
}

.employee-form__radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.employee-form__radio {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.employee-form__radio-label {
  color: var(--color-text);
}

.employee-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 40rem) {
  .employee-form {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-height: 899px) {
  .employee-form {
    gap: 0.75rem;
  }
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .employee-form {
    grid-template-columns: 1fr;
    min-width: 0;
    gap: 0.85rem;
  }

  .employee-form-dialog {
    width: 100vw;
  }

  .employee-form-dialog :deep(.p-dialog-content) {
    max-height: none;
  }

  .employee-form__actions {
    position: sticky;
    bottom: 0;
    z-index: 2;
    padding: 0.75rem 0 calc(0.25rem + var(--safe-area-bottom));
    background: var(--color-surface);
  }
}
</style>
