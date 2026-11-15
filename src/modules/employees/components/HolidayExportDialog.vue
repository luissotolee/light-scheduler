<template>
  <AppDialog
    :visible="visible"
    modal
    :header="t('employees.exportHolidays.title')"
    class="holiday-export-dialog"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="holiday-export-dialog__body" data-test="holiday-export-dialog">
      <p class="holiday-export-dialog__description">
        {{ t('employees.exportHolidays.description') }}
      </p>

      <div
        class="holiday-export-dialog__group"
        role="radiogroup"
        :aria-label="t('employees.exportHolidays.year')"
      >
        <div
          class="holiday-export-dialog__option"
          data-test="export-year-current"
          @click="selectedYear = currentYear"
        >
          <RadioButton
            v-model="selectedYear"
            input-id="holiday-export-year-current"
            name="holiday-export-year"
            :value="currentYear"
          />
          <label class="holiday-export-dialog__label" for="holiday-export-year-current">
            {{ currentYear }}
          </label>
        </div>

        <div
          class="holiday-export-dialog__option"
          data-test="export-year-next"
          @click="selectedYear = nextYear"
        >
          <RadioButton
            v-model="selectedYear"
            input-id="holiday-export-year-next"
            name="holiday-export-year"
            :value="nextYear"
          />
          <label class="holiday-export-dialog__label" for="holiday-export-year-next">
            {{ nextYear }}
          </label>
        </div>
      </div>

      <div class="holiday-export-dialog__actions">
        <Button
          type="button"
          :label="t('common.cancel')"
          severity="secondary"
          data-test="cancel-holiday-export"
          @click="emit('update:visible', false)"
        />
        <Button
          type="button"
          :label="t('employees.exportHolidays.confirm')"
          data-test="confirm-holiday-export"
          @click="confirm"
        />
      </div>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import AppDialog from '@/shared/components/AppDialog.vue'
import { useI18n } from '@/shared/i18n'
import { exportYearOptions } from '@/modules/employees/utils/holidayExport'

const props = defineProps<{ visible: boolean }>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  export: [year: number]
}>()

const { t } = useI18n()

const [currentYear, nextYear] = exportYearOptions()
const selectedYear = ref(currentYear)

watch(
  () => props.visible,
  (visible) => {
    if (visible) selectedYear.value = currentYear
  },
)

function confirm(): void {
  emit('export', selectedYear.value)
  emit('update:visible', false)
}
</script>

<style scoped>
.holiday-export-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  min-width: 0;
}

.holiday-export-dialog__description {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.95rem;
}

.holiday-export-dialog__group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.holiday-export-dialog__option {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
}

.holiday-export-dialog__label {
  cursor: pointer;
  font-weight: 500;
}

.holiday-export-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .holiday-export-dialog__actions {
    position: sticky;
    bottom: 0;
    z-index: 2;
    padding: 0.75rem 0 calc(0.25rem + var(--safe-area-bottom));
    background: var(--color-surface);
  }
}
</style>
