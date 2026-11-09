import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DayOff, Shift, TeamMember } from '@/types'
import {
  BACKUP_FORMAT,
  BACKUP_MIME,
  BACKUP_VERSION,
  MAX_BACKUP_BYTES,
  buildBackup,
  gunzipJson,
  gzipJson,
  parseBackup,
  readBackupFile,
} from '@/shared/utils/archiveBackup'

const ada: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
  name: 'Ada',
  duty: 'manager',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [
    { year: 2026, week: 11 },
    { year: 2026, week: 10 },
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
  active: false,
  startDate: '2025-02-01',
  endDate: '2026-12-31',
}

function shift(
  id: string,
  memberId: string,
  weekday: Shift['weekday'],
  startMinute: number,
  endMinute: number,
): Shift {
  return { id, memberId, weekday, startMinute, endMinute }
}

const schedules: Record<string, Shift[]> = {
  '2026-11-02': [
    shift('shift-1', 'member-1', 'monday', 540, 1020),
    shift('shift-2', 'member-1', 'monday', 600, 700),
    shift('shift-3', 'member-2', 'tuesday', 600, 660),
  ],
  '2026-11-09': [],
  '2026-11-16': [shift('shift-4', 'missing-member', 'friday', 540, 600)],
}

const dayOffs: Record<string, DayOff[]> = {
  '2026-11-02': [
    { memberId: 'member-1', weekday: 'thursday' },
    { memberId: 'member-2', weekday: 'wednesday' },
    { memberId: 'member-1', weekday: 'thursday' },
  ],
  '2026-11-09': [{ memberId: 'member-1', weekday: 'monday' }],
}

function employeeRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    emp_id: 'EMP-0001',
    name: 'Ada',
    duty: 'manager',
    contract: 'fulltime',
    weeklyHours: 40,
    holidays: [],
    active: true,
    startDate: '2025-01-15',
    ...overrides,
  }
}

function backupRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: '2026-11-09T20:57:00.000Z',
    employees: [employeeRecord()],
    schedules: {},
    ...overrides,
  }
}

function withSchedules(schedulesValue: unknown): Record<string, unknown> {
  return backupRecord({ schedules: schedulesValue })
}

describe('buildBackup', () => {
  it('groups shifts by ISO year, week, and employee id', () => {
    const backup = buildBackup(
      [ada, bo],
      schedules,
      dayOffs,
      '2026-11-02',
      new Date('2026-11-09T20:57:00.000Z'),
    )

    expect(backup.format).toBe(BACKUP_FORMAT)
    expect(backup.version).toBe(BACKUP_VERSION)
    expect(backup.exportedAt).toBe('2026-11-09T20:57:00.000Z')
    expect(backup.currentWeekKey).toBe('2026-11-02')
    expect(backup.employees).toEqual([
      {
        emp_id: 'EMP-0001',
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
      },
      {
        emp_id: 'EMP-0002',
        name: 'Bo',
        duty: 'employee',
        contract: 'part_time',
        weeklyHours: 20,
        holidays: [],
        active: false,
        startDate: '2025-02-01',
        endDate: '2026-12-31',
      },
    ])
    expect(backup.schedules).toEqual({
      '2026': {
        '45': {
          'EMP-0001': [
            { weekday: 'monday', startMinute: 540, endMinute: 1020 },
            { weekday: 'monday', startMinute: 600, endMinute: 700 },
          ],
          'EMP-0002': [{ weekday: 'tuesday', startMinute: 600, endMinute: 660 }],
        },
      },
    })
    expect(backup.dayOffs).toEqual({
      '2026': {
        '45': {
          'EMP-0001': ['thursday'],
          'EMP-0002': ['wednesday'],
        },
        '46': {
          'EMP-0001': ['monday'],
        },
      },
    })
  })

  it('omits empty weeks and weeks whose shifts reference missing employees', () => {
    const backup = buildBackup([ada], schedules, dayOffs, '2026-11-02')

    expect(backup.schedules?.['2026']?.['45']).toBeDefined()
    expect(backup.schedules?.['2026']?.['46']).toBeUndefined()
    expect(backup.schedules?.['2026']?.['47']).toBeUndefined()
    expect(JSON.stringify(backup.schedules)).not.toContain('missing-member')
  })

  it('writes a backup with employees but no schedules', () => {
    const backup = buildBackup([ada], {}, {}, '2026-11-02')

    expect(backup.employees).toHaveLength(1)
    expect(backup.schedules).toEqual({})
    expect(backup.dayOffs).toEqual({})
  })
})

describe('parseBackup', () => {
  it('round-trips a backup built from workspace data', () => {
    const backup = buildBackup([ada, bo], schedules, dayOffs, '2026-11-02')
    const parsed = parseBackup(JSON.parse(JSON.stringify(backup)))

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    expect(parsed.data.currentWeekKey).toBe('2026-11-02')
    expect(parsed.data.members).toHaveLength(2)
    expect(parsed.data.members[0]).toMatchObject({
      empId: 'EMP-0001',
      name: 'Ada',
      holidays: [
        { year: 2026, week: 10 },
        { year: 2026, week: 11 },
      ],
      email: 'ada@example.com',
      phone: '+1 555 010 0000',
    })
    expect(parsed.data.members[1]).toMatchObject({
      empId: 'EMP-0002',
      active: false,
      endDate: '2026-12-31',
    })

    const weekShifts = parsed.data.schedules['2026-11-02']
    expect(weekShifts).toHaveLength(3)
    expect(weekShifts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memberId: parsed.data.members[0].id,
          weekday: 'monday',
          startMinute: 540,
          endMinute: 1020,
        }),
        expect.objectContaining({
          memberId: parsed.data.members[0].id,
          weekday: 'monday',
          startMinute: 600,
          endMinute: 700,
        }),
        expect.objectContaining({
          memberId: parsed.data.members[1].id,
          weekday: 'tuesday',
          startMinute: 600,
          endMinute: 660,
        }),
      ]),
    )
    expect(parsed.data.dayOffs['2026-11-02']).toEqual([
      { memberId: parsed.data.members[0].id, weekday: 'thursday' },
      { memberId: parsed.data.members[1].id, weekday: 'wednesday' },
    ])
  })

  it('accepts a backup without schedules, days off, or a current week', () => {
    const parsed = parseBackup({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      employees: [employeeRecord()],
    })

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.schedules).toEqual({})
    expect(parsed.data.dayOffs).toEqual({})
    expect(parsed.data.currentWeekKey).toBeUndefined()
  })

  it('rejects malformed files', () => {
    expect(parseBackup(null)).toEqual({ ok: false, error: 'archive.invalidBackup' })
    expect(parseBackup([])).toEqual({ ok: false, error: 'archive.invalidBackup' })
    expect(parseBackup({})).toEqual({ ok: false, error: 'archive.invalidBackup' })
    expect(parseBackup(backupRecord({ format: 'other' }))).toEqual({
      ok: false,
      error: 'archive.invalidBackup',
    })
    expect(parseBackup(backupRecord({ version: 2 }))).toEqual({
      ok: false,
      error: 'archive.unsupportedVersion',
    })
    expect(parseBackup(backupRecord({ employees: 'nope' }))).toEqual({
      ok: false,
      error: 'archive.invalidBackup',
    })
  })

  it('validates employees', () => {
    expect(parseBackup(backupRecord({ employees: [employeeRecord({ emp_id: '' })] }))).toEqual({
      ok: false,
      error: 'errors.invalidEmpId',
    })
    expect(parseBackup(backupRecord({ employees: [employeeRecord({ name: ' ' })] }))).toEqual({
      ok: false,
      error: 'errors.requiredName',
    })
    expect(parseBackup(backupRecord({ employees: [employeeRecord({ duty: 'chef' })] }))).toEqual({
      ok: false,
      error: 'errors.invalidDuty',
    })
    expect(
      parseBackup(backupRecord({ employees: [employeeRecord({ contract: 'other' })] })),
    ).toEqual({ ok: false, error: 'errors.invalidContract' })
    expect(parseBackup(backupRecord({ employees: [employeeRecord({ weeklyHours: 0 })] }))).toEqual({
      ok: false,
      error: 'errors.weeklyHours',
    })
    expect(
      parseBackup(backupRecord({ employees: [employeeRecord({ holidays: 'nope' })] })),
    ).toEqual({ ok: false, error: 'errors.invalidHolidays' })
    expect(
      parseBackup(
        backupRecord({
          employees: [employeeRecord({ holidays: [{ year: 2026, week: 99 }] })],
        }),
      ),
    ).toEqual({ ok: false, error: 'errors.invalidHolidays' })
    expect(parseBackup(backupRecord({ employees: [employeeRecord({ active: 'true' })] }))).toEqual({
      ok: false,
      error: 'errors.invalidActive',
    })
    expect(
      parseBackup(backupRecord({ employees: [employeeRecord({ startDate: '2026-13-01' })] })),
    ).toEqual({ ok: false, error: 'errors.invalidStartDate' })
    expect(parseBackup(backupRecord({ employees: [employeeRecord({ endDate: 'nope' })] }))).toEqual(
      { ok: false, error: 'errors.invalidEndDate' },
    )
    expect(
      parseBackup(
        backupRecord({
          employees: [employeeRecord({ startDate: '2026-05-01', endDate: '2026-04-01' })],
        }),
      ),
    ).toEqual({ ok: false, error: 'errors.endBeforeStart' })
    expect(parseBackup(backupRecord({ employees: [employeeRecord({ active: false })] }))).toEqual({
      ok: false,
      error: 'errors.endRequiredInactive',
    })
    expect(
      parseBackup(
        backupRecord({
          employees: [employeeRecord({ active: true, endDate: '2026-12-31' })],
        }),
      ),
    ).toEqual({ ok: false, error: 'errors.endNotAllowedActive' })
    expect(parseBackup(backupRecord({ employees: [employeeRecord({ email: 1 })] }))).toEqual({
      ok: false,
      error: 'errors.invalidEmail',
    })
    expect(parseBackup(backupRecord({ employees: [employeeRecord({ phone: 1 })] }))).toEqual({
      ok: false,
      error: 'errors.invalidPhone',
    })
  })

  it('rejects duplicate employee ids', () => {
    expect(
      parseBackup(
        backupRecord({
          employees: [employeeRecord(), employeeRecord({ name: 'Ada again' })],
        }),
      ),
    ).toEqual({ ok: false, error: 'errors.duplicateEmpId' })
  })

  it('validates schedule structure and employee references', () => {
    expect(parseBackup(withSchedules([]))).toEqual({
      ok: false,
      error: 'archive.invalidBackup',
    })
    expect(parseBackup(withSchedules({ '26': {} }))).toEqual({
      ok: false,
      error: 'archive.invalidWeek',
    })
    expect(parseBackup(withSchedules({ '2026': { '0': {} } }))).toEqual({
      ok: false,
      error: 'archive.invalidWeek',
    })
    expect(parseBackup(withSchedules({ '2026': { '54': {} } }))).toEqual({
      ok: false,
      error: 'archive.invalidWeek',
    })
    expect(
      parseBackup(
        withSchedules({
          '2026': { '45': { 'EMP-9999': [] } },
        }),
      ),
    ).toEqual({ ok: false, error: 'errors.unknownEmpId' })
    expect(
      parseBackup(
        withSchedules({
          '2026': { '45': { 'EMP-0001': 'nope' } },
        }),
      ),
    ).toEqual({ ok: false, error: 'archive.invalidBackup' })
    expect(
      parseBackup(
        withSchedules({
          '2026': {
            '45': {
              'EMP-0001': [{ weekday: 'monday', startMinute: 600, endMinute: 540 }],
            },
          },
        }),
      ),
    ).toEqual({ ok: false, error: 'errors.shiftTimes' })
    expect(
      parseBackup(
        withSchedules({
          '2026': {
            '45': {
              'EMP-0001': [{ weekday: 'monday', startMinute: 540, endMinute: 1501 }],
            },
          },
        }),
      ),
    ).toEqual({ ok: false, error: 'errors.shiftTimes' })
    expect(
      parseBackup(
        withSchedules({
          '2026': {
            '45': {
              'EMP-0001': [{ weekday: 'funday', startMinute: 540, endMinute: 600 }],
            },
          },
        }),
      ),
    ).toEqual({ ok: false, error: 'errors.shiftTimes' })
  })

  it('ignores empty schedule arrays and validates days off', () => {
    const parsed = parseBackup(
      withSchedules({
        '2026': {
          '45': {
            'EMP-0001': [],
          },
        },
      }),
    )

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.schedules).toEqual({})

    expect(
      parseBackup(
        backupRecord({
          dayOffs: {
            '2026': {
              '45': {
                'EMP-9999': ['monday'],
              },
            },
          },
        }),
      ),
    ).toEqual({ ok: false, error: 'errors.unknownEmpId' })
    expect(
      parseBackup(
        backupRecord({
          dayOffs: {
            '2026': {
              '45': {
                'EMP-0001': ['funday'],
              },
            },
          },
        }),
      ),
    ).toEqual({ ok: false, error: 'archive.invalidBackup' })
    expect(
      parseBackup(
        backupRecord({
          dayOffs: {
            '2026': {
              '45': {
                'EMP-0001': 'monday',
              },
            },
          },
        }),
      ),
    ).toEqual({ ok: false, error: 'archive.invalidBackup' })
  })

  it('validates the current week key', () => {
    expect(parseBackup(backupRecord({ currentWeekKey: '2026-11-02' }))).toMatchObject({
      ok: true,
    })
    expect(parseBackup(backupRecord({ currentWeekKey: 'nope' }))).toEqual({
      ok: false,
      error: 'archive.invalidBackup',
    })
  })
})

describe('gzipJson / gunzipJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('round-trips JSON through gzip', async () => {
    const value = { hello: 'world', nested: { count: 3 }, list: [1, 2, 3] }
    const blob = await gzipJson(value)

    expect(blob.type).toBe(BACKUP_MIME)
    expect(await gunzipJson(blob)).toEqual(value)
  })

  it('reports when compression is unavailable', async () => {
    vi.stubGlobal('CompressionStream', undefined)
    await expect(gzipJson({})).rejects.toThrow('compression-unsupported')

    vi.stubGlobal('DecompressionStream', undefined)
    expect(await readBackupFile(new Blob([new Uint8Array([1, 2, 3])]))).toEqual({
      ok: false,
      error: 'archive.compressionUnsupported',
    })
  })
})

describe('readBackupFile', () => {
  it('reads and parses a gzipped backup blob', async () => {
    const value = { format: BACKUP_FORMAT, version: BACKUP_VERSION, employees: [] }
    const result = await readBackupFile(await gzipJson(value))

    expect(result).toEqual({ ok: true, value })
  })

  it('rejects files above the size limit', async () => {
    const blob = new Blob(['x'])
    Object.defineProperty(blob, 'size', { value: MAX_BACKUP_BYTES + 1 })

    expect(await readBackupFile(blob)).toEqual({
      ok: false,
      error: 'archive.backupTooLarge',
    })
  })

  it('rejects data that is not a gzip file', async () => {
    expect(await readBackupFile(new Blob([new Uint8Array([1, 2, 3])]))).toEqual({
      ok: false,
      error: 'archive.invalidBackup',
    })
  })
})
