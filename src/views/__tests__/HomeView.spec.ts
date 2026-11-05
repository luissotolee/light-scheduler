import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import HomeView from '@/views/HomeView.vue'
import { useSchedulerStore } from '@/stores/scheduler'

describe('HomeView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('adds tasks submitted through the form', async () => {
    const wrapper = mount(HomeView, { global: { plugins: [pinia] } })
    const store = useSchedulerStore()

    await wrapper.find('input').setValue('Ship release')
    await wrapper.find('form').trigger('submit')
    await nextTick()

    expect(store.tasks.map((task) => task.title)).toEqual(['Ship release'])
    expect(wrapper.text()).toContain('Ship release')
  })

  it('hides the clear action until something is completed', async () => {
    const wrapper = mount(HomeView, { global: { plugins: [pinia] } })
    const store = useSchedulerStore()

    store.addTask({ title: 'one', priority: 'low' })
    await nextTick()
    expect(wrapper.find('.home__clear').exists()).toBe(false)

    store.toggleTask(store.tasks[0].id)
    await nextTick()
    const clear = wrapper.find('.home__clear')
    expect(clear.exists()).toBe(true)

    await clear.trigger('click')
    expect(store.tasks).toHaveLength(0)
  })
})
