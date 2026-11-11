---
name: scheduling-calendar
description: Model and validate schedules: shifts defined as an hour range per team member per weekday, current and following calendar views, and timezone-safe date handling. Use when implementing or extending calendar views, shift creation/editing, or shift overlap validation (the future scheduling features).
---

# Scheduling Calendar

Read `workspace.md` first for the module map and where files belong.

## 1. Data model

These types already live in `src/types.ts`:

```ts
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface Shift {
  id: string
  memberId: string
  weekday: Weekday
  startMinute: number   // 0..1439, minutes since midnight (canonical)
  endMinute: number     // startMinute < endMinute
}

export interface NewShift {
  memberId: string
  weekday: Weekday
  start: string         // 'HH:mm' (UI/input form)
  end: string           // 'HH:mm'
}
```

Canonical comparison always uses `startMinute` / `endMinute`. `'HH:mm'` is input/display only — convert it at the boundary with `parseTimeToMinutes`.

## 2. Hour-range validation

Put pure helpers in `src/shared/utils/shifts.ts`:

```ts
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export function parseTimeToMinutes(hhmm: string): number | null {
  const m = TIME_RE.exec(hhmm)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

export function shiftsOverlap(
  a: { startMinute: number; endMinute: number },
  b: { startMinute: number; endMinute: number },
): boolean {
  return a.startMinute < b.endMinute && b.startMinute < a.endMinute
}
```

Rules:

- Reject `start >= end`. Cross-midnight shifts are not supported in v1; document this decision in the PR/issue and keep the model simple.
- Reject invalid `'HH:mm'` input (`parseTimeToMinutes` returns `null`).
- Check overlap per member and weekday: two shifts overlap only when `memberId` and `weekday` match and their minute ranges intersect.
- Half-open ranges: a shift ending at 12:00 does not overlap one starting at 12:00.

Validation failures surface as `MessageKey` values in the scheduler store (`errors.shiftTimes`, `errors.shiftRange`, `errors.maxDaysOff`), translated at the view boundary. Add any new shift error key to **both** `en.ts` and `es.ts` (see the `i18n` skill).

```ts
export function toShiftMinutes(
  start: string,
  end: string,
): { startMinute: number; endMinute: number } | null {
  const startMinute = parseTimeToMinutes(start)
  const endMinute = parseTimeToMinutes(end)
  if (startMinute === null || endMinute === null) return null
  if (startMinute >= endMinute) return null
  return { startMinute, endMinute }
}
```

## 3. Timezone handling

- All shift and weekday math is wall-clock local time.
- Store only `HH:mm` + `weekday` for shift times; never store a naive `Date` as a shift time.
- ISO-8601 week boundaries start on Monday.
- Use local date construction (`new Date(year, month, day)`) when converting week boundaries; avoid UTC conversion surprises from `toISOString()` for local calendar labels.

## 4. Current and following calendars

Derive the views; do not persist them. Add ISO-week helpers in `src/shared/utils/calendar.ts`:

```ts
function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date)
  const offset = (start.getDay() + 6) % 7 // Monday = 0
  start.setDate(start.getDate() - offset)
  start.setHours(0, 0, 0, 0)
  return start
}

export function getWeekKey(date: Date): string {
  return toLocalIsoDate(startOfWeek(date))
}
```

The scheduler store exposes `currentWeekShifts` and week navigation, computed from the shared `workspace` store's `schedules` and `currentWeekKey`.

## 5. Testing

Pure helpers are the test surface; no DOM is needed:

- `shiftsOverlap` for overlapping, touching, and disjoint ranges.
- Overlap is false for different members or different weekdays.
- `parseTimeToMinutes` valid values (`'00:00'`, `'09:30'`, `'23:59'`) and invalid values (`'24:00'`, `'9:00'`, `'09:60'`, `'noon'`).
- Reject `start >= end`.
- Week-key math with `vi.useFakeTimers()` + `vi.setSystemTime(...)`, including a Sunday reference date (still maps to the preceding Monday).
