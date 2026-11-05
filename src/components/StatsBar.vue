<script setup lang="ts">
defineProps<{
  total: number
  completed: number
  remaining: number
  progress: number
}>()
</script>

<template>
  <section class="stats" aria-label="Task statistics">
    <div class="stats__metric">
      <span class="stats__value">{{ total }}</span>
      <span class="stats__label">Total</span>
    </div>
    <div class="stats__metric">
      <span class="stats__value">{{ remaining }}</span>
      <span class="stats__label">Remaining</span>
    </div>
    <div class="stats__metric">
      <span class="stats__value">{{ completed }}</span>
      <span class="stats__label">Done</span>
    </div>
    <div class="stats__progress-wrap">
      <div
        class="stats__progress"
        role="progressbar"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <span class="stats__progress-fill" :style="{ width: `${progress}%` }" />
      </div>
      <span class="stats__label">{{ progress }}% complete</span>
    </div>
  </section>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(3, auto) 1fr;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.stats__metric {
  display: flex;
  flex-direction: column;
}

.stats__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.stats__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
}

.stats__progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 8rem;
}

.stats__progress {
  height: 0.5rem;
  border-radius: 999px;
  background: var(--color-surface-alt);
  overflow: hidden;
}

.stats__progress-fill {
  display: block;
  height: 100%;
  background: var(--color-accent);
  transition: width 200ms ease;
}

@media (max-width: 600px) {
  .stats {
    grid-template-columns: repeat(3, 1fr);
  }

  .stats__progress-wrap {
    grid-column: 1 / -1;
  }
}
</style>
