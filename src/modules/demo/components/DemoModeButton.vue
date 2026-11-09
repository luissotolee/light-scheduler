<template>
  <button
    type="button"
    class="demo-mode-button"
    :aria-label="t('demo.startAria')"
    :aria-pressed="isDemoActive"
    :disabled="starting"
    data-test="demo-start-button"
    @click="handleStart"
  >
    {{ t('demo.start') }}
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '@/shared/i18n'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { startDemo } from '@/modules/demo/utils/demoSession'
import { getDemoScenario } from '@/modules/demo/scenarios'

const { t } = useI18n()
const demoStore = useDemoStore()
const starting = ref(false)

const isDemoActive = computed(() => demoStore.status !== 'idle')

async function handleStart(): Promise<void> {
  if (starting.value) return
  starting.value = true
  try {
    const scenario = getDemoScenario('scheduler-demo')
    if (scenario) {
      await startDemo(scenario.id)
    }
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
</style>