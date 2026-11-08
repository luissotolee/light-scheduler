<template>
  <div
    ref="bar"
    class="shift-bar"
    :class="[
      `shift-bar--${dutyModifier(props.duty)}`,
      { 'shift-bar--selected': selected, 'shift-bar--disabled': disabled },
    ]"
    :style="barStyle"
    role="button"
    :tabindex="disabled ? -1 : 0"
    data-test="shift-bar"
    :title="t('shiftBar.removeHint')"
    :aria-disabled="disabled"
    :aria-label="ariaLabel"
    @pointerdown.stop.prevent="beginDrag('move', $event)"
    @pointermove="updateDrag"
    @pointerup="endDrag"
    @pointercancel="cancelDrag"
    @contextmenu.prevent.stop="handleContextMenu"
    @keydown="handleKeydown"
  >
    <span class="shift-bar__label">
      {{ formatExtendedMinutes(displayedRange.startMinute) }}–{{
        formatExtendedMinutes(displayedRange.endMinute)
      }}
    </span>
    <span
      class="shift-bar__handle shift-bar__handle--start"
      data-test="resize-start"
      aria-hidden="true"
      @pointerdown.stop.prevent="beginDrag('resize-start', $event)"
    />
    <span
      class="shift-bar__handle shift-bar__handle--end"
      data-test="resize-end"
      aria-hidden="true"
      @pointerdown.stop.prevent="beginDrag('resize-end', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Duty, Shift } from '@/types'
import type { ShiftResizeInput } from '@/modules/scheduler/types'
import {
  DAY_END_MINUTE,
  DAY_START_MINUTE,
  MIN_SHIFT_MINUTES,
  SLOT_MINUTES,
  clampToDayWindow,
  formatExtendedMinutes,
  snapToSlot,
} from '@/shared/utils/shifts'
import type { MinuteRange } from '@/shared/utils/shifts'
import { useI18n } from '@/shared/i18n'
import { dutyModifier } from '@/shared/utils/employee'
import {
  minuteDeltaFromPixels,
  minuteToPercent,
  rangeToPercentWidth,
} from '@/modules/scheduler/utils/grid'

const props = withDefaults(
  defineProps<{
    shift: Shift
    memberName: string
    duty: Duty
    selected?: boolean
    disabled?: boolean
  }>(),
  { disabled: false },
)

const emit = defineEmits<{
  resize: [input: ShiftResizeInput]
  remove: [id: string]
}>()

type DragMode = 'move' | 'resize-start' | 'resize-end'

interface DragState {
  mode: DragMode
  originStartMinute: number
  originEndMinute: number
  startClientX: number
  captureTarget: Element | null
  trackElement: Element | null
  pointerId: number
}

const { t } = useI18n()

const bar = ref<HTMLElement | null>(null)
const drag = ref<DragState | null>(null)
const draftRange = ref<MinuteRange | null>(null)

const displayedRange = computed<MinuteRange>(() => ({
  startMinute: draftRange.value?.startMinute ?? props.shift.startMinute,
  endMinute: draftRange.value?.endMinute ?? props.shift.endMinute,
}))

const barStyle = computed(() => ({
  left: `${minuteToPercent(displayedRange.value.startMinute)}%`,
  width: `${rangeToPercentWidth(displayedRange.value.startMinute, displayedRange.value.endMinute)}%`,
}))

const ariaLabel = computed(() =>
  t('shiftBar.aria', {
    name: props.memberName,
    start: formatExtendedMinutes(displayedRange.value.startMinute),
    end: formatExtendedMinutes(displayedRange.value.endMinute),
  }),
)

function beginDrag(mode: DragMode, event: PointerEvent): void {
  if (props.disabled) return
  if (event.button > 0) return

  const captureTarget = event.currentTarget instanceof Element ? event.currentTarget : null
  if (captureTarget && typeof captureTarget.setPointerCapture === 'function') {
    captureTarget.setPointerCapture(event.pointerId)
  }

  drag.value = {
    mode,
    originStartMinute: props.shift.startMinute,
    originEndMinute: props.shift.endMinute,
    startClientX: event.clientX,
    captureTarget,
    trackElement: bar.value?.parentElement ?? null,
    pointerId: event.pointerId,
  }
  draftRange.value = {
    startMinute: props.shift.startMinute,
    endMinute: props.shift.endMinute,
  }
}

function updateDrag(event: PointerEvent): void {
  const state = drag.value
  if (!state) return

  const trackWidth = state.trackElement?.getBoundingClientRect().width ?? 0
  if (!trackWidth) return

  const deltaMinutes = minuteDeltaFromPixels(event.clientX - state.startClientX, trackWidth)
  const duration = state.originEndMinute - state.originStartMinute

  if (state.mode === 'move') {
    const rawStart = snapToSlot(state.originStartMinute + deltaMinutes)
    const startMinute = Math.min(Math.max(rawStart, DAY_START_MINUTE), DAY_END_MINUTE - duration)
    draftRange.value = { startMinute, endMinute: startMinute + duration }
    return
  }

  if (state.mode === 'resize-start') {
    const rawStart = clampToDayWindow(snapToSlot(state.originStartMinute + deltaMinutes))
    const startMinute = Math.min(rawStart, state.originEndMinute - MIN_SHIFT_MINUTES)
    draftRange.value = { startMinute, endMinute: state.originEndMinute }
    return
  }

  const rawEnd = clampToDayWindow(snapToSlot(state.originEndMinute + deltaMinutes))
  const endMinute = Math.max(rawEnd, state.originStartMinute + MIN_SHIFT_MINUTES)
  draftRange.value = { startMinute: state.originStartMinute, endMinute }
}

function endDrag(): void {
  const state = drag.value
  if (!state) return

  const range = draftRange.value
  if (state.captureTarget && typeof state.captureTarget.releasePointerCapture === 'function') {
    state.captureTarget.releasePointerCapture(state.pointerId)
  }
  drag.value = null
  draftRange.value = null

  if (!range) return
  emit('resize', { id: props.shift.id, ...range })
}

function cancelDrag(): void {
  drag.value = null
  draftRange.value = null
}

function handleContextMenu(): void {
  if (props.disabled) return
  emit('remove', props.shift.id)
}

function handleKeydown(event: KeyboardEvent): void {
  if (props.disabled) return
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    emit('remove', props.shift.id)
    return
  }

  const duration = props.shift.endMinute - props.shift.startMinute
  let range: MinuteRange | null = null

  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    const delta = event.key === 'ArrowLeft' ? -SLOT_MINUTES : SLOT_MINUTES

    if (event.shiftKey) {
      const endMinute = Math.max(
        props.shift.startMinute + MIN_SHIFT_MINUTES,
        clampToDayWindow(snapToSlot(props.shift.endMinute + delta)),
      )
      range = { startMinute: props.shift.startMinute, endMinute }
    } else {
      const startMinute = Math.min(
        Math.max(snapToSlot(props.shift.startMinute + delta), DAY_START_MINUTE),
        DAY_END_MINUTE - duration,
      )
      range = { startMinute, endMinute: startMinute + duration }
    }
  } else if (event.key === 'Home' || event.key === 'End') {
    const startMinute = event.key === 'Home' ? DAY_START_MINUTE : DAY_END_MINUTE - duration
    range = { startMinute, endMinute: startMinute + duration }
  }

  if (!range) return

  event.preventDefault()
  if (range.startMinute === props.shift.startMinute && range.endMinute === props.shift.endMinute) {
    return
  }
  emit('resize', { id: props.shift.id, ...range })
}
</script>

<style scoped>
.shift-bar {
  position: absolute;
  top: var(--grid-bar-inset);
  bottom: var(--grid-bar-inset);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5rem;
  border: 1px solid var(--color-accent);
  border-left-width: 4px;
  border-radius: var(--radius-sm);
  background: var(--color-shift-bar);
  color: var(--color-text);
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.shift-bar:active {
  cursor: grabbing;
}

.shift-bar--disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.shift-bar--selected {
  box-shadow: 0 0 0 2px var(--color-accent);
}

.shift-bar--manager {
  border-color: var(--color-duty-manager);
}

.shift-bar--head-manager {
  border-color: var(--color-duty-head-manager);
}

.shift-bar--assistant {
  border-color: var(--color-duty-assistant);
}

.shift-bar--employee {
  border-color: var(--color-duty-employee);
}

.shift-bar:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.shift-bar__label {
  pointer-events: none;
}

.shift-bar__handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 0.5rem;
  background: transparent;
  cursor: ew-resize;
}

.shift-bar__handle--start {
  left: 0;
}

.shift-bar__handle--end {
  right: 0;
}
</style>
