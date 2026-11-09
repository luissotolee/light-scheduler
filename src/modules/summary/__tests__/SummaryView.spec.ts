import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import SummaryView from '@/modules/summary/views/SummaryView.vue'
import { useLocaleStore } from '@/shared/stores/locale'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { Shift, TeamMember } from '@/types'
import { getIsoWeek, getWeekKey } from '@/shared/utils/calendar'

const weekKey = '2026-11-02'

function member(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'member-1',
    empId: 'EMP-0001',
    name: 'Ada',
    duty: 'employee',
    contract: 'fulltime',
    weeklyHours: 40,
    holidays: [],
    active: true,
    startDate: '2025-01-01',
    ...overrides,
  }
}

function shift(
  id: string,
  weekday: Shift['weekday'],
  startMinute: number,
  endMinute: number,
): Shift {
  return { id, memberId: 'member-1', weekday, startMinute, endMinute }
}

describe('SummaryView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function seed(
    members: TeamMember[] = [member()],
    shifts: Shift[] = [shift('shift-1', 'monday', 540, 720)],
  ) {
    const workspace = useWorkspaceStore()
    workspace.setMembers(members)
    workspace.setCurrentWeekKey(weekKey)
    workspace.setShiftsForWeek(weekKey, shifts)
    return workspace
  }

  function mountView() {
    return mount(SummaryView, { global: { plugins: [pinia, PrimeVue] } })
  }

  it('renders the week range and navigation controls', () => {
    seed()
    const wrapper = mountView()

    expect(wrapper.get('[data-test="summary-week-label"]').text()).toBe('Nov 2 – Nov 8, 2026')
    expect(wrapper.find('[data-test="summary-previous-week"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="summary-next-week"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="summary-this-week"]').exists()).toBe(true)
  })

  it('renders the weekly table with weekday headers', () => {
    seed()
    const wrapper = mountView()
    const table = wrapper.get('[data-test="summary-table"]')

    expect(table.text()).toContain('Employee')
    expect(table.text()).toContain('Monday')
    expect(table.text()).toContain('Sunday')
  })

  it('renders two shifts inside one weekday cell', () => {
    seed([member()], [shift('shift-1', 'monday', 540, 720), shift('shift-2', 'monday', 840, 1080)])
    const wrapper = mountView()
    const cell = wrapper.get('[data-test="summary-cell-member-1-monday"]')

    expect(cell.findAll('.summary-cell__shift').map((item) => item.text())).toEqual([
      '09:00–12:00',
      '14:00–18:00',
    ])
  })

  it('shows OFF on days without shifts', () => {
    seed()
    const wrapper = mountView()

    expect(wrapper.get('[data-test="summary-cell-member-1-tuesday"]').text()).toBe('OFF')
  })

  it('shows a VACATIONS row for members on holiday', () => {
    seed([member({ holidays: [getIsoWeek(new Date(2026, 10, 2))] })])
    const wrapper = mountView()

    expect(wrapper.get('[data-test="summary-vacation"]').text()).toBe('VACATIONS')
    expect(wrapper.get('[data-test="summary-row-member-1"]').classes()).toContain(
      'summary-table__row--vacation',
    )
  })

  it('moves the shared workspace week with the controls', async () => {
    const workspace = seed()
    const wrapper = mountView()

    await wrapper.get('[data-test="summary-next-week"]').trigger('click')
    expect(workspace.currentWeekKey).toBe('2026-11-09')
    expect(wrapper.get('[data-test="summary-week-label"]').text()).toBe('Nov 9 – Nov 15, 2026')

    await wrapper.get('[data-test="summary-previous-week"]').trigger('click')
    expect(workspace.currentWeekKey).toBe(weekKey)

    await wrapper.get('[data-test="summary-next-week"]').trigger('click')
    await wrapper.get('[data-test="summary-this-week"]').trigger('click')
    expect(workspace.currentWeekKey).toBe(getWeekKey(new Date()))
  })

  it('opens the browser print dialog', async () => {
    seed()
    const print = vi.fn()
    vi.stubGlobal('print', print)
    const wrapper = mountView()

    await wrapper.get('[data-test="print-summary"]').trigger('click')

    expect(print).toHaveBeenCalledOnce()
  })

  it('downloads a PDF without opening the print dialog', async () => {
    seed()
    const print = vi.fn()
    vi.stubGlobal('print', print)
    const blobs: Blob[] = []
    const createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob)
      return 'blob:test'
    })
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    let downloadName = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.download
    })
    const wrapper = mountView()

    await wrapper.get('[data-test="save-summary-pdf"]').trigger('click')

    expect(print).not.toHaveBeenCalled()
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
    expect(downloadName).toBe('2026-11_Schedule_2nd.pdf')
    expect(blobs[0]?.type).toBe('application/pdf')
  })

  it('localizes labels and weekdays to Spanish live', async () => {
    seed([member()], [])
    const wrapper = mountView()

    useLocaleStore().setLocale('es')
    await nextTick()

    expect(wrapper.get('[data-test="summary-week-label"]').text()).toBe('2 nov – 8 nov, 2026')
    expect(wrapper.get('[data-test="summary-table"]').text()).toContain('Lunes')
    expect(wrapper.get('[data-test="summary-cell-member-1-monday"]').text()).toBe('LIBRE')
  })

  it('shows an empty state when there are no employees', () => {
    seed([])
    const wrapper = mountView()

    expect(wrapper.find('[data-test="summary-table"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('No employees this week')
  })

  it('exposes the print zoom on the sheet', () => {
    seed()
    const wrapper = mountView()

    expect(wrapper.get('.summary__sheet').attributes('style')).toContain('--summary-print-zoom: 1')
  })
})
