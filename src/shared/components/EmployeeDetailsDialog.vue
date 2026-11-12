<template>
  <AppDialog
    :visible="visible"
    modal
    :header="title"
    class="employee-details"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="member" class="employee-details__body">
      <EmployeeDetailsContent :member="member" />

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
}>()

const { t } = useI18n()

const title = computed(() => props.member?.name ?? t('employees.details.title'))
</script>

<style scoped>
.employee-details :deep(.p-dialog-content) {
  max-height: calc(100dvh - 10rem);
  overflow-y: auto;
}

.employee-details__body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: min(30rem, 90vw);
}

.employee-details__actions {
  display: flex;
  justify-content: flex-end;
}

@media screen and (max-height: 899px) {
  .employee-details__body {
    gap: 0.75rem;
  }
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .employee-details {
    width: 100vw;
  }

  .employee-details :deep(.p-dialog-content) {
    max-height: none;
  }

  .employee-details__body {
    min-width: 0;
  }

  .employee-details__actions {
    position: sticky;
    bottom: 0;
    z-index: 2;
    padding: 0.75rem 0 calc(0.25rem + var(--safe-area-bottom));
    background: var(--color-surface);
  }
}
</style>
