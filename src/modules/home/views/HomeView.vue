<template>
  <section class="home">
    <PageHeader title="Light Scheduler" :description="t('home.description')" />

    <p class="home__intro">{{ t('home.intro') }}</p>

    <ul class="home__features">
      <li v-for="feature in features" :key="feature.path" class="home__feature">
        <RouterLink class="home__feature-link" :to="feature.path">
          {{ t(feature.titleKey) }}
        </RouterLink>
        <p class="home__feature-description">{{ t(feature.descriptionKey) }}</p>
      </li>
    </ul>

    <RouterLink class="home__cta" to="/scheduler">{{ t('home.cta') }}</RouterLink>
  </section>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PageHeader from '@/shared/components/PageHeader.vue'
import { useI18n } from '@/shared/i18n'

const { t } = useI18n()

const features = [
  {
    titleKey: 'home.feature.scheduler.title',
    descriptionKey: 'home.feature.scheduler.description',
    path: '/scheduler',
  },
  {
    titleKey: 'home.feature.employees.title',
    descriptionKey: 'home.feature.employees.description',
    path: '/employees',
  },
  {
    titleKey: 'home.feature.summary.title',
    descriptionKey: 'home.feature.summary.description',
    path: '/summary',
  },
  {
    titleKey: 'home.feature.archive.title',
    descriptionKey: 'home.feature.archive.description',
    path: '/archive',
  },
] as const
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.home__intro {
  margin: 0;
  max-width: 65ch;
  color: var(--color-muted);
}

.home__features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.home__feature {
  padding: 1.1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.home__feature-link {
  font-weight: 600;
  text-decoration: none;
}

.home__feature-description {
  margin: 0.4rem 0 0;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.home__cta {
  align-self: flex-start;
  padding: 0.6rem 1.1rem;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: none;
}

.home__cta:hover,
.home__cta:focus-visible {
  background: var(--color-surface-alt);
}
</style>
