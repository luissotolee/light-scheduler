<template>
  <button
    type="button"
    class="demo-mode-button"
    :aria-label="t('demo.startAria')"
    :aria-pressed="isDemoActive"
    aria-haspopup="dialog"
    :aria-expanded="pickerVisible"
    :disabled="starting"
    data-test="demo-start-button"
    @click="openPicker"
  >
    {{ t('demo.start') }}
  </button>

  <DemoPickerDialog
    :visible="pickerVisible"
    @update:visible="pickerVisible = $event"
    @select="handleSelect"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/shared/i18n'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { startDemo } from '@/modules/demo/utils/demoSession'
import DemoPickerDialog from '@/modules/demo/components/DemoPickerDialog.vue'

const { t } = useI18n()
const demoStore = useDemoStore()
const starting = ref(false)
const pickerVisible = ref(false)

const isDemoActive = computed(() => demoStore.status !== 'idle')

function openPicker(): void {
  if (starting.value) return
  pickerVisible.value = true
}

async function handleSelect(scenarioId: string): Promise<void> {
  if (starting.value) return
  pickerVisible.value = false
  starting.value = true
  try {
    await startDemo(scenarioId)
  } finally {
    starting.value = false
  }
}
</script>

<style scoped>
.demo-mode-button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-accent);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.demo-mode-button:hover:not(:disabled) {
  background: var(--color-surface-alt);
}

.demo-mode-button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.demo-mode-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media screen and (max-height: 899px) {
  .demo-mode-button {
    padding: 0.35rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
