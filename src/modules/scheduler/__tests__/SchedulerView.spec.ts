import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SchedulerView from '@/modules/scheduler/views/SchedulerView.vue'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { Shift } from '@/types'
import { formatWeekRange, getWeekKey } from '@/shared/utils/calendar'

const shift: Shift = {
  id: 'shift-1',
  memberId: 'member-1',
  weekday: 'monday',
  startMinute: 540,
  endMinute: 720,
}

describe('SchedulerView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountView() {
    return mount(SchedulerView, { global: { plugins: [pinia] } })
  }

  it('shows the current week with an empty state', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain(formatWeekRange(getWeekKey(new Date())))
    expect(wrapper.text()).toContain('Shifts this week: 0')
    expect(wrapper.text()).toContain('No shifts this week yet')
    expect(wrapper.find('[data-test="add-shift"]').attributes('disabled')).toBeDefined()
  })

  it('navigates to the next and previous week', async () => {
    const workspace = useWorkspaceStore()
    const initialWeekKey = workspace.currentWeekKey
    const wrapper = mountView()

    await wrapper.find('[data-test="next-week"]').trigger('click')
    expect(workspace.currentWeekKey).not.toBe(initialWeekKey)
    expect(wrapper.text()).toContain(formatWeekRange(workspace.currentWeekKey))

    await wrapper.find('[data-test="previous-week"]').trigger('click')
    expect(workspace.currentWeekKey).toBe(initialWeekKey)
  })

  it('renders shifts for the selected week', () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setShiftsForWeek('2026-11-02', [shift])
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Shifts this week: 1')
    expect(wrapper.find('.scheduler__shift').text()).toContain('09:00–12:00')
    expect(wrapper.text()).not.toContain('No shifts this week yet')
  })
})
