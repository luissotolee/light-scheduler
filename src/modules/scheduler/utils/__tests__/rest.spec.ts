import { describe, expect, it } from 'vitest'
import type { Shift } from '@/types'
import { MIN_REST_MINUTES, findRestConflicts } from '@/modules/scheduler/utils/rest'

const WEEK = '2026-11-02'
const PREV_WEEK = '2026-10-26'
const NEXT_WEEK = '2026-11-09'

function makeShift(
  id: string,
  weekday: Shift['weekday'],
  startMinute: number,
  endMinute: number,
  memberId = 'ada',
): Shift {
  return { id, memberId, weekday, startMinute, endMinute }
}

describe('MIN_REST_MINUTES', () => {
  it('is twelve hours', () => {
    expect(MIN_REST_MINUTES).toBe(720)
  })
})

describe('findRestConflicts', () => {
  it('returns no conflicts for an empty schedule', () => {
    const candidate = makeShift('candidate', 'monday', 540, 780)

    expect(findRestConflicts(candidate, WEEK, {})).toEqual([])
  })

  it('ignores same-day split shifts', () => {
    const early = makeShift('early', 'monday', 540, 780)
    const candidate = makeShift('candidate', 'monday', 1260, 1380)

    expect(findRestConflicts(candidate, WEEK, { [WEEK]: [early, candidate] })).toEqual([])
  })

  it('flags a previous-day shift that leaves less than twelve hours', () => {
    const previous = makeShift('previous', 'sunday', 1260, 1350)
    const candidate = makeShift('candidate', 'monday', 540, 780)

    const conflicts = findRestConflicts(candidate, WEEK, {
      [PREV_WEEK]: [previous],
      [WEEK]: [candidate],
    })

    expect(conflicts).toEqual([{ shift: previous, weekKey: PREV_WEEK, restMinutes: 630 }])
  })

  it('flags a following-day shift that leaves less than twelve hours', () => {
    const candidate = makeShift('candidate', 'monday', 1200, 1380)
    const following = makeShift('following', 'tuesday', 540, 780)

    const conflicts = findRestConflicts(candidate, WEEK, { [WEEK]: [candidate, following] })

    expect(conflicts).toEqual([{ shift: following, weekKey: WEEK, restMinutes: 600 }])
  })

  it('allows exactly twelve hours of rest', () => {
    const candidate = makeShift('candidate', 'monday', 1200, 1380)
    const following = makeShift('following', 'tuesday', 660, 900)

    expect(findRestConflicts(candidate, WEEK, { [WEEK]: [candidate, following] })).toEqual([])
  })

  it('handles cross-midnight shifts that end on the next calendar day', () => {
    const candidate = makeShift('candidate', 'sunday', 1260, 1500)
    const following = makeShift('following', 'monday', 660, 900)

    const conflicts = findRestConflicts(candidate, WEEK, {
      [WEEK]: [candidate],
      [NEXT_WEEK]: [following],
    })

    expect(conflicts).toEqual([{ shift: following, weekKey: NEXT_WEEK, restMinutes: 600 }])
  })

  it('compares Sunday with the following Monday of the next week', () => {
    const candidate = makeShift('candidate', 'sunday', 1260, 1380)
    const following = makeShift('following', 'monday', 540, 780)

    const conflicts = findRestConflicts(candidate, WEEK, {
      [WEEK]: [candidate],
      [NEXT_WEEK]: [following],
    })

    expect(conflicts).toEqual([{ shift: following, weekKey: NEXT_WEEK, restMinutes: 600 }])
  })

  it('compares Monday with the previous Sunday of the previous week', () => {
    const previous = makeShift('previous', 'sunday', 1260, 1380)
    const candidate = makeShift('candidate', 'monday', 540, 780)

    const conflicts = findRestConflicts(candidate, NEXT_WEEK, {
      [WEEK]: [previous],
      [NEXT_WEEK]: [candidate],
    })

    expect(conflicts).toEqual([{ shift: previous, weekKey: WEEK, restMinutes: 600 }])
  })

  it('uses only the nearest previous shift', () => {
    const early = makeShift('early', 'sunday', 540, 1200)
    const late = makeShift('late', 'sunday', 1260, 1380)
    const candidate = makeShift('candidate', 'monday', 540, 780)

    const conflicts = findRestConflicts(candidate, WEEK, {
      [PREV_WEEK]: [early, late],
      [WEEK]: [candidate],
    })

    expect(conflicts).toEqual([{ shift: late, weekKey: PREV_WEEK, restMinutes: 600 }])
  })

  it('uses only the nearest following shift', () => {
    const early = makeShift('early', 'tuesday', 540, 780)
    const late = makeShift('late', 'tuesday', 840, 1020)
    const candidate = makeShift('candidate', 'monday', 1200, 1380)

    const conflicts = findRestConflicts(candidate, WEEK, {
      [WEEK]: [candidate, late, early],
    })

    expect(conflicts).toEqual([{ shift: early, weekKey: WEEK, restMinutes: 600 }])
  })

  it('contains both previous and following conflicts sorted by rest', () => {
    const previous = makeShift('previous', 'sunday', 1260, 1500)
    const following = makeShift('following', 'tuesday', 540, 780)
    const candidate = makeShift('candidate', 'monday', 0, 1440)

    const conflicts = findRestConflicts(candidate, WEEK, {
      [PREV_WEEK]: [previous],
      [WEEK]: [candidate, following],
    })

    expect(conflicts).toEqual([
      { shift: previous, weekKey: PREV_WEEK, restMinutes: -60 },
      { shift: following, weekKey: WEEK, restMinutes: 540 },
    ])
  })

  it('ignores other employees', () => {
    const other = makeShift('other', 'sunday', 1260, 1380, 'bo')
    const candidate = makeShift('candidate', 'monday', 540, 780)

    expect(
      findRestConflicts(candidate, WEEK, { [PREV_WEEK]: [other], [WEEK]: [candidate] }),
    ).toEqual([])
  })

  it('ignores the candidate itself when it is already scheduled', () => {
    const candidate = makeShift('candidate', 'monday', 540, 780)

    expect(findRestConflicts(candidate, WEEK, { [WEEK]: [candidate] })).toEqual([])
  })

  it('reports negative rest when different-day shifts overlap', () => {
    const previous = makeShift('previous', 'sunday', 1260, 1500)
    const candidate = makeShift('candidate', 'monday', 0, 240)

    const conflicts = findRestConflicts(candidate, WEEK, {
      [PREV_WEEK]: [previous],
      [WEEK]: [candidate],
    })

    expect(conflicts).toEqual([{ shift: previous, weekKey: PREV_WEEK, restMinutes: -60 }])
  })
})
