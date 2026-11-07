const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export interface MinuteRange {
  startMinute: number
  endMinute: number
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

export function toShiftMinutes(start: string, end: string): MinuteRange | null {
  const startMinute = parseTimeToMinutes(start)
  const endMinute = parseTimeToMinutes(end)
  if (startMinute === null || endMinute === null) return null
  if (startMinute >= endMinute) return null
  return { startMinute, endMinute }
}
