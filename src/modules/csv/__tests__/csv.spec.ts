import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCsvStore } from '@/modules/csv/stores/csv'
import { useLocaleStore } from '@/shared/stores/locale'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { todayIsoDate } from '@/shared/utils/calendar'
import type { TeamMember } from '@/types'

const ada: TeamMember = {
  id: 'member-1',
  name: 'Ada',
  duty: 'manager',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [
    { year: 2026, week: 10 },
    { year: 2026, week: 11 },
  ],
  email: 'ada@example.com',
  phone: '+1 555 010 0000',
  active: true,
  startDate: '2025-01-15',
}
const bo: TeamMember = {
  id: 'member-2',
  name: 'Bo',
  duty: 'employee',
  contract: 'part_time',
  weeklyHours: 20,
  holidays: [],
  active: true,
  startDate: '2026-02-01',
}

describe('csv store', () => {
  const blobs: Blob[] = []
  const createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob)
    return 'blob:test'
  })
  const revokeObjectURL = vi.fn()
  let downloadName = ''

  beforeEach(() => {
    localStorage.clear()
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

    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'simple', code: 'csv.noEmployees' },
    })
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('exports members with a UTF-8 BOM, all headers, and a timestamped filename', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const store = useCsvStore()

    store.exportMembers()

    expect(store.canExportMembers).toBe(true)
    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'csv.employeesExported' },
    })
    expect(downloadName).toBe('employees-2026-11-05T20-57-00-000Z.csv')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')

    const blob = blobs[0]
    expect(new Uint8Array(await blob.slice(0, 3).arrayBuffer())).toEqual(
      new Uint8Array([0xef, 0xbb, 0xbf]),
    )
    expect(await blob.slice(3).text()).toBe(
      'name,duty,contract,weeklyHours,holidays,email,phone,active,startDate,endDate\r\n' +
        'Ada,manager,fulltime,40,2026-W10;2026-W11,ada@example.com,+1 555 010 0000,true,2025-01-15,\r\n' +
        'Bo,employee,part_time,20,,,,true,2026-02-01,',
    )
  })

  it('imports employees and replaces the existing list', () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const store = useCsvStore()

    store.importMembers(
      'name,duty,contract,weeklyHours,holidays,email,phone\r\n' +
        'Bo,employee,part_time,20,,,+1 555 010 0002\r\n' +
        'Cy,assistant,weekends,12,2026-W20;2026-W19,cy@example.com,+1 555 010 0003',
    )

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'csv.importedMany', params: { count: 2 } },
    })
    expect(workspace.members).toHaveLength(2)
    expect(workspace.members[0]).toMatchObject({
      name: 'Bo',
      duty: 'employee',
      contract: 'part_time',
      weeklyHours: 20,
      holidays: [],
      phone: '+1 555 010 0002',
    })
    expect(workspace.members[0].id).toBeTruthy()
    expect(workspace.members[0].email).toBeUndefined()
    expect(workspace.members[1]).toMatchObject({
      name: 'Cy',
      duty: 'assistant',
      contract: 'weekends',
      weeklyHours: 12,
      holidays: [
        { year: 2026, week: 19 },
        { year: 2026, week: 20 },
      ],
      email: 'cy@example.com',
      phone: '+1 555 010 0003',
    })
  })

  it('round-trips phone and email through CSV export and import', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const store = useCsvStore()

    store.exportMembers()

    const text = await blobs[0].text()
    store.importMembers(text)

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'csv.importedMany', params: { count: 2 } },
    })
    expect(workspace.members[0]).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
      phone: '+1 555 010 0000',
      active: true,
      startDate: '2025-01-15',
    })
    expect(workspace.members[1]).toMatchObject({
      name: 'Bo',
      active: true,
      startDate: '2026-02-01',
    })
    expect(workspace.members[1].email).toBeUndefined()
    expect(workspace.members[1].phone).toBeUndefined()
  })

  it('round-trips an inactive member with its end date', async () => {
    const inactive: TeamMember = {
      ...ada,
      active: false,
      startDate: '2020-01-01',
      endDate: '2026-11-08',
    }
    const workspace = useWorkspaceStore()
    workspace.setMembers([inactive])
    const store = useCsvStore()

    store.exportMembers()
    const text = await blobs[0].text()
    store.importMembers(text)

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'csv.importedOne', params: { count: 1 } },
    })
    expect(workspace.members[0]).toMatchObject({
      name: 'Ada',
      active: false,
      startDate: '2020-01-01',
      endDate: '2026-11-08',
    })
  })

  it('defaults legacy imports to active with today as the start date', () => {
    const workspace = useWorkspaceStore()
    const store = useCsvStore()

    store.importMembers(
      'name,duty,contract,weeklyHours,holidays\r\nAda,manager,fulltime,40,2026-W10',
    )

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'csv.importedOne', params: { count: 1 } },
    })
    expect(workspace.members[0]).toMatchObject({
      name: 'Ada',
      active: true,
      startDate: todayIsoDate(),
    })
    expect(workspace.members[0].endDate).toBeUndefined()
  })

  it('reports invalid email and phone values from CSV', () => {
    const store = useCsvStore()

    store.importMembers(
      'name,duty,contract,weeklyHours,holidays,email,phone\r\n' +
        'Ada,manager,fulltime,40,,not-an-email,5551234',
    )
    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'rowError', row: 2, messageCode: 'errors.invalidEmail' },
    })

    store.importMembers(
      'name,duty,contract,weeklyHours,holidays,email,phone\r\n' + 'Ada,manager,fulltime,40,,,123',
    )
    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'rowError', row: 2, messageCode: 'errors.invalidPhone' },
    })
  })

  it('imports legacy employees without the optional phone header', () => {
    const workspace = useWorkspaceStore()
    const store = useCsvStore()

    store.importMembers(
      'name,duty,contract,weeklyHours,holidays,email\r\n' +
        'Ada,manager,fulltime,40,,ada@example.com',
    )

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'csv.importedOne', params: { count: 1 } },
    })
    expect(workspace.members[0]).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
    })
    expect(workspace.members[0].phone).toBeUndefined()
  })

  it('imports employees without the optional email header', () => {
    const store = useCsvStore()

    store.importMembers(
      'name,duty,contract,weeklyHours,holidays\r\nAda,manager,fulltime,40,2026-W1',
    )

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'csv.importedOne', params: { count: 1 } },
    })
  })

  it('reports the first row error and leaves the workspace unchanged', () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const store = useCsvStore()

    store.importMembers(
      'name,duty,contract,weeklyHours,holidays\r\n' +
        'Ada,chef,fulltime,40,\r\n' +
        'Bo,employee,part_time,20,',
    )

    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'rowError', row: 2, messageCode: 'errors.invalidDuty' },
    })
    expect(workspace.members).toEqual([ada])
  })

  it('reports unexpected headers', () => {
    const store = useCsvStore()

    store.importMembers('name,email\r\nAda,ada@example.com')

    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'rowError', row: 1, messageCode: 'errors.unexpectedHeaders' },
    })
  })

  it('reports empty and malformed CSV input', () => {
    const store = useCsvStore()

    store.importMembers('   ')
    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'simple', code: 'csv.empty' },
    })

    store.importMembers('name,duty\r\n"Ada,employee')
    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'simple', code: 'csv.unterminated' },
    })
  })

  it('exposes a setter for import errors', () => {
    const store = useCsvStore()

    store.setError('csv.tooLarge')

    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'simple', code: 'csv.tooLarge' },
    })
  })

  it('reports an error when there are no shifts to export', () => {
    const store = useCsvStore()

    store.exportSchedule()

    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'simple', code: 'csv.noShifts' },
    })
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('exports the current week schedule with formatted times', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada])
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
    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'csv.scheduleExported' },
    })
    expect(downloadName).toBe('schedule-2026-11-05T20-57-00-000Z.csv')

    const blob = blobs[0]
    expect(new Uint8Array(await blob.slice(0, 3).arrayBuffer())).toEqual(
      new Uint8Array([0xef, 0xbb, 0xbf]),
    )
    expect(await blob.slice(3).text()).toBe(
      'member,weekday,start,end\r\nAda,monday,09:00,17:00\r\nmissing-member,tuesday,10:00,11:00',
    )
  })

  it('exports byte-identical CSV regardless of the active locale', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada, bo])
    workspace.setShiftsForWeek('2026-11-02', [
      {
        id: 'shift-1',
        memberId: 'member-1',
        weekday: 'monday',
        startMinute: 540,
        endMinute: 1020,
      },
    ])
    const store = useCsvStore()
    const localeStore = useLocaleStore()

    localeStore.setLocale('en')
    store.exportMembers()
    const enMembers = await blobs[0].text()
    const enMembersName = downloadName

    localeStore.setLocale('es')
    store.exportMembers()
    const esMembers = await blobs[1].text()
    const esMembersName = downloadName

    expect(esMembers).toBe(enMembers)
    expect(esMembersName).toBe(enMembersName)

    localeStore.setLocale('en')
    store.exportSchedule()
    const enSchedule = await blobs[2].text()
    const enScheduleName = downloadName

    localeStore.setLocale('es')
    store.exportSchedule()
    const esSchedule = await blobs[3].text()
    const esScheduleName = downloadName

    expect(esSchedule).toBe(enSchedule)
    expect(esScheduleName).toBe(enScheduleName)
    expect(new Uint8Array(await blobs[0].slice(0, 3).arrayBuffer())).toEqual(
      new Uint8Array([0xef, 0xbb, 0xbf]),
    )
    expect(enMembers).toContain('\r\n')
    expect(enMembers).toContain(
      'name,duty,contract,weeklyHours,holidays,email,phone,active,startDate,endDate',
    )
    expect(enMembers).toContain('true,')
    expect(enMembers).toContain('part_time')
    expect(enMembers).toContain('2025-01-15')
    expect(enMembersName.startsWith('employees-')).toBe(true)
    expect(enScheduleName.startsWith('schedule-')).toBe(true)
    expect(enSchedule).toContain('member,weekday,start,end')
    expect(enSchedule).toContain('monday,09:00,17:00')
  })

  it('resets the status', () => {
    const store = useCsvStore()
    store.exportMembers()

    store.resetStatus()

    expect(store.status).toEqual({ state: 'idle', message: null })
  })
})
