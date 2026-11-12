<template>
  <DataTable
    :value="rows"
    :row-class="rowClass"
    size="small"
    :scrollable="isPhone"
    sort-field="name"
    :sort-order="1"
    :removable-sort="false"
    data-test="employee-table"
    class="employee-table"
  >
    <Column field="name" :header="t('employees.column.name')" sortable>
      <template #header>
        <span data-test="sort-name">{{ t('employees.column.name') }}</span>
      </template>
      <template #body="{ data }">
        <button
          type="button"
          class="employee-table__name-button"
          :data-test="`details-${data.id}`"
          :aria-label="
            data.active
              ? t('employees.detailsFor', { name: data.name })
              : t('employees.detailsForInactive', { name: data.name })
          "
          @click="emit('details', data.id)"
        >
          <span
            :class="['employee-table__name', { 'employee-table__name--inactive': !data.active }]"
          >
            {{ data.name }}
          </span>
        </button>
      </template>
    </Column>

    <Column
      field="duty"
      sort-field="dutySortRank"
      :header="t('employees.column.duty')"
      sortable
    >
      <template #header>
        <span data-test="sort-duty">{{ t('employees.column.duty') }}</span>
      </template>
      <template #body="{ data }">
        <Chip
          :label="dutyLabel(data.duty)"
          :class="['employee-table__chip', `employee-table__chip--${dutyModifier(data.duty)}`]"
        />
      </template>
    </Column>

    <Column
      field="contract"
      sort-field="contractSortRank"
      :header="t('employees.column.contract')"
      sortable
    >
      <template #header>
        <span data-test="sort-contract">{{ t('employees.column.contract') }}</span>
      </template>
      <template #body="{ data }">
        <Chip
          :label="contractLabel(data.contract)"
          :class="[
            'employee-table__chip',
            `employee-table__chip--${contractModifier(data.contract)}`,
          ]"
        />
      </template>
    </Column>

    <Column field="weeklyHours" :header="t('employees.column.weeklyHours')">
      <template #body="{ data }">
        <span class="employee-table__hours">{{ data.weeklyHours }}</span>
      </template>
    </Column>

    <Column v-if="!isPhone" :header="t('employees.column.contact')">
      <template #body="{ data }">
        <div class="employee-table__contact">
          <a
            v-if="data.phone"
            v-tooltip.top="t('employees.phone', { phone: data.phone })"
            class="employee-table__contact-icon"
            :href="`tel:${data.phone}`"
            :aria-label="t('employees.phone', { phone: data.phone })"
          >
            <i class="pi pi-phone" aria-hidden="true" />
          </a>
          <a
            v-if="data.email"
            v-tooltip.top="t('employees.email', { email: data.email })"
            class="employee-table__contact-icon"
            :href="`mailto:${data.email}`"
            :aria-label="t('employees.email', { email: data.email })"
          >
            <i class="pi pi-envelope" aria-hidden="true" />
          </a>
        </div>
      </template>
    </Column>

    <Column :header="t('employees.column.actions')">
      <template #body="{ data }">
        <div class="employee-table__actions">
          <Button
            v-if="data.active"
            v-tooltip.top="t('common.edit')"
            type="button"
            icon="pi pi-pencil"
            size="small"
            text
            rounded
            :aria-label="t('employees.editAria', { name: data.name })"
            :data-test="`edit-${data.id}`"
            @click="emit('edit', data.id)"
          />
          <Button
            v-if="data.active"
            v-tooltip.top="t('common.holidays')"
            type="button"
            icon="pi pi-calendar"
            size="small"
            text
            rounded
            :aria-label="t('employees.holidaysAria', { name: data.name })"
            :data-test="`holidays-${data.id}`"
            @click="emit('holidays', data.id)"
          />
          <Button
            v-if="data.active"
            v-tooltip.top="t('common.deactivate')"
            type="button"
            icon="pi pi-user-minus"
            size="small"
            text
            rounded
            severity="warn"
            :aria-label="t('employees.deactivateAria', { name: data.name })"
            :data-test="`deactivate-${data.id}`"
            @click="emit('deactivate', data.id)"
          />
          <Button
            v-else
            v-tooltip.top="t('common.reactivate')"
            type="button"
            icon="pi pi-user-plus"
            size="small"
            text
            rounded
            :aria-label="t('employees.reactivateAria', { name: data.name })"
            :data-test="`reactivate-${data.id}`"
            @click="emit('reactivate', data.id)"
          />
          <Button
            v-tooltip.top="t('common.remove')"
            type="button"
            icon="pi pi-trash"
            size="small"
            text
            rounded
            severity="danger"
            :aria-label="t('employees.removeAria', { name: data.name })"
            :data-test="`remove-${data.id}`"
            @click="emit('remove', data.id)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed } from 'vue'
import type { TeamMember } from '@/types'
import { useI18n } from '@/shared/i18n'
import { useIsPhone } from '@/shared/composables/useIsPhone'
import {
  CONTRACTS,
  dutyModifier,
  dutyRank,
  isContract,
  isDuty,
} from '@/shared/utils/employee'

type EmployeeTableRow = TeamMember & {
  dutySortRank: number
  contractSortRank: number
}

const props = defineProps<{
  members: TeamMember[]
}>()

const rows = computed<EmployeeTableRow[]>(() =>
  props.members.map((member) => ({
    ...member,
    dutySortRank: dutyRank(member.duty),
    contractSortRank: CONTRACTS.indexOf(member.contract),
  })),
)

const emit = defineEmits<{
  edit: [id: string]
  holidays: [id: string]
  remove: [id: string]
  details: [id: string]
  deactivate: [id: string]
  reactivate: [id: string]
}>()

const { t } = useI18n()
const isPhone = useIsPhone()

function rowClass(data: TeamMember): string {
  return data.active ? '' : 'employee-table__row--inactive'
}

function dutyLabel(value: unknown): string {
  return isDuty(value) ? t(`duty.${value}`) : ''
}

function contractLabel(value: unknown): string {
  return isContract(value) ? t(`contract.${value}`) : ''
}

function contractModifier(value: unknown): string {
  return isContract(value) ? value.replace('_', '-') : ''
}
</script>

<style scoped>
.employee-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.employee-table :deep(.employee-table__row--inactive) {
  background: var(--color-inactive-bg);
}

.employee-table__name-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.employee-table__name {
  font-weight: 600;
}

.employee-table__name-button:hover .employee-table__name {
  color: var(--color-accent);
}

.employee-table__name-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.employee-table__name--inactive {
  color: var(--color-danger);
  text-decoration: line-through;
}

.employee-table__hours {
  color: var(--color-muted);
}

.employee-table__contact {
  display: flex;
  gap: 0.5rem;
}

.employee-table__contact-icon {
  color: var(--color-muted);
}

.employee-table__contact-icon:hover {
  color: var(--color-accent);
}

.employee-table__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.employee-table__chip--manager {
  color: var(--color-duty-manager);
}

.employee-table__chip--head-manager {
  color: var(--color-duty-head-manager);
}

.employee-table__chip--assistant {
  color: var(--color-duty-assistant);
}

.employee-table__chip--employee {
  color: var(--color-duty-employee);
}

.employee-table__chip--fulltime {
  color: var(--color-contract-fulltime);
}

.employee-table__chip--part-time {
  color: var(--color-contract-part-time);
}

.employee-table__chip--weekends {
  color: var(--color-contract-weekends);
}

@media screen and (max-height: 899px) {
  .employee-table :deep(.p-datatable-thead > tr > th),
  .employee-table :deep(.p-datatable-tbody > tr > td) {
    padding-block: 0.3rem;
  }
}

.employee-table__contact-icon {
  text-decoration: none;
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .employee-table {
    overflow: hidden;
  }

  .employee-table :deep(.p-datatable-thead > tr > th:first-child),
  .employee-table :deep(.p-datatable-tbody > tr > td:first-child) {
    position: sticky;
    left: 0;
    z-index: 2;
    background: var(--color-surface);
  }

  .employee-table :deep(.p-datatable-thead > tr > th:first-child) {
    z-index: 3;
  }

  .employee-table :deep(.p-datatable-thead > tr > th),
  .employee-table :deep(.p-datatable-tbody > tr > td) {
    white-space: nowrap;
  }

  .employee-table__actions {
    flex-wrap: nowrap;
  }

  .employee-table__actions :deep(.p-button) {
    width: 2.5rem;
    height: 2.5rem;
  }
}
</style>
