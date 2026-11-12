<template>
  <AppDialog
    :visible="visible"
    modal
    :header="title"
    class="employee-manage"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="member" class="employee-manage__body" data-test="employee-manage">
      <EmployeeDetailsContent :member="member" />

      <div
        class="employee-manage__actions"
        role="group"
        :aria-label="t('employees.manage.actions')"
      >
        <Button
          v-if="member.active"
          type="button"
          class="employee-manage__action"
          :label="t('common.edit')"
          icon="pi pi-pencil"
          severity="secondary"
          :data-test="`edit-${member.id}`"
          @click="emit('edit', member.id)"
        />
        <Button
          v-if="member.active"
          type="button"
          class="employee-manage__action"
          :label="t('common.holidays')"
          icon="pi pi-calendar"
          severity="secondary"
          :data-test="`holidays-${member.id}`"
          @click="emit('holidays', member.id)"
        />
        <Button
          v-if="member.active"
          type="button"
          class="employee-manage__action"
          :label="t('common.deactivate')"
          icon="pi pi-user-minus"
          severity="warn"
          :data-test="`deactivate-${member.id}`"
          @click="emit('deactivate', member.id)"
        />
        <Button
          v-else
          type="button"
          class="employee-manage__action"
          :label="t('common.reactivate')"
          icon="pi pi-user-plus"
          :data-test="`reactivate-${member.id}`"
          @click="emit('reactivate', member.id)"
        />
        <Button
          type="button"
          class="employee-manage__action"
          :label="t('common.remove')"
          icon="pi pi-trash"
          severity="danger"
          :data-test="`remove-${member.id}`"
          @click="emit('remove', member.id)"
        />
      </div>

      <div class="employee-manage__footer">
        <Button
          type="button"
          class="employee-manage__action"
          :label="t('common.close')"
          severity="secondary"
          data-test="close-details"
          @click="emit('update:visible', false)"
        />
      </div>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import AppDialog from '@/shared/components/AppDialog.vue'
import EmployeeDetailsContent from '@/shared/components/EmployeeDetailsContent.vue'
import type { TeamMember } from '@/types'
import { useI18n } from '@/shared/i18n'

const props = defineProps<{
  visible: boolean
  member: TeamMember | null
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  edit: [id: string]
  holidays: [id: string]
  deactivate: [id: string]
  reactivate: [id: string]
  remove: [id: string]
}>()

const { t } = useI18n()

const title = computed(() => props.member?.name ?? t('employees.manage.title'))
</script>

<style scoped>
.employee-manage :deep(.p-dialog-content) {
  max-height: calc(100dvh - 10rem);
  overflow-y: auto;
}

.employee-manage__body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: min(30rem, 90vw);
}

.employee-manage__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.employee-manage__action {
  justify-content: flex-start;
  width: 100%;
}

.employee-manage__footer {
  display: flex;
  justify-content: flex-end;
}

.employee-manage__footer .employee-manage__action {
  width: auto;
}

@media screen and (max-height: 899px) {
  .employee-manage__body {
    gap: 0.75rem;
  }
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .employee-manage {
    width: 100vw;
  }

  .employee-manage :deep(.p-dialog-content) {
    max-height: none;
  }

  .employee-manage__body {
    min-width: 0;
  }

  .employee-manage__footer {
    position: sticky;
    bottom: 0;
    z-index: 2;
    padding: 0.75rem 0 calc(0.25rem + var(--safe-area-bottom));
    background: var(--color-surface);
  }
}
</style>
