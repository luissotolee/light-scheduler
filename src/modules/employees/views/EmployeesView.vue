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
          :aria-label="t('employees.add')"
          data-test="add-employee"
          @click="store.openCreate"
        >
          <i v-if="isPhone" class="pi pi-plus" aria-hidden="true" />
          <span v-if="!isPhone">{{ t('employees.add') }}</span>
        </button>
      </template>
    </PageHeader>

    <div class="employees__toolbar">
      <div class="employees__filters">
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
        <span class="employees__count">{{ t('employees.count', { active: activeCount, total: totalCount }) }}</span>
      </div>

      <label
        v-tooltip.top="t('employees.hideInactive.tooltip')"
        class="employees__toggle"
        for="employee-hide-inactive"
        data-test="hide-inactive"
      >
        <span>{{ t('employees.hideInactive') }}</span>
        <ToggleSwitch
          input-id="employee-hide-inactive"
          :model-value="hideInactive"
          @update:model-value="store.setHideInactive"
        />
      </label>
    </div>

    <p v-if="isPhone" class="employees__hint">{{ t('employees.hideInactive.tooltip') }}</p>

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
      :title="t(emptyTitle)"
      :description="t(emptyDescription)"
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
      @manage="store.openManage"
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

    <EmployeeManageDialog
      v-if="isPhone"
      :visible="manageVisible"
      :member="manageTarget"
      @update:visible="handleManageVisibility"
      @edit="handleManageEdit"
      @holidays="handleManageHolidays"
      @deactivate="handleManageDeactivate"
      @reactivate="handleManageReactivate"
      @remove="handleManageRemove"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import ConfirmActionDialog from '@/shared/components/ConfirmActionDialog.vue'
import EmployeeDetailsDialog from '@/shared/components/EmployeeDetailsDialog.vue'
import EmployeeManageDialog from '@/modules/employees/components/EmployeeManageDialog.vue'
import EmployeeFormDialog from '@/modules/employees/components/EmployeeFormDialog.vue'
import EmployeeTable from '@/modules/employees/components/EmployeeTable.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import HolidayWeeksDialog from '@/shared/components/HolidayWeeksDialog.vue'
import PageHeader from '@/shared/components/PageHeader.vue'
import ToggleSwitch from 'primevue/toggleswitch'
import { useEmployeesStore } from '@/modules/employees/stores/employees'
import { useI18n } from '@/shared/i18n'
import type { MessageKey } from '@/shared/i18n/messages/en'
import type { HolidayWeek, NewTeamMember } from '@/types'
import { useIsPhone } from '@/shared/composables/useIsPhone'

const store = useEmployeesStore()
const {
  search,
  count,
  activeCount,
  totalCount,
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
  manageVisible,
  manageTarget,
  hideInactive,
} = storeToRefs(store)
const { t } = useI18n()
const isPhone = useIsPhone()

watch(isPhone, (phone) => {
  if (phone) store.closeDetails()
  else store.closeManage()
})

const emptyTitle = computed<MessageKey>(() => {
  if (count.value === 0) return 'employees.emptyTitle'
  if (search.value.trim() !== '') return 'employees.noMatchTitle'
  return 'employees.allInactiveTitle'
})

const emptyDescription = computed<MessageKey>(() => {
  if (count.value === 0) return 'employees.emptyDescription'
  if (search.value.trim() !== '') return 'employees.noMatchDescription'
  return 'employees.allInactiveDescription'
})

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

function handleManageVisibility(visible: boolean): void {
  if (!visible) store.closeManage()
}

function handleManageEdit(id: string): void {
  store.openEdit(id)
}

function handleManageHolidays(id: string): void {
  store.openHolidays(id)
}

function handleManageDeactivate(id: string): void {
  store.closeManage()
  store.requestDeactivate(id)
}

function handleManageReactivate(id: string): void {
  store.reactivateMember(id)
}

function handleManageRemove(id: string): void {
  store.closeManage()
  store.requestRemove(id)
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
  gap: var(--space-stack);
}

.employees__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.employees__filters {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  max-width: 34rem;
}

.employees__search-label {
  color: var(--color-muted);
  font-size: 0.9rem;
}

.employees__search {
  flex: 1 1 12rem;
  min-width: 10rem;
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
  white-space: nowrap;
}

.employees__toggle {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  white-space: nowrap;
  cursor: pointer;
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

@media screen and (max-height: 899px) {
  .employees__toolbar {
    padding: 0.5rem 0.65rem;
    gap: 0.5rem;
  }

  .employees__search {
    padding: 0.35rem 0.6rem;
  }

  .employees__error {
    padding: 0.5rem 0.75rem;
  }
}

.employees__hint {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.85rem;
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .employees__toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 0.75rem;
  }

  .employees__filters {
    flex-direction: column;
    align-items: stretch;
    max-width: none;
    gap: 0.4rem;
  }

  .employees__search {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
  }

  .employees__toggle {
    justify-content: space-between;
    margin-left: 0;
  }

  .employees__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    padding: 0.5rem;
  }
}
</style>
