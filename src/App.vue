<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import AppNav from '@/components/AppNav.vue'
import { NAV_ITEMS } from '@/router/nav'
</script>

<template>
  <div class="app">
    <header class="app__header">
      <RouterLink class="app__brand" to="/">Light Scheduler</RouterLink>
      <AppNav :items="NAV_ITEMS" />
    </header>

    <main class="app__main">
      <RouterView />
    </main>

    <footer class="app__footer">
      Light Scheduler — a frontend-only weekly shift scheduler. Data stays in your browser.
    </footer>
  </div>
</template>

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

.app__main {
  flex: 1;
  width: 100%;
  max-width: var(--layout-max-width);
  margin: 0 auto;
  padding: clamp(1.5rem, 4vw, 3rem) var(--space-page-x);
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
