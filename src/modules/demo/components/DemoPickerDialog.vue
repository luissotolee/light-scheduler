<template>
  <AppDialog
    :visible="visible"
    modal
    :header="t('demo.picker.title')"
    class="demo-picker"
    data-test="demo-picker"
    @update:visible="emit('update:visible', $event)"
  >
    <p class="demo-picker__description">{{ t('demo.picker.description') }}</p>

    <div
      class="demo-picker__options"
      role="group"
      :aria-label="t('demo.picker.optionsAria')"
    >
      <button
        v-for="option in options"
        :key="option.id"
        type="button"
        class="demo-picker__option"
        :data-test="`demo-option-${option.key}`"
        @click="emit('select', option.id)"
      >
        <i class="demo-picker__icon" :class="option.icon" aria-hidden="true" />
        <span class="demo-picker__option-body">
          <span class="demo-picker__option-title">{{ t(option.titleKey) }}</span>
          <span class="demo-picker__option-description">{{ t(option.descriptionKey) }}</span>
        </span>
      </button>
    </div>

    <div class="demo-picker__actions">
      <Button
        type="button"
        :label="t('common.cancel')"
        severity="secondary"
        data-test="demo-picker-cancel"
        @click="emit('update:visible', false)"
      />
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import AppDialog from '@/shared/components/AppDialog.vue'
import { useI18n } from '@/shared/i18n'
import type { MessageKey } from '@/shared/i18n'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  select: [scenarioId: string]
}>()

interface DemoPickerOption {
  id: string
  key: string
  icon: string
  titleKey: MessageKey
  descriptionKey: MessageKey
}

const options: DemoPickerOption[] = [
  {
    id: 'employees-demo',
    key: 'employees',
    icon: 'pi pi-users',
    titleKey: 'demo.picker.employees',
    descriptionKey: 'demo.picker.employeesDescription',
  },
  {
    id: 'scheduler-demo',
    key: 'scheduler',
    icon: 'pi pi-calendar',
    titleKey: 'demo.picker.scheduler',
    descriptionKey: 'demo.picker.schedulerDescription',
  },
  {
    id: 'calendar-demo',
    key: 'calendar',
    icon: 'pi pi-calendar-plus',
    titleKey: 'demo.picker.calendar',
    descriptionKey: 'demo.picker.calendarDescription',
  },
  {
    id: 'summary-demo',
    key: 'summary',
    icon: 'pi pi-table',
    titleKey: 'demo.picker.summary',
    descriptionKey: 'demo.picker.summaryDescription',
  },
]

const { t } = useI18n()
</script>

<style scoped>
.demo-picker {
  width: min(32rem, 92vw);
  max-height: calc(100dvh - 2rem);
}

.demo-picker :deep(.p-dialog-content) {
  max-height: calc(100dvh - 10rem);
  overflow-y: auto;
}

.demo-picker__description {
  margin: 0 0 1rem;
  color: var(--color-muted);
  line-height: 1.5;
}

.demo-picker__options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.demo-picker__option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.demo-picker__option:hover {
  border-color: var(--color-accent);
  background: var(--color-surface-alt);
}

.demo-picker__option:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.demo-picker__icon {
  color: var(--color-accent);
  font-size: 1.25rem;
  line-height: 1.4;
}

.demo-picker__option-body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.demo-picker__option-title {
  font-weight: 700;
}

.demo-picker__option-description {
  color: var(--color-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}

.demo-picker__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.25rem;
}

@media screen and (max-height: 899px) {
  .demo-picker__option {
    padding: 0.65rem;
  }

  .demo-picker__option-description {
    font-size: 0.8rem;
  }
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .demo-picker {
    width: 100vw;
    max-height: none;
  }

  .demo-picker :deep(.p-dialog-content) {
    max-height: none;
  }

  .demo-picker__option {
    padding: 0.85rem;
  }

  .demo-picker__actions {
    position: sticky;
    bottom: 0;
    z-index: 2;
    padding: 0.75rem 0 calc(0.25rem + var(--safe-area-bottom));
    background: var(--color-surface);
  }
}
</style>
