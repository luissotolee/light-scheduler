import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { toCsv } from '@/utils/csv'
import { downloadTextFile, timestampedName } from '@/utils/download'
import { formatMinutesToHhmm } from '@/utils/shifts'

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

    const rows = members.map((member) => [member.name, member.email ?? ''])
    const text = `\uFEFF${toCsv(['name', 'email'], rows)}`
    downloadTextFile(timestampedName('employees', 'csv'), text)
    status.value = { state: 'success', message: 'Employees exported' }
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
    resetStatus,
  }
})
