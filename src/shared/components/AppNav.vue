<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { NavItem } from '@/router/nav'

defineProps<{
  items: NavItem[]
}>()
</script>

<template>
  <nav class="app-nav" aria-label="Primary">
    <RouterLink v-for="item in items" :key="item.name" class="app-nav__link" :to="item.path">
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.app-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--nav-gap);
}

.app-nav__link {
  color: var(--color-muted);
  text-decoration: none;
  padding: 0.25rem 0;
  border-bottom: 2px solid transparent;
}

.app-nav__link:hover {
  color: var(--color-text);
}

.app-nav__link[aria-current='page'] {
  color: var(--color-accent);
  border-bottom-color: var(--color-accent);
}

.app-nav__link:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .app-nav {
    gap: 0.75rem;
  }
}
</style>
