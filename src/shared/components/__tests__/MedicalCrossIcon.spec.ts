import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MedicalCrossIcon from '@/shared/components/MedicalCrossIcon.vue'

describe('MedicalCrossIcon', () => {
  it('renders an outlined medical cross', () => {
    const wrapper = mount(MedicalCrossIcon)
    const svg = wrapper.get('svg')

    expect(svg.classes()).toContain('medical-cross-icon')
    expect(svg.attributes('fill')).toBe('none')
    expect(svg.attributes('stroke')).toBe('currentColor')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.get('path').attributes('d')).toBe('M6 2h4v4h4v4h-4v4H6v-4H2V6h4V2Z')
  })
})
