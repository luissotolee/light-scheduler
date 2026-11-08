<template>
  <Dialog
    :visible="visible"
    modal
    :header="header"
    class="confirm-dialog"
    @update:visible="emit('update:visible', $event)"
  >
    <p class="confirm-dialog__message" data-test="confirm-message">{{ message }}</p>
    <div class="confirm-dialog__actions">
      <Button
        type="button"
        label="Cancel"
        severity="secondary"
        data-test="confirm-cancel"
        @click="emit('update:visible', false)"
      />
      <Button
        type="button"
        :label="confirmLabel"
        :severity="severity ?? 'danger'"
        data-test="confirm-accept"
        @click="emit('confirm')"
      />
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

type Severity = 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' | 'help'

defineProps<{
  visible: boolean
  header: string
  message: string
  confirmLabel: string
  severity?: Severity
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  confirm: []
}>()
</script>

<style scoped>
.confirm-dialog__message {
  margin: 0 0 1.25rem;
  color: var(--color-text);
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
