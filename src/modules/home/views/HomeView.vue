<template>
  <section class="home">
    <PageHeader title="Light Scheduler" :description="t('home.description')" />

    <p class="home__intro">{{ t('home.intro') }}</p>

    <ul class="home__features">
      <li v-for="feature in features" :key="feature.path" class="home__feature">
        <div class="home__feature-header">
          <i class="home__feature-icon" :class="feature.icon" aria-hidden="true" />
          <RouterLink class="home__feature-link" :to="feature.path">
            {{ t(feature.titleKey) }}
          </RouterLink>
        </div>
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
    icon: 'pi pi-calendar',
  },
  {
    titleKey: 'home.feature.employees.title',
    descriptionKey: 'home.feature.employees.description',
    path: '/employees',
    icon: 'pi pi-users',
  },
  {
    titleKey: 'home.feature.summary.title',
    descriptionKey: 'home.feature.summary.description',
    path: '/summary',
    icon: 'pi pi-table',
  },
  {
    titleKey: 'home.feature.archive.title',
    descriptionKey: 'home.feature.archive.description',
    path: '/archive',
    icon: 'pi pi-file-export',
  },
] as const
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-stack);
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

.home__feature-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.home__feature-icon {
  color: var(--color-accent);
  font-size: 1.25rem;
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

@media screen and (max-height: 899px) {
  .home__intro {
    font-size: 0.9rem;
  }

  .home__features {
    gap: var(--space-stack);
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  }

  .home__feature {
    padding: 0.8rem;
  }

  .home__cta {
    padding: 0.45rem 0.9rem;
  }
}
</style>
