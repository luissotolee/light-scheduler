<template>
  <AppDialog
    :visible="visible"
    modal
    :header="title"
    class="employee-sickness-dialog"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="employee-sickness" data-test="employee-sickness">
      <ul v-if="leaves.length > 0" class="employee-sickness__list" data-test="sick-leave-list">
        <li
          v-for="leave in leaves"
          :key="leave.id"
          class="employee-sickness__item"
          :data-test="`sick-leave-${leave.id}`"
        >
          <span class="employee-sickness__range">
            {{
              t('employees.sick.range', {
                start: formatIsoDate(leave.startDate, locale),
                end: formatIsoDate(leave.endDate, locale),
              })
            }}
          </span>
          <Button
            type="button"
            icon="pi pi-trash"
            size="small"
            text
            rounded
            severity="danger"
            :aria-label="t('employees.sick.removeAria', { range: rangeLabel(leave) })"
            :data-test="`sick-remove-${leave.id}`"
            @click="removeLeave(leave.id)"
          />
        </li>
      </ul>
      <p v-else class="employee-sickness__empty" data-test="sick-leave-empty">
        {{ t('employees.sick.empty') }}
      </p>

      <div class="employee-sickness__fields">
        <div class="employee-sickness__field">
          <label class="employee-sickness__label" for="sick-leave-start">
            {{ t('employees.sick.start') }}
          </label>
          <div data-test="sick-start-date">
            <DatePicker
              v-model="startDate"
              input-id="sick-leave-start"
              date-format="yy-mm-dd"
              show-icon
              class="employee-sickness__date"
            />
          </div>
        </div>

        <div class="employee-sickness__field">
          <label class="employee-sickness__label" for="sick-leave-end">
            {{ t('employees.sick.end') }}
          </label>
          <div data-test="sick-end-date">
            <DatePicker
              v-model="endDate"
              input-id="sick-leave-end"
              date-format="yy-mm-dd"
              show-icon
              class="employee-sickness__date"
            />
          </div>
        </div>
      </div>

      <small v-if="errorMessage" class="employee-sickness__error" role="alert" data-test="sick-error">
        {{ errorMessage }}
      </small>

      <div class="employee-sickness__actions">
        <Button
          type="button"
          :label="t('employees.sick.addRange')"
          icon="pi pi-plus"
          severity="secondary"
          data-test="sick-add-range"
          @click="addRange"
        />
        <div class="employee-sickness__actions-right">
          <Button
            type="button"
            :label="t('common.cancel')"
            severity="secondary"
            data-test="sick-cancel"
            @click="emit('update:visible', false)"
          />
          <Button
            type="button"
            :label="t('common.save')"
            data-test="sick-save"
            @click="save"
          />
        </div>
      </div>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import AppDialog from '@/shared/components/AppDialog.vue'
import type { SickLeave } from '@/types'
import type { MessageKey } from '@/shared/i18n/messages/en'
import { useI18n } from '@/shared/i18n'
import { formatIsoDate, isoDateToDate, toLocalIsoDate } from '@/shared/utils/calendar'
import { createId } from '@/shared/utils/id'
import {
  isValidSickLeaveRange,
  normalizeSickLeaves,
  overlapsSickLeave,
} from '@/shared/utils/sickness'

const props = defineProps<{
  visible: boolean
  memberName: string
  selected: SickLeave[]
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  save: [leaves: SickLeave[]]
}>()

const { t, locale } = useI18n()

const leaves = ref<SickLeave[]>([])
const startDate = ref<Date | null>(new Date())
const endDate = ref<Date | null>(new Date())
const errorKey = ref<MessageKey | null>(null)

const title = computed(() => t('employees.sick.title', { name: props.memberName }))
const errorMessage = computed(() => (errorKey.value ? t(errorKey.value) : ''))

function rangeLabel(leave: SickLeave): string {
  return t('employees.sick.range', {
    start: formatIsoDate(leave.startDate, locale.value),
    end: formatIsoDate(leave.endDate, locale.value),
  })
}

function reset(): void {
  leaves.value = normalizeSickLeaves(props.selected)
  startDate.value = new Date()
  endDate.value = new Date()
  errorKey.value = null
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) reset()
  },
  { immediate: true },
)

function addRange(): void {
  if (!startDate.value || !endDate.value) {
    errorKey.value = 'errors.sickLeaveRequired'
    return
  }

  const start = toLocalIsoDate(startDate.value)
  const end = toLocalIsoDate(endDate.value)
  if (!isValidSickLeaveRange(start, end)) {
    errorKey.value = end < start ? 'errors.endBeforeStart' : 'errors.invalidSickLeave'
    return
  }

  if (overlapsSickLeave(leaves.value, start, end)) {
    errorKey.value = 'errors.sickLeaveOverlap'
    return
  }

  leaves.value = normalizeSickLeaves([...leaves.value, { id: createId(), startDate: start, endDate: end }])
  startDate.value = isoDateToDate(end)
  endDate.value = isoDateToDate(end)
  errorKey.value = null
}

function removeLeave(id: string): void {
  leaves.value = leaves.value.filter((leave) => leave.id !== id)
  errorKey.value = null
}

function save(): void {
  emit('save', normalizeSickLeaves(leaves.value))
  emit('update:visible', false)
}
</script>

<style scoped>
.employee-sickness {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: min(30rem, 90vw);
}

.employee-sickness-dialog {
  width: min(34rem, 92vw);
}

.employee-sickness-dialog :deep(.p-dialog-content) {
  max-height: calc(100dvh - 10rem);
  overflow-y: auto;
}

.employee-sickness__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.employee-sickness__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-inactive-bg);
}

.employee-sickness__range {
  font-weight: 600;
}

.employee-sickness__empty {
  margin: 0;
  color: var(--color-muted);
}

.employee-sickness__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.employee-sickness__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.employee-sickness__label {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.employee-sickness__date {
  width: 100%;
}

.employee-sickness__error {
  color: var(--color-danger);
  font-size: 0.8rem;
}

.employee-sickness__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.employee-sickness__actions-right {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

@media (max-width: 36rem) {
  .employee-sickness__fields {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .employee-sickness {
    min-width: 0;
    width: 100%;
  }

  .employee-sickness__actions {
    position: sticky;
    bottom: 0;
    z-index: 2;
    padding: 0.75rem 0 calc(0.25rem + var(--safe-area-bottom));
    background: var(--color-surface);
  }
}
</style>
