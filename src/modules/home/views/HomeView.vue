<template>
  <section class="home">
    <PageHeader title="Light Scheduler" :description="t('home.description')" />

    <section
      v-if="demoStore.status === 'idle'"
      class="home__demo"
      data-test="home-demo-recommendation"
      aria-labelledby="home-demo-title"
    >
      <div class="home__demo-text">
        <span class="home__demo-badge">{{ t('home.demo.badge') }}</span>
        <h2 id="home-demo-title" class="home__demo-title">{{ t('home.demo.title') }}</h2>
        <p class="home__demo-description">{{ t('home.demo.description') }}</p>
      </div>
      <button
        type="button"
        class="home__demo-cta"
        data-test="home-demo-start"
        aria-haspopup="dialog"
        :aria-expanded="pickerVisible"
        :disabled="starting"
        @click="pickerVisible = true"
      >
        <i class="pi pi-play" aria-hidden="true" />
        <span>{{ t('home.demo.cta') }}</span>
      </button>
    </section>

    <DemoPickerDialog
      :visible="pickerVisible"
      @update:visible="pickerVisible = $event"
      @select="handleDemoSelect"
    />

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

    <RouterLink class="home__cta" to="/employees">{{ t('home.cta') }}</RouterLink>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '@/shared/components/PageHeader.vue'
import DemoPickerDialog from '@/modules/demo/components/DemoPickerDialog.vue'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { startDemo } from '@/modules/demo/utils/demoSession'
import { useI18n } from '@/shared/i18n'

const { t } = useI18n()
const demoStore = useDemoStore()
const starting = ref(false)
const pickerVisible = ref(false)

const features = [
  {
    titleKey: 'home.feature.scheduler.title',
    descriptionKey: 'home.feature.scheduler.description',
    path: '/scheduler',
    icon: 'pi pi-calendar',
  },
  {
    titleKey: 'home.feature.summary.title',
    descriptionKey: 'home.feature.summary.description',
    path: '/summary',
    icon: 'pi pi-table',
  },
  {
    titleKey: 'home.feature.calendar.title',
    descriptionKey: 'home.feature.calendar.description',
    path: '/calendar',
    icon: 'pi pi-calendar-plus',
  },
  {
    titleKey: 'home.feature.employees.title',
    descriptionKey: 'home.feature.employees.description',
    path: '/employees',
    icon: 'pi pi-users',
  },
  {
    titleKey: 'home.feature.archive.title',
    descriptionKey: 'home.feature.archive.description',
    path: '/archive',
    icon: 'pi pi-file-export',
  },
] as const

async function handleDemoSelect(scenarioId: string): Promise<void> {
  if (starting.value) return
  pickerVisible.value = false
  starting.value = true
  try {
    await startDemo(scenarioId)
  } finally {
    starting.value = false
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--space-stack);
}

.home__demo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.home__demo-text {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 60ch;
}

.home__demo-badge {
  align-self: flex-start;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  background: var(--color-accent);
  color: var(--color-bg);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.home__demo-title {
  margin: 0;
  font-size: 1.15rem;
}

.home__demo-description {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.9rem;
}

.home__demo-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 1.2rem;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-bg);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.home__demo-cta:hover:not(:disabled) {
  filter: brightness(1.08);
}

.home__demo-cta:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.home__demo-cta:disabled {
  cursor: not-allowed;
  opacity: 0.55;
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
  .home__demo {
    gap: 0.65rem;
    padding: 0.75rem 0.9rem;
  }

  .home__demo-title {
    font-size: 1rem;
  }

  .home__demo-description {
    font-size: 0.82rem;
  }

  .home__demo-cta {
    padding: 0.5rem 0.9rem;
  }

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

@media (max-width: 640px) {
  .home__demo {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
