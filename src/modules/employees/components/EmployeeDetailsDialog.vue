<template>
  <Dialog
    :visible="visible"
    modal
    :header="title"
    class="employee-details"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="member" class="employee-details__body">
      <dl class="employee-details__list">
        <div class="employee-details__item">
          <dt class="employee-details__label">{{ t('employees.details.empId') }}</dt>
          <dd class="employee-details__value" data-test="details-emp-id">{{ member.empId }}</dd>
        </div>
        <div class="employee-details__item">
          <dt class="employee-details__label">{{ t('employees.details.duty') }}</dt>
          <dd class="employee-details__value" data-test="details-duty">{{ dutyLabel }}</dd>
        </div>
        <div class="employee-details__item">
          <dt class="employee-details__label">{{ t('employees.details.contract') }}</dt>
          <dd class="employee-details__value" data-test="details-contract">{{ contractLabel }}</dd>
        </div>
        <div class="employee-details__item">
          <dt class="employee-details__label">{{ t('employees.details.weeklyHours') }}</dt>
          <dd class="employee-details__value" data-test="details-hours">
            {{ member.weeklyHours }}
          </dd>
        </div>
        <div class="employee-details__item">
          <dt class="employee-details__label">{{ t('employees.details.email') }}</dt>
          <dd class="employee-details__value" data-test="details-email">
            {{ member.email || t('common.dash') }}
          </dd>
        </div>
        <div class="employee-details__item">
          <dt class="employee-details__label">{{ t('employees.details.phone') }}</dt>
          <dd class="employee-details__value" data-test="details-phone">
            {{ member.phone || t('common.dash') }}
          </dd>
        </div>
        <div class="employee-details__item">
          <dt class="employee-details__label">{{ t('employees.details.status') }}</dt>
          <dd class="employee-details__value" data-test="details-status">
            {{ member.active ? t('employees.status.active') : t('employees.status.inactive') }}
          </dd>
        </div>
        <div class="employee-details__item">
          <dt class="employee-details__label">{{ t('employees.details.startDate') }}</dt>
          <dd class="employee-details__value" data-test="details-start-date">
            {{ formatIsoDate(member.startDate, locale) }}
          </dd>
        </div>
        <div v-if="member.endDate" class="employee-details__item">
          <dt class="employee-details__label">{{ t('employees.details.endDate') }}</dt>
          <dd class="employee-details__value" data-test="details-end-date">
            {{ formatIsoDate(member.endDate, locale) }}
          </dd>
        </div>
      </dl>

      <div class="employee-details__holidays">
        <h3 class="employee-details__section-title">{{ t('employees.details.holidays') }}</h3>
        <ul v-if="member.holidays.length > 0" class="employee-details__holiday-list">
          <li v-for="holiday in member.holidays" :key="`${holiday.year}-${holiday.week}`">
            {{
              t('employees.details.holidayItem', {
                week: holiday.week,
                range: formatWeekRange(holidayToWeekKey(holiday), locale),
              })
            }}
          </li>
        </ul>
        <p v-else class="employee-details__empty" data-test="details-no-holidays">
          {{ t('employees.details.noHolidays') }}
        </p>
      </div>

      <div class="employee-details__actions">
        <Button
          type="button"
          :label="t('common.close')"
          severity="secondary"
          data-test="close-details"
          @click="emit('update:visible', false)"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import type { TeamMember } from '@/types'
import { useI18n } from '@/shared/i18n'
import { formatIsoDate, formatWeekRange, holidayToWeekKey } from '@/shared/utils/calendar'
import { isContract, isDuty } from '@/shared/utils/employee'

const props = defineProps<{
  visible: boolean
  member: TeamMember | null
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
}>()

const { t, locale } = useI18n()

const title = computed(() => props.member?.name ?? t('employees.details.title'))

const dutyLabel = computed(() =>
  props.member && isDuty(props.member.duty) ? t(`duty.${props.member.duty}`) : t('common.dash'),
)

const contractLabel = computed(() =>
  props.member && isContract(props.member.contract)
    ? t(`contract.${props.member.contract}`)
    : t('common.dash'),
)
</script>

<style scoped>
.employee-details__body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: min(30rem, 90vw);
}

.employee-details__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem 1.5rem;
  margin: 0;
}

.employee-details__item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.employee-details__label {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.employee-details__value {
  margin: 0;
  color: var(--color-text);
}

.employee-details__section-title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.employee-details__holiday-list {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--color-text);
}

.employee-details__empty {
  margin: 0;
  color: var(--color-muted);
}

.employee-details__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 36rem) {
  .employee-details__list {
    grid-template-columns: 1fr;
  }
}
</style>
