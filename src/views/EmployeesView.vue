<script setup lang="ts">
import { storeToRefs } from 'pinia'
import EmployeeFormDialog from '@/components/EmployeeFormDialog.vue'
import EmployeeTable from '@/components/EmployeeTable.vue'
import EmptyState from '@/components/EmptyState.vue'
import HolidayWeeksDialog from '@/components/HolidayWeeksDialog.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useEmployeesStore } from '@/stores/employees'
import type { HolidayWeek, NewTeamMember } from '@/types'

const store = useEmployeesStore()
const {
  search,
  count,
  filteredMembers,
  formVisible,
  editingMember,
  holidayVisible,
  holidayTarget,
} = storeToRefs(store)

function handleSearch(event: Event): void {
  const target = event.target
  if (target instanceof HTMLInputElement) store.setSearch(target.value)
}

function handleFormVisibility(visible: boolean): void {
  if (!visible) store.closeForm()
}

function handleHolidayVisibility(visible: boolean): void {
  if (!visible) store.closeHolidays()
}

function handleSubmit(payload: NewTeamMember): void {
  store.submitForm(payload)
}

function handleSaveHolidays(holidays: HolidayWeek[]): void {
  if (holidayTarget.value) store.setHolidays(holidayTarget.value.id, holidays)
}
</script>

<template>
  <section class="employees">
    <PageHeader
      title="Employees"
      description="Manage the employee records used when building weekly schedules."
    >
      <template #actions>
        <button
          type="button"
          class="employees__button"
          data-test="add-employee"
          @click="store.openCreate"
        >
          Add employee
        </button>
      </template>
    </PageHeader>

    <div class="employees__toolbar">
      <label class="employees__search-label" for="employee-search">Search employees</label>
      <input
        id="employee-search"
        class="employees__search"
        type="search"
        placeholder="Search by name or email"
        :value="search"
        @input="handleSearch"
      />
      <span class="employees__count">Employees: {{ count }}</span>
    </div>

    <EmptyState
      v-if="filteredMembers.length === 0"
      :title="count === 0 ? 'No employees yet' : 'No matching employees'"
      :description="
        count === 0
          ? 'Add your first employee to start building schedules.'
          : 'Try a different name or email.'
      "
    />

    <EmployeeTable
      v-else
      :members="filteredMembers"
      @edit="store.openEdit"
      @holidays="store.openHolidays"
      @remove="store.removeMember"
    />

    <EmployeeFormDialog
      :visible="formVisible"
      :member="editingMember"
      @update:visible="handleFormVisibility"
      @submit="handleSubmit"
    />

    <HolidayWeeksDialog
      :visible="holidayVisible"
      :member-name="holidayTarget?.name ?? ''"
      :selected="holidayTarget?.holidays ?? []"
      @update:visible="handleHolidayVisibility"
      @save="handleSaveHolidays"
    />
  </section>
</template>

<style scoped>
.employees {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.employees__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.employees__search-label {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.employees__search {
  flex: 1;
  min-width: 12rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
}

.employees__search:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.employees__count {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.employees__button {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.employees__button:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.employees__button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.employees__button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
</style>
