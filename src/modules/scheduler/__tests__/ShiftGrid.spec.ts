import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ShiftGrid from '@/modules/scheduler/components/ShiftGrid.vue'
import ShiftRow from '@/modules/scheduler/components/ShiftRow.vue'
import type { DayRow } from '@/modules/scheduler/types'
import type { Shift, TeamMember } from '@/types'
import { buildDaySlots } from '@/shared/utils/shifts'

const ada: TeamMember = {
  id: 'member-1',
  name: 'Ada',
  duty: 'manager',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [],
  active: true,
  startDate: '2026-01-01',
}

const bo: TeamMember = {
  id: 'member-2',
  name: 'Bo',
  duty: 'assistant',
  contract: 'part_time',
  weeklyHours: 20,
  holidays: [],
  active: true,
  startDate: '2026-01-01',
}

const shift: Shift = {
  id: 'shift-1',
  memberId: 'member-1',
  weekday: 'monday',
  startMinute: 540,
  endMinute: 660,
}

const rows: DayRow[] = [
  { member: ada, bars: [shift], dailyHours: 2, isOff: false, daysOffCount: 0 },
  { member: bo, bars: [], dailyHours: 0, isOff: false, daysOffCount: 0 },
]

describe('ShiftGrid', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mountGrid(dayRows: DayRow[] = rows) {
    return mount(ShiftGrid, {
      props: { rows: dayRows, slots: buildDaySlots() },
    })
  }

  it('renders a two-row header with unique hours over half-hour slot labels', () => {
    const wrapper = mountGrid()

    expect(wrapper.find('[data-test="shift-grid"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="shift-grid-hours"]').text()).toBe('Hours')
    const hourCells = wrapper.findAll('.shift-grid__time-row:first-child .shift-grid__time-cell')
    const minuteCells = wrapper.findAll('.shift-grid__time-row:last-child .shift-grid__time-cell')
    expect(hourCells).toHaveLength(16)
    expect(minuteCells).toHaveLength(32)

    const hourTexts = hourCells.map((cell) => cell.text())
    expect(hourTexts[0]).toBe('09')
    expect(hourTexts[hourTexts.length - 1]).toBe('00')
    expect(new Set(hourTexts).size).toBe(hourTexts.length)

    const minuteTexts = minuteCells.map((cell) => cell.text())
    expect(minuteTexts[0]).toBe('00')
    expect(minuteTexts[1]).toBe('30')
    minuteTexts.forEach((label, index) => {
      expect(label).toBe(index % 2 === 0 ? '00' : '30')
    })

    expect(wrapper.findAll('.shift-grid__time-cell--next-day')).toHaveLength(3)
    expect(
      wrapper.findAll('.shift-grid__time-row:first-child .shift-grid__time-cell--next-day'),
    ).toHaveLength(1)
    expect(
      wrapper.findAll('.shift-grid__time-row:last-child .shift-grid__time-cell--next-day'),
    ).toHaveLength(2)
  })

  it('renders one row per employee and the employee name column', () => {
    const wrapper = mountGrid()

    expect(wrapper.findAllComponents(ShiftRow)).toHaveLength(2)
    expect(wrapper.text()).toContain('Employee')
    expect(wrapper.find('[data-test="shift-row-member-1"]').text()).toContain('Ada')
    expect(wrapper.find('[data-test="shift-row-member-2"]').text()).toContain('Bo')
    expect(wrapper.find('[data-test="shift-bar"]').exists()).toBe(true)
  })

  it('shows an empty message when there are no rows', () => {
    const wrapper = mountGrid([])

    expect(wrapper.text()).toContain('No active employees are available on this day.')
    expect(wrapper.findAllComponents(ShiftRow)).toHaveLength(0)
  })

  it('forwards create, resize, remove, and toggleOff events from rows', async () => {
    const wrapper = mountGrid()
    const row = wrapper.findComponent(ShiftRow)

    row.vm.$emit('create', { memberId: 'member-1', startMinute: 540, endMinute: 570 })
    row.vm.$emit('resize', { id: 'shift-1', startMinute: 540, endMinute: 630 })
    row.vm.$emit('remove', 'shift-1')
    row.vm.$emit('toggleOff', 'member-1')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('create')).toEqual([
      [{ memberId: 'member-1', startMinute: 540, endMinute: 570 }],
    ])
    expect(wrapper.emitted('resize')).toEqual([
      [{ id: 'shift-1', startMinute: 540, endMinute: 630 }],
    ])
    expect(wrapper.emitted('remove')).toEqual([['shift-1']])
    expect(wrapper.emitted('toggleOff')).toEqual([['member-1']])
  })
})
