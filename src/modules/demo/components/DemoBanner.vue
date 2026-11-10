<template>
  <div
    v-if="demoStore.status !== 'idle'"
    class="demo-banner"
    data-test="demo-banner"
  >
    <div class="demo-banner__heading">
      <span class="demo-banner__badge">{{ t('demo.badge') }}</span>
      <p class="demo-banner__message">{{ t('demo.banner') }}</p>
      <span
        v-if="showStepInfo"
        class="demo-banner__progress"
        data-test="demo-progress"
      >
        {{ progressLabel }}
      </span>
    </div>

    <p
      v-if="errorMessage"
      class="demo-banner__error"
      role="alert"
      data-test="demo-error"
    >
      {{ errorMessage }}
    </p>

    <div class="demo-banner__footer">
      <button
        type="button"
        class="demo-banner__exit"
        data-test="demo-exit"
        @click="stopDemo"
      >
        <i class="pi pi-sign-out" aria-hidden="true" />
        <span>{{ t('demo.exit') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/shared/i18n'
import type { MessageKey } from '@/shared/i18n'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { stopDemo } from '@/modules/demo/utils/demoSession'

const { t } = useI18n()
const demoStore = useDemoStore()

const isActive = computed(
  () => demoStore.status === 'running' || demoStore.status === 'paused',
)
const showStepInfo = computed(
  () => isActive.value && demoStore.currentStep !== null && demoStore.totalSteps > 0,
)

const progressLabel = computed(() =>
  t('demo.progress', {
    current: demoStore.stepIndex + 1,
    total: demoStore.totalSteps,
  }),
)

const errorMessage = computed(() =>
  demoStore.status === 'error' && demoStore.errorKey
    ? t(demoStore.errorKey as MessageKey)
    : '',
)
</script>

<style scoped>
.demo-banner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.65rem 0.9rem;
  margin-bottom: var(--space-stack);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  color: var(--color-text);
}

.demo-banner__heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.demo-banner__badge {
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-bg);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.demo-banner__message {
  flex: 1;
  min-width: 14rem;
  margin: 0;
  font-size: 0.9rem;
}

.demo-banner__progress {
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.demo-banner__error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 500;
}

.demo-banner__footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.demo-banner__exit {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
  padding: 0.3rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.demo-banner__exit:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.demo-banner__exit:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@media screen and (max-height: 899px) {
  .demo-banner {
    gap: 0.35rem;
    padding: 0.4rem 0.7rem;
  }

  .demo-banner__message {
    min-width: 10rem;
    font-size: 0.8rem;
  }

  .demo-banner__badge {
    font-size: 0.62rem;
  }

  .demo-banner__exit {
    padding: 0.2rem 0.5rem;
    font-size: 0.72rem;
  }
}

@media (max-width: 600px) {
  .demo-banner__message {
    min-width: 100%;
  }

  .demo-banner__exit {
    margin-left: 0;
  }
}
</style>
