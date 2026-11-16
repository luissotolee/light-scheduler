import type { SummarySettings } from '@/types'

export const DEFAULT_SUMMARY_SETTINGS: SummarySettings = {
  showWeeklyHours: false,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseSummarySettings(value: unknown): SummarySettings | null {
  if (!isRecord(value)) return null

  const showWeeklyHours = value.showWeeklyHours
  if (showWeeklyHours === undefined) return { ...DEFAULT_SUMMARY_SETTINGS }
  if (typeof showWeeklyHours !== 'boolean') return null

  return { showWeeklyHours }
}
