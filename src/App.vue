<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="app__header">
      <RouterLink class="app__brand" to="/">Light Scheduler</RouterLink>
      <nav class="app__nav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/hello">Hello PrimeVue</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </header>

    <main class="app__main">
      <RouterView />
    </main>

    <footer class="app__footer">Built with Vue, Vite, and GitHub Actions.</footer>
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
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem clamp(1rem, 4vw, 2.5rem);
  border-bottom: 1px solid var(--color-border);
}

.app__brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-text);
  text-decoration: none;
}

.app__nav {
  display: flex;
  gap: 1rem;
}

.app__nav a {
  color: var(--color-muted);
  text-decoration: none;
  padding: 0.25rem 0;
  border-bottom: 2px solid transparent;
}

.app__nav a:hover {
  color: var(--color-text);
}

.app__nav a.router-link-active {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.app__main {
  flex: 1;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2.5rem);
}

.app__footer {
  padding: 1.25rem clamp(1rem, 4vw, 2.5rem);
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 0.85rem;
  text-align: center;
}
</style>
