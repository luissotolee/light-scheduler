<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import type { Contract, Duty, NewTeamMember, TeamMember } from '@/types'
import {
  CONTRACTS,
  CONTRACT_LABELS,
  DUTIES,
  DUTY_LABELS,
  isValidEmail,
  isValidPhone,
  parseWeeklyHours,
} from '@/utils/employee'

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

const phoneError = computed(() => {
  const phone = form.phone.trim()
  return phone && !isValidPhone(phone) ? 'Phone is invalid' : ''
})

const emailError = computed(() => {
  const email = form.email.trim()
  return email && !isValidEmail(email) ? 'Email is invalid' : ''
})

const canSubmit = computed(
  () =>
    form.name.trim().length > 0 &&
    parseWeeklyHours(form.weeklyHours) !== null &&
    phoneError.value === '' &&
    emailError.value === '',
)

const title = computed(() => (props.member ? 'Edit employee' : 'Add employee'))

function resetForm(): void {
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
  const name = form.name.trim()
  const weeklyHours = parseWeeklyHours(form.weeklyHours)
  const phone = form.phone.trim()
  const email = form.email.trim()
  if (!name || weeklyHours === null) return
  if (phone && !isValidPhone(phone)) return
  if (email && !isValidEmail(email)) return

  emit('submit', {
    name,
    duty: form.duty,
    contract: form.contract,
    weeklyHours,
    holidays: props.member?.holidays ?? [],
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
  })
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
    <form class="employee-form" data-test="employee-form" @submit.prevent="handleSubmit">
      <div class="employee-form__field">
        <label class="employee-form__label" for="employee-name">Name</label>
        <InputText id="employee-name" v-model="form.name" autocomplete="off" />
      </div>

      <div class="employee-form__field">
        <label class="employee-form__label" for="employee-duty">Duty</label>
        <Select
          v-model="form.duty"
          input-id="employee-duty"
          :options="dutyOptions"
          option-label="label"
          option-value="value"
        />
      </div>

      <div class="employee-form__field">
        <label class="employee-form__label" for="employee-phone">Phone (optional)</label>
        <InputText
          id="employee-phone"
          v-model="form.phone"
          type="tel"
          autocomplete="tel"
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
        <label class="employee-form__label" for="employee-email">Email (optional)</label>
        <InputText
          id="employee-email"
          v-model="form.email"
          type="email"
          autocomplete="email"
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
        <label class="employee-form__label" for="employee-hours">Weekly hours</label>
        <InputNumber
          input-id="employee-hours"
          :model-value="form.weeklyHours"
          :min="0"
          :max="168"
          :step="0.5"
          :use-grouping="false"
          @update:model-value="handleHours"
        />
      </div>

      <fieldset class="employee-form__field employee-form__field--full">
        <legend class="employee-form__label">Contract *</legend>
        <div class="employee-form__radio-group" role="radiogroup" aria-label="Contract">
          <div v-for="value in CONTRACTS" :key="value" class="employee-form__radio">
            <RadioButton
              v-model="form.contract"
              :input-id="`employee-contract-${value}`"
              name="contract"
              :value="value"
            />
            <label class="employee-form__radio-label" :for="`employee-contract-${value}`">
              {{ CONTRACT_LABELS[value] }}
            </label>
          </div>
        </div>
      </fieldset>

      <div class="employee-form__actions employee-form__field--full">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          data-test="cancel"
          @click="emit('update:visible', false)"
        />
        <Button type="submit" label="Save" data-test="submit" :disabled="!canSubmit" />
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
