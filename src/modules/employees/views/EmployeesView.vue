<template>
  <section class="employees">
    <PageHeader
      :title="t('employees.title')"
      :description="t('employees.description')"
      description-tooltip
    >
      <template #actions>
        <button
          type="button"
          class="employees__button"
          data-test="add-employee"
          @click="store.openCreate"
        >
          {{ t('employees.add') }}
        </button>
      </template>
    </PageHeader>

    <div class="employees__toolbar">
      <label class="employees__search-label" for="employee-search">
        {{ t('employees.searchLabel') }}
      </label>
      <input
        id="employee-search"
        class="employees__search"
        type="search"
        :placeholder="t('employees.searchPlaceholder')"
        :value="search"
        data-test="employee-search"
        @input="handleSearch"
      />
      <span class="employees__count">{{ t('employees.count', { count }) }}</span>
    </div>

    <p
      v-if="errorMessage && !formVisible"
      class="employees__error"
      role="alert"
      data-test="employees-error"
    >
      {{ errorMessage }}
    </p>

    <EmptyState
      v-if="filteredMembers.length === 0"
      :title="t(count === 0 ? 'employees.emptyTitle' : 'employees.noMatchTitle')"
      :description="t(count === 0 ? 'employees.emptyDescription' : 'employees.noMatchDescription')"
    />

    <EmployeeTable
      v-else
      :members="filteredMembers"
      @edit="store.openEdit"
      @holidays="store.openHolidays"
      @remove="store.requestRemove"
      @deactivate="store.requestDeactivate"
      @reactivate="store.reactivateMember"
      @details="store.openDetails"
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

    <ConfirmActionDialog
      :visible="confirmVisible"
      :header="confirmHeader"
      :message="confirmMessage"
      :confirm-label="confirmLabel"
      :severity="confirmSeverity"
      @update:visible="handleConfirmVisibility"
      @confirm="store.confirmAction"
    />

    <EmployeeDetailsDialog
      :visible="detailsVisible"
      :member="detailsTarget"
      @update:visible="handleDetailsVisibility"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import ConfirmActionDialog from '@/shared/components/ConfirmActionDialog.vue'
import EmployeeDetailsDialog from '@/modules/employees/components/EmployeeDetailsDialog.vue'
import EmployeeFormDialog from '@/modules/employees/components/EmployeeFormDialog.vue'
import EmployeeTable from '@/modules/employees/components/EmployeeTable.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import HolidayWeeksDialog from '@/modules/employees/components/HolidayWeeksDialog.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useEmployeesStore } from '@/modules/employees/stores/employees'
import { useI18n } from '@/shared/i18n'
import type { HolidayWeek, NewTeamMember } from '@/types'

const store = useEmployeesStore()
const {
  search,
  count,
  status,
  filteredMembers,
  formVisible,
  editingMember,
  holidayVisible,
  holidayTarget,
  confirmVisible,
  pendingAction,
  pendingMember,
  detailsVisible,
  detailsTarget,
} = storeToRefs(store)
const { t } = useI18n()

const errorMessage = computed(() => (status.value.error ? t(status.value.error) : ''))

const confirmHeader = computed(() => {
  const kind = pendingAction.value?.kind
  if (kind === 'remove') return t('employees.confirm.removeHeader')
  if (kind === 'deactivate') return t('employees.confirm.deactivateHeader')
  return t('employees.confirm.holidaysHeader')
})

const confirmMessage = computed(() => {
  const name = pendingMember.value?.name ?? t('employees.thisEmployee')
  const kind = pendingAction.value?.kind
  if (kind === 'remove') return t('employees.confirm.removeMessage', { name })
  if (kind === 'deactivate') return t('employees.confirm.deactivateMessage', { name })
  return t('employees.confirm.holidaysMessage', { name })
})

const confirmLabel = computed(() => {
  const kind = pendingAction.value?.kind
  if (kind === 'remove') return t('common.remove')
  if (kind === 'deactivate') return t('common.deactivate')
  return t('employees.confirm.removeShifts')
})

const confirmSeverity = computed(() =>
  pendingAction.value?.kind === 'remove' ? ('danger' as const) : ('warn' as const),
)

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

function handleConfirmVisibility(visible: boolean): void {
  if (!visible) store.cancelAction()
}

function handleDetailsVisibility(visible: boolean): void {
  if (!visible) store.closeDetails()
}

function handleSubmit(payload: NewTeamMember): void {
  store.submitForm(payload)
}

function handleSaveHolidays(holidays: HolidayWeek[]): void {
  if (holidayTarget.value) store.requestSetHolidays(holidayTarget.value.id, holidays)
}

onUnmounted(() => {
  store.resetUi()
})
</script>

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

.employees__error {
  margin: 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
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
