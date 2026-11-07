import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { TeamMember } from '@/types'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { parseCsv, toCsv } from '@/shared/utils/csv'
import { downloadTextFile, timestampedName } from '@/shared/utils/download'
import { EMPLOYEE_HEADERS, employeesToRows, validateEmployees } from '@/shared/utils/employee'
import { createId } from '@/shared/utils/id'
import { formatMinutesToHhmm } from '@/shared/utils/shifts'

export type CsvStatusState = 'idle' | 'success' | 'error'

export interface CsvStatus {
  state: CsvStatusState
  message: string | null
}

export const useCsvStore = defineStore('csv', () => {
  const status = ref<CsvStatus>({ state: 'idle', message: null })

  function workspace() {
    return useWorkspaceStore()
  }

  const canExportMembers = computed(() => workspace().members.length > 0)
  const canExportSchedule = computed(() => workspace().currentWeekShifts.length > 0)

  function exportMembers(): void {
    const members = workspace().members
    if (members.length === 0) {
      status.value = { state: 'error', message: 'No employees to export' }
      return
    }

    const text = `\uFEFF${toCsv([...EMPLOYEE_HEADERS], employeesToRows(members))}`
    downloadTextFile(timestampedName('employees', 'csv'), text)
    status.value = { state: 'success', message: 'Employees exported' }
  }

  function importMembers(text: string): void {
    const parsed = parseCsv(text)
    if (!parsed.ok) {
      status.value = { state: 'error', message: parsed.error }
      return
    }

    const validated = validateEmployees(parsed.headers, parsed.rows)
    if (!validated.ok) {
      const first = validated.errors[0]
      status.value = {
        state: 'error',
        message: first ? `Row ${first.row}: ${first.message}` : 'Import failed',
      }
      return
    }

    const members: TeamMember[] = validated.data.map((member) => {
      const email = member.email?.trim()
      const phone = member.phone?.trim()
      return {
        id: createId(),
        name: member.name,
        duty: member.duty,
        contract: member.contract,
        weeklyHours: member.weeklyHours,
        holidays: member.holidays ?? [],
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      }
    })

    workspace().setMembers(members)
    status.value = {
      state: 'success',
      message: `Imported ${members.length} ${members.length === 1 ? 'employee' : 'employees'}`,
    }
  }

  function setError(message: string): void {
    status.value = { state: 'error', message }
  }

  function exportSchedule(): void {
    const shifts = workspace().currentWeekShifts
    if (shifts.length === 0) {
      status.value = { state: 'error', message: 'No shifts to export for this week' }
      return
    }

    const rows = shifts.map((shift) => {
      const member = workspace().findMember(shift.memberId)
      return [
        member?.name ?? shift.memberId,
        shift.weekday,
        formatMinutesToHhmm(shift.startMinute),
        formatMinutesToHhmm(shift.endMinute),
      ]
    })
    const text = `\uFEFF${toCsv(['member', 'weekday', 'start', 'end'], rows)}`
    downloadTextFile(timestampedName('schedule', 'csv'), text)
    status.value = { state: 'success', message: 'Schedule exported' }
  }

  function resetStatus(): void {
    status.value = { state: 'idle', message: null }
  }

  return {
    status,
    canExportMembers,
    canExportSchedule,
    exportMembers,
    exportSchedule,
    importMembers,
    setError,
    resetStatus,
  }
})
