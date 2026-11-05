import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskForm from '@/components/TaskForm.vue'

describe('TaskForm', () => {
  it('disables the submit button while the title is empty', () => {
    const wrapper = mount(TaskForm)

    expect(wrapper.find('button').attributes('disabled')).toBeDefined()
  })

  it('emits a trimmed task and resets the form on submit', async () => {
    const wrapper = mount(TaskForm)

    await wrapper.find('input').setValue('  plan sprint  ')
    await wrapper.find('select').setValue('high')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([[{ title: 'plan sprint', priority: 'high' }]])
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('does not emit for whitespace-only input', async () => {
    const wrapper = mount(TaskForm)

    await wrapper.find('input').setValue('   ')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
