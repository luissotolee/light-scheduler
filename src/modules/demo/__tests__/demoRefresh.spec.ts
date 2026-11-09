import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { recoverInterruptedDemo, writeDemoBackup, captureAppStorage } from '@/modules/demo/utils/storageSnapshot'
import { buildDemoWorkspace } from '@/modules/demo/fixtures/demoWorkspace'

describe('demo refresh recovery', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('restores user workspace after mid-demo refresh', () => {
    const userWorkspace = {
      version: 1,
      members: [
        { id: 'emp-1', name: 'Alice', duty: 'employee', contract: 'fulltime', weeklyHours: 40, startDate: '2026-01-01', active: true, phone: '', email: '', holidays: [] },
        { id: 'emp-2', name: 'Bob', duty: 'manager', contract: 'part_time', weeklyHours: 20, startDate: '2026-02-01', active: true, phone: '', email: '', holidays: [] },
      ],
      schedules: {
        '2026-11-02': [
          { id: 's1', memberId: 'emp-1', weekday: 'monday', startMinute: 540, endMinute: 720 },
        ],
      },
      dayOffs: {},
      currentWeekKey: '2026-11-02',
    }
    localStorage.setItem('light-scheduler.workspace', JSON.stringify(userWorkspace))
    localStorage.setItem('light-scheduler.locale', 'en')

    const snapshot = captureAppStorage()
    writeDemoBackup(snapshot)

    const demoWorkspace = buildDemoWorkspace(new Date('2026-11-09'))
    localStorage.setItem('light-scheduler.workspace', JSON.stringify(demoWorkspace))

    const demoStored = JSON.parse(localStorage.getItem('light-scheduler.workspace')!)
    expect(demoStored.members.length).toBeGreaterThan(userWorkspace.members.length)

    setActivePinia(createPinia())

    const result = recoverInterruptedDemo()
    expect(result).toBe('restored')

    const restoredWorkspace = JSON.parse(localStorage.getItem('light-scheduler.workspace')!)
    expect(restoredWorkspace.members).toHaveLength(2)
    expect(restoredWorkspace.members[0].name).toBe('Alice')
    expect(restoredWorkspace.members[1].name).toBe('Bob')
    expect(restoredWorkspace.currentWeekKey).toBe('2026-11-02')
    expect(localStorage.getItem('light-scheduler.demo.recovered')).toBe('true')

    // Workspace store hydrates from localStorage on creation
    setActivePinia(createPinia())
    const workspaceStore = useWorkspaceStore()
    const demoStore = useDemoStore()
    demoStore.checkRecovery()

    expect(workspaceStore.members).toHaveLength(2)
    expect(workspaceStore.members[0].name).toBe('Alice')
    expect(workspaceStore.members[1].name).toBe('Bob')

    expect(localStorage.getItem('light-scheduler.demo.backup')).toBeNull()
    expect(demoStore.status).toBe('idle')
  })

  it('handles recovery when no backup exists', () => {
    // No backup, no recovered flag
    const result = recoverInterruptedDemo()
    expect(result).toBe('none')

    const demoStore = useDemoStore()
    expect(demoStore.status).toBe('idle')
    expect(demoStore.showRestoredFlag).toBe(false)
  })

  it('does not restore when recovered flag already set', () => {
    localStorage.setItem('light-scheduler.demo.recovered', 'true')
    localStorage.setItem('light-scheduler.demo.backup', JSON.stringify({
      version: 1,
      createdAt: Date.now(),
      entries: { 'light-scheduler.workspace': '{"version":1,"members":[],"schedules":{},"dayOffs":{},"currentWeekKey":"2026-W45"}' },
    }))

    const result = recoverInterruptedDemo()
    expect(result).toBe('none')

    // Stale recovered flag is cleared when no actual recovery happened
    expect(localStorage.getItem('light-scheduler.demo.backup')).not.toBeNull()
    expect(localStorage.getItem('light-scheduler.demo.recovered')).toBeNull()
  })
})