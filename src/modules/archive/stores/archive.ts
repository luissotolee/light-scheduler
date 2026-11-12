import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { TeamMember } from '@/types'
import type { MessageKey } from '@/shared/i18n/messages/en'
import { useSchedulerSettingsStore } from '@/modules/scheduler/stores/schedulerSettings'
import { useLocaleStore } from '@/shared/stores/locale'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import {
  BACKUP_EXTENSION,
  buildBackup,
  gzipJson,
  parseBackup,
  readBackupFile,
  type BackupData,
  type BackupSettings,
} from '@/shared/utils/archiveBackup'
import { todayIsoDate } from '@/shared/utils/calendar'
import { parseCsv, toCsv } from '@/shared/utils/csv'
import type { CsvStatus } from '@/shared/utils/csv'
import { downloadBlob, downloadTextFile, timestampedName } from '@/shared/utils/download'
import {
  EMPLOYEE_HEADERS,
  createEmpId,
  employeesToRows,
  validateEmployees,
} from '@/shared/utils/employee'
import { createId } from '@/shared/utils/id'
import {
  buildScheduleCsvRows,
  SCHEDULE_HEADERS,
  validateScheduleCsv,
} from '@/shared/utils/scheduleCsv'
import type { ImportedScheduleData } from '@/shared/utils/scheduleCsv'

export const useArchiveStore = defineStore('archive', () => {
  const status = ref<CsvStatus>({ state: 'idle', message: null })
  const scheduleImportData = ref<ImportedScheduleData | null>(null)
  const scheduleImportVisible = ref(false)
  const backupImportData = ref<BackupData | null>(null)
  const backupImportVisible = ref(false)

  function workspace() {
    return useWorkspaceStore()
  }

  const canExportMembers = computed(() => workspace().members.length > 0)
  const canExportBackup = computed(() => workspace().hasAnyData)
  const canExportSchedule = computed(() =>
    Object.values(workspace().schedules).some((shifts) => shifts.length > 0),
  )

  function exportMembers(): void {
    const members = workspace().members
    if (members.length === 0) {
      status.value = {
        state: 'error',
        message: { kind: 'simple', code: 'archive.noEmployees' },
      }
      return
    }

    const text = `\uFEFF${toCsv([...EMPLOYEE_HEADERS], employeesToRows(members))}`
    downloadTextFile(timestampedName('employees', 'csv'), text)
    status.value = {
      state: 'success',
      message: { kind: 'simple', code: 'archive.employeesExported' },
    }
  }

  function importMembers(text: string): void {
    const parsed = parseCsv(text)
    if (!parsed.ok) {
      status.value = {
        state: 'error',
        message: { kind: 'simple', code: parsed.error },
      }
      return
    }

    const validated = validateEmployees(parsed.headers, parsed.rows)
    if (!validated.ok) {
      const first = validated.errors[0]
      status.value = {
        state: 'error',
        message: first
          ? { kind: 'rowError', row: first.row, messageCode: first.message }
          : { kind: 'simple', code: 'archive.importFailed' },
      }
      return
    }

    const existingByEmpId = new Map(workspace().members.map((member) => [member.empId, member]))
    const usedEmpIds = new Set<string>()
    for (const record of validated.data) {
      if (record.empId) usedEmpIds.add(record.empId)
    }

    const members: TeamMember[] = validated.data.map((record) => {
      const email = record.email?.trim()
      const phone = record.phone?.trim()
      const comment = record.comment?.trim()
      const active = record.active ?? true
      const empId = record.empId ?? createEmpId([...usedEmpIds])
      usedEmpIds.add(empId)
      const existing = existingByEmpId.get(empId)

      return {
        id: existing?.id ?? createId(),
        name: record.name,
        duty: record.duty,
        contract: record.contract,
        weeklyHours: record.weeklyHours,
        holidays: record.holidays ?? [],
        active,
        startDate: record.startDate ?? todayIsoDate(),
        ...(active === false && record.endDate ? { endDate: record.endDate } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...(comment ? { comment } : {}),
        empId,
      }
    })

    workspace().setMembers(members)
    status.value = {
      state: 'success',
      message: {
        kind: 'simple',
        code: members.length === 1 ? 'archive.importedOne' : 'archive.importedMany',
        params: { count: members.length },
      },
    }
  }

  function prepareScheduleImport(text: string): boolean {
    scheduleImportData.value = null
    scheduleImportVisible.value = false

    const parsed = parseCsv(text)
    if (!parsed.ok) {
      status.value = {
        state: 'error',
        message: { kind: 'simple', code: parsed.error },
      }
      return false
    }

    const validated = validateScheduleCsv(parsed.headers, parsed.rows, workspace().members)
    if (!validated.ok) {
      const first = validated.errors[0]
      status.value = {
        state: 'error',
        message: first
          ? { kind: 'rowError', row: first.row, messageCode: first.message }
          : { kind: 'simple', code: 'archive.importFailed' },
      }
      return false
    }

    if (validated.data.shiftCount === 0) {
      status.value = {
        state: 'error',
        message: { kind: 'simple', code: 'archive.noScheduleRows' },
      }
      return false
    }

    scheduleImportData.value = validated.data
    scheduleImportVisible.value = true
    status.value = { state: 'idle', message: null }
    return true
  }

  function confirmScheduleImport(): void {
    const data = scheduleImportData.value
    if (!data) return

    workspace().replaceScheduleData(data.schedules, data.dayOffs)

    const importedWeeks = Object.keys(data.schedules).sort()
    const currentHasShifts = importedWeeks.includes(workspace().currentWeekKey)
    if (!currentHasShifts && importedWeeks.length > 0) {
      workspace().setCurrentWeekKey(importedWeeks[0])
    }

    status.value = {
      state: 'success',
      message: {
        kind: 'simple',
        code:
          data.shiftCount === 1 ? 'archive.schedulesImportedOne' : 'archive.schedulesImportedMany',
        params: { count: data.shiftCount },
      },
    }

    scheduleImportData.value = null
    scheduleImportVisible.value = false
  }

  function cancelScheduleImport(): void {
    scheduleImportData.value = null
    scheduleImportVisible.value = false
    status.value = { state: 'idle', message: null }
  }

  function setError(message: MessageKey): void {
    status.value = { state: 'error', message: { kind: 'simple', code: message } }
  }

  function applyBackupSettings(settings: BackupSettings | undefined): void {
    if (!settings) return
    if (settings.locale) useLocaleStore().setLocale(settings.locale)
    if (settings.scheduler) useSchedulerSettingsStore().applySettings(settings.scheduler)
  }

  function exportSchedule(): void {
    const rows = buildScheduleCsvRows(
      workspace().members,
      workspace().schedules,
      workspace().dayOffs,
    )

    if (rows.length === 0) {
      status.value = {
        state: 'error',
        message: { kind: 'simple', code: 'archive.noShifts' },
      }
      return
    }

    const text = `\uFEFF${toCsv([...SCHEDULE_HEADERS], rows)}`
    downloadTextFile(timestampedName('schedule', 'csv'), text)
    status.value = {
      state: 'success',
      message: { kind: 'simple', code: 'archive.scheduleExported' },
    }
  }

  async function exportBackup(): Promise<void> {
    const workspaceStore = workspace()
    if (!workspaceStore.hasAnyData) {
      status.value = {
        state: 'error',
        message: { kind: 'simple', code: 'archive.noData' },
      }
      return
    }

    try {
      const backup = buildBackup(
        workspaceStore.members,
        workspaceStore.schedules,
        workspaceStore.dayOffs,
        workspaceStore.currentWeekKey,
        {
          locale: useLocaleStore().locale,
          scheduler: { ...useSchedulerSettingsStore().settings },
        },
        new Date(),
        workspaceStore.calendar,
      )
      const blob = await gzipJson(backup)
      downloadBlob(timestampedName('backup', BACKUP_EXTENSION), blob)
      status.value = {
        state: 'success',
        message: { kind: 'simple', code: 'archive.backupExported' },
      }
    } catch {
      setError('archive.compressionUnsupported')
    }
  }

  async function prepareBackupImport(file: Blob): Promise<boolean> {
    backupImportData.value = null
    backupImportVisible.value = false

    const read = await readBackupFile(file)
    if (!read.ok) {
      setError(read.error)
      return false
    }

    const parsed = parseBackup(read.value)
    if (!parsed.ok) {
      setError(parsed.error)
      return false
    }

    backupImportData.value = parsed.data
    backupImportVisible.value = true
    status.value = { state: 'idle', message: null }
    return true
  }

  function confirmBackupImport(): void {
    const data = backupImportData.value
    if (!data) return

    const workspaceStore = workspace()
    workspaceStore.setMembers(data.members)
    workspaceStore.replaceScheduleData(data.schedules, data.dayOffs)
    workspaceStore.setCalendar(data.calendar)

    if (data.currentWeekKey) {
      workspaceStore.setCurrentWeekKey(data.currentWeekKey)
    } else {
      const weekKeys = Object.keys(data.schedules).sort()
      if (weekKeys.length > 0 && !weekKeys.includes(workspaceStore.currentWeekKey)) {
        workspaceStore.setCurrentWeekKey(weekKeys[0])
      }
    }

    applyBackupSettings(data.settings)

    status.value = {
      state: 'success',
      message: { kind: 'simple', code: 'archive.backupImported' },
    }

    backupImportData.value = null
    backupImportVisible.value = false
  }

  function cancelBackupImport(): void {
    backupImportData.value = null
    backupImportVisible.value = false
    status.value = { state: 'idle', message: null }
  }

  function resetStatus(): void {
    status.value = { state: 'idle', message: null }
  }

  return {
    status,
    scheduleImportVisible,
    backupImportVisible,
    canExportMembers,
    canExportBackup,
    canExportSchedule,
    exportMembers,
    exportSchedule,
    exportBackup,
    importMembers,
    prepareScheduleImport,
    confirmScheduleImport,
    cancelScheduleImport,
    prepareBackupImport,
    confirmBackupImport,
    cancelBackupImport,
    setError,
    resetStatus,
  }
})

export type { CsvStatus, CsvStatusMessage, CsvStatusState } from '@/shared/utils/csv'
