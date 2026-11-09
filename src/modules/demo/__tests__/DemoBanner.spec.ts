import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import DemoBanner from '@/modules/demo/components/DemoBanner.vue'
import { useDemoStore } from '@/modules/demo/stores/demo'
import { useLocaleStore } from '@/shared/stores/locale'
import { stopDemo } from '@/modules/demo/utils/demoSession'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'
import type { DemoStep } from '@/modules/demo/types'

vi.mock('@/modules/demo/utils/demoSession', () => ({
  stopDemo: vi.fn(),
}))

const step = (overrides: Partial<DemoStep> = {}): DemoStep =>
  ({
    id: 'step-1',
    action: 'spotlight',
    target: { testId: 'test' },
    narrationKey: 'demo.scenario.scheduler.intro',
    ...overrides,
  }) as DemoStep

describe('DemoBanner', () => {
  const wrappers: VueWrapper[] = []
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    for (const wrapper of wrappers) wrapper.unmount()
    wrappers.length = 0
  })

  function seed(overrides: Record<string, unknown> = {}): void {
    const store = useDemoStore()
    Object.assign(store, {
      status: 'running',
      stepIndex: 0,
      totalSteps: 2,
      currentStep: step(),
      errorKey: null,
      ...overrides,
    })
  }

  function mountBanner(overrides: Record<string, unknown> = {}): VueWrapper {
    seed(overrides)
    const wrapper = mount(DemoBanner, {
      global: { plugins: [pinia] },
    })
    wrappers.push(wrapper)
    return wrapper
  }

  it('renders nothing when idle', () => {
    seed({ status: 'idle' })
    const wrapper = mount(DemoBanner, { global: { plugins: [pinia] } })
    wrappers.push(wrapper)
    expect(wrapper.find('[data-test="demo-banner"]').exists()).toBe(false)
  })

  it('running: badge, description and translated progress', () => {
    const wrapper = mountBanner()
    expect(wrapper.find('.demo-banner__badge').text()).toBe(en['demo.badge'])
    expect(wrapper.find('.demo-banner__message').text()).toBe(en['demo.banner'])
    expect(wrapper.find('[data-test="demo-progress"]').text()).toContain('Step 1 of 2')
  })

  it('leaves step narration to the overlay callout', () => {
    const wrapper = mountBanner()
    expect(wrapper.find('[data-test="demo-narration"]').exists()).toBe(false)
  })

  it('renders only the exit control', async () => {
    const wrapper = mountBanner({ stepIndex: 1 })
    expect(wrapper.find('[data-test="demo-previous"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="demo-pause"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="demo-next"]').exists()).toBe(false)

    await wrapper.find('[data-test="demo-exit"]').trigger('click')
    expect(stopDemo).toHaveBeenCalled()
  })

  it('shows a translated alert and keeps exit on error', () => {
    const wrapper = mountBanner({ status: 'error', errorKey: 'demo.error.start' })
    const alert = wrapper.find('[data-test="demo-error"]')
    expect(alert.exists()).toBe(true)
    expect(alert.attributes('role')).toBe('alert')
    expect(alert.text()).toBe(en['demo.error.start'])
    expect(wrapper.find('[data-test="demo-narration"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="demo-progress"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="demo-pause"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="demo-exit"]').exists()).toBe(true)
  })

  it('hides step information while finishing but keeps exit', () => {
    const wrapper = mountBanner({ status: 'finishing' })
    expect(wrapper.find('[data-test="demo-narration"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="demo-progress"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="demo-pause"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="demo-exit"]').exists()).toBe(true)
  })

  it('renders Spanish labels when the locale is es', () => {
    useLocaleStore().setLocale('es')
    const wrapper = mountBanner()
    expect(wrapper.find('.demo-banner__badge').text()).toBe(es['demo.badge'])
    expect(wrapper.find('.demo-banner__message').text()).toBe(es['demo.banner'])
    expect(wrapper.find('[data-test="demo-progress"]').text()).toContain('Paso 1 de 2')
    expect(wrapper.find('[data-test="demo-exit"]').text()).toContain(es['demo.exit'])
  })
})
