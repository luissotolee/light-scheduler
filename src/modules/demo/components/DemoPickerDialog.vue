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
      class="demo-picker__groups"
      role="group"
      :aria-label="t('demo.picker.optionsAria')"
    >
      <section
        v-for="group in groups"
        :key="group.module"
        class="demo-picker__group"
        :data-test="`demo-group-${group.module}`"
      >
        <h3 class="demo-picker__group-heading">
          <button
            type="button"
            class="demo-picker__group-toggle"
            :aria-expanded="openModule === group.module"
            :aria-controls="`demo-group-panel-${group.module}`"
            :data-test="`demo-group-toggle-${group.module}`"
            @click="toggleGroup(group.module)"
          >
            <span class="demo-picker__group-title">
              <i class="demo-picker__icon" :class="group.icon" aria-hidden="true" />
              <span>{{ t(group.labelKey) }}</span>
            </span>
            <i
              class="pi demo-picker__group-chevron"
              :class="openModule === group.module ? 'pi-chevron-up' : 'pi-chevron-down'"
              aria-hidden="true"
            />
          </button>
        </h3>

        <div
          v-if="openModule === group.module"
          :id="`demo-group-panel-${group.module}`"
          class="demo-picker__group-panel"
          role="region"
          :aria-label="t(group.labelKey)"
          :data-test="`demo-group-panel-${group.module}`"
        >
          <div class="demo-picker__options">
            <button
              v-for="option in group.options"
              :key="option.id"
              type="button"
              class="demo-picker__option"
              :data-test="`demo-option-${option.id}`"
              @click="emit('select', option.id)"
            >
              <span class="demo-picker__option-body">
                <span class="demo-picker__option-title">{{ t(option.titleKey) }}</span>
                <span class="demo-picker__option-description">{{ t(option.descriptionKey) }}</span>
              </span>
              <i class="pi pi-angle-right demo-picker__option-arrow" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
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
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import AppDialog from '@/shared/components/AppDialog.vue'
import { useI18n } from '@/shared/i18n'
import type { MessageKey } from '@/shared/i18n'
import type { DemoModuleId } from '@/modules/demo/types'
import { demoScenarioGroups } from '@/modules/demo/scenarios'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  select: [scenarioId: string]
}>()

interface DemoModuleMeta {
  icon: string
  labelKey: MessageKey
}

const moduleMeta: Record<DemoModuleId, DemoModuleMeta> = {
  scheduler: { icon: 'pi pi-calendar', labelKey: 'demo.picker.scheduler' },
  summary: { icon: 'pi pi-table', labelKey: 'demo.picker.summary' },
  calendar: { icon: 'pi pi-calendar-plus', labelKey: 'demo.picker.calendar' },
  employees: { icon: 'pi pi-users', labelKey: 'demo.picker.employees' },
}

const groups = demoScenarioGroups.map((group) => ({
  module: group.module,
  icon: moduleMeta[group.module].icon,
  labelKey: moduleMeta[group.module].labelKey,
  options: group.scenarios.map((scenario) => ({
    id: scenario.id,
    titleKey: scenario.titleKey as MessageKey,
    descriptionKey: scenario.descriptionKey as MessageKey,
  })),
}))

const openModule = ref<DemoModuleId | null>(null)

watch(
  () => props.visible,
  (visible) => {
    if (visible) openModule.value = null
  },
)

function toggleGroup(module: DemoModuleId): void {
  openModule.value = openModule.value === module ? null : module
}

const { t } = useI18n()
</script>

<style scoped>
:global(.demo-picker.p-dialog) {
  width: min(40rem, 92vw);
  max-height: calc(100dvh - 2rem);
}

:global(.demo-picker .p-dialog-content) {
  max-height: calc(100dvh - 10rem);
  overflow-y: auto;
}

.demo-picker__description {
  margin: 0 0 1rem;
  color: var(--color-muted);
  line-height: 1.5;
}

.demo-picker__groups {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.demo-picker__group {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.demo-picker__group-heading {
  margin: 0;
}

.demo-picker__group-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.85rem 1rem;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.demo-picker__group-toggle:hover {
  background: var(--color-surface-alt);
}

.demo-picker__group-toggle:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.demo-picker__group-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 700;
}

.demo-picker__group-chevron {
  flex: 0 0 auto;
  color: var(--color-muted);
  font-size: 0.8rem;
}

.demo-picker__group-panel {
  padding: 0 0.5rem 0.5rem;
}

.demo-picker__options {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.demo-picker__option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
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
  font-size: 0.9rem;
}

.demo-picker__option-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.demo-picker__option-arrow {
  flex: 0 0 auto;
  color: var(--color-muted);
  font-size: 0.85rem;
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
  :global(.demo-picker.p-dialog) {
    width: 100vw;
    max-height: none;
  }

  :global(.demo-picker .p-dialog-content) {
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
