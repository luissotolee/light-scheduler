<template>
  <div class="shift-grid" :style="gridStyle" data-test="shift-grid">
    <div
      ref="scroller"
      class="shift-grid__scroller"
      :class="{ 'shift-grid__scroller--panning': panning }"
      :role="isPhone ? 'region' : undefined"
      :aria-label="isPhone ? t('scheduler.gridScrollAria') : undefined"
      data-test="shift-grid-scroller"
    >
      <div class="shift-grid__header" aria-hidden="true">
        <div class="shift-grid__corner">
          <i v-if="isPhone" class="pi pi-user" aria-hidden="true" />
          <span :class="{ 'visually-hidden': isPhone }">{{ t('shiftGrid.employee') }}</span>
        </div>
      <div class="shift-grid__hours" data-test="shift-grid-hours">{{ t('shiftGrid.hours') }}</div>
      <div class="shift-grid__time-header">
        <div class="shift-grid__time-row shift-grid__time-row--hours">
          <span
            v-for="hour in hourGroups"
            :key="hour.key"
            class="shift-grid__time-cell"
            :class="{ 'shift-grid__time-cell--next-day': hour.isNextDay }"
            :style="hourCellStyle(hour.span)"
          >
            <span>{{ hour.label }}</span>
            <span
              v-if="showHeadcount"
              class="shift-grid__headcount"
              :class="{ 'shift-grid__headcount--empty': hour.count === 0 }"
              :title="headcountTitle(hour)"
              :aria-label="headcountTitle(hour)"
              data-test="hour-headcount"
            >
              {{ hour.count }}
            </span>
          </span>
        </div>
        <div class="shift-grid__time-row shift-grid__time-row--minutes">
          <span
            v-for="slot in slots"
            :key="slot.index"
            class="shift-grid__time-cell"
            :class="{ 'shift-grid__time-cell--next-day': slot.isNextDay }"
            :style="slotCellStyle()"
          >
            {{ slot.minuteLabel }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="rows.length > 0" ref="body" class="shift-grid__body">
      <ShiftRow
        v-for="row in rows"
        :key="row.member.id"
        :row="row"
        :slots="slots"
        :drop-target="dropTargetMemberId === row.member.id"
        :pan-active="panning"
        @create="emit('create', $event)"
        @resize="emit('resize', $event)"
        @remove="emit('remove', $event)"
        @toggle-off="emit('toggleOff', $event)"
        @move-start="handleMoveStart"
        @move-drag="handleMoveDrag"
        @move-end="handleMoveEnd"
        @move-cancel="resetDrag"
      />
    </div>

      <p v-else class="shift-grid__empty">{{ t('shiftGrid.empty') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DaySlot } from '@/shared/utils/shifts'
import type {
  DayRow,
  ShiftMoveDrag,
  ShiftMoveInput,
  ShiftRangeInput,
  ShiftResizeInput,
} from '@/modules/scheduler/types'
import ShiftRow from '@/modules/scheduler/components/ShiftRow.vue'
import { buildHourlyHeadcounts, type HourHeadcount } from '@/modules/scheduler/utils/headcount'
import { useI18n } from '@/shared/i18n'
import { useIsPhone } from '@/shared/composables/useIsPhone'
import { useTwoFingerPan } from '@/shared/composables/useTwoFingerPan'

const props = defineProps<{
  rows: DayRow[]
  slots: DaySlot[]
  showHeadcount?: boolean
}>()

const emit = defineEmits<{
  create: [input: ShiftRangeInput]
  resize: [input: ShiftResizeInput]
  remove: [id: string]
  toggleOff: [memberId: string]
  move: [input: ShiftMoveInput]
}>()

const { t, tc } = useI18n()
const isPhone = useIsPhone()

const scroller = ref<HTMLElement | null>(null)
const { panning } = useTwoFingerPan({
  element: scroller,
  enabled: isPhone,
  onPanStart: () => resetDrag(),
})

const gridStyle = computed<Record<string, string>>(() => ({
  '--grid-mobile-content-width': `max(32rem, ${props.slots.length * 1.5}rem)`,
}))

const hourGroups = computed(() => buildHourlyHeadcounts(props.rows, props.slots))

function headcountTitle(hour: HourHeadcount): string {
  return tc(
    'shiftGrid.headcountTooltipOne',
    'shiftGrid.headcountTooltipMany',
    hour.count,
    { count: hour.count, hour: hour.label },
  )
}

const slotWidthPercent = computed(() => 100 / props.slots.length)

function hourCellStyle(span: number): Record<string, string> {
  return { flex: `0 0 ${span * slotWidthPercent.value}%` }
}

function slotCellStyle(): Record<string, string> {
  return { flex: `0 0 ${slotWidthPercent.value}%` }
}

const body = ref<HTMLElement | null>(null)
const dragSourceMemberId = ref<string | null>(null)
const dropTargetMemberId = ref<string | null>(null)
const dropBlocked = ref(false)

interface RowHit {
  memberId: string
  disabled: boolean
}

function memberIdForShift(shiftId: string): string | null {
  for (const row of props.rows) {
    if (row.bars.some((bar) => bar.id === shiftId)) return row.member.id
  }
  return null
}

function rowAt(clientY: number): RowHit | null {
  const container = body.value
  if (!container) return null
  const tracks = container.querySelectorAll<HTMLElement>('[data-row-member-id]')
  for (const track of tracks) {
    const rect = track.getBoundingClientRect()
    if (clientY >= rect.top && clientY < rect.bottom) {
      return {
        memberId: track.dataset.rowMemberId ?? '',
        disabled: track.dataset.rowDisabled === 'true',
      }
    }
  }
  return null
}

function handleMoveStart(shiftId: string): void {
  dragSourceMemberId.value = memberIdForShift(shiftId)
  dropTargetMemberId.value = null
  dropBlocked.value = false
}

function updateDropTarget(clientY: number): void {
  const hit = rowAt(clientY)
  dropTargetMemberId.value = null
  dropBlocked.value = false

  if (!hit) return
  if (hit.disabled) {
    dropBlocked.value = true
    return
  }
  if (hit.memberId === dragSourceMemberId.value) return
  dropTargetMemberId.value = hit.memberId
}

function handleMoveDrag(payload: ShiftMoveDrag): void {
  updateDropTarget(payload.clientY)
}

function handleMoveEnd(payload: ShiftMoveDrag): void {
  updateDropTarget(payload.clientY)
  const blocked = dropBlocked.value
  const target = dropTargetMemberId.value
  resetDrag()

  if (blocked) return

  if (target) {
    emit('move', {
      id: payload.id,
      memberId: target,
      startMinute: payload.startMinute,
      endMinute: payload.endMinute,
    })
    return
  }

  emit('resize', {
    id: payload.id,
    startMinute: payload.startMinute,
    endMinute: payload.endMinute,
  })
}

function resetDrag(): void {
  dragSourceMemberId.value = null
  dropTargetMemberId.value = null
  dropBlocked.value = false
}
</script>

<style scoped>
.shift-grid {
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow: hidden;
}

.shift-grid__header {
  display: grid;
  grid-template-columns: var(--grid-name-width) var(--grid-hours-width) 1fr;
  grid-template-rows: repeat(2, 1fr);
  height: calc(var(--grid-header-height) * 2);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.shift-grid__corner {
  grid-row: 1 / 3;
  position: sticky;
  left: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  width: var(--grid-name-width);
  min-width: var(--grid-name-width);
  padding: 0 0.75rem;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.shift-grid__hours {
  grid-row: 1 / 3;
  position: sticky;
  left: var(--grid-name-width);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--grid-hours-width);
  min-width: var(--grid-hours-width);
  padding: 0 0.5rem;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.shift-grid__time-header {
  grid-column: 3;
  grid-row: 1 / 3;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.shift-grid__time-row {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
}

.shift-grid__time-row:first-child {
  border-bottom: 1px solid var(--color-border);
}

.shift-grid__time-cell {
  flex: 0 0 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  padding: 0 0.1rem;
  border-right: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
}

.shift-grid__headcount {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1rem;
  padding: 0 0.2rem;
  border: 1px solid var(--color-accent);
  border-radius: 999px;
  color: var(--color-accent);
  font-size: 0.58rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.3;
}

.shift-grid__headcount--empty {
  border-color: var(--color-border);
  color: var(--color-muted);
}

.shift-grid__time-cell--next-day {
  background: var(--color-inactive-bg);
  color: var(--color-accent);
}

.shift-grid__empty {
  margin: 0;
  padding: 1.25rem;
  color: var(--color-muted);
}

@media screen and (max-height: 899px) {
  .shift-grid__corner,
  .shift-grid__hours {
    font-size: 0.65rem;
  }

  .shift-grid__time-cell {
    font-size: 0.6rem;
  }

  .shift-grid__headcount {
    min-width: 0.9rem;
    padding: 0 0.15rem;
    font-size: 0.52rem;
  }

  .shift-grid__empty {
    padding: 0.75rem;
  }
}

@media (max-width: 640px), (max-height: 480px) and (max-width: 1024px) {
  .shift-grid {
    --grid-row-height: 2.5rem;
    --grid-header-height: 2.25rem;
    --grid-name-width: 4.25rem;
    --grid-hours-width: 3rem;
  }

  .shift-grid__scroller {
    overflow: auto;
    max-height: 60dvh;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    touch-action: auto;
  }

  .shift-grid__scroller--panning {
    cursor: grabbing;
  }

  .shift-grid__header {
    position: sticky;
    top: 0;
    z-index: 6;
  }

  .shift-grid__header,
  .shift-grid__body {
    min-width: var(--grid-mobile-content-width, 100%);
  }

  .shift-grid__corner {
    justify-content: center;
    padding: 0;
    font-size: 0.85rem;
  }

  .shift-grid__hours {
    padding: 0;
    font-size: 0.65rem;
  }

  .shift-grid__time-cell {
    font-size: 0.62rem;
  }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
