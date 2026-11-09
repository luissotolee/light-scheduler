<template>
  <div
    v-if="isActive || demoStore.showRestoredFlag"
    class="demo-overlay"
    data-test="demo-overlay"
  >
    <template v-if="isActive">
      <!-- Cursor -->
      <div
        v-if="demoStore.cursor.visible && !reducedMotion"
        class="demo-cursor"
        :style="cursorStyle"
        aria-hidden="true"
      >
        <svg class="demo-cursor__svg" viewBox="0 0 24 24" width="24" height="24">
          <path
            d="M5.5 3.21V20.8c0 .45.54.67.85.35l6.87-6.87a.5.5 0 0 0 0-.7L6.35 2.86a.5.5 0 0 0-.85.35z"
            fill="currentColor"
          />
        </svg>
        <div v-if="demoStore.ring.visible" class="demo-cursor__ripple" aria-hidden="true" />
      </div>

      <!-- Target Ring / Spotlight -->
      <div
        v-if="demoStore.ring.visible && demoStore.ring.rect && !reducedMotion"
        class="demo-ring"
        :style="ringStyle"
        aria-hidden="true"
      >
        <div class="demo-ring__inner" />
      </div>
    </template>

    <!-- Restored Toast -->
    <div
      v-if="demoStore.showRestoredFlag"
      class="demo-restored"
      role="status"
      aria-live="polite"
      data-test="demo-restored"
    >
      {{ t('demo.restored') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from '@/shared/i18n'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { stopDemo } from '@/modules/demo/utils/demoSession'
import { prefersReducedMotion } from '@/modules/demo/utils/dom'

const { t } = useI18n()
const demoStore = useDemoStore()
const reducedMotion = ref(false)

const isActive = computed(() => demoStore.status === 'running' || demoStore.status === 'paused')

const cursorStyle = computed(() => {
  const { x, y } = demoStore.cursor
  return {
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -50%)',
  }
})

const ringStyle = computed(() => {
  const rect = demoStore.ring.rect
  if (!rect) return {}
  return {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
})

function handleKeydownEscape(e: KeyboardEvent): void {
  if (!isActive.value) return
  if (e.key === 'Escape') {
    stopDemo()
  }
}

let keydownHandlerAttached = false

onMounted(() => {
  reducedMotion.value = prefersReducedMotion()

  if (!keydownHandlerAttached) {
    document.addEventListener('keydown', handleKeydownEscape)
    keydownHandlerAttached = true
  }
})

onUnmounted(() => {
  if (keydownHandlerAttached) {
    document.removeEventListener('keydown', handleKeydownEscape)
    keydownHandlerAttached = false
  }
})
</script>

<style scoped>
.demo-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
  contain: layout paint;
}

.demo-cursor {
  position: fixed;
  z-index: 10001;
  pointer-events: none;
  color: var(--color-accent);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: left 0.15s ease-out, top 0.15s ease-out;
  will-change: left, top;
}

.demo-cursor__svg {
  display: block;
}

.demo-cursor__ripple {
  position: absolute;
  inset: -8px;
  border: 2px solid var(--color-accent);
  border-radius: 50%;
  animation: demo-ripple 0.6s ease-out forwards;
}

@keyframes demo-ripple {
  from {
    transform: scale(0.5);
    opacity: 1;
  }
  to {
    transform: scale(2);
    opacity: 0;
  }
}

.demo-ring {
  position: fixed;
  z-index: 10000;
  pointer-events: none;
  border: 3px solid var(--color-accent);
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
  animation: demo-ring-pulse 1.5s ease-in-out infinite;
}

.demo-ring__inner {
  position: absolute;
  inset: -3px;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  opacity: 0.3;
}

@keyframes demo-ring-pulse {
  0%, 100% {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 0 0 var(--color-accent);
  }
  50% {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 0 8px var(--color-accent);
  }
}

.demo-restored {
  position: fixed;
  top: 5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10003;
  pointer-events: none;
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-accent);
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  animation: demo-restored-in 0.3s ease-out, demo-restored-out 0.3s ease-in 2.7s forwards;
}

@keyframes demo-restored-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes demo-restored-out {
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-1rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .demo-cursor,
  .demo-ring {
    display: none !important;
  }

  .demo-restored {
    animation: none;
  }
}
</style>