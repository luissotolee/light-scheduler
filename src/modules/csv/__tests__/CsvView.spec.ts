import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import CsvView from '@/modules/csv/views/CsvView.vue'
import { useLocaleStore } from '@/shared/stores/locale'
import { useWorkspaceStore } from '@/shared/stores/workspace'

describe('CsvView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
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

  async function upload(wrapper: ReturnType<typeof mountView>, file: File): Promise<void> {
    const input = wrapper.find('[data-test="employee-file"]')
    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    })
    await input.trigger('change')
    await flushPromises()
  }

  it('disables exports while enabling the employee upload flow', () => {
    const wrapper = mountView()

    expect(wrapper.find('[data-test="export-employees"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="export-schedule"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="upload-employees"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-test="upload-schedule"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Upload an employees CSV')
    expect(wrapper.find('[data-test="status"]').exists()).toBe(false)
  })

  it('opens the employee file picker from the upload button', async () => {
    const wrapper = mountView()
    const input = wrapper.find('[data-test="employee-file"]')
    const click = vi.spyOn(input.element as HTMLInputElement, 'click')

    await wrapper.find('[data-test="upload-employees"]').trigger('click')

    expect(click).toHaveBeenCalledOnce()
  })

  it('exports employees and schedules with status messages', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([
      {
        id: 'member-1',
        name: 'Ada',
        duty: 'manager',
        contract: 'fulltime',
        weeklyHours: 40,
        holidays: [],
        email: 'ada@example.com',
        active: true,
        startDate: '2025-01-15',
      },
    ])
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

  it('imports employees from an uploaded CSV', async () => {
    const workspace = useWorkspaceStore()
    const wrapper = mountView()
    const file = new File(
      ['name,duty,contract,weeklyHours,holidays\r\n' + 'Ada,manager,fulltime,40,2026-W10'],
      'employees.csv',
      { type: 'text/csv' },
    )

    await upload(wrapper, file)

    expect(wrapper.find('[data-test="status"]').text()).toBe('Imported 1 employee')
    expect(workspace.members[0]).toMatchObject({
      name: 'Ada',
      duty: 'manager',
      weeklyHours: 40,
      holidays: [{ year: 2026, week: 10 }],
    })
  })

  it('surfaces invalid CSV errors from an upload', async () => {
    const wrapper = mountView()
    const file = new File(['name,email\r\nAda,ada@example.com'], 'employees.csv', {
      type: 'text/csv',
    })

    await upload(wrapper, file)

    expect(wrapper.find('[data-test="status"]').text()).toBe('Row 1: Unexpected CSV headers')
  })

  it('renders Spanish copy and statuses live', async () => {
    const workspace = useWorkspaceStore()
    workspace.setMembers([
      {
        id: 'member-1',
        name: 'Ada',
        duty: 'manager',
        contract: 'fulltime',
        weeklyHours: 40,
        holidays: [],
        active: true,
        startDate: '2025-01-15',
      },
    ])
    const wrapper = mountView()

    useLocaleStore().setLocale('es')
    await nextTick()

    expect(wrapper.text()).toContain('Exportar empleados')
    expect(wrapper.text()).toContain('Subir empleados')

    await wrapper.find('[data-test="export-employees"]').trigger('click')
    expect(wrapper.find('[data-test="status"]').text()).toBe('Empleados exportados')
  })

  it('rejects files larger than 5 MB', async () => {
    const workspace = useWorkspaceStore()
    const wrapper = mountView()
    const file = new File(['name'], 'employees.csv', { type: 'text/csv' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 + 1 })

    await upload(wrapper, file)

    expect(wrapper.find('[data-test="status"]').text()).toBe('CSV file is too large (max 5 MB)')
    expect(workspace.members).toEqual([])
  })
})
