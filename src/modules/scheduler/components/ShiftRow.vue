<template>
  <div class="shift-row" :data-test="`shift-row-${row.member.id}`">
    <div
      class="shift-row__name"
      :class="`shift-row__name--${dutyModifier(row.member.duty)}`"
      :title="row.member.name"
    >
      <button
        type="button"
        class="shift-row__name-toggle"
        :class="{ 'shift-row__name-toggle--off': row.isOff }"
        :title="row.member.name"
        :aria-pressed="row.isOff"
        :aria-label="toggleAriaLabel"
        data-test="shift-row-name-toggle"
        @click="emit('toggleOff', row.member.id)"
      >
        {{ displayName }}
      </button>
      <span
        v-tooltip.top="
          t('shiftRow.daysOffTooltip', {
            count: row.daysOffCount,
            min: MIN_DAYS_OFF,
            name: row.member.name,
          })
        "
        class="shift-row__day-off-chip"
        :class="{ 'shift-row__day-off-chip--full': row.daysOffCount >= MIN_DAYS_OFF }"
        data-test="day-off-count"
      >
        {{ row.daysOffCount }}/{{ MIN_DAYS_OFF }}
      </span>
    </div>

    <div class="shift-row__hours" data-test="shift-row-hours">
      {{ formatHours(row.dailyHours) }}
    </div>

    <div
      ref="track"
      class="shift-row__track"
      :class="{ 'shift-row__track--disabled': row.isOff }"
      data-test="shift-track"
      :tabindex="row.isOff ? -1 : 0"
      :aria-disabled="row.isOff"
      :aria-label="t('shiftRow.trackAria', { name: row.member.name })"
      @pointerdown="startSelection"
      @pointermove="updateSelection"
      @pointerup="finishSelection"
      @pointercancel="cancelSelection"
      @keydown="handleKeydown"
    >
      <div class="shift-row__grid" aria-hidden="true">
        <span
          v-for="slot in slots"
          :key="slot.index"
          class="shift-row__grid-slot"
          :class="{ 'shift-row__grid-slot--next-day': slot.isNextDay }"
        />
      </div>

      <ShiftBar
        v-for="bar in row.bars"
        :key="bar.id"
        :shift="bar"
        :member-name="row.member.name"
        :duty="row.member.duty"
        :limits="limits"
        :disabled="row.isOff"
        @resize="emit('resize', $event)"
        @remove="emit('remove', $event)"
      />

      <div v-if="draft" class="shift-row__draft" :style="draftStyle" data-test="shift-draft" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DaySlot, MinuteRange, SchedulingWindow } from '@/shared/utils/shifts'
import {
  DEFAULT_SHIFT_MINUTES,
  clampToDayWindow,
  snapToSlot,
} from '@/shared/utils/shifts'
import type { DayRow, ShiftRangeInput, ShiftResizeInput } from '@/modules/scheduler/types'
import {
  firstFreeStartMinute,
  minuteToPercent,
  offsetXToMinute,
  rangeToPercentWidth,
  windowFromSlots,
} from '@/modules/scheduler/utils/grid'
import ShiftBar from '@/modules/scheduler/components/ShiftBar.vue'
import { useI18n } from '@/shared/i18n'
import { dutyModifier } from '@/shared/utils/employee'
import { formatHours } from '@/modules/scheduler/utils/hours'
import { MIN_DAYS_OFF } from '@/modules/scheduler/utils/off'

const props = defineProps<{
  row: DayRow
  slots: DaySlot[]
}>()

const { t } = useI18n()

const limits = computed<SchedulingWindow>(() => windowFromSlots(props.slots))

const MAX_NAME_LENGTH = 20
const displayName = computed(() => {
  const name = props.row.member.name
  return name.length > MAX_NAME_LENGTH ? `${name.slice(0, MAX_NAME_LENGTH)}…` : name
})

const emit = defineEmits<{
  create: [input: ShiftRangeInput]
  resize: [input: ShiftResizeInput]
  remove: [id: string]
  toggleOff: [memberId: string]
}>()

const toggleAriaLabel = computed(() =>
  props.row.isOff
    ? t('shiftRow.markOn', { name: props.row.member.name })
    : t('shiftRow.markOff', { name: props.row.member.name }),
)

const track = ref<HTMLElement | null>(null)
const dragging = ref(false)
const moved = ref(false)
const anchorMinute = ref(limits.value.startMinute)
const draft = ref<MinuteRange | null>(null)

const draftStyle = computed(() => {
  if (!draft.value) return {}
  return {
    left: `${minuteToPercent(draft.value.startMinute, limits.value)}%`,
    width: `${rangeToPercentWidth(draft.value.startMinute, draft.value.endMinute, limits.value)}%`,
  }
})

function minuteAt(clientX: number): number | null {
  const rect = track.value?.getBoundingClientRect()
  if (!rect || !rect.width) return null
  return offsetXToMinute(clientX - rect.left, rect.width, limits.value)
}

function capturePointer(event: PointerEvent): void {
  const target = event.currentTarget
  if (target instanceof Element && typeof target.setPointerCapture === 'function') {
    target.setPointerCapture(event.pointerId)
  }
}

function releasePointer(event: PointerEvent): void {
  const target = event.currentTarget
  if (target instanceof Element && typeof target.releasePointerCapture === 'function') {
    target.releasePointerCapture(event.pointerId)
  }
}

function startSelection(event: PointerEvent): void {
  if (props.row.isOff) return
  if (event.button > 0) return

  const minute = minuteAt(event.clientX)
  if (minute === null) return

  const anchor = clampToDayWindow(snapToSlot(minute, limits.value.slotMinutes), limits.value)
  if (limits.value.endMinute - anchor < limits.value.slotMinutes) return

  anchorMinute.value = anchor
  moved.value = false
  draft.value = {
    startMinute: anchor,
    endMinute: Math.min(anchor + DEFAULT_SHIFT_MINUTES, limits.value.endMinute),
  }
  dragging.value = true
  capturePointer(event)
}

function updateSelection(event: PointerEvent): void {
  if (!dragging.value) return

  const minute = minuteAt(event.clientX)
  if (minute === null) return

  const current = clampToDayWindow(snapToSlot(minute, limits.value.slotMinutes), limits.value)
  if (current !== anchorMinute.value) moved.value = true
  if (!moved.value) return

  const startMinute = Math.min(anchorMinute.value, current)
  const endMinute = Math.max(anchorMinute.value, current)

  draft.value =
    endMinute - startMinute >= limits.value.slotMinutes
      ? { startMinute, endMinute }
      : {
          startMinute: anchorMinute.value,
          endMinute: Math.min(
            anchorMinute.value + limits.value.slotMinutes,
            limits.value.endMinute,
          ),
        }
}

function finishSelection(event: PointerEvent): void {
  if (!dragging.value) return

  releasePointer(event)
  const wasMoved = moved.value
  const anchor = anchorMinute.value
  const range: MinuteRange | null = wasMoved
    ? draft.value
    : {
        startMinute: anchor,
        endMinute: Math.min(anchor + DEFAULT_SHIFT_MINUTES, limits.value.endMinute),
      }

  dragging.value = false
  moved.value = false
  draft.value = null

  if (!range || range.endMinute - range.startMinute < limits.value.slotMinutes) return
  emit('create', { memberId: props.row.member.id, ...range })
}

function cancelSelection(): void {
  dragging.value = false
  moved.value = false
  draft.value = null
}

function handleKeydown(event: KeyboardEvent): void {
  if (props.row.isOff) return
  if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return

  event.preventDefault()
  const startMinute = firstFreeStartMinute(props.row.bars, limits.value)
  const endMinute = Math.min(startMinute + DEFAULT_SHIFT_MINUTES, limits.value.endMinute)
  if (endMinute - startMinute < limits.value.slotMinutes) return

  emit('create', {
    memberId: props.row.member.id,
    startMinute,
    endMinute,
  })
}
</script>

<style scoped>
.shift-row {
  display: flex;
  border-top: 1px solid var(--color-border);
}

.shift-row__name {
  position: sticky;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: var(--grid-name-width);
  min-width: var(--grid-name-width);
  padding: 0 0.75rem;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
}

.shift-row__name-toggle {
  flex: 0 1 auto;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: inherit;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
}

.shift-row__name-toggle:hover {
  text-decoration: underline;
}

.shift-row__name-toggle:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.shift-row__name-toggle--off {
  color: var(--color-muted);
  text-decoration: line-through;
}

.shift-row__day-off-chip {
  flex-shrink: 0;
  padding: 0.05rem 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-inactive-bg);
  color: var(--color-muted);
  font-size: 0.7rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}

.shift-row__day-off-chip--full {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.shift-row__name--manager {
  color: var(--color-duty-manager);
}

.shift-row__name--head-manager {
  color: var(--color-duty-head-manager);
}

.shift-row__name--assistant {
  color: var(--color-duty-assistant);
}

.shift-row__name--employee {
  color: var(--color-duty-employee);
}

.shift-row__hours {
  position: sticky;
  left: var(--grid-name-width);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--grid-hours-width);
  min-width: var(--grid-hours-width);
  padding: 0 0.5rem;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.shift-row__track {
  position: relative;
  flex: 1;
  min-width: 0;
  width: auto;
  height: var(--grid-row-height);
  background: var(--color-surface);
  cursor: crosshair;
  touch-action: none;
  overflow: hidden;
}

.shift-row__track:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.shift-row__track--disabled {
  background: var(--color-inactive-bg);
  cursor: not-allowed;
  opacity: 0.6;
}

.shift-row__grid {
  position: absolute;
  inset: 0;
  display: flex;
  pointer-events: none;
}

.shift-row__grid-slot {
  flex: 1 1 0;
  min-width: 0;
  border-right: 1px solid var(--color-border);
}

.shift-row__grid-slot--next-day {
  background: var(--color-inactive-bg);
}

.shift-row__draft {
  position: absolute;
  top: var(--grid-bar-inset);
  bottom: var(--grid-bar-inset);
  box-sizing: border-box;
  border: 1px dashed var(--color-accent);
  border-radius: var(--radius-sm);
  background: var(--color-shift-bar);
  pointer-events: none;
}

@media screen and (max-height: 899px) {
  .shift-row__name {
    gap: 0.25rem;
    padding: 0 0.5rem;
  }

  .shift-row__hours {
    padding: 0 0.3rem;
    font-size: 0.72rem;
  }

  .shift-row__day-off-chip {
    padding: 0.02rem 0.3rem;
    font-size: 0.62rem;
  }
}
</style>
