import { describe, expect, it } from 'vitest'
import { buildDemoWorkspace } from '@/modules/demo/fixtures/demoWorkspace'
import { parsePersistedWorkspace } from '@/shared/utils/persistence'

describe('demoWorkspace', () => {
  it('builds a valid workspace that passes parsePersistedWorkspace', () => {
    const workspace = buildDemoWorkspace(new Date('2026-11-09T12:00:00'))
    const parsed = parsePersistedWorkspace(workspace)
    expect(parsed).not.toBeNull()
    expect(parsed).toEqual(workspace)
  })

  it('contains all required fields', () => {
    const workspace = buildDemoWorkspace()
    expect(workspace.version).toBe(1)
    expect(Array.isArray(workspace.members)).toBe(true)
    expect(typeof workspace.schedules).toBe('object')
    expect(typeof workspace.dayOffs).toBe('object')
    expect(typeof workspace.currentWeekKey).toBe('string')
  })

  it('includes mock employees', () => {
    const workspace = buildDemoWorkspace()
    expect(workspace.members.length).toBeGreaterThan(0)
    workspace.members.forEach((member) => {
      expect(member.id).toBeTruthy()
      expect(member.name).toBeTruthy()
      expect(['head_manager', 'manager', 'employee', 'assistant']).toContain(member.duty)
      expect(['fulltime', 'part_time', 'weekends']).toContain(member.contract)
      expect(typeof member.weeklyHours).toBe('number')
      expect(member.weeklyHours).toBeGreaterThan(0)
      expect(Array.isArray(member.holidays)).toBe(true)
      expect(typeof member.active).toBe('boolean')
      expect(member.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      if (!member.active) {
        expect(member.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    })
  })

  it('includes schedules for current, previous, and next weeks', () => {
    const now = new Date('2026-11-09T12:00:00')
    const workspace = buildDemoWorkspace(now)

    const currentWeekKey = workspace.currentWeekKey
    const prevWeekKey = Object.keys(workspace.schedules).find((k) => k < currentWeekKey)
    const nextWeekKey = Object.keys(workspace.schedules).find((k) => k > currentWeekKey)

    expect(currentWeekKey).toBeTruthy()
    expect(prevWeekKey).toBeTruthy()
    expect(nextWeekKey).toBeTruthy()
    expect(workspace.schedules[currentWeekKey].length).toBeGreaterThan(0)
    expect(workspace.schedules[prevWeekKey!].length).toBeGreaterThan(0)
    expect(workspace.schedules[nextWeekKey!].length).toBeGreaterThan(0)
  })

  it('includes day offs for weeks with schedules', () => {
    const workspace = buildDemoWorkspace()
    Object.keys(workspace.schedules).forEach((weekKey) => {
      expect(workspace.dayOffs[weekKey]).toBeDefined()
      expect(Array.isArray(workspace.dayOffs[weekKey])).toBe(true)
    })
  })

  it('shifts have valid time ranges', () => {
    const workspace = buildDemoWorkspace()
    Object.values(workspace.schedules).flat().forEach((shift) => {
      expect(shift.startMinute).toBeGreaterThanOrEqual(0)
      expect(shift.endMinute).toBeLessThanOrEqual(1500)
      expect(shift.startMinute).toBeLessThan(shift.endMinute)
      expect(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).toContain(
        shift.weekday,
      )
    })
  })

  it('uses stable IDs for mock employees', () => {
    const workspace1 = buildDemoWorkspace(new Date('2026-11-09'))
    const workspace2 = buildDemoWorkspace(new Date('2026-11-16'))

    expect(workspace1.members.map((m) => m.id)).toEqual(workspace2.members.map((m) => m.id))
  })
})