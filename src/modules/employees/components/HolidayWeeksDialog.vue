<template>
  <Dialog
    :visible="visible"
    modal
    :header="title"
    class="holiday-dialog"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="holiday-dialog__body">
      <div class="holiday-dialog__year">
        <Button
          v-tooltip.top="t('holidays.previousYear')"
          type="button"
          icon="pi pi-chevron-left"
          size="small"
          text
          rounded
          :aria-label="t('holidays.previousYear')"
          data-test="previous-year"
          @click="changeYear(-1)"
        />
        <span class="holiday-dialog__year-label" data-test="current-year">{{ year }}</span>
        <Button
          v-tooltip.top="t('holidays.nextYear')"
          type="button"
          icon="pi pi-chevron-right"
          size="small"
          text
          rounded
          :aria-label="t('holidays.nextYear')"
          data-test="next-year"
          @click="changeYear(1)"
        />
      </div>

      <p class="holiday-dialog__counter" data-test="counter">
        {{ t('holidays.counter', { count, max: MAX_HOLIDAY_WEEKS }) }}
      </p>

      <div class="holiday-dialog__grid" role="group" :aria-label="t('holidays.group')">
        <button
          v-for="option in weeks"
          :key="option.week"
          type="button"
          class="holiday-dialog__week"
          :class="{ 'holiday-dialog__week--selected': isSelected(option) }"
          :aria-pressed="isSelected(option)"
          :disabled="isDisabled(option)"
          :data-test="`week-${option.week}`"
          @click="toggle(option)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="holiday-dialog__actions">
        <Button
          type="button"
          :label="t('common.cancel')"
          severity="secondary"
          data-test="cancel-holidays"
          @click="emit('update:visible', false)"
        />
        <Button type="button" :label="t('common.save')" data-test="save-holidays" @click="save" />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import type { HolidayWeek, HolidayWeekOption } from '@/types'
import { useI18n } from '@/shared/i18n'
import { getIsoWeek, getIsoWeeksForYear } from '@/shared/utils/calendar'
import { MAX_HOLIDAY_WEEKS, holidayKey, normalizeHolidays } from '@/shared/utils/employee'

const props = defineProps<{
  visible: boolean
  memberName: string
  selected: HolidayWeek[]
  initialYear?: number
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  save: [holidays: HolidayWeek[]]
}>()

const { t, locale } = useI18n()

const year = ref(getIsoWeek(new Date()).year)
const selectedKeys = ref<Set<string>>(new Set())

const weeks = computed(() => getIsoWeeksForYear(year.value, locale.value))
const count = computed(() => selectedKeys.value.size)
const title = computed(() => t('holidays.title', { name: props.memberName }))

function reset(): void {
  year.value = props.initialYear ?? props.selected[0]?.year ?? getIsoWeek(new Date()).year
  selectedKeys.value = new Set(props.selected.map(holidayKey))
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) reset()
  },
  { immediate: true },
)

function isSelected(option: HolidayWeekOption): boolean {
  return selectedKeys.value.has(holidayKey(option))
}

function isDisabled(option: HolidayWeekOption): boolean {
  return !isSelected(option) && count.value >= MAX_HOLIDAY_WEEKS
}

function toggle(option: HolidayWeekOption): void {
  const key = holidayKey(option)
  const next = new Set(selectedKeys.value)

  if (next.has(key)) {
    next.delete(key)
  } else if (next.size < MAX_HOLIDAY_WEEKS) {
    next.add(key)
  }

  selectedKeys.value = next
}

function changeYear(delta: number): void {
  year.value += delta
}

function parseKey(key: string): HolidayWeek {
  const [yearPart, weekPart] = key.split('-W')
  return { year: Number(yearPart), week: Number(weekPart) }
}

function save(): void {
  emit('save', normalizeHolidays([...selectedKeys.value].map(parseKey)))
  emit('update:visible', false)
}
</script>

<style scoped>
.holiday-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: min(48rem, 92vw);
}

.holiday-dialog__year {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.holiday-dialog__year-label {
  font-weight: 600;
}

.holiday-dialog__week {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.holiday-dialog__week:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.holiday-dialog__week:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.holiday-dialog__counter {
  margin: 0;
  color: var(--color-muted);
}

.holiday-dialog__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  max-height: 28rem;
  overflow-y: auto;
}

.holiday-dialog__week {
  text-align: left;
  font-size: 0.85rem;
}

.holiday-dialog__week[aria-pressed='true'] {
  border-color: var(--color-accent);
  background: var(--color-surface-alt);
  color: var(--color-accent);
}

.holiday-dialog__week:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.holiday-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 56rem) {
  .holiday-dialog__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 36rem) {
  .holiday-dialog__grid {
    grid-template-columns: 1fr;
  }
}
</style>
