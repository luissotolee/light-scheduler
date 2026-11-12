<template>
  <Dialog
    :visible="visible"
    modal
    :header="header"
    :closable="!isPhone"
    :draggable="false"
    :block-scroll="isPhone"
    :class="['app-dialog', { 'app-dialog--phone': isPhone }]"
    :style="isPhone ? phoneStyle : undefined"
    @update:visible="emit('update:visible', $event)"
    @focusin="handleFocusIn"
  >
    <template v-if="isPhone" #header>
      <div class="app-dialog__header">
        <button
          type="button"
          class="app-dialog__back"
          :aria-label="t('common.back')"
          data-test="dialog-back"
          @click="emit('update:visible', false)"
        >
          <i class="pi pi-arrow-left" aria-hidden="true" />
        </button>
        <span class="app-dialog__title">{{ header }}</span>
      </div>
    </template>
    <slot />
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { useI18n } from '@/shared/i18n'
import { useIsPhone } from '@/shared/composables/useIsPhone'

defineProps<{
  visible: boolean
  header: string
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
}>()

const { t } = useI18n()
const isPhone = useIsPhone()

const phoneStyle = {
  width: '100vw',
  maxWidth: '100vw',
  height: 'calc(100dvh - var(--keyboard-inset, 0px))',
  maxHeight: 'calc(100dvh - var(--keyboard-inset, 0px))',
  margin: '0',
  borderRadius: '0',
}

function handleFocusIn(event: FocusEvent): void {
  if (!isPhone.value) return
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  const isField =
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  if (!isField) return
  window.setTimeout(() => {
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'center' })
    }
  }, 250)
}
</script>

<style scoped>
.app-dialog--phone {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-dialog--phone :deep(.p-dialog-header) {
  flex: 0 0 auto;
  padding-top: calc(0.65rem + env(safe-area-inset-top, 0px));
}

.app-dialog--phone :deep(.p-dialog-content) {
  flex: 1;
  max-height: none;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-padding-bottom: calc(1rem + var(--keyboard-inset, 0px));
  padding-bottom: calc(1rem + var(--keyboard-inset, 0px) + var(--safe-area-bottom, 0px));
}

.app-dialog__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  min-width: 0;
}

.app-dialog__back {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  margin-left: -0.4rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font-size: 1.1rem;
  cursor: pointer;
}

.app-dialog__back:hover {
  background: var(--color-surface-alt);
}

.app-dialog__back:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.app-dialog__title {
  min-width: 0;
  font-size: 1rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
