<template>
  <nav class="app-nav" :aria-label="t('app.navPrimary')">
    <RouterLink
      v-for="item in items"
      :key="item.name"
      class="app-nav__link"
      :to="item.path"
      :aria-label="isPhone ? t(item.labelKey) : undefined"
      :data-test="`nav-${item.name}`"
    >
      <i v-if="isPhone" class="app-nav__icon" :class="item.icon" aria-hidden="true" />
      <span v-else>{{ t(item.labelKey) }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { NavItem } from '@/router/nav'
import { useI18n } from '@/shared/i18n'
import { useIsPhone } from '@/shared/composables/useIsPhone'

defineProps<{
  items: NavItem[]
}>()

const { t } = useI18n()
const isPhone = useIsPhone()
</script>

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

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .app-nav {
    gap: 0.25rem;
  }

  .app-nav__link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    padding: 0;
    border-bottom: 0;
    border-radius: var(--radius-sm);
    font-size: 1.05rem;
  }

  .app-nav__link[aria-current='page'] {
    border-bottom: 0;
    background: var(--color-shift-bar);
  }
}
</style>
