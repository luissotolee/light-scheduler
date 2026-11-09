import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DemoOverlay from '@/modules/demo/components/DemoOverlay.vue'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { pauseEngine, resumeEngine, nextStep, previousStep } from '@/modules/demo/player/engine'
import { stopDemo } from '@/modules/demo/utils/demoSession'
import { en } from '@/shared/i18n/messages/en'

vi.mock('@/modules/demo/player/engine', () => ({
  startEngine: vi.fn().mockResolvedValue(undefined),
  stopEngine: vi.fn().mockResolvedValue(undefined),
  pauseEngine: vi.fn().mockResolvedValue(undefined),
  resumeEngine: vi.fn().mockResolvedValue(undefined),
  nextStep: vi.fn().mockResolvedValue(undefined),
  previousStep: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/modules/demo/utils/demoSession', () => ({
  stopDemo: vi.fn(),
}))

vi.mock('@/modules/demo/scenarios', () => ({
  getDemoScenario: vi.fn().mockReturnValue({
    id: 'scheduler-demo',
    steps: [
      { id: '1', action: 'spotlight', target: { testId: 'test' }, narrationKey: 'demo.scenario.scheduler.intro' },
      { id: '2', action: 'navigate', route: '/employees', narrationKey: 'demo.scenario.employees.intro' },
    ],
  }),
}))

vi.mock('@/modules/demo/utils/dom', () => ({
  prefersReducedMotion: vi.fn().mockReturnValue(false),
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

  function mountOverlay(overrides: Partial<ReturnType<typeof useDemoStore>> = {}) {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    Object.assign(store, {
      status: 'running',
      stepIndex: 0,
      totalSteps: 2,
      currentStep: { id: '1', action: 'spotlight', target: { testId: 'test' }, narrationKey: 'demo.scenario.scheduler.intro' },
      showRestoredFlag: false,
      ...overrides,
    })
    wrapper = mount(DemoOverlay, { global: { plugins: [pinia] }, attachTo: document.body })
    return wrapper
  }

  it('renders when demo is running', () => {
    const wrapper = mountOverlay()
    expect(wrapper.find('[data-test="demo-overlay"]').exists()).toBe(true)
  })

  it('does not render when demo is idle and no restored flag', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    store.status = 'idle'
    store.showRestoredFlag = false
    const wrapper = mount(DemoOverlay, { global: { plugins: [pinia] } })
    expect(wrapper.find('[data-test="demo-overlay"]').exists()).toBe(false)
  })

  it('shows narration text with translation', () => {
    const wrapper = mountOverlay()
    expect(wrapper.find('[data-test="demo-narration"]').text()).toContain(en['demo.scenario.scheduler.intro'])
    expect(wrapper.find('[data-test="demo-narration"]').text()).toContain(en['demo.progress'].replace('{current}', '1').replace('{total}', '2'))
  })

  it('shows progress with current and total steps', () => {
    const wrapper = mountOverlay({ stepIndex: 1, totalSteps: 3 })
    expect(wrapper.find('.demo-narration__progress').text()).toContain('2')
    expect(wrapper.find('.demo-narration__progress').text()).toContain('3')
  })

  it('renders control buttons with translated labels', () => {
    const wrapper = mountOverlay()
    const buttons = wrapper.findAll('.demo-controls__btn')
    expect(buttons[0].text()).toBe(en['demo.previous'])
    expect(buttons[1].text()).toBe(en['demo.pause'])
    expect(buttons[2].text()).toBe(en['demo.next'])
    expect(buttons[3].text()).toBe(en['demo.exit'])
  })

  it('shows resume button when paused', () => {
    const wrapper = mountOverlay({ status: 'paused' })
    const pauseBtn = wrapper.findAll('.demo-controls__btn')[1]
    expect(pauseBtn.text()).toBe(en['demo.resume'])
  })

  it('shows finish button on last step', () => {
    const wrapper = mountOverlay({ stepIndex: 1, totalSteps: 2 })
    const nextBtn = wrapper.findAll('.demo-controls__btn')[2]
    expect(nextBtn.text()).toBe(en['demo.finish'])
  })

  it('calls previousStep when previous clicked', async () => {
    const wrapper = mountOverlay({ stepIndex: 1 })
    await wrapper.findAll('.demo-controls__btn')[0].trigger('click')
    expect(previousStep).toHaveBeenCalled()
  })

  it('calls nextStep when next clicked', async () => {
    const wrapper = mountOverlay()
    await wrapper.findAll('.demo-controls__btn')[2].trigger('click')
    expect(nextStep).toHaveBeenCalled()
  })

  it('calls pauseEngine when pause clicked', async () => {
    const wrapper = mountOverlay()
    await wrapper.findAll('.demo-controls__btn')[1].trigger('click')
    expect(pauseEngine).toHaveBeenCalled()
  })

  it('calls resumeEngine when resume clicked', async () => {
    const wrapper = mountOverlay({ status: 'paused' })
    await wrapper.findAll('.demo-controls__btn')[1].trigger('click')
    expect(resumeEngine).toHaveBeenCalled()
  })

  it('calls stopDemo when exit clicked', async () => {
    const wrapper = mountOverlay()
    await wrapper.findAll('.demo-controls__btn')[3].trigger('click')
    expect(stopDemo).toHaveBeenCalled()
  })

  it('exits on Escape key', async () => {
    mountOverlay()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await vi.dynamicImportSettled?.()
    expect(stopDemo).toHaveBeenCalled()
  })

  it('shows restored toast when flag is set and demo is idle', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    store.status = 'idle'
    store.showRestoredFlag = true
    const wrapper = mount(DemoOverlay, { global: { plugins: [pinia] }, attachTo: document.body })
    expect(wrapper.find('[data-test="demo-restored"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="demo-restored"]').text()).toBe(en['demo.restored'])
  })

  it('has aria-live on narration and controls', () => {
    const wrapper = mountOverlay()
    expect(wrapper.find('[data-test="demo-narration"]').attributes('aria-live')).toBe('polite')
    expect(wrapper.find('[data-test="demo-narration"]').attributes('role')).toBe('status')
  })

  it('has exit button with aria-label', () => {
    const wrapper = mountOverlay()
    const exitBtn = wrapper.find('.demo-controls__btn--exit')
    expect(exitBtn.attributes('aria-label')).toBe(en['demo.exitAria'])
  })

  it('disables previous button on first step', () => {
    const wrapper = mountOverlay({ stepIndex: 0 })
    const prevBtn = wrapper.findAll('.demo-controls__btn')[0]
    expect(prevBtn.attributes('disabled')).toBeDefined()
  })

  it('disables previous button when paused', () => {
    const wrapper = mountOverlay({ status: 'paused', stepIndex: 1 })
    const prevBtn = wrapper.findAll('.demo-controls__btn')[0]
    expect(prevBtn.attributes('disabled')).toBeDefined()
  })

  it('does not call startEngine on mount', async () => {
    const { startEngine } = await import('@/modules/demo/player/engine')
    mountOverlay()
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

    expect(wrapper.find('.demo-controls__btn--exit').exists()).toBe(true)
    wrapper.unmount()
  })
})