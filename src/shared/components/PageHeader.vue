<template>
  <header class="page-header">
    <div class="page-header__text">
      <div class="page-header__title-row">
        <h1 class="page-header__title">{{ title }}</h1>
        <span
          v-if="description && descriptionTooltip && !isPhone"
          v-tooltip.top="description"
          class="page-header__info"
          role="img"
          :aria-label="description"
          tabindex="0"
          data-test="page-header-info"
        >
          <i class="pi pi-info-circle" aria-hidden="true" />
        </span>
      </div>
      <p v-if="description && (!descriptionTooltip || isPhone)" class="page-header__description">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { useIsPhone } from '@/shared/composables/useIsPhone'

defineProps<{
  title: string
  description?: string
  descriptionTooltip?: boolean
}>()

const isPhone = useIsPhone()
</script>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.page-header__title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.page-header__title {
  margin: 0;
  font-size: var(--font-size-page-title);
}

.page-header__info {
  display: inline-flex;
  align-items: center;
  color: var(--color-muted);
  font-size: 1rem;
  cursor: help;
}

.page-header__info:hover,
.page-header__info:focus-visible {
  color: var(--color-accent);
}

.page-header__info:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.page-header__description {
  margin: 0;
  max-width: 60ch;
  color: var(--color-muted);
}

.page-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media screen and (max-height: 899px) {
  .page-header {
    margin-bottom: 0.25rem;
    gap: 0.5rem;
  }

  .page-header__title-row {
    margin-bottom: 0.2rem;
  }

  .page-header__actions {
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
  }
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .page-header {
    flex-direction: column;
    gap: 0.5rem;
  }

  .page-header__title {
    font-size: 1.35rem;
  }

  .page-header__description {
    max-width: none;
    font-size: 0.9rem;
  }

  .page-header__actions {
    width: 100%;
    gap: 0.5rem;
  }
}
</style>
