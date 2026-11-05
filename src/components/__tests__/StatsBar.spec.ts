import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import StatsBar from '@/components/StatsBar.vue'

describe('StatsBar', () => {
  it('renders each metric and the progress value', () => {
    const wrapper = mount(StatsBar, {
      props: { total: 4, completed: 1, remaining: 3, progress: 25 },
    })

    const values = wrapper.findAll('.stats__value').map((node) => node.text())
    expect(values).toEqual(['4', '3', '1'])

    const progress = wrapper.find('[role="progressbar"]')
    expect(progress.attributes('aria-valuenow')).toBe('25')
    expect(wrapper.find('.stats__progress-fill').attributes('style')).toContain('width: 25%')
  })
})
