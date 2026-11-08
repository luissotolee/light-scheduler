import { describe, expect, it } from 'vitest'
import type { DayOff } from '@/types'
import { MIN_DAYS_OFF, countDaysOffByMember } from '@/modules/scheduler/utils/off'

describe('off utils', () => {
  it('exposes the weekly minimum of two days off', () => {
    expect(MIN_DAYS_OFF).toBe(2)
  })

  it('returns an empty map when there are no days off', () => {
    expect(countDaysOffByMember([])).toEqual(new Map())
  })

  it('counts days off per member across weekdays', () => {
    const offs: DayOff[] = [
      { memberId: 'member-1', weekday: 'monday' },
      { memberId: 'member-1', weekday: 'tuesday' },
      { memberId: 'member-2', weekday: 'friday' },
    ]

    const counts = countDaysOffByMember(offs)

    expect(counts.get('member-1')).toBe(2)
    expect(counts.get('member-2')).toBe(1)
    expect(counts.has('member-3')).toBe(false)
  })

  it('counts duplicate entries defensively for pure input (store cannot produce them)', () => {
    const offs: DayOff[] = [
      { memberId: 'member-1', weekday: 'monday' },
      { memberId: 'member-1', weekday: 'monday' },
    ]

    expect(countDaysOffByMember(offs).get('member-1')).toBe(2)
  })
})
