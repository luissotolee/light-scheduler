import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SummaryView from '@/views/SummaryView.vue'
import { useWorkspaceStore } from '@/stores/workspace'
import type { Shift } from '@/types'

const shifts: Shift[] = [
  { id: 'shift-1', memberId: 'member-1', weekday: 'monday', startMinute: 540, endMinute: 720 },
  { id: 'shift-2', memberId: 'member-1', weekday: 'tuesday', startMinute: 540, endMinute: 720 },
  { id: 'shift-3', memberId: 'member-2', weekday: 'monday', startMinute: 780, endMinute: 900 },
]

describe('SummaryView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mountView() {
    return mount(SummaryView, { global: { plugins: [pinia] } })
  }

  it('renders the selected week and its totals', () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setShiftsForWeek('2026-11-02', shifts)
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Nov 2 – Nov 8, 2026')
    expect(wrapper.find('[data-test="total-shifts"]').text()).toBe('3')
    expect(wrapper.find('[data-test="assigned-members"]').text()).toBe('2')
  })

  it('prints the page and disables PDF export', async () => {
    const print = vi.fn()
    vi.stubGlobal('print', print)
    const wrapper = mountView()

    await wrapper.find('[data-test="print"]').trigger('click')

    expect(print).toHaveBeenCalledOnce()
    expect(wrapper.find('[data-test="save-pdf"]').attributes('disabled')).toBeDefined()
  })
})
