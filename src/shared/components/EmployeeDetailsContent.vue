<template>
  <div class="employee-details__content">
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
      <div class="employee-details__item employee-details__item--full">
        <dt class="employee-details__label">{{ t('employees.details.comment') }}</dt>
        <dd
          class="employee-details__value employee-details__value--multiline"
          data-test="details-comment"
        >
          {{ member.comment || t('common.dash') }}
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TeamMember } from '@/types'
import { useI18n } from '@/shared/i18n'
import { formatIsoDate, formatWeekRange, holidayToWeekKey } from '@/shared/utils/calendar'
import { isContract, isDuty } from '@/shared/utils/employee'

const props = defineProps<{
  member: TeamMember
}>()

const { t, locale } = useI18n()

const dutyLabel = computed(() =>
  isDuty(props.member.duty) ? t(`duty.${props.member.duty}`) : t('common.dash'),
)

const contractLabel = computed(() =>
  isContract(props.member.contract) ? t(`contract.${props.member.contract}`) : t('common.dash'),
)
</script>

<style scoped>
.employee-details__content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

.employee-details__item--full {
  grid-column: 1 / -1;
}

.employee-details__value {
  margin: 0;
  color: var(--color-text);
}

.employee-details__value--multiline {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
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

@media (max-width: 36rem) {
  .employee-details__list {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-height: 899px) {
  .employee-details__content {
    gap: 0.75rem;
  }

  .employee-details__list {
    gap: 0.5rem 1rem;
  }
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .employee-details__list {
    grid-template-columns: 1fr;
  }
}
</style>
