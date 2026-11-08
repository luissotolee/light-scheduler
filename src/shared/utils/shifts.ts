const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export const DAY_START_MINUTE = 540
export const DAY_END_MINUTE = 1500
export const SLOT_MINUTES = 30
export const MIN_SHIFT_MINUTES = 30
export const DEFAULT_SHIFT_MINUTES = 180

const MINUTES_PER_DAY = 1440

export interface MinuteRange {
  startMinute: number
  endMinute: number
}

export interface MergedRangesResult {
  range: MinuteRange
  mergedIndexes: number[]
}

export interface DaySlot {
  index: number
  startMinute: number
  endMinute: number
  label: string
  hourLabel: string
  minuteLabel: string
  isNextDay: boolean
}

export function parseTimeToMinutes(hhmm: string): number | null {
  const match = TIME_RE.exec(hhmm)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function formatMinutesToHhmm(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export function shiftsOverlap(a: MinuteRange, b: MinuteRange): boolean {
  return a.startMinute < b.endMinute && b.startMinute < a.endMinute
}

export function mergeOverlappingRanges(
  candidate: MinuteRange,
  others: readonly MinuteRange[],
): MergedRangesResult {
  let startMinute = candidate.startMinute
  let endMinute = candidate.endMinute
  const mergedIndexes: number[] = []
  let extended = true

  while (extended) {
    extended = false
    others.forEach((other, index) => {
      if (mergedIndexes.includes(index)) return
      if (startMinute < other.endMinute && other.startMinute < endMinute) {
        startMinute = Math.min(startMinute, other.startMinute)
        endMinute = Math.max(endMinute, other.endMinute)
        mergedIndexes.push(index)
        extended = true
      }
    })
  }

  mergedIndexes.sort((a, b) => a - b)

  return { range: { startMinute, endMinute }, mergedIndexes }
}

export function toShiftMinutes(start: string, end: string): MinuteRange | null {
  const startMinute = parseTimeToMinutes(start)
  const endMinute = parseTimeToMinutes(end)
  if (startMinute === null || endMinute === null) return null
  if (startMinute >= endMinute) return null
  return { startMinute, endMinute }
}

export function isNextDayMinute(minute: number): boolean {
  return minute >= MINUTES_PER_DAY
}

export function formatExtendedMinutes(minute: number): string {
  return formatMinutesToHhmm(minute % MINUTES_PER_DAY)
}

export function buildDaySlots(): DaySlot[] {
  const slots: DaySlot[] = []

  for (
    let startMinute = DAY_START_MINUTE;
    startMinute < DAY_END_MINUTE;
    startMinute += SLOT_MINUTES
  ) {
    const label = formatExtendedMinutes(startMinute)
    slots.push({
      index: slots.length,
      startMinute,
      endMinute: startMinute + SLOT_MINUTES,
      label,
      hourLabel: label.slice(0, 2),
      minuteLabel: label.slice(3),
      isNextDay: isNextDayMinute(startMinute),
    })
  }

  return slots
}

export function snapToSlot(minute: number): number {
  return Math.round(minute / SLOT_MINUTES) * SLOT_MINUTES
}

export function clampToDayWindow(minute: number): number {
  return Math.min(Math.max(minute, DAY_START_MINUTE), DAY_END_MINUTE)
}

export function normalizeGridRange(start: number, end: number): MinuteRange | null {
  const first = clampToDayWindow(snapToSlot(start))
  const second = clampToDayWindow(snapToSlot(end))
  const startMinute = Math.min(first, second)
  const endMinute = Math.max(first, second)

  if (endMinute - startMinute < MIN_SHIFT_MINUTES) return null
  return { startMinute, endMinute }
}
