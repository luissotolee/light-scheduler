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

    <footer class="app__footer">
      <p class="app__footer-text">{{ t('app.footer') }}</p>
      <KoFiButton />
    </footer>

    <DemoOverlay v-if="demoStore.status !== 'idle' || demoStore.showRestoredFlag" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { defineAsyncComponent } from 'vue'
import AppNav from '@/shared/components/AppNav.vue'
import LanguageSwitcher from '@/shared/components/LanguageSwitcher.vue'
import KoFiButton from '@/shared/components/KoFiButton.vue'
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
  min-height: 100dvh;
}

.app__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: var(--header-height);
  padding: var(--header-padding-y) var(--space-page-x);
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
  gap: var(--nav-gap);
}

.app__main {
  flex: 1;
  width: 100%;
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: var(--space-page-y-top) var(--space-page-x) var(--space-page-y-bottom);
}

.app__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: var(--footer-padding-y) var(--space-page-x);
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: var(--footer-font-size);
  text-align: left;
}

.app__footer-text {
  margin: 0;
}

.app__footer .ko-fi-button {
  margin-left: auto;
}

@media (max-width: 480px) {
  .app__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
