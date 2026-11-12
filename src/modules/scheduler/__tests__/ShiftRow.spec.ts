import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import type { Directive } from 'vue'
import ShiftRow from '@/modules/scheduler/components/ShiftRow.vue'
import ShiftBar from '@/modules/scheduler/components/ShiftBar.vue'
import type { DayRow } from '@/modules/scheduler/types'
import type { Shift, TeamMember } from '@/types'
import { useI18n } from '@/shared/i18n'
import { MIN_DAYS_OFF } from '@/modules/scheduler/utils/off'
import { buildDaySlots } from '@/shared/utils/shifts'

const member: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
  name: 'Ada',
  duty: 'employee',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [],
  active: true,
  startDate: '2026-01-01',
}

const bar: Shift = {
  id: 'shift-1',
  memberId: 'member-1',
  weekday: 'monday',
  startMinute: 540,
  endMinute: 600,
}

function makeRow(bars: Shift[] = [], overrides: Partial<DayRow> = {}): DayRow {
  const minutes = bars.reduce((total, shift) => total + (shift.endMinute - shift.startMinute), 0)
  return {
    member,
    bars,
    dailyHours: minutes / 60,
    isOff: false,
    isHoliday: false,
    daysOffCount: 0,
    ...overrides,
  }
}

async function pointer(element: Element, type: string, init: PointerEventInit = {}): Promise<void> {
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

function stubTrackRect(width = 1536): void {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width,
    height: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect)
}

describe('ShiftRow', () => {
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
    stubTrackRect()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    Reflect.deleteProperty(Element.prototype, 'setPointerCapture')
    Reflect.deleteProperty(Element.prototype, 'releasePointerCapture')
  })

  function mountRow(bars: Shift[] = [], overrides: Partial<DayRow> = {}) {
    return mount(ShiftRow, {
      props: { row: makeRow(bars, overrides), slots: buildDaySlots() },
    })
  }

  it('renders the employee name and a 32-slot track', () => {
    const wrapper = mountRow()

    expect(wrapper.find('[data-test="shift-row-member-1"]').text()).toContain('Ada')
    expect(wrapper.findAll('.shift-row__grid-slot')).toHaveLength(32)
    expect(wrapper.find('[data-test="shift-track"]').attributes('tabindex')).toBe('0')
    expect(wrapper.find('[data-test="shift-track"]').attributes('aria-label')).toContain(
      'Press Enter to add a 3 hour shift',
    )
  })

  it.each([
    ['head_manager', 'shift-row__name--head-manager'],
    ['manager', 'shift-row__name--manager'],
  ] as const)('applies the %s modifier to the name cell', (duty, modifier) => {
    const wrapper = mount(ShiftRow, {
      props: {
        row: { member: { ...member, duty }, bars: [], dailyHours: 0, isOff: false, isHoliday: false, daysOffCount: 0 },
        slots: buildDaySlots(),
      },
    })

    expect(wrapper.find('.shift-row__name').classes()).toContain(modifier)
  })

  it('renders the daily hours total', () => {
    const wrapper = mountRow([bar])

    expect(wrapper.find('[data-test="shift-row-hours"]').text()).toBe('1.0')
  })

  it('truncates long names at 20 characters and keeps the full name in the title', () => {
    const longName = 'Alexandria Montgomery'
    const wrapper = mount(ShiftRow, {
      props: {
        row: {
          member: { ...member, name: longName },
          bars: [],
          dailyHours: 0,
          isOff: false,
          isHoliday: false,
          daysOffCount: 0,
        },
        slots: buildDaySlots(),
      },
    })

    const nameCell = wrapper.find('.shift-row__name')
    const nameToggle = wrapper.find('[data-test="shift-row-name-toggle"]')
    expect(nameToggle.text()).toBe('Alexandria Montgomer…')
    expect(nameCell.attributes('title')).toBe(longName)
    expect(nameToggle.attributes('title')).toBe(longName)
  })

  it('renders a weekly day off counter chip', () => {
    const wrapper = mountRow()

    expect(wrapper.find('[data-test="day-off-count"]').text()).toBe('0/2')
    expect(wrapper.find('[data-test="day-off-count"]').classes()).not.toContain(
      'shift-row__day-off-chip--full',
    )
  })

  it('flags the chip once the weekly minimum is reached', () => {
    const belowMinimum = mountRow([], { daysOffCount: 1 })
    const atMinimum = mountRow([], { daysOffCount: MIN_DAYS_OFF })

    const belowChip = belowMinimum.find('[data-test="day-off-count"]')
    expect(belowChip.text()).toBe('1/2')
    expect(belowChip.classes()).not.toContain('shift-row__day-off-chip--full')

    const atChip = atMinimum.find('[data-test="day-off-count"]')
    expect(atChip.text()).toBe('2/2')
    expect(atChip.classes()).toContain('shift-row__day-off-chip--full')
  })

  it('binds the days-off tooltip through the tooltip directive', () => {
    const tooltipBindings: Array<{ el: HTMLElement; value: string }> = []
    const recordingTooltip: Directive<HTMLElement, string> = {
      mounted(el, binding) {
        tooltipBindings.push({ el, value: binding.value })
      },
    }

    const wrapper = mount(ShiftRow, {
      props: { row: makeRow([], { daysOffCount: 1 }), slots: buildDaySlots() },
      global: { stubs: { teleport: true }, directives: { tooltip: recordingTooltip } },
    })

    const { t } = useI18n()
    const chip = wrapper.find('[data-test="day-off-count"]')

    expect(chip.attributes('title')).toBeUndefined()
    expect(tooltipBindings).toEqual([
      {
        el: chip.element,
        value: t('shiftRow.daysOffTooltip', {
          count: 1,
          min: MIN_DAYS_OFF,
          name: 'Ada',
        }),
      },
    ])
    expect(tooltipBindings[0]?.value).toBe('1 days off scheduled for Ada this week (minimum 2).')
  })

  it('emits toggleOff when the employee name is clicked', async () => {
    const wrapper = mountRow()
    const toggle = wrapper.find('[data-test="shift-row-name-toggle"]')

    expect(toggle.attributes('type')).toBe('button')
    expect(toggle.attributes('aria-pressed')).toBe('false')
    expect(toggle.attributes('aria-label')).toBe('Mark Ada off for this day')

    await toggle.trigger('click')

    expect(wrapper.emitted('toggleOff')).toEqual([['member-1']])
  })

  it('marks an off day as pressed and disables the row controls', async () => {
    const wrapper = mountRow([bar], { isOff: true, daysOffCount: 1 })
    const toggle = wrapper.find('[data-test="shift-row-name-toggle"]')
    const track = wrapper.find('[data-test="shift-track"]')

    expect(toggle.classes()).toContain('shift-row__name-toggle--off')
    expect(toggle.attributes('aria-pressed')).toBe('true')
    expect(toggle.attributes('aria-label')).toBe('Mark Ada back on for this day')
    expect(track.classes()).toContain('shift-row__track--disabled')
    expect(track.attributes('aria-disabled')).toBe('true')
    expect(track.attributes('tabindex')).toBe('-1')
    expect(wrapper.findComponent(ShiftBar).props('disabled')).toBe(true)

    await pointer(track.element, 'pointerdown', { clientX: 48 })
    await pointer(track.element, 'pointerup', { clientX: 48 })
    await track.trigger('keydown', { key: 'Enter' })
    await track.trigger('keydown', { key: ' ' })

    expect(wrapper.find('[data-test="shift-draft"]').exists()).toBe(false)
    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('keeps the row enabled while on', () => {
    const wrapper = mountRow([bar])
    const track = wrapper.find('[data-test="shift-track"]')

    expect(wrapper.find('[data-test="shift-row-name-toggle"]').attributes('aria-pressed')).toBe(
      'false',
    )
    expect(track.classes()).not.toContain('shift-row__track--disabled')
    expect(track.attributes('aria-disabled')).toBe('false')
    expect(track.attributes('tabindex')).toBe('0')
    expect(wrapper.findComponent(ShiftBar).props('disabled')).toBe(false)
  })

  it('disables a holiday row and hides the day off chip', async () => {
    const wrapper = mountRow([bar], { isHoliday: true, daysOffCount: 1 })
    const toggle = wrapper.find('[data-test="shift-row-name-toggle"]')
    const track = wrapper.find('[data-test="shift-track"]')

    expect(wrapper.find('[data-test="day-off-count"]').exists()).toBe(false)
    expect(toggle.attributes('disabled')).toBeDefined()
    expect(track.classes()).toContain('shift-row__track--disabled')
    expect(track.attributes('aria-disabled')).toBe('true')
    expect(track.attributes('tabindex')).toBe('-1')
    expect(wrapper.findComponent(ShiftBar).props('disabled')).toBe(true)

    await toggle.trigger('click')
    await pointer(track.element, 'pointerdown', { clientX: 48 })
    await pointer(track.element, 'pointerup', { clientX: 48 })
    await track.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('toggleOff')).toBeUndefined()
    expect(wrapper.find('[data-test="shift-draft"]').exists()).toBe(false)
    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('creates a 3-hour shift when a cell is clicked', async () => {
    const wrapper = mountRow()
    const track = wrapper.find('[data-test="shift-track"]')

    await pointer(track.element, 'pointerdown', { clientX: 0 })
    const draft = wrapper.find('[data-test="shift-draft"]')
    expect(draft.exists()).toBe(true)
    expect(draft.attributes('style')).toContain('left: 0%')
    expect(draft.attributes('style')).toContain('width: 18.75%')

    await pointer(track.element, 'pointerup', { clientX: 0 })

    expect(wrapper.emitted('create')).toEqual([
      [{ memberId: 'member-1', startMinute: 540, endMinute: 720 }],
    ])
    expect(wrapper.find('[data-test="shift-draft"]').exists()).toBe(false)
  })

  it('creates the dragged range when the pointer moves to another slot', async () => {
    const wrapper = mountRow()
    const track = wrapper.find('[data-test="shift-track"]')

    await pointer(track.element, 'pointerdown', { clientX: 48 })
    await pointer(track.element, 'pointermove', { clientX: 144 })
    await pointer(track.element, 'pointerup', { clientX: 144 })

    expect(wrapper.emitted('create')).toEqual([
      [{ memberId: 'member-1', startMinute: 570, endMinute: 630 }],
    ])
  })

  it('handles right-to-left drags by normalizing the range', async () => {
    const wrapper = mountRow()
    const track = wrapper.find('[data-test="shift-track"]')

    await pointer(track.element, 'pointerdown', { clientX: 144 })
    await pointer(track.element, 'pointermove', { clientX: 48 })
    await pointer(track.element, 'pointerup', { clientX: 48 })

    expect(wrapper.emitted('create')).toEqual([
      [{ memberId: 'member-1', startMinute: 570, endMinute: 630 }],
    ])
  })

  it('keeps the 3-hour default when the pointer stays in the anchor slot', async () => {
    const wrapper = mountRow()
    const track = wrapper.find('[data-test="shift-track"]')

    await pointer(track.element, 'pointerdown', { clientX: 48 })
    await pointer(track.element, 'pointermove', { clientX: 60 })
    await pointer(track.element, 'pointerup', { clientX: 60 })

    expect(wrapper.emitted('create')).toEqual([
      [{ memberId: 'member-1', startMinute: 570, endMinute: 750 }],
    ])
  })

  it('clamps the 3-hour default to the end of the day', async () => {
    const wrapper = mountRow()
    const track = wrapper.find('[data-test="shift-track"]')

    await pointer(track.element, 'pointerdown', { clientX: 1440 })
    await pointer(track.element, 'pointerup', { clientX: 1440 })

    expect(wrapper.emitted('create')).toEqual([
      [{ memberId: 'member-1', startMinute: 1440, endMinute: 1500 }],
    ])
  })

  it('ignores a press when less than 30 minutes remain in the day', async () => {
    const wrapper = mountRow()
    const track = wrapper.find('[data-test="shift-track"]')

    await pointer(track.element, 'pointerdown', { clientX: 1536 })
    await pointer(track.element, 'pointerup', { clientX: 1536 })

    expect(wrapper.find('[data-test="shift-draft"]').exists()).toBe(false)
    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('adds a 3-hour shift at the leftmost free slot with Enter and Space', async () => {
    const wrapper = mountRow([bar])
    const track = wrapper.find('[data-test="shift-track"]')

    await track.trigger('keydown', { key: 'Enter' })
    await track.trigger('keydown', { key: ' ' })

    expect(wrapper.emitted('create')).toEqual([
      [{ memberId: 'member-1', startMinute: 600, endMinute: 780 }],
      [{ memberId: 'member-1', startMinute: 600, endMinute: 780 }],
    ])
  })

  it('does not create a shift when every slot is occupied or the key is unrelated', async () => {
    const wrapper = mountRow([{ ...bar, startMinute: 540, endMinute: 1500 }])
    const track = wrapper.find('[data-test="shift-track"]')

    await track.trigger('keydown', { key: 'Enter' })
    await track.trigger('keydown', { key: 'a' })

    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('ignores secondary buttons and pointer movement outside a drag', async () => {
    const wrapper = mountRow()
    const track = wrapper.find('[data-test="shift-track"]')

    await pointer(track.element, 'pointerdown', { button: 2, clientX: 48 })
    await pointer(track.element, 'pointermove', { clientX: 144 })
    await pointer(track.element, 'pointerup', { clientX: 144 })

    expect(wrapper.emitted('create')).toBeUndefined()
  })

  it('cancels a selection without creating a shift', async () => {
    const wrapper = mountRow()
    const track = wrapper.find('[data-test="shift-track"]')

    await pointer(track.element, 'pointerdown', { clientX: 48 })
    await pointer(track.element, 'pointermove', { clientX: 144 })
    await pointer(track.element, 'pointercancel')

    expect(wrapper.emitted('create')).toBeUndefined()
    expect(wrapper.find('[data-test="shift-draft"]').exists()).toBe(false)
  })

  it('forwards resize and remove events from the shift bar', async () => {
    const wrapper = mountRow([bar])
    const shiftBar = wrapper.findComponent(ShiftBar)

    shiftBar.vm.$emit('resize', { id: 'shift-1', startMinute: 540, endMinute: 630 })
    shiftBar.vm.$emit('remove', 'shift-1')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('resize')).toEqual([
      [{ id: 'shift-1', startMinute: 540, endMinute: 630 }],
    ])
    expect(wrapper.emitted('remove')).toEqual([['shift-1']])
  })

  it('forwards cross-row drag events from the shift bar', async () => {
    const wrapper = mountRow([bar])
    const shiftBar = wrapper.findComponent(ShiftBar)
    const payload = { id: 'shift-1', startMinute: 540, endMinute: 630, clientY: 42 }

    shiftBar.vm.$emit('moveStart', 'shift-1')
    shiftBar.vm.$emit('moveDrag', payload)
    shiftBar.vm.$emit('moveEnd', payload)
    shiftBar.vm.$emit('moveCancel')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('moveStart')).toEqual([['shift-1']])
    expect(wrapper.emitted('moveDrag')).toEqual([[payload]])
    expect(wrapper.emitted('moveEnd')).toEqual([[payload]])
    expect(wrapper.emitted('moveCancel')).toEqual([[]])
  })

  it('marks the row as a drop target without disabling it', () => {
    const regular = mountRow([bar])
    const target = mount(ShiftRow, {
      props: { row: makeRow([bar]), slots: buildDaySlots(), dropTarget: true },
    })

    expect(regular.find('.shift-row').classes()).not.toContain('shift-row--drop-target')
    expect(target.find('.shift-row').classes()).toContain('shift-row--drop-target')
    expect(target.find('[data-test="shift-track"]').attributes('aria-disabled')).toBe('false')
  })

  it('uses a custom 15-minute window for selection and snapping', async () => {
    const wrapper = mount(ShiftRow, {
      props: {
        row: makeRow([bar]),
        slots: buildDaySlots({ startMinute: 540, endMinute: 720, slotMinutes: 15 }),
      },
    })
    const track = wrapper.find('[data-test="shift-track"]')

    expect(wrapper.findAll('.shift-row__grid-slot')).toHaveLength(12)
    expect(wrapper.findComponent(ShiftBar).props('limits')).toEqual({
      startMinute: 540,
      endMinute: 720,
      slotMinutes: 15,
    })

    await pointer(track.element, 'pointerdown', { clientX: 0 })
    await pointer(track.element, 'pointermove', { clientX: 144 })
    await pointer(track.element, 'pointerup', { clientX: 144 })

    expect(wrapper.emitted('create')).toEqual([
      [{ memberId: 'member-1', startMinute: 540, endMinute: 555 }],
    ])
  })

  it('shows employee initials on phones while keeping the full accessible name', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const wrapper = mountRow()

    const toggle = wrapper.find('[data-test="shift-row-name-toggle"]')
    expect(toggle.text()).toBe('A')
    expect(toggle.attributes('aria-label')).toContain('Ada')
  })

  it('shows a delete button after a long-press and removes the shift', async () => {
    const wrapper = mountRow([bar])
    const shiftBar = wrapper.findComponent(ShiftBar)

    shiftBar.vm.$emit('longPress', 'shift-1')
    await nextTick()

    const remove = wrapper.find('[data-test="shift-delete"]')
    expect(remove.exists()).toBe(true)
    expect(remove.attributes('aria-label')).toBe('Remove this shift')

    await remove.trigger('click')

    expect(wrapper.emitted('remove')).toEqual([['shift-1']])
    expect(wrapper.find('[data-test="shift-delete"]').exists()).toBe(false)
  })

  it('dismisses the delete button when tapping outside', async () => {
    const wrapper = mountRow([bar])
    wrapper.findComponent(ShiftBar).vm.$emit('longPress', 'shift-1')
    await nextTick()
    expect(wrapper.find('[data-test="shift-delete"]').exists()).toBe(true)

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()

    expect(wrapper.find('[data-test="shift-delete"]').exists()).toBe(false)
  })
})
