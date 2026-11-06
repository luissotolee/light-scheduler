<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'

const features = [
  {
    title: 'Scheduler',
    description: 'Build weekly shifts for every employee on your team.',
    path: '/scheduler',
  },
  {
    title: 'Employees',
    description: 'Keep the employee records used by every schedule.',
    path: '/employees',
  },
  {
    title: 'Summary',
    description: 'Review a week and print it or save it as a PDF.',
    path: '/summary',
  },
  {
    title: 'History',
    description: 'Browse the weekly schedules you have saved.',
    path: '/history',
  },
  {
    title: 'CSV I/O',
    description: 'Export employees and schedules, or import files to resume work.',
    path: '/csv',
  },
]
</script>

<template>
  <section class="home">
    <PageHeader
      title="Light Scheduler"
      description="A light, modern weekly shift scheduler for teams. It is frontend-only: all data stays in your browser and round-trips through CSV files so you can pick up where you left off."
    />

    <p class="home__intro">
      Plan daily shifts across a week for many employees, review the result, and keep a history of
      past schedules without a backend.
    </p>

    <ul class="home__features">
      <li v-for="feature in features" :key="feature.path" class="home__feature">
        <RouterLink class="home__feature-link" :to="feature.path">{{ feature.title }}</RouterLink>
        <p class="home__feature-description">{{ feature.description }}</p>
      </li>
    </ul>

    <RouterLink class="home__cta" to="/scheduler">Start scheduling</RouterLink>
  </section>
</template>

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
