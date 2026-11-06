import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCsvStore } from '@/stores/csv'
import { useWorkspaceStore } from '@/stores/workspace'

describe('csv store', () => {
  const blobs: Blob[] = []
  const createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob)
    return 'blob:test'
  })
  const revokeObjectURL = vi.fn()
  let downloadName = ''

  beforeEach(() => {
    setActivePinia(createPinia())
    blobs.length = 0
    downloadName = ''
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.download
    })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T20:57:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('starts idle with export availability based on workspace data', () => {
    const store = useCsvStore()

    expect(store.status).toEqual({ state: 'idle', message: null })
    expect(store.canExportMembers).toBe(false)
    expect(store.canExportSchedule).toBe(false)
  })

  it('reports an error when there are no employees to export', () => {
    const store = useCsvStore()

    store.exportMembers()

    expect(store.status).toEqual({ state: 'error', message: 'No employees to export' })
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('exports members with a UTF-8 BOM and timestamped filename', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([
      { id: 'member-1', name: 'Ada', email: 'ada@example.com' },
      { id: 'member-2', name: 'Bo' },
    ])
    const store = useCsvStore()

    store.exportMembers()

    expect(store.canExportMembers).toBe(true)
    expect(store.status).toEqual({ state: 'success', message: 'Employees exported' })
    expect(downloadName).toBe('employees-2026-11-05T20-57-00-000Z.csv')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')

    const blob = blobs[0]
    expect(new Uint8Array(await blob.slice(0, 3).arrayBuffer())).toEqual(
      new Uint8Array([0xef, 0xbb, 0xbf]),
    )
    expect(await blob.slice(3).text()).toBe('name,email\r\nAda,ada@example.com\r\nBo,')
  })

  it('reports an error when there are no shifts to export', () => {
    const store = useCsvStore()

    store.exportSchedule()

    expect(store.status).toEqual({
      state: 'error',
      message: 'No shifts to export for this week',
    })
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('exports the current week schedule with formatted times', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([{ id: 'member-1', name: 'Ada' }])
    workspace.setShiftsForWeek('2026-11-02', [
      {
        id: 'shift-1',
        memberId: 'member-1',
        weekday: 'monday',
        startMinute: 540,
        endMinute: 1020,
      },
      {
        id: 'shift-2',
        memberId: 'missing-member',
        weekday: 'tuesday',
        startMinute: 600,
        endMinute: 660,
      },
    ])
    const store = useCsvStore()

    store.exportSchedule()

    expect(store.canExportSchedule).toBe(true)
    expect(store.status).toEqual({ state: 'success', message: 'Schedule exported' })
    expect(downloadName).toBe('schedule-2026-11-05T20-57-00-000Z.csv')

    const blob = blobs[0]
    expect(new Uint8Array(await blob.slice(0, 3).arrayBuffer())).toEqual(
      new Uint8Array([0xef, 0xbb, 0xbf]),
    )
    expect(await blob.slice(3).text()).toBe(
      'member,weekday,start,end\r\nAda,monday,09:00,17:00\r\nmissing-member,tuesday,10:00,11:00',
    )
  })

  it('resets the status', () => {
    const store = useCsvStore()
    store.exportMembers()

    store.resetStatus()

    expect(store.status).toEqual({ state: 'idle', message: null })
  })
})
