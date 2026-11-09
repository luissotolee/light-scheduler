import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DemoOverlay from '@/modules/demo/components/DemoOverlay.vue'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { stopDemo } from '@/modules/demo/utils/demoSession'
import { en } from '@/shared/i18n/messages/en'
import { startEngine } from '@/modules/demo/player/engine'

vi.mock('@/modules/demo/player/engine', () => ({
  startEngine: vi.fn(),
  stopEngine: vi.fn(),
  getPlayerStatus: vi.fn(() => 'idle'),
}))

vi.mock('@/modules/demo/utils/demoSession', () => ({
  stopDemo: vi.fn(),
}))

describe('DemoOverlay', () => {
  let wrapper: ReturnType<typeof mount> | null = null

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.resetModules()
  })

  it('renders when demo is running', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    store.status = 'running'
    store.showRestoredFlag = false
    wrapper = mount(DemoOverlay, { global: { plugins: [pinia] } })
    expect(wrapper.find('[data-test="demo-overlay"]').exists()).toBe(true)
  })

  it('does not render when demo is idle and no restored flag', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    store.status = 'idle'
    store.showRestoredFlag = false
    wrapper = mount(DemoOverlay, { global: { plugins: [pinia] } })
    expect(wrapper.find('[data-test="demo-overlay"]').exists()).toBe(false)
  })

  it('shows restored toast when flag is set and demo is idle', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    store.status = 'idle'
    store.showRestoredFlag = true
    wrapper = mount(DemoOverlay, { global: { plugins: [pinia] }, attachTo: document.body })
    expect(wrapper.find('[data-test="demo-restored"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="demo-restored"]').text()).toBe(en['demo.restored'])
  })

  it('has no .demo-narration or .demo-controls on mount', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    store.status = 'running'
    store.showRestoredFlag = false
    wrapper = mount(DemoOverlay, { global: { plugins: [pinia] } })
    expect(wrapper.find('.demo-narration').exists()).toBe(false)
    expect(wrapper.find('.demo-controls').exists()).toBe(false)
  })

  it('exits on Escape key', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    store.status = 'running'
    store.showRestoredFlag = false
    const wrapper = mount(DemoOverlay, { global: { plugins: [pinia] }, attachTo: document.body })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(stopDemo).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does not call startEngine on mount', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    store.status = 'running'
    store.showRestoredFlag = false
    wrapper = mount(DemoOverlay, { global: { plugins: [pinia] } })
    expect(startEngine).not.toHaveBeenCalled()
  })

  it('renders exit control when demo becomes active', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    store.status = 'idle'
    store.showRestoredFlag = false
    const wrapper = mount(DemoOverlay, { global: { plugins: [pinia] } })

    store.status = 'running'
    store.totalSteps = 1
    store.currentStep = { id: '1', action: 'spotlight', target: { testId: 'test' }, narrationKey: 'demo.scenario.scheduler.intro' }
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.demo-overlay').exists()).toBe(true)
    wrapper.unmount()
  })
})