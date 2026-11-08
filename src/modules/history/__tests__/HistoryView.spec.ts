import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HistoryView from '@/modules/history/views/HistoryView.vue'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { Shift } from '@/types'

const shift: Shift = {
  id: 'shift-1',
  memberId: 'member-1',
  weekday: 'monday',
  startMinute: 540,
  endMinute: 720,
}

describe('HistoryView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountView() {
    return mount(HistoryView, { global: { plugins: [pinia] } })
  }

  it('lists weeks sorted and selects one', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-09')
    workspace.setShiftsForWeek('2026-10-26', [shift])
    workspace.setShiftsForWeek('2026-11-02', [])
    const wrapper = mountView()

    const weeks = wrapper.findAll('.history__week')
    expect(weeks.map((week) => week.text())).toEqual([
      'Oct 26 – Nov 1, 2026',
      'Nov 2 – Nov 8, 2026',
      'Nov 9 – Nov 15, 2026',
    ])
    expect(wrapper.find('[data-test="selected-count"]').text()).toContain('0')

    await weeks[0].trigger('click')

    expect(weeks[0].attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-test="selected-count"]').text()).toContain('1')
  })

  it('starts with the current week when nothing is archived', () => {
    const wrapper = mountView()

    expect(wrapper.findAll('.history__week')).toHaveLength(1)
    expect(wrapper.find('[data-test="selected-count"]').text()).toContain('0')
  })
})
