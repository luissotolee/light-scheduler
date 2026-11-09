<template>
  <div
    v-if="demoStore.status !== 'idle'"
    class="demo-banner"
    role="status"
    aria-live="polite"
    data-test="demo-banner"
  >
    <span class="demo-banner__badge">{{ t('demo.badge') }}</span>
    <span class="demo-banner__message">{{ t('demo.banner') }}</span>
    <button
      type="button"
      class="demo-banner__exit"
      :aria-label="t('demo.exitAria')"
      @click="handleExit"
    >
      {{ t('demo.exit') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/shared/i18n'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { stopDemo } from '@/modules/demo/utils/demoSession'

const { t } = useI18n()
const demoStore = useDemoStore()

async function handleExit(): Promise<void> {
  await stopDemo()
}
</script>

<style scoped>
.demo-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  color: var(--color-text);
}

.demo-banner__badge {
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-on-accent);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.demo-banner__message {
  flex: 1;
  min-width: 12rem;
  font-size: 0.9rem;
}

.demo-banner__exit {
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.demo-banner__exit:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.demo-banner__exit:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .demo-banner {
    flex-direction: column;
    align-items: stretch;
  }

  .demo-banner__exit {
    width: 100%;
  }
}
</style>