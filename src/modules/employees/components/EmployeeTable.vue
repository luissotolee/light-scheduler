<script setup lang="ts">
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import type { TeamMember } from '@/types'
import { CONTRACT_LABELS, DUTY_LABELS, isContract, isDuty } from '@/shared/utils/employee'

defineProps<{
  members: TeamMember[]
}>()

const emit = defineEmits<{
  edit: [id: string]
  holidays: [id: string]
  remove: [id: string]
}>()

function dutyLabel(value: unknown): string {
  return isDuty(value) ? DUTY_LABELS[value] : ''
}

function contractLabel(value: unknown): string {
  return isContract(value) ? CONTRACT_LABELS[value] : ''
}

function dutyModifier(value: unknown): string {
  return isDuty(value) ? value.replace('_', '-') : ''
}

function contractModifier(value: unknown): string {
  return isContract(value) ? value.replace('_', '-') : ''
}
</script>

<template>
  <DataTable :value="members" data-test="employee-table" class="employee-table">
    <Column field="name" header="Name">
      <template #body="{ data }">
        <span class="employee-table__name">{{ data.name }}</span>
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

<style scoped>
.employee-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.employee-table__name {
  font-weight: 600;
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
