<script setup lang="ts">
import { storeToRefs } from 'pinia'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useEmployeesStore } from '@/stores/employees'

const store = useEmployeesStore()
const { search, count, filteredMembers } = storeToRefs(store)

function handleSearch(event: Event): void {
  const target = event.target
  if (target instanceof HTMLInputElement) store.setSearch(target.value)
}
</script>

<template>
  <section class="employees">
    <PageHeader
      title="Employees"
      description="Manage the employee records used when building weekly schedules."
    >
      <template #actions>
        <button type="button" class="employees__button" data-test="add-employee" disabled>
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
      description="Employee editing is coming next. The list is already wired to the shared workspace data."
    />

    <ul v-else class="employees__list">
      <li v-for="member in filteredMembers" :key="member.id" class="employees__member">
        <span class="employees__name">{{ member.name }}</span>
        <span v-if="member.email" class="employees__email">{{ member.email }}</span>
      </li>
    </ul>
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

.employees__button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.employees__list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.employees__member {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.employees__name {
  font-weight: 600;
}

.employees__email {
  color: var(--color-muted);
}
</style>
