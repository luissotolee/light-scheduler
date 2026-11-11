import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ShiftGrid from '@/modules/scheduler/components/ShiftGrid.vue'
import ShiftRow from '@/modules/scheduler/components/ShiftRow.vue'
import type { DayRow } from '@/modules/scheduler/types'
import type { Shift, TeamMember } from '@/types'
import { buildDaySlots } from '@/shared/utils/shifts'

const ada: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
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
  empId: 'EMP-0002',
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
  { member: ada, bars: [shift], dailyHours: 2, isOff: false, isHoliday: false, daysOffCount: 0 },
  { member: bo, bars: [], dailyHours: 0, isOff: false, isHoliday: false, daysOffCount: 0 },
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
    Object.defineProperty(Element.prototype, 'setPointerCapture', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
    Object.defineProperty(Element.prototype, 'releasePointerCapture', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    Reflect.deleteProperty(Element.prototype, 'setPointerCapture')
    Reflect.deleteProperty(Element.prototype, 'releasePointerCapture')
  })

  function stubRowRects(): void {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      const top = this.getAttribute('data-row-member-id') === 'member-2' ? 40 : 0
      const width = 1536
      return {
        width,
        height: 40,
        top,
        bottom: top + 40,
        left: 0,
        right: width,
        x: 0,
        y: top,
        toJSON: () => ({}),
      } as DOMRect
    })
  }

  async function pointer(
    element: Element,
    type: string,
    init: PointerEventInit = {},
  ): Promise<void> {
    element.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        ...init,
      }),
    )
    await nextTick()
  }

  function mountGrid(dayRows: DayRow[] = rows, showHeadcount = false) {
    return mount(ShiftGrid, {
      props: { rows: dayRows, slots: buildDaySlots(), showHeadcount },
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

  it('moves a dragged shift onto another employee row', async () => {
    stubRowRects()
    const wrapper = mountGrid()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await pointer(bar.element, 'pointerdown', { clientX: 100, clientY: 10 })
    await pointer(bar.element, 'pointermove', { clientX: 148, clientY: 60 })

    expect(wrapper.find('[data-test="shift-row-member-2"]').classes()).toContain(
      'shift-row--drop-target',
    )

    await pointer(bar.element, 'pointerup', { clientX: 148, clientY: 60 })

    expect(wrapper.emitted('move')).toEqual([
      [{ id: 'shift-1', memberId: 'member-2', startMinute: 570, endMinute: 690 }],
    ])
    expect(wrapper.emitted('resize')).toBeUndefined()
    expect(wrapper.find('[data-test="shift-row-member-2"]').classes()).not.toContain(
      'shift-row--drop-target',
    )
  })

  it('keeps a drop inside the source row as a same-row move', async () => {
    stubRowRects()
    const wrapper = mountGrid()
    const bar = wrapper.find('[data-test="shift-bar"]')

    await pointer(bar.element, 'pointerdown', { clientX: 100, clientY: 10 })
    await pointer(bar.element, 'pointermove', { clientX: 148, clientY: 20 })
    await pointer(bar.element, 'pointerup', { clientX: 148, clientY: 20 })

    expect(wrapper.emitted('resize')).toEqual([
      [{ id: 'shift-1', startMinute: 570, endMinute: 690 }],
    ])
    expect(wrapper.emitted('move')).toBeUndefined()
  })

  it('does not accept a drop on a disabled row', async () => {
    stubRowRects()
    const disabledRows: DayRow[] = [
      rows[0],
      { ...rows[1], isOff: true },
    ]
    const wrapper = mountGrid(disabledRows)
    const bar = wrapper.find('[data-test="shift-bar"]')

    await pointer(bar.element, 'pointerdown', { clientX: 100, clientY: 10 })
    await pointer(bar.element, 'pointermove', { clientX: 148, clientY: 60 })

    expect(wrapper.find('[data-test="shift-row-member-2"]').classes()).not.toContain(
      'shift-row--drop-target',
    )

    await pointer(bar.element, 'pointerup', { clientX: 148, clientY: 60 })

    expect(wrapper.emitted('move')).toBeUndefined()
    expect(wrapper.emitted('resize')).toBeUndefined()
  })

  it('renders hour groups and minute cells for custom 15-minute slots', () => {
    const wrapper = mount(ShiftGrid, {
      props: {
        rows,
        slots: buildDaySlots({ startMinute: 540, endMinute: 780, slotMinutes: 15 }),
      },
    })
    const hourCells = wrapper.findAll('.shift-grid__time-row:first-child .shift-grid__time-cell')
    const minuteCells = wrapper.findAll('.shift-grid__time-row:last-child .shift-grid__time-cell')

    expect(hourCells).toHaveLength(4)
    expect(minuteCells).toHaveLength(16)
    expect(minuteCells.map((cell) => cell.text()).slice(0, 4)).toEqual([
      '00',
      '15',
      '30',
      '45',
    ])
  })

  it('does not render headcount chips while the setting is off', () => {
    const wrapper = mountGrid()

    expect(wrapper.find('[data-test="hour-headcount"]').exists()).toBe(false)
  })

  it('renders one peak headcount chip per hour when enabled', () => {
    const wrapper = mountGrid(rows, true)
    const chips = wrapper.findAll('[data-test="hour-headcount"]')

    expect(chips).toHaveLength(16)
    expect(chips[0].text()).toBe('1')
    expect(chips[1].text()).toBe('1')
    expect(chips[2].text()).toBe('0')
    expect(chips[2].classes()).toContain('shift-grid__headcount--empty')
    expect(chips[0].attributes('title')).toBe('1 employee scheduled at 09:00')
  })

  it('counts simultaneous employees and ignores a hand-off at the same minute', () => {
    const simultaneous: DayRow[] = [
      {
        member: ada,
        bars: [{ id: 'a', memberId: 'member-1', weekday: 'monday', startMinute: 630, endMinute: 690 }],
        dailyHours: 1,
        isOff: false,
        isHoliday: false,
        daysOffCount: 0,
      },
      {
        member: bo,
        bars: [{ id: 'b', memberId: 'member-2', weekday: 'monday', startMinute: 630, endMinute: 690 }],
        dailyHours: 1,
        isOff: false,
        isHoliday: false,
        daysOffCount: 0,
      },
    ]
    const handoff: DayRow[] = [
      {
        member: ada,
        bars: [{ id: 'a', memberId: 'member-1', weekday: 'monday', startMinute: 540, endMinute: 630 }],
        dailyHours: 1.5,
        isOff: false,
        isHoliday: false,
        daysOffCount: 0,
      },
      {
        member: bo,
        bars: [{ id: 'b', memberId: 'member-2', weekday: 'monday', startMinute: 630, endMinute: 720 }],
        dailyHours: 1.5,
        isOff: false,
        isHoliday: false,
        daysOffCount: 0,
      },
    ]

    const simultaneousChips = mountGrid(simultaneous, true).findAll('[data-test="hour-headcount"]')
    expect(simultaneousChips[1].text()).toBe('2')
    expect(simultaneousChips[1].attributes('title')).toBe('2 employees scheduled at 10:00')

    const handoffChips = mountGrid(handoff, true).findAll('[data-test="hour-headcount"]')
    expect(handoffChips[1].text()).toBe('1')
  })
})
