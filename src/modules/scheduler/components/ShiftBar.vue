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
    :title="isPhone ? t('shiftBar.removeHintPhone') : t('shiftBar.removeHint')"
    :aria-disabled="disabled"
    :aria-label="isPhone ? touchAriaLabel : ariaLabel"
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
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Duty, Shift } from '@/types'
import type { ShiftMoveDrag, ShiftResizeInput } from '@/modules/scheduler/types'
import type { MinuteRange, SchedulingWindow } from '@/shared/utils/shifts'
import {
  DEFAULT_SCHEDULING_WINDOW,
  clampToDayWindow,
  formatExtendedMinutes,
  snapToSlot,
} from '@/shared/utils/shifts'
import { useI18n } from '@/shared/i18n'
import { useIsPhone } from '@/shared/composables/useIsPhone'
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
    limits?: SchedulingWindow
    selected?: boolean
    disabled?: boolean
    panActive?: boolean
  }>(),
  {
    disabled: false,
    panActive: false,
    limits: () => ({ ...DEFAULT_SCHEDULING_WINDOW }),
  },
)

const emit = defineEmits<{
  resize: [input: ShiftResizeInput]
  remove: [id: string]
  moveStart: [id: string]
  moveDrag: [payload: ShiftMoveDrag]
  moveEnd: [payload: ShiftMoveDrag]
  moveCancel: []
  longPress: [id: string]
}>()

type DragMode = 'move' | 'resize-start' | 'resize-end'

interface DragState {
  mode: DragMode
  originStartMinute: number
  originEndMinute: number
  startClientX: number
  startClientY: number
  captureTarget: Element | null
  trackElement: Element | null
  pointerId: number
}

const { t } = useI18n()
const isPhone = useIsPhone()

const LONG_PRESS_MS = 500
const LONG_PRESS_MOVE_TOLERANCE = 8

const bar = ref<HTMLElement | null>(null)
const drag = ref<DragState | null>(null)
const draftRange = ref<MinuteRange | null>(null)
let longPressTimer: number | null = null

function clearLongPress(): void {
  if (longPressTimer !== null) {
    window.clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function fireLongPress(): void {
  longPressTimer = null
  if (props.disabled) return
  cancelDrag()
  emit('longPress', props.shift.id)
}

watch(
  () => props.panActive,
  (active) => {
    if (!active) return
    clearLongPress()
    cancelDrag()
  },
)

onBeforeUnmount(clearLongPress)

const displayedRange = computed<MinuteRange>(() => ({
  startMinute: draftRange.value?.startMinute ?? props.shift.startMinute,
  endMinute: draftRange.value?.endMinute ?? props.shift.endMinute,
}))

const barStyle = computed(() => ({
  left: `${minuteToPercent(displayedRange.value.startMinute, props.limits)}%`,
  width: `${rangeToPercentWidth(
    displayedRange.value.startMinute,
    displayedRange.value.endMinute,
    props.limits,
  )}%`,
}))

const ariaLabel = computed(() =>
  t('shiftBar.aria', {
    name: props.memberName,
    start: formatExtendedMinutes(displayedRange.value.startMinute),
    end: formatExtendedMinutes(displayedRange.value.endMinute),
  }),
)

const touchAriaLabel = computed(() =>
  t('shiftBar.ariaTouch', {
    name: props.memberName,
    start: formatExtendedMinutes(displayedRange.value.startMinute),
    end: formatExtendedMinutes(displayedRange.value.endMinute),
  }),
)

function beginDrag(mode: DragMode, event: PointerEvent): void {
  if (props.disabled) return
  if (props.panActive) return
  if (event.pointerType === 'touch' && !event.isPrimary) return
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
    startClientY: event.clientY,
    captureTarget,
    trackElement: bar.value?.parentElement ?? null,
    pointerId: event.pointerId,
  }
  draftRange.value = {
    startMinute: props.shift.startMinute,
    endMinute: props.shift.endMinute,
  }

  if (mode === 'move') emit('moveStart', props.shift.id)

  if (isPhone.value && event.pointerType === 'touch' && mode === 'move') {
    clearLongPress()
    longPressTimer = window.setTimeout(fireLongPress, LONG_PRESS_MS)
  }
}

function updateDrag(event: PointerEvent): void {
  const state = drag.value
  if (!state) return

  if (longPressTimer !== null) {
    const moved =
      Math.abs(event.clientX - state.startClientX) > LONG_PRESS_MOVE_TOLERANCE ||
      Math.abs(event.clientY - state.startClientY) > LONG_PRESS_MOVE_TOLERANCE
    if (moved) clearLongPress()
  }

  const trackWidth = state.trackElement?.getBoundingClientRect().width ?? 0
  if (!trackWidth) return

  const deltaMinutes = minuteDeltaFromPixels(
    event.clientX - state.startClientX,
    trackWidth,
    props.limits,
  )
  const duration = state.originEndMinute - state.originStartMinute
  const slot = props.limits.slotMinutes

  if (state.mode === 'move') {
    const rawStart = snapToSlot(state.originStartMinute + deltaMinutes, slot)
    const maxStart = Math.max(props.limits.startMinute, props.limits.endMinute - duration)
    const startMinute = Math.min(Math.max(rawStart, props.limits.startMinute), maxStart)
    draftRange.value = { startMinute, endMinute: startMinute + duration }
    emit('moveDrag', {
      id: props.shift.id,
      ...draftRange.value,
      clientY: event.clientY,
    })
    return
  }

  if (state.mode === 'resize-start') {
    const rawStart = clampToDayWindow(
      snapToSlot(state.originStartMinute + deltaMinutes, slot),
      props.limits,
    )
    const startMinute = Math.max(
      Math.min(rawStart, state.originEndMinute - slot),
      props.limits.startMinute,
    )
    if (startMinute >= state.originEndMinute) return
    draftRange.value = { startMinute, endMinute: state.originEndMinute }
    return
  }

  const rawEnd = clampToDayWindow(
    snapToSlot(state.originEndMinute + deltaMinutes, slot),
    props.limits,
  )
  const endMinute = Math.max(rawEnd, state.originStartMinute + slot)
  draftRange.value = { startMinute: state.originStartMinute, endMinute }
}

function endDrag(event: PointerEvent): void {
  clearLongPress()
  const state = drag.value
  if (!state) return

  const range = draftRange.value
  if (state.captureTarget && typeof state.captureTarget.releasePointerCapture === 'function') {
    state.captureTarget.releasePointerCapture(state.pointerId)
  }
  drag.value = null
  draftRange.value = null

  if (!range) return
  if (state.mode === 'move') {
    emit('moveEnd', { id: props.shift.id, ...range, clientY: event.clientY })
    return
  }
  emit('resize', { id: props.shift.id, ...range })
}

function cancelDrag(): void {
  clearLongPress()
  const wasMoving = drag.value?.mode === 'move'
  drag.value = null
  draftRange.value = null
  if (wasMoving) emit('moveCancel')
}

function handleContextMenu(): void {
  if (props.disabled) return
  if (isPhone.value) return
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
  const slot = props.limits.slotMinutes
  let range: MinuteRange | null = null

  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    const delta = event.key === 'ArrowLeft' ? -slot : slot

    if (event.shiftKey) {
      const endMinute = Math.max(
        props.shift.startMinute + slot,
        clampToDayWindow(snapToSlot(props.shift.endMinute + delta, slot), props.limits),
      )
      range = { startMinute: props.shift.startMinute, endMinute }
    } else {
      const maxStart = Math.max(props.limits.startMinute, props.limits.endMinute - duration)
      const startMinute = Math.min(
        Math.max(snapToSlot(props.shift.startMinute + delta, slot), props.limits.startMinute),
        maxStart,
      )
      range = { startMinute, endMinute: startMinute + duration }
    }
  } else if (event.key === 'Home' || event.key === 'End') {
    const startMinute =
      event.key === 'Home'
        ? props.limits.startMinute
        : Math.max(props.limits.startMinute, props.limits.endMinute - duration)
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
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
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

@media screen and (max-height: 899px) {
  .shift-bar {
    padding: 0 0.35rem;
    border-left-width: 3px;
    font-size: 0.68rem;
  }

  .shift-bar__handle {
    width: 0.4rem;
  }
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .shift-bar {
    padding: 0 0.3rem;
    font-size: 0.68rem;
  }

  .shift-bar__handle {
    width: 0.85rem;
  }

  .shift-bar__handle--start {
    left: -0.15rem;
  }

  .shift-bar__handle--end {
    right: -0.15rem;
  }
}
</style>
