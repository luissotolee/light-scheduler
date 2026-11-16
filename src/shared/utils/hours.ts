import type { Shift } from '@/types'

export function sumShiftMinutes(shifts: readonly Shift[]): number {
  return shifts.reduce((total, shift) => total + (shift.endMinute - shift.startMinute), 0)
}

export function minutesToHours(minutes: number): number {
  return minutes / 60
}

export function formatHours(hours: number): string {
  return (Math.round(hours * 10) / 10).toFixed(1)
}

export function formatDiff(hours: number): string {
  const rounded = Math.round(hours * 10) / 10
  if (rounded === 0) return '0.0'
  return rounded > 0 ? `+${rounded.toFixed(1)}` : `-${Math.abs(rounded).toFixed(1)}`
}
