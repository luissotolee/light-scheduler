import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CsvView from '@/views/CsvView.vue'
import { useWorkspaceStore } from '@/stores/workspace'

describe('CsvView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function mountView() {
    return mount(CsvView, { global: { plugins: [pinia] } })
  }

  it('disables exports and imports when there is no data', () => {
    const wrapper = mountView()

    expect(wrapper.find('[data-test="export-employees"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="export-schedule"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="upload-employees"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="upload-schedule"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('coming soon')
    expect(wrapper.find('[data-test="status"]').exists()).toBe(false)
  })

  it('exports employees and schedules with status messages', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([{ id: 'member-1', name: 'Ada', email: 'ada@example.com' }])
    workspace.setShiftsForWeek('2026-11-02', [
      {
        id: 'shift-1',
        memberId: 'member-1',
        weekday: 'monday',
        startMinute: 540,
        endMinute: 1020,
      },
    ])
    const wrapper = mountView()

    expect(wrapper.find('[data-test="export-employees"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-test="export-schedule"]').attributes('disabled')).toBeUndefined()

    await wrapper.find('[data-test="export-employees"]').trigger('click')
    expect(wrapper.find('[data-test="status"]').text()).toBe('Employees exported')

    await wrapper.find('[data-test="export-schedule"]').trigger('click')
    expect(wrapper.find('[data-test="status"]').text()).toBe('Schedule exported')
  })
})
