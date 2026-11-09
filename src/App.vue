<template>
  <div class="app">
    <header class="app__header">
      <RouterLink class="app__brand" to="/">Light Scheduler</RouterLink>
      <div class="app__controls">
        <AppNav :items="NAV_ITEMS" />
        <LanguageSwitcher />
        <DemoModeButton v-if="demoStore.status === 'idle'" />
      </div>
    </header>

    <main class="app__main">
      <DemoBanner />
      <RouterView />
    </main>

    <footer class="app__footer">{{ t('app.footer') }}</footer>

    <DemoOverlay v-if="demoStore.status !== 'idle' || demoStore.showRestoredFlag" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { defineAsyncComponent } from 'vue'
import AppNav from '@/shared/components/AppNav.vue'
import LanguageSwitcher from '@/shared/components/LanguageSwitcher.vue'
import DemoModeButton from '@/modules/demo/components/DemoModeButton.vue'
import DemoBanner from '@/modules/demo/components/DemoBanner.vue'
import { useI18n } from '@/shared/i18n'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { NAV_ITEMS } from '@/router/nav'

const { t } = useI18n()
const demoStore = useDemoStore()

onMounted(() => {
  demoStore.checkRecovery()
})

const DemoOverlay = defineAsyncComponent(() => import('@/modules/demo/components/DemoOverlay.vue'))
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: var(--header-height);
  padding: 0.65rem var(--space-page-x);
  border-bottom: 1px solid var(--color-border);
}

.app__brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-text);
  text-decoration: none;
}

.app__brand:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.app__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.app__main {
  flex: 1;
  width: 100%;
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: clamp(0.75rem, 2vw, 1.5rem) var(--space-page-x) clamp(1.5rem, 4vw, 3rem);
}

.app__footer {
  padding: 1.25rem var(--space-page-x);
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 0.85rem;
  text-align: center;
}

@media (max-width: 480px) {
  .app__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
