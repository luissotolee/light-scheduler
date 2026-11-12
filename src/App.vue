<template>
  <div class="app">
    <header class="app__header">
      <RouterLink class="app__brand" to="/">Light Scheduler</RouterLink>
      <div class="app__nav">
        <AppNav :items="NAV_ITEMS" />
      </div>
      <DemoModeButton v-if="demoStore.status === 'idle'" />
      <LanguageSwitcher class="app__language" />
    </header>

    <main class="app__main">
      <DemoBanner />
      <RouterView />
    </main>

    <footer class="app__footer">
      <a class="app__footer-contact" :href="CONTACT_EMAIL">
        <i class="pi pi-envelope app__footer-contact-icon" aria-hidden="true" />
        {{ t('app.contact') }}
      </a>
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
import { useKeyboardInset } from '@/shared/composables/useKeyboardInset'

const { t } = useI18n()
const demoStore = useDemoStore()

useKeyboardInset()

const CONTACT_EMAIL = 'mailto:luissotolee@gmail.com?subject=Light%20Scheduler'

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
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.75rem;
  min-height: var(--header-height);
  padding: var(--header-padding-y) var(--space-page-x);
  border-bottom: 1px solid var(--color-border);
}

.app__brand {
  flex: 0 0 auto;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
}

.app__brand:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.app__nav {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  min-width: 0;
  margin-left: auto;
  overflow-x: auto;
  scrollbar-width: none;
}

.app__nav::-webkit-scrollbar {
  display: none;
}

.app__nav .app-nav {
  flex-wrap: nowrap;
}

.app__language,
.app__header > .demo-mode-button {
  flex: 0 0 auto;
}

.app__main {
  flex: 1;
  width: 100%;
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: var(--space-page-y-top) var(--space-page-x) var(--space-page-y-bottom);
}

.app__footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: 1rem;
  padding: var(--footer-padding-y) var(--space-page-x);
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: var(--footer-font-size);
  text-align: left;
}

.app__footer-text {
  grid-column: 2;
  margin: 0;
  text-align: center;
}

.app__footer .ko-fi-button {
  grid-column: 3;
  justify-self: end;
}

.app__footer-contact {
  justify-self: start;
  color: var(--color-accent);
  text-decoration: none;
}

.app__footer-contact-icon {
  margin-right: 0.35rem;
}

.app__footer-contact:hover {
  text-decoration: underline;
}

.app__footer-contact:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .app__footer {
    grid-template-columns: 1fr;
    justify-items: center;
    row-gap: 0.75rem;
  }

  .app__footer-text,
  .app__footer .ko-fi-button {
    grid-column: auto;
    justify-self: center;
  }
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .app__header {
    gap: 0.4rem;
    padding-left: max(var(--space-page-x), env(safe-area-inset-left, 0px));
    padding-right: max(var(--space-page-x), env(safe-area-inset-right, 0px));
    padding-top: max(var(--header-padding-y), env(safe-area-inset-top, 0px));
  }

  .app__brand {
    font-size: 1rem;
  }

  .app__nav {
    gap: 0.25rem;
  }

  .app__language,
  .app__header > .demo-mode-button {
    margin-left: 0;
  }

  .app__main {
    padding-left: max(var(--space-page-x), env(safe-area-inset-left, 0px));
    padding-right: max(var(--space-page-x), env(safe-area-inset-right, 0px));
    padding-bottom: calc(
      var(--space-page-y-bottom) + var(--keyboard-inset) + env(safe-area-inset-bottom, 0px)
    );
  }

  .app__footer {
    grid-template-columns: 1fr;
    justify-items: center;
    row-gap: 0.75rem;
    padding-bottom: calc(var(--footer-padding-y) + env(safe-area-inset-bottom, 0px));
  }

  .app__footer-text,
  .app__footer .ko-fi-button {
    grid-column: auto;
    justify-self: center;
  }
}
</style>
