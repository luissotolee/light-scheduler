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

  it('has no callout or controls without a current step', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    store.status = 'running'
    store.showRestoredFlag = false
    wrapper = mount(DemoOverlay, { global: { plugins: [pinia] } })
    expect(wrapper.find('.demo-callout').exists()).toBe(false)
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

  function mountRunning(overrides: Record<string, unknown> = {}) {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    store.status = 'running'
    store.showRestoredFlag = false
    store.totalSteps = 1
    store.currentStep = {
      id: '1',
      action: 'spotlight',
      target: { testId: 'test' },
      narrationKey: 'demo.scenario.scheduler.intro',
    }
    Object.assign(store, overrides)
    const mounted = mount(DemoOverlay, { global: { plugins: [pinia] }, attachTo: document.body })
    wrapper = mounted
    return { wrapper: mounted, store }
  }

  it('renders the step narration as a floating callout', () => {
    const { wrapper } = mountRunning()

    const callout = wrapper.find('[data-test="demo-narration"]')
    expect(callout.exists()).toBe(true)
    expect(callout.text()).toBe(en['demo.scenario.scheduler.intro'])
    expect(callout.attributes('role')).toBe('status')
    expect(callout.attributes('aria-live')).toBe('polite')
    expect(callout.attributes('aria-label')).toBe(en['demo.narrationAria'])
  })

  it('anchors the callout near the highlighted target', () => {
    const rect = {
      x: 100,
      y: 300,
      width: 100,
      height: 40,
      top: 300,
      left: 100,
      right: 200,
      bottom: 340,
      toJSON: () => {},
    } as DOMRect
    const { wrapper } = mountRunning({ narrationAnchor: rect })

    const callout = wrapper.find('.demo-callout')
    expect(callout.classes()).toContain('demo-callout--above')
    expect(callout.attributes('style')).toContain('left: 172px')
    expect(callout.attributes('style')).toContain('top: 286px')
  })

  it('centers the callout when a step has no target', () => {
    const { wrapper } = mountRunning()

    const callout = wrapper.find('.demo-callout')
    expect(callout.classes()).toContain('demo-callout--center')
    expect(callout.attributes('style')).toContain('top: 50%')
    expect(callout.attributes('style')).toContain('translate(-50%, -50%)')
  })

  it('renders the click area circle when a click occurs', async () => {
    const { wrapper, store } = mountRunning()

    store.showClick(50, 75)
    await wrapper.vm.$nextTick()
    const click = wrapper.find('[data-test="demo-click"]')

    expect(click.exists()).toBe(true)
    expect(click.attributes('aria-hidden')).toBe('true')
    expect(click.attributes('style')).toContain('left: 50px')
    expect(click.attributes('style')).toContain('top: 75px')
  })

  it('hides the click area when it is cleared', async () => {
    const { wrapper, store } = mountRunning()

    store.showClick(50, 75)
    await wrapper.vm.$nextTick()
    store.hideClick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="demo-click"]').exists()).toBe(false)
  })
})