<template>
  <DataTable
    :value="members"
    :row-class="rowClass"
    data-test="employee-table"
    class="employee-table"
  >
    <Column field="name" header="Name">
      <template #body="{ data }">
        <button
          type="button"
          class="employee-table__name-button"
          :data-test="`details-${data.id}`"
          :aria-label="
            data.active
              ? `View details for ${data.name}`
              : `View details for ${data.name} (inactive)`
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

    <Column field="duty" header="Duty">
      <template #body="{ data }">
        <Chip
          :label="dutyLabel(data.duty)"
          :class="['employee-table__chip', `employee-table__chip--${dutyModifier(data.duty)}`]"
        />
      </template>
    </Column>

    <Column field="contract" header="Contract">
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

    <Column field="weeklyHours" header="Weekly hours">
      <template #body="{ data }">
        <span class="employee-table__hours">{{ data.weeklyHours }}</span>
      </template>
    </Column>

    <Column header="Contact">
      <template #body="{ data }">
        <div class="employee-table__contact">
          <span
            v-if="data.phone"
            v-tooltip.top="`Phone: ${data.phone}`"
            class="employee-table__contact-icon"
            role="img"
            :aria-label="`Phone: ${data.phone}`"
          >
            <i class="pi pi-phone" aria-hidden="true" />
          </span>
          <span
            v-if="data.email"
            v-tooltip.top="`Email: ${data.email}`"
            class="employee-table__contact-icon"
            role="img"
            :aria-label="`Email: ${data.email}`"
          >
            <i class="pi pi-envelope" aria-hidden="true" />
          </span>
        </div>
      </template>
    </Column>

    <Column header="Actions">
      <template #body="{ data }">
        <div class="employee-table__actions">
          <Button
            v-if="data.active"
            v-tooltip.top="'Edit'"
            type="button"
            icon="pi pi-pencil"
            size="small"
            text
            rounded
            :aria-label="`Edit ${data.name}`"
            :data-test="`edit-${data.id}`"
            @click="emit('edit', data.id)"
          />
          <Button
            v-if="data.active"
            v-tooltip.top="'Holidays'"
            type="button"
            icon="pi pi-calendar"
            size="small"
            text
            rounded
            :aria-label="`Holidays for ${data.name}`"
            :data-test="`holidays-${data.id}`"
            @click="emit('holidays', data.id)"
          />
          <Button
            v-if="data.active"
            v-tooltip.top="'Deactivate'"
            type="button"
            icon="pi pi-user-minus"
            size="small"
            text
            rounded
            severity="warn"
            :aria-label="`Deactivate ${data.name}`"
            :data-test="`deactivate-${data.id}`"
            @click="emit('deactivate', data.id)"
          />
          <Button
            v-else
            v-tooltip.top="'Reactivate'"
            type="button"
            icon="pi pi-user-plus"
            size="small"
            text
            rounded
            :aria-label="`Reactivate ${data.name}`"
            :data-test="`reactivate-${data.id}`"
            @click="emit('reactivate', data.id)"
          />
          <Button
            v-tooltip.top="'Remove'"
            type="button"
            icon="pi pi-trash"
            size="small"
            text
            rounded
            severity="danger"
            :aria-label="`Remove ${data.name}`"
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
import type { TeamMember } from '@/types'
import {
  CONTRACT_LABELS,
  DUTY_LABELS,
  dutyModifier,
  isContract,
  isDuty,
} from '@/shared/utils/employee'

defineProps<{
  members: TeamMember[]
}>()

const emit = defineEmits<{
  edit: [id: string]
  holidays: [id: string]
  remove: [id: string]
  details: [id: string]
  deactivate: [id: string]
  reactivate: [id: string]
}>()

function rowClass(data: TeamMember): string {
  return data.active ? '' : 'employee-table__row--inactive'
}

function dutyLabel(value: unknown): string {
  return isDuty(value) ? DUTY_LABELS[value] : ''
}

function contractLabel(value: unknown): string {
  return isContract(value) ? CONTRACT_LABELS[value] : ''
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
</style>
