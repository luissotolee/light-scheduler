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

      <!-- Click Area -->
      <div
        v-if="demoStore.click.visible"
        :key="demoStore.click.id"
        class="demo-click"
        :style="clickStyle"
        aria-hidden="true"
        data-test="demo-click"
      >
        <span class="demo-click__circle" />
        <span class="demo-click__dot" />
      </div>

      <!-- Floating Narration -->
      <Transition name="demo-callout">
        <div
          v-if="showNarration"
          class="demo-callout"
          :class="`demo-callout--${bubblePlacement}`"
          :style="bubbleStyle"
          role="status"
          aria-live="polite"
          :aria-label="t('demo.narrationAria')"
          data-test="demo-narration"
        >
          <p class="demo-callout__text">{{ narrationText }}</p>
        </div>
      </Transition>
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
import type { CSSProperties } from 'vue'
import { useI18n } from '@/shared/i18n'
import type { MessageKey } from '@/shared/i18n'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { stopDemo } from '@/modules/demo/utils/demoSession'
import { prefersReducedMotion } from '@/modules/demo/utils/dom'

const BUBBLE_MAX_WIDTH = 320
const BUBBLE_GAP = 14
const BUBBLE_MARGIN = 12
const BUBBLE_PREFERRED_SPACE = 170

const { t } = useI18n()
const demoStore = useDemoStore()
const reducedMotion = ref(false)
const viewport = ref({ width: window.innerWidth, height: window.innerHeight })

const isActive = computed(() => demoStore.status === 'running' || demoStore.status === 'paused')

const narrationText = computed(() =>
  demoStore.currentStep
    ? t(demoStore.currentStep.narrationKey as MessageKey)
    : '',
)

const showNarration = computed(
  () => isActive.value && narrationText.value.length > 0,
)

const bubblePlacement = computed<'above' | 'below' | 'center'>(() => {
  const rect = demoStore.narrationAnchor
  if (!rect) return 'center'

  const spaceAbove = rect.top
  const spaceBelow = viewport.value.height - rect.bottom

  if (spaceAbove >= BUBBLE_PREFERRED_SPACE) return 'above'
  if (spaceBelow >= BUBBLE_PREFERRED_SPACE) return 'below'
  return spaceAbove >= spaceBelow ? 'above' : 'below'
})

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

const clickStyle = computed(() => ({
  left: `${demoStore.click.x}px`,
  top: `${demoStore.click.y}px`,
}))

type CalloutStyle = CSSProperties & { '--callout-tail-x'?: string }

const bubbleStyle = computed<CalloutStyle>(() => {
  const maxWidth = Math.min(
    BUBBLE_MAX_WIDTH,
    Math.max(BUBBLE_MARGIN * 2, viewport.value.width - BUBBLE_MARGIN * 2),
  )
  const rect = demoStore.narrationAnchor

  if (!rect) {
    return {
      left: '50%',
      top: '50%',
      maxWidth: `${maxWidth}px`,
      transform: 'translate(-50%, -50%)',
    }
  }

  const halfWidth = maxWidth / 2
  const targetCenter = rect.left + rect.width / 2
  const left = Math.min(
    Math.max(targetCenter, BUBBLE_MARGIN + halfWidth),
    viewport.value.width - BUBBLE_MARGIN - halfWidth,
  )
  const placement = bubblePlacement.value
  const top = placement === 'above' ? rect.top - BUBBLE_GAP : rect.bottom + BUBBLE_GAP
  const translateY = placement === 'above' ? '-100%' : '0'
  const tailX = Math.min(
    Math.max(targetCenter - (left - halfWidth), 16),
    maxWidth - 16,
  )

  return {
    left: `${left}px`,
    top: `${top}px`,
    maxWidth: `${maxWidth}px`,
    transform: `translate(-50%, ${translateY})`,
    '--callout-tail-x': `${tailX}px`,
  }
})

function updateViewport(): void {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
}

function handleKeydownEscape(e: KeyboardEvent): void {
  if (!isActive.value) return
  if (e.key === 'Escape') {
    stopDemo()
  }
}

let keydownHandlerAttached = false

onMounted(() => {
  reducedMotion.value = prefersReducedMotion()
  updateViewport()
  window.addEventListener('resize', updateViewport)

  if (!keydownHandlerAttached) {
    document.addEventListener('keydown', handleKeydownEscape)
    keydownHandlerAttached = true
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewport)

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
  color: var(--color-demo-cursor);
  filter:
    drop-shadow(0 0 2px var(--color-bg))
    drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
  transition: left 0.15s ease-out, top 0.15s ease-out;
  will-change: left, top;
}

.demo-cursor__svg {
  display: block;
  overflow: visible;
}

.demo-cursor__svg path {
  stroke: var(--color-bg);
  stroke-width: 1.5;
  stroke-linejoin: round;
  paint-order: stroke;
}

.demo-cursor__ripple {
  position: absolute;
  inset: -8px;
  border: 2px solid var(--color-demo-cursor);
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

.demo-click {
  position: fixed;
  z-index: 10002;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.demo-click__circle {
  display: block;
  width: 2.25rem;
  height: 2.25rem;
  border: 2px solid var(--color-accent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-accent) 22%, transparent);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--color-accent) 20%, transparent),
    0 0 14px color-mix(in srgb, var(--color-accent) 60%, transparent);
  animation: demo-click-pop 0.45s ease-out;
}

.demo-click__dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--color-accent);
  transform: translate(-50%, -50%);
}

@keyframes demo-click-pop {
  from {
    transform: scale(0.4);
    opacity: 0.4;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.demo-callout {
  position: fixed;
  z-index: 10003;
  pointer-events: none;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.45),
    0 0 0 1px color-mix(in srgb, var(--color-accent) 20%, transparent);
  font-size: 0.9rem;
  line-height: 1.45;
}

.demo-callout__text {
  margin: 0;
}

.demo-callout::after {
  content: '';
  position: absolute;
  left: var(--callout-tail-x, 50%);
  width: 0;
  height: 0;
  transform: translateX(-50%);
  border-left: 0.5rem solid transparent;
  border-right: 0.5rem solid transparent;
}

.demo-callout--above::after {
  bottom: -0.5rem;
  border-top: 0.5rem solid var(--color-accent);
}

.demo-callout--below::after {
  top: -0.5rem;
  border-bottom: 0.5rem solid var(--color-accent);
}

.demo-callout--center::after {
  display: none;
}

.demo-callout-enter-active,
.demo-callout-leave-active {
  transition: opacity 0.18s ease;
}

.demo-callout-enter-from,
.demo-callout-leave-to {
  opacity: 0;
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

  .demo-click__circle {
    animation: none;
  }

  .demo-callout-enter-active,
  .demo-callout-leave-active {
    transition: none;
  }

  .demo-restored {
    animation: none;
  }
}
</style>