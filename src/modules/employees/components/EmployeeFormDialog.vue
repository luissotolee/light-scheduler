<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import type { Contract, Duty, EmployeeFormErrors, NewTeamMember, TeamMember } from '@/types'
import {
  CONTRACTS,
  CONTRACT_LABELS,
  DUTIES,
  DUTY_LABELS,
  validateEmployeeForm,
} from '@/shared/utils/employee'

const props = defineProps<{
  visible: boolean
  member: TeamMember | null
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  submit: [payload: NewTeamMember]
}>()

type FormState = {
  name: string
  duty: Duty
  contract: Contract
  weeklyHours: number | null
  email: string
  phone: string
}

const form = reactive<FormState>({
  name: '',
  duty: 'employee',
  contract: 'fulltime',
  weeklyHours: null,
  email: '',
  phone: '',
})

const dutyOptions = computed(() => DUTIES.map((value) => ({ label: DUTY_LABELS[value], value })))

const validation = computed(() =>
  validateEmployeeForm({ ...form, holidays: props.member?.holidays ?? [] }),
)

const submitted = ref(false)

const errors = computed<EmployeeFormErrors>(() =>
  validation.value.ok ? {} : validation.value.errors,
)

const visibleErrors = computed<EmployeeFormErrors>(() => (submitted.value ? errors.value : {}))

const nameError = computed(() => visibleErrors.value.name ?? '')
const dutyError = computed(() => visibleErrors.value.duty ?? '')
const phoneError = computed(() => visibleErrors.value.phone ?? '')
const emailError = computed(() => visibleErrors.value.email ?? '')
const hoursError = computed(() => visibleErrors.value.weeklyHours ?? '')
const contractError = computed(() => visibleErrors.value.contract ?? '')

const title = computed(() => (props.member ? 'Edit employee' : 'Add employee'))

function resetForm(): void {
  submitted.value = false
  form.name = props.member?.name ?? ''
  form.duty = props.member?.duty ?? 'employee'
  form.contract = props.member?.contract ?? 'fulltime'
  form.weeklyHours = props.member?.weeklyHours ?? null
  form.email = props.member?.email ?? ''
  form.phone = props.member?.phone ?? ''
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

<template>
  <Dialog
    :visible="visible"
    modal
    :header="title"
    class="employee-form-dialog"
    @update:visible="emit('update:visible', $event)"
  >
    <form
      class="employee-form"
      data-test="employee-form"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <div class="employee-form__field">
        <label class="employee-form__label" for="employee-name">Name *</label>
        <InputText
          id="employee-name"
          v-model="form.name"
          autocomplete="off"
          required
          aria-required="true"
          placeholder="e.g. Jane Doe"
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
        <label class="employee-form__label" for="employee-duty">Duty *</label>
        <Select
          v-model="form.duty"
          input-id="employee-duty"
          :options="dutyOptions"
          option-label="label"
          option-value="value"
          required
          aria-required="true"
          :aria-invalid="dutyError ? 'true' : undefined"
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

      <div class="employee-form__field">
        <label class="employee-form__label" for="employee-phone">Phone</label>
        <InputText
          id="employee-phone"
          v-model="form.phone"
          type="tel"
          autocomplete="tel"
          placeholder="e.g. 612 345 678 or +34 612 345 678"
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
        <label class="employee-form__label" for="employee-email">Email</label>
        <InputText
          id="employee-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          placeholder="e.g. jane@example.com"
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
        <label class="employee-form__label" for="employee-hours">Weekly hours *</label>
        <InputNumber
          input-id="employee-hours"
          :model-value="form.weeklyHours"
          :min="0"
          :max="168"
          :step="0.5"
          :use-grouping="false"
          required
          aria-required="true"
          placeholder="e.g. 40"
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

      <fieldset class="employee-form__field employee-form__field--full">
        <legend class="employee-form__label">Contract *</legend>
        <div
          class="employee-form__radio-group"
          role="radiogroup"
          aria-label="Contract"
          aria-required="true"
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
              {{ CONTRACT_LABELS[value] }}
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

      <div class="employee-form__actions employee-form__field--full">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          data-test="cancel"
          @click="emit('update:visible', false)"
        />
        <Button type="submit" label="Save" data-test="submit" />
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
.employee-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  min-width: min(32rem, 90vw);
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
</style>
