import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import SchedulerView from '@/modules/scheduler/views/SchedulerView.vue'
import ShiftGrid from '@/modules/scheduler/components/ShiftGrid.vue'
import HolidayWeeksDialog from '@/shared/components/HolidayWeeksDialog.vue'
import { useSchedulerStore } from '@/modules/scheduler/stores/scheduler'
import { useSchedulerSettingsStore } from '@/modules/scheduler/stores/schedulerSettings'
import { useLocaleStore } from '@/shared/stores/locale'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import type { Shift, TeamMember } from '@/types'
import { formatWeekRange, getIsoWeek, getWeekKey } from '@/shared/utils/calendar'

const ada: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
  name: 'Ada',
  duty: 'manager',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [],
  active: true,
  startDate: '2025-01-15',
}

const bo: TeamMember = {
  id: 'member-2',
  empId: 'EMP-0002',
  name: 'Bo',
  duty: 'assistant',
  contract: 'part_time',
  weeklyHours: 20,
  holidays: [],
  active: true,
  startDate: '2026-01-01',
}

const mondayShift: Shift = {
  id: 'shift-1',
  memberId: 'member-1',
  weekday: 'monday',
  startMinute: 540,
  endMinute: 720,
}

const tuesdayShift: Shift = {
  id: 'shift-2',
  memberId: 'member-2',
  weekday: 'tuesday',
  startMinute: 600,
  endMinute: 660,
}

describe('SchedulerView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
    pinia = createPinia()
    setActivePinia(pinia)
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mountView() {
    return mount(SchedulerView, {
      global: {
        plugins: [pinia, PrimeVue],
        stubs: { teleport: true },
        directives: { tooltip: Tooltip },
      },
    })
  }

  it('renders the week toolbar, weekday tabs, and an empty grid', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain(formatWeekRange(getWeekKey(new Date())))
    expect(wrapper.text()).not.toContain('Shifts this week')
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(7)
    expect(wrapper.find('[data-test="weekday-tab-monday"]').attributes('aria-selected')).toBe(
      'true',
    )
    expect(wrapper.find('[data-test="shift-grid"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No active employees are available on this day.')
  })

  it('renders icon-only week navigation controls with accessible labels', () => {
    const wrapper = mountView()
    const toolbar = wrapper.find('.scheduler__toolbar')
    const previous = toolbar.find('[data-test="previous-week"]')
    const next = toolbar.find('[data-test="next-week"]')

    expect(previous.element.tagName).toBe('BUTTON')
    expect(next.element.tagName).toBe('BUTTON')
    expect(previous.attributes('aria-label')).toBe('Previous week')
    expect(next.attributes('aria-label')).toBe('Next week')
    expect(previous.text()).toBe('')
    expect(next.text()).toBe('')
    expect(previous.find('.pi-chevron-left').exists()).toBe(true)
    expect(next.find('.pi-chevron-right').exists()).toBe(true)
    expect(toolbar.find('strong').text()).toBe(formatWeekRange(getWeekKey(new Date())))
  })

  it('renders a right-aligned restart button with an accessible label', () => {
    const wrapper = mountView()
    const actions = wrapper.find('.scheduler__actions')
    const restart = actions.find('[data-test="restart-week"]')

    expect(actions.exists()).toBe(true)
    expect(restart.element.tagName).toBe('BUTTON')
    expect(restart.attributes('aria-label')).toBe('Clear all')
    expect(restart.text()).toBe('')
    expect(restart.find('.pi-trash').exists()).toBe(true)
  })

  it('groups a settings button before clear all and opens the settings dialog', async () => {
    const wrapper = mountView()
    const actions = wrapper.find('.scheduler__actions')
    const settings = actions.find('[data-test="scheduler-settings"]')
    const restart = actions.find('[data-test="restart-week"]')

    expect(settings.element.tagName).toBe('BUTTON')
    expect(settings.attributes('aria-label')).toBe('Schedule settings')
    expect(settings.find('.pi-cog').exists()).toBe(true)
    expect(actions.element.firstElementChild).toBe(settings.element)
    expect(actions.element.lastElementChild).toBe(restart.element)
    expect(wrapper.find('[data-test="scheduler-settings-form"]').exists()).toBe(false)

    await settings.trigger('click')

    expect(wrapper.find('[data-test="scheduler-settings-form"]').exists()).toBe(true)
  })

  it('regenerates the grid minute cells when settings change', async () => {
    const settingsStore = useSchedulerSettingsStore()
    const wrapper = mountView()
    const minuteCells = () =>
      wrapper.findAll('.shift-grid__time-row:last-child .shift-grid__time-cell')

    expect(minuteCells()).toHaveLength(32)

    settingsStore.applySettings({
      startTime: '09:00',
      endTime: '01:00',
      slotMinutes: 15,
      showHourlyHeadcount: false,
    })
    await nextTick()
    expect(minuteCells()).toHaveLength(64)

    settingsStore.applySettings({
      startTime: '09:00',
      endTime: '12:00',
      slotMinutes: 30,
      showHourlyHeadcount: false,
    })
    await nextTick()
    expect(minuteCells()).toHaveLength(6)

    settingsStore.applySettings({
      startTime: '09:00',
      endTime: '12:00',
      slotMinutes: 15,
      showHourlyHeadcount: false,
    })
    await nextTick()
    expect(minuteCells()).toHaveLength(12)
  })

  it('shows hourly headcount chips when the setting is enabled', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada, bo])
    workspace.setShiftsForWeek('2026-11-02', [mondayShift])
    const settingsStore = useSchedulerSettingsStore()
    settingsStore.applySettings({
      startTime: '09:00',
      endTime: '12:00',
      slotMinutes: 30,
      showHourlyHeadcount: true,
    })
    const wrapper = mountView()

    const chips = wrapper.findAll('[data-test="hour-headcount"]')
    expect(chips).toHaveLength(3)
    expect(chips.map((chip) => chip.text())).toEqual(['1', '1', '1'])
  })

  it('combines selected day and restart button in the day header', () => {
    const wrapper = mountView()
    const dayHeader = wrapper.find('[data-test="scheduler-day-header"]')
    const selectedDay = dayHeader.find('[data-test="scheduler-selected-day"]')
    const restart = dayHeader.find('[data-test="restart-week"]')
    const content = wrapper.find('.scheduler__content')

    expect(dayHeader.exists()).toBe(true)
    expect(selectedDay.exists()).toBe(true)
    expect(restart.exists()).toBe(true)
    expect(content.element.firstElementChild).toBe(dayHeader.element)
    expect(wrapper.find('.scheduler__selected-day-wrapper').exists()).toBe(false)
  })

  it('clears the current week after confirming the restart dialog', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada, bo])
    workspace.setShiftsForWeek('2026-11-02', [mondayShift, tuesdayShift])
    workspace.setDayOffsForWeek('2026-11-02', [{ memberId: 'member-1', weekday: 'monday' }])
    const wrapper = mountView()

    expect(wrapper.find('[data-test="confirm-message"]').exists()).toBe(false)

    await wrapper.find('[data-test="restart-week"]').trigger('click')

    expect(wrapper.find('[data-test="confirm-message"]').text()).toBe(
      'This clears all shifts and days off for the current week. Team members are kept. This cannot be undone.',
    )

    await wrapper.find('[data-test="confirm-accept"]').trigger('click')

    expect(workspace.currentWeekShifts).toEqual([])
    expect(workspace.currentWeekDayOffs).toEqual([])
    expect(wrapper.find('[data-test="confirm-message"]').exists()).toBe(false)
  })

  it('keeps the current week when the restart dialog is cancelled', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada, bo])
    workspace.setShiftsForWeek('2026-11-02', [mondayShift, tuesdayShift])
    workspace.setDayOffsForWeek('2026-11-02', [{ memberId: 'member-1', weekday: 'monday' }])
    const wrapper = mountView()

    await wrapper.find('[data-test="restart-week"]').trigger('click')
    await wrapper.find('[data-test="confirm-cancel"]').trigger('click')

    expect(workspace.currentWeekShifts).toEqual([mondayShift, tuesdayShift])
    expect(workspace.currentWeekDayOffs).toEqual([{ memberId: 'member-1', weekday: 'monday' }])
    expect(wrapper.find('[data-test="confirm-message"]').exists()).toBe(false)
  })

  it('navigates to the next and previous week', async () => {
    const workspace = useWorkspaceStore()
    const initialWeekKey = workspace.currentWeekKey
    const wrapper = mountView()
    const toolbarLabel = () => wrapper.find('.scheduler__toolbar strong').text()

    expect(toolbarLabel()).toBe(formatWeekRange(initialWeekKey))

    await wrapper.find('[data-test="next-week"]').trigger('click')
    expect(workspace.currentWeekKey).not.toBe(initialWeekKey)
    expect(toolbarLabel()).toBe(formatWeekRange(workspace.currentWeekKey))
    expect(wrapper.text()).toContain(formatWeekRange(workspace.currentWeekKey))

    await wrapper.find('[data-test="previous-week"]').trigger('click')
    expect(workspace.currentWeekKey).toBe(initialWeekKey)
    expect(toolbarLabel()).toBe(formatWeekRange(initialWeekKey))
  })

  it('opens the week picker from the week label and jumps to the chosen week', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    const wrapper = mountView()

    await wrapper.find('[data-test="scheduler-week-label"]').trigger('click')

    const dialog = wrapper.findComponent(HolidayWeeksDialog)
    expect(dialog.props('visible')).toBe(true)
    expect(dialog.props('mode')).toBe('week')
    expect(dialog.props('currentWeek')).toBe('2026-11-02')

    dialog.vm.$emit('select', '2026-03-02')
    await nextTick()

    expect(workspace.currentWeekKey).toBe('2026-03-02')
    expect(wrapper.find('.scheduler__toolbar strong').text()).toBe('Mar 2 – Mar 8, 2026')
  })

  it('renders rows for active employees that have started by the selected day', () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([
      ada,
      bo,
      { ...bo, id: 'member-3', name: 'Cy', active: false },
      { ...bo, id: 'member-4', name: 'Dee', startDate: '2026-11-10' },
    ])
    const wrapper = mountView()

    expect(wrapper.find('[data-test="shift-row-member-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="shift-row-member-2"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="shift-row-member-3"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="shift-row-member-4"]').exists()).toBe(false)
  })

  it('orders employee names by duty then alphabetically', () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([
      { ...bo, id: 'employee-b', name: 'Bea', duty: 'employee' },
      { ...ada, id: 'manager', name: 'Max', duty: 'manager' },
      { ...bo, id: 'assistant', name: 'Al', duty: 'assistant' },
      { ...bo, id: 'head', name: 'Hana', duty: 'head_manager' },
      { ...bo, id: 'employee-a', name: 'Ada', duty: 'employee' },
    ])
    const wrapper = mountView()

    expect(wrapper.findAll('.shift-row__name-toggle').map((cell) => cell.text())).toEqual([
      'Hana',
      'Al',
      'Max',
      'Ada',
      'Bea',
    ])
  })

  it('renders shifts for the selected weekday and switches tabs', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada, bo])
    workspace.setShiftsForWeek('2026-11-02', [mondayShift, tuesdayShift])
    const wrapper = mountView()

    expect(wrapper.text()).toContain('09:00–12:00')
    expect(wrapper.text()).not.toContain('10:00–11:00')

    await wrapper.find('[data-test="weekday-tab-tuesday"]').trigger('click')

    expect(wrapper.find('[data-test="weekday-tab-tuesday"]').attributes('aria-selected')).toBe(
      'true',
    )
    expect(wrapper.text()).toContain('10:00–11:00')
    expect(wrapper.text()).not.toContain('09:00–12:00')
  })

  it('renders the selected day, tab day numbers, and daily hours for a fixed week', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada, bo])
    workspace.setShiftsForWeek('2026-11-02', [mondayShift, tuesdayShift])
    const wrapper = mountView()

    expect(wrapper.find('[data-test="scheduler-selected-day"]').text()).toBe(
      'Monday, November 2nd, 2026',
    )
    expect(wrapper.find('[data-test="weekday-tab-monday"]').text()).toBe('Monday 2nd')
    expect(wrapper.find('[data-test="weekday-tab-sunday"]').text()).toBe('Sunday 8th')
    expect(
      wrapper.find('[data-test="shift-row-member-1"] [data-test="shift-row-hours"]').text(),
    ).toBe('3.0')
    expect(
      wrapper.find('[data-test="shift-row-member-2"] [data-test="shift-row-hours"]').text(),
    ).toBe('0.0')

    await wrapper.find('[data-test="weekday-tab-tuesday"]').trigger('click')

    expect(wrapper.find('[data-test="scheduler-selected-day"]').text()).toBe(
      'Tuesday, November 3rd, 2026',
    )
    expect(
      wrapper.find('[data-test="shift-row-member-1"] [data-test="shift-row-hours"]').text(),
    ).toBe('0.0')
    expect(
      wrapper.find('[data-test="shift-row-member-2"] [data-test="shift-row-hours"]').text(),
    ).toBe('1.0')
  })

  it('shows day numbers across a month boundary', () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-10-26')
    const wrapper = mountView()

    expect(wrapper.find('[data-test="weekday-tab-sunday"]').text()).toBe('Sunday 1st')
  })

  it('truncates long member names but keeps the full name in the title', () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    const longName = 'Alexandria Montgomery'
    workspace.setMembers([{ ...ada, name: longName }])
    const wrapper = mountView()

    const nameCell = wrapper.find('[data-test="shift-row-member-1"] .shift-row__name')
    const nameToggle = wrapper.find('[data-test="shift-row-member-1"] .shift-row__name-toggle')
    expect(nameToggle.text()).toBe('Alexandria Montgomer…')
    expect(nameCell.attributes('title')).toBe(longName)
  })

  it('marks a member off for the selected day and keeps the weekly count across tabs', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada, bo])
    const wrapper = mountView()

    const row = () => wrapper.find('[data-test="shift-row-member-1"]')
    const chip = () => row().find('[data-test="day-off-count"]')
    const track = () => row().find('[data-test="shift-track"]')

    expect(chip().text()).toBe('0/2')
    expect(track().classes()).not.toContain('shift-row__track--disabled')

    await row().find('[data-test="shift-row-name-toggle"]').trigger('click')

    expect(chip().text()).toBe('1/2')
    expect(track().classes()).toContain('shift-row__track--disabled')
    expect(track().attributes('aria-disabled')).toBe('true')

    await wrapper.find('[data-test="weekday-tab-tuesday"]').trigger('click')

    expect(chip().text()).toBe('1/2')
    expect(track().classes()).not.toContain('shift-row__track--disabled')
    expect(track().attributes('aria-disabled')).toBe('false')

    await wrapper.find('[data-test="weekday-tab-monday"]').trigger('click')

    expect(chip().text()).toBe('1/2')
    expect(track().classes()).toContain('shift-row__track--disabled')
  })

  it('clears an existing shift when the member is marked off for the day', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada, bo])
    workspace.setShiftsForWeek('2026-11-02', [mondayShift])
    const wrapper = mountView()

    expect(wrapper.text()).toContain('09:00–12:00')

    await wrapper
      .find('[data-test="shift-row-member-1"] [data-test="shift-row-name-toggle"]')
      .trigger('click')

    expect(wrapper.text()).not.toContain('09:00–12:00')
    expect(workspace.currentWeekShifts).toEqual([])
  })

  it('shows the store error in an alert', () => {
    const store = useSchedulerStore()
    store.addShiftRange({ memberId: 'member-1', startMinute: 540, endMinute: 550 })

    const wrapper = mountView()

    expect(wrapper.find('[role="alert"]').text()).toBe(
      'Shift must be at least 30 minutes within 09:00–01:00',
    )
  })

  it('wires grid create, resize, and remove events to the store', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    const wrapper = mountView()
    const grid = wrapper.findComponent(ShiftGrid)

    grid.vm.$emit('create', { memberId: 'member-1', startMinute: 540, endMinute: 600 })
    await nextTick()

    const shift = workspace.currentWeekShifts[0]
    expect(shift).toMatchObject({ startMinute: 540, endMinute: 600 })

    grid.vm.$emit('resize', { id: shift.id, startMinute: 600, endMinute: 660 })
    await nextTick()
    expect(workspace.currentWeekShifts[0]).toMatchObject({ startMinute: 600, endMinute: 660 })

    grid.vm.$emit('remove', shift.id)
    await nextTick()
    expect(workspace.currentWeekShifts).toHaveLength(0)
  })

  it('wires grid move events to the store', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada, bo])
    workspace.setShiftsForWeek('2026-11-02', [mondayShift])
    const wrapper = mountView()
    const grid = wrapper.findComponent(ShiftGrid)

    grid.vm.$emit('move', {
      id: mondayShift.id,
      memberId: 'member-2',
      startMinute: 540,
      endMinute: 720,
    })
    await nextTick()

    expect(workspace.currentWeekShifts).toEqual([{ ...mondayShift, memberId: 'member-2' }])
  })

  it('renders the weekly hours table at the bottom with computed values', () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada, bo])
    workspace.setShiftsForWeek('2026-11-02', [mondayShift, tuesdayShift])
    const wrapper = mountView()

    const view = wrapper.find('.scheduler').element
    const weeklyHours = wrapper.find('[data-test="weekly-hours"]').element
    expect(view.lastElementChild).toBe(weeklyHours)

    expect(wrapper.find('[data-test="weekly-hours-group-manager"]').text()).toBe('Managers')
    expect(wrapper.find('[data-test="weekly-hours-group-assistant"]').text()).toBe('Assistants')
    expect(wrapper.find('[data-test="weekly-hours-row-member-1"]').text()).toBe('A')
    expect(wrapper.find('[data-test="weekly-hours-row-member-1-current"]').text()).toBe('3.0')
    expect(wrapper.find('[data-test="weekly-hours-row-member-1-contract"]').text()).toBe('40.0')
    expect(wrapper.find('[data-test="weekly-hours-row-member-1-diff"]').text()).toBe('-37.0')
    expect(wrapper.find('[data-test="weekly-hours-row-member-2-current"]').text()).toBe('1.0')
    expect(wrapper.find('[data-test="weekly-hours-row-member-2-diff"]').text()).toBe('-19.0')
  })

  it('omits future-start employee from weekly hours table', () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([
      ada,
      { ...bo, id: 'member-3', name: 'Cy', startDate: '2026-11-09' },
    ])
    const wrapper = mountView()

    expect(wrapper.find('[data-test="weekly-hours-row-member-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="weekly-hours-row-member-3"]').exists()).toBe(false)
  })

  it('disables holiday members in the grid and omits them from weekly hours', () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([
      { ...ada, holidays: [getIsoWeek(new Date(2026, 10, 2))] },
      bo,
    ])
    const wrapper = mountView()

    const row = wrapper.find('[data-test="shift-row-member-1"]')
    expect(row.exists()).toBe(true)
    expect(row.find('[data-test="day-off-count"]').exists()).toBe(false)
    expect(row.find('[data-test="shift-row-name-toggle"]').attributes('disabled')).toBeDefined()
    expect(row.find('[data-test="shift-track"]').attributes('aria-disabled')).toBe('true')
    expect(wrapper.find('[data-test="weekly-hours-row-member-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="weekly-hours-row-member-2"]').exists()).toBe(true)
  })

  it('renders Spanish weekday labels and dates live', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    const wrapper = mountView()

    useLocaleStore().setLocale('es')
    await nextTick()

    expect(wrapper.find('[data-test="weekday-tab-monday"]').text()).toBe('Lunes 2')
    expect(wrapper.find('[data-test="scheduler-selected-day"]').text()).toBe(
      'lunes, 2 de noviembre de 2026',
    )
    expect(wrapper.find('[data-test="previous-week"]').attributes('aria-label')).toBe(
      'Semana anterior',
    )
    expect(wrapper.find('[data-test="restart-week"]').attributes('aria-label')).toBe(
      'Borrar todo',
    )
    expect(wrapper.find('[data-test="scheduler-settings"]').attributes('aria-label')).toBe(
      'Configuración del horario',
    )
    expect(wrapper.find('.weekly-hours__title').text()).toBe('Horas semanales')
  })

  it('updates a weekly hours cell when the store changes', async () => {
    const workspace = useWorkspaceStore()
    const store = useSchedulerStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada])
    const wrapper = mountView()

    expect(wrapper.find('[data-test="weekly-hours-row-member-1-current"]').text()).toBe('0.0')

    store.addShiftRange({ memberId: 'member-1', startMinute: 540, endMinute: 660 })
    await nextTick()

    expect(wrapper.find('[data-test="weekly-hours-row-member-1-current"]').text()).toBe('2.0')
    expect(wrapper.find('[data-test="weekly-hours-row-member-1-diff"]').text()).toBe('-38.0')
  })

  it('create on capped row relocates nearest shift (integration)', async () => {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    const adaWithId: TeamMember = { ...ada, id: 'member-1' }
    workspace.setMembers([adaWithId])
    const shift1: Shift = { id: 'shift-1', memberId: 'member-1', weekday: 'monday', startMinute: 540, endMinute: 600 }
    const shift2: Shift = { id: 'shift-2', memberId: 'member-1', weekday: 'monday', startMinute: 720, endMinute: 780 }
    workspace.setShiftsForWeek('2026-11-02', [shift1, shift2])
    const wrapper = mountView()
    const grid = wrapper.findComponent(ShiftGrid)

    grid.vm.$emit('create', { memberId: 'member-1', startMinute: 900, endMinute: 960 })
    await nextTick()

    expect(workspace.currentWeekShifts).toHaveLength(2)
    const moved = workspace.currentWeekShifts.find((s) => s.id === 'shift-2')
    expect(moved).toMatchObject({ startMinute: 900, endMinute: 960 })
    const unchanged = workspace.currentWeekShifts.find((s) => s.id === 'shift-1')
    expect(unchanged).toMatchObject({ startMinute: 540, endMinute: 600 })
    expect(wrapper.text()).toContain('15:00–16:00')
    expect(wrapper.text()).not.toContain('12:00–13:00')
  })

})
