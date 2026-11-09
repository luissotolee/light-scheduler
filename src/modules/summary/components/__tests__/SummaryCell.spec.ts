import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import SummaryCell from '@/modules/summary/components/SummaryCell.vue'
import { useLocaleStore } from '@/shared/stores/locale'
import type { SummaryCell as SummaryCellType } from '@/modules/summary/types'

describe('SummaryCell', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
    pinia = createPinia()
    setActivePinia(pinia)
  })

  function mountCell(cell: SummaryCellType) {
    return mount(SummaryCell, { props: { cell }, global: { plugins: [pinia] } })
  }

  it('renders OFF with the off class', () => {
    const wrapper = mountCell({ kind: 'off' })

    expect(wrapper.get('[data-test="summary-off"]').text()).toBe('OFF')
    expect(wrapper.classes()).toContain('summary-cell--off')
  })

  it('renders a single shift', () => {
    const wrapper = mountCell({
      kind: 'shifts',
      shifts: [{ id: 's1', startMinute: 540, endMinute: 720, label: '09:00–12:00' }],
    })

    const container = wrapper.get('.summary-cell--shifts')
    expect(container.attributes('data-count')).toBe('1')
    expect(container.text()).toContain('09:00–12:00')
  })

  it('renders two shifts inside the same cell', () => {
    const wrapper = mountCell({
      kind: 'shifts',
      shifts: [
        { id: 's1', startMinute: 540, endMinute: 720, label: '09:00–12:00' },
        { id: 's2', startMinute: 840, endMinute: 1080, label: '14:00–18:00' },
      ],
    })

    const container = wrapper.get('.summary-cell--shifts')
    expect(container.attributes('data-count')).toBe('2')
    expect(container.findAll('.summary-cell__shift').map((item) => item.text())).toEqual([
      '09:00–12:00',
      '14:00–18:00',
    ])
  })

  it('renders the vacation label', () => {
    const wrapper = mountCell({ kind: 'vacations' })

    expect(wrapper.text()).toBe('VACATIONS')
  })

  it('localizes OFF and VACATIONS to Spanish', async () => {
    useLocaleStore().setLocale('es')
    await nextTick()

    const off = mountCell({ kind: 'off' })
    const vacation = mountCell({ kind: 'vacations' })

    expect(off.text()).toBe('LIBRE')
    expect(vacation.text()).toBe('VACACIONES')
  })
})
