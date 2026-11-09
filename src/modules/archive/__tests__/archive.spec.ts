import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useArchiveStore } from '@/modules/archive/stores/archive'
import { useLocaleStore } from '@/shared/stores/locale'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  buildBackup,
  gunzipJson,
  gzipJson,
} from '@/shared/utils/archiveBackup'
import { todayIsoDate } from '@/shared/utils/calendar'
import type { TeamMember } from '@/types'

const ada: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
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
  empId: 'EMP-0002',
  name: 'Bo',
  duty: 'employee',
  contract: 'part_time',
  weeklyHours: 20,
  holidays: [],
  active: true,
  startDate: '2026-02-01',
}

describe('archive store', () => {
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
    const store = useArchiveStore()

    expect(store.status).toEqual({ state: 'idle', message: null })
    expect(store.canExportMembers).toBe(false)
    expect(store.canExportSchedule).toBe(false)
  })

  it('reports an error when there are no employees to export', () => {
    const store = useArchiveStore()

    store.exportMembers()

    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'simple', code: 'archive.noEmployees' },
    })
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('exports members with a UTF-8 BOM, all headers, and a timestamped filename', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    const store = useArchiveStore()

    store.exportMembers()

    expect(store.canExportMembers).toBe(true)
    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'archive.employeesExported' },
    })
    expect(downloadName).toBe('employees-2026-11-05T20-57-00-000Z.csv')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')

    const blob = blobs[0]
    expect(new Uint8Array(await blob.slice(0, 3).arrayBuffer())).toEqual(
      new Uint8Array([0xef, 0xbb, 0xbf]),
    )
    expect(await blob.slice(3).text()).toBe(
      'emp_id,name,duty,contract,weeklyHours,holidays,email,phone,active,startDate,endDate\r\n' +
        'EMP-0001,Ada,manager,fulltime,40,2026-W10;2026-W11,ada@example.com,+1 555 010 0000,true,2025-01-15,\r\n' +
        'EMP-0002,Bo,employee,part_time,20,,,,true,2026-02-01,',
    )
  })

  it('imports employees and replaces the existing list', () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const store = useArchiveStore()

    store.importMembers(
      'name,duty,contract,weeklyHours,holidays,email,phone\r\n' +
        'Bo,employee,part_time,20,,,+1 555 010 0002\r\n' +
        'Cy,assistant,weekends,12,2026-W20;2026-W19,cy@example.com,+1 555 010 0003',
    )

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'archive.importedMany', params: { count: 2 } },
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
    const store = useArchiveStore()

    store.exportMembers()

    const text = await blobs[0].text()
    store.importMembers(text)

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'archive.importedMany', params: { count: 2 } },
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
    const store = useArchiveStore()

    store.exportMembers()
    const text = await blobs[0].text()
    store.importMembers(text)

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'archive.importedOne', params: { count: 1 } },
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
    const store = useArchiveStore()

    store.importMembers(
      'name,duty,contract,weeklyHours,holidays\r\nAda,manager,fulltime,40,2026-W10',
    )

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'archive.importedOne', params: { count: 1 } },
    })
    expect(workspace.members[0]).toMatchObject({
      name: 'Ada',
      active: true,
      startDate: todayIsoDate(),
    })
    expect(workspace.members[0].endDate).toBeUndefined()
  })

  it('reports invalid email and phone values from CSV', () => {
    const store = useArchiveStore()

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
    const store = useArchiveStore()

    store.importMembers(
      'name,duty,contract,weeklyHours,holidays,email\r\n' +
        'Ada,manager,fulltime,40,,ada@example.com',
    )

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'archive.importedOne', params: { count: 1 } },
    })
    expect(workspace.members[0]).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
    })
    expect(workspace.members[0].phone).toBeUndefined()
  })

  it('imports employees without the optional email header', () => {
    const store = useArchiveStore()

    store.importMembers(
      'name,duty,contract,weeklyHours,holidays\r\nAda,manager,fulltime,40,2026-W1',
    )

    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'archive.importedOne', params: { count: 1 } },
    })
  })

  it('reports the first row error and leaves the workspace unchanged', () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const store = useArchiveStore()

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
    const store = useArchiveStore()

    store.importMembers('name,email\r\nAda,ada@example.com')

    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'rowError', row: 1, messageCode: 'errors.unexpectedHeaders' },
    })
  })

  it('reports empty and malformed CSV input', () => {
    const store = useArchiveStore()

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
    const store = useArchiveStore()

    store.setError('csv.tooLarge')

    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'simple', code: 'csv.tooLarge' },
    })
  })

  it('reports an error when there are no shifts to export', () => {
    const store = useArchiveStore()

    store.exportSchedule()

    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'simple', code: 'archive.noShifts' },
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
    const store = useArchiveStore()

    store.exportSchedule()

    expect(store.canExportSchedule).toBe(true)
    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'archive.scheduleExported' },
    })
    expect(downloadName).toBe('schedule-2026-11-05T20-57-00-000Z.csv')

    const blob = blobs[0]
    expect(new Uint8Array(await blob.slice(0, 3).arrayBuffer())).toEqual(
      new Uint8Array([0xef, 0xbb, 0xbf]),
    )
    expect(await blob.slice(3).text()).toBe(
      'week,emp_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday\r\n' +
        'Y2026W45,,,,,,,,\r\n' +
        ',EMP-0001,09:00-17:00,,,,,,',
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
    const store = useArchiveStore()
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
    expect(enSchedule).toContain('week,emp_id,monday,tuesday')
    expect(enSchedule).toContain('Y2026W45')
    expect(enSchedule).toContain(',EMP-0001,09:00-17:00')
  })

  const scheduleFile =
    'week,emp_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday\r\n' +
    'Y2026W45,,,,,,,,\r\n' +
    ',EMP-0001,09:00-17:00,,,,,,\r\n' +
    ',EMP-0002,,OFF,,,,,'

  it('preserves the internal id when an imported employee matches emp_id', () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    const store = useArchiveStore()

    store.importMembers(
      'emp_id,name,duty,contract,weeklyHours,holidays\r\n' +
        'EMP-0001,Ada Updated,manager,fulltime,40,',
    )

    expect(workspace.members[0]).toMatchObject({
      id: ada.id,
      empId: 'EMP-0001',
      name: 'Ada Updated',
    })
  })

  it('generates employee ids when the imported file omits them', () => {
    const workspace = useWorkspaceStore()
    const store = useArchiveStore()

    store.importMembers('name,duty,contract,weeklyHours,holidays\r\nAda,manager,fulltime,40,')

    expect(workspace.members[0].empId).toBe('EMP-0001')
    expect(store.status).toEqual({
      state: 'success',
      message: { kind: 'simple', code: 'archive.importedOne', params: { count: 1 } },
    })
  })

  it('prepares a schedule import without mutating the workspace', () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setShiftsForWeek('2026-11-02', [
      { id: 'existing', memberId: 'member-1', weekday: 'friday', startMinute: 540, endMinute: 600 },
    ])
    const store = useArchiveStore()

    expect(store.prepareScheduleImport(scheduleFile)).toBe(true)
    expect(store.scheduleImportVisible).toBe(true)
    expect(workspace.schedules['2026-11-02']).toHaveLength(1)
    expect(workspace.schedules['2026-11-02'][0].id).toBe('existing')
  })

  it('confirms a schedule import and replaces all shifts and days off', () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    workspace.setCurrentWeekKey('2026-12-07')
    workspace.setShiftsForWeek('2026-12-07', [
      { id: 'old', memberId: 'member-1', weekday: 'friday', startMinute: 540, endMinute: 600 },
    ])
    workspace.setDayOffsForWeek('2026-12-07', [{ memberId: 'member-2', weekday: 'monday' }])
    const store = useArchiveStore()

    store.prepareScheduleImport(scheduleFile)
    store.confirmScheduleImport()

    expect(store.scheduleImportVisible).toBe(false)
    expect(store.status).toEqual({
      state: 'success',
      message: {
        kind: 'simple',
        code: 'archive.schedulesImportedOne',
        params: { count: 1 },
      },
    })
    expect(workspace.schedules).toMatchObject({
      '2026-11-02': [
        { memberId: 'member-1', weekday: 'monday', startMinute: 540, endMinute: 1020 },
      ],
    })
    expect(workspace.dayOffs).toEqual({
      '2026-11-02': [{ memberId: 'member-2', weekday: 'tuesday' }],
    })
    expect(workspace.currentWeekKey).toBe('2026-11-02')
  })

  it('keeps the current week when the import includes it', () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    workspace.setCurrentWeekKey('2026-11-02')
    const store = useArchiveStore()

    store.prepareScheduleImport(scheduleFile)
    store.confirmScheduleImport()

    expect(workspace.currentWeekKey).toBe('2026-11-02')
  })

  it('cancels a prepared schedule import without changing data', () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada, bo])
    workspace.setShiftsForWeek('2026-11-02', [
      { id: 'existing', memberId: 'member-1', weekday: 'friday', startMinute: 540, endMinute: 600 },
    ])
    const store = useArchiveStore()

    store.prepareScheduleImport(scheduleFile)
    store.cancelScheduleImport()

    expect(store.scheduleImportVisible).toBe(false)
    expect(store.status).toEqual({ state: 'idle', message: null })
    expect(workspace.schedules['2026-11-02']).toHaveLength(1)
    expect(workspace.schedules['2026-11-02'][0].id).toBe('existing')
  })

  it('rejects schedules with unknown employee ids without mutating data', () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([ada])
    workspace.setShiftsForWeek('2026-11-02', [
      { id: 'existing', memberId: 'member-1', weekday: 'friday', startMinute: 540, endMinute: 600 },
    ])
    const store = useArchiveStore()

    expect(
      store.prepareScheduleImport(
        'week,emp_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday\r\n' +
          'Y2026W45,,,,,,,,\r\n' +
          ',EMP-9999,09:00-17:00,,,,,,',
      ),
    ).toBe(false)

    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'rowError', row: 3, messageCode: 'errors.unknownEmpId' },
    })
    expect(workspace.schedules['2026-11-02'][0].id).toBe('existing')
  })

  it('rejects a schedule file with no shifts', () => {
    const store = useArchiveStore()

    expect(
      store.prepareScheduleImport(
        'week,emp_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday\r\n' +
          'Y2026W45,,,,,,,,',
      ),
    ).toBe(false)

    expect(store.status).toEqual({
      state: 'error',
      message: { kind: 'simple', code: 'archive.noScheduleRows' },
    })
    expect(store.scheduleImportVisible).toBe(false)
  })

  it('resets the status', () => {
    const store = useArchiveStore()
    store.exportMembers()

    store.resetStatus()

    expect(store.status).toEqual({ state: 'idle', message: null })
  })

  describe('backup', () => {
    async function makeBackupFile(): Promise<File> {
      const backup = buildBackup(
        [ada, bo],
        {
          '2026-11-02': [
            {
              id: 'shift-1',
              memberId: 'member-1',
              weekday: 'monday',
              startMinute: 540,
              endMinute: 1020,
            },
          ],
        },
        {
          '2026-11-02': [{ memberId: 'member-2', weekday: 'tuesday' }],
        },
        '2026-11-02',
      )

      return new File([await gzipJson(backup)], 'backup.json.gz', {
        type: 'application/gzip',
      })
    }

    it('tracks whether there is data to back up', () => {
      const workspace = useWorkspaceStore()
      const store = useArchiveStore()

      expect(store.canExportBackup).toBe(false)

      workspace.setMembers([ada])

      expect(store.canExportBackup).toBe(true)
    })

    it('reports an error when there is no data to back up', async () => {
      const store = useArchiveStore()

      await store.exportBackup()

      expect(store.status).toEqual({
        state: 'error',
        message: { kind: 'simple', code: 'archive.noData' },
      })
      expect(createObjectURL).not.toHaveBeenCalled()
    })

    it('exports a gzipped backup with employees and schedules', async () => {
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
      workspace.setDayOffsForWeek('2026-11-02', [{ memberId: 'member-2', weekday: 'tuesday' }])
      const store = useArchiveStore()

      await store.exportBackup()

      expect(store.status).toEqual({
        state: 'success',
        message: { kind: 'simple', code: 'archive.backupExported' },
      })
      expect(downloadName).toBe('backup-2026-11-05T20-57-00-000Z.json.gz')
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')

      const backup = await gunzipJson(blobs[0])
      expect(backup).toMatchObject({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: '2026-11-05T20:57:00.000Z',
        currentWeekKey: '2026-11-02',
        schedules: {
          '2026': {
            '45': {
              'EMP-0001': [{ weekday: 'monday', startMinute: 540, endMinute: 1020 }],
            },
          },
        },
        dayOffs: {
          '2026': {
            '45': {
              'EMP-0002': ['tuesday'],
            },
          },
        },
      })
    })

    it('prepares an import without mutating the workspace', async () => {
      const workspace = useWorkspaceStore()
      workspace.setMembers([ada])
      const store = useArchiveStore()

      expect(await store.prepareBackupImport(await makeBackupFile())).toBe(true)

      expect(store.backupImportVisible).toBe(true)
      expect(workspace.members).toEqual([ada])
    })

    it('confirms an import and replaces employees, schedules, and days off', async () => {
      const workspace = useWorkspaceStore()
      workspace.setMembers([ada])
      workspace.setShiftsForWeek('2026-12-07', [
        { id: 'old', memberId: 'member-1', weekday: 'friday', startMinute: 540, endMinute: 600 },
      ])
      workspace.setDayOffsForWeek('2026-12-07', [{ memberId: 'member-1', weekday: 'monday' }])
      const store = useArchiveStore()

      await store.prepareBackupImport(await makeBackupFile())
      store.confirmBackupImport()

      expect(store.backupImportVisible).toBe(false)
      expect(store.status).toEqual({
        state: 'success',
        message: { kind: 'simple', code: 'archive.backupImported' },
      })
      expect(workspace.members.map((member) => member.empId)).toEqual(['EMP-0001', 'EMP-0002'])
      expect(workspace.schedules).toEqual({
        '2026-11-02': [
          expect.objectContaining({
            memberId: workspace.members[0].id,
            weekday: 'monday',
            startMinute: 540,
            endMinute: 1020,
          }),
        ],
      })
      expect(workspace.dayOffs).toEqual({
        '2026-11-02': [{ memberId: workspace.members[1].id, weekday: 'tuesday' }],
      })
      expect(workspace.currentWeekKey).toBe('2026-11-02')
    })

    it('cancels an import without changing data', async () => {
      const workspace = useWorkspaceStore()
      workspace.setMembers([ada])
      const store = useArchiveStore()

      await store.prepareBackupImport(await makeBackupFile())
      store.cancelBackupImport()

      expect(store.backupImportVisible).toBe(false)
      expect(store.status).toEqual({ state: 'idle', message: null })
      expect(workspace.members).toEqual([ada])
    })

    it('rejects an invalid backup without mutating the workspace', async () => {
      const workspace = useWorkspaceStore()
      workspace.setMembers([ada])
      const store = useArchiveStore()
      const file = new File([new Uint8Array([1, 2, 3])], 'backup.json.gz', {
        type: 'application/gzip',
      })

      expect(await store.prepareBackupImport(file)).toBe(false)
      expect(store.status).toEqual({
        state: 'error',
        message: { kind: 'simple', code: 'archive.invalidBackup' },
      })
      expect(store.backupImportVisible).toBe(false)
      expect(workspace.members).toEqual([ada])
    })

    it('rejects an unsupported backup version', async () => {
      const store = useArchiveStore()
      const file = new File(
        [await gzipJson({ format: BACKUP_FORMAT, version: 99, employees: [] })],
        'backup.json.gz',
        { type: 'application/gzip' },
      )

      expect(await store.prepareBackupImport(file)).toBe(false)
      expect(store.status).toEqual({
        state: 'error',
        message: { kind: 'simple', code: 'archive.unsupportedVersion' },
      })
    })
  })
})
