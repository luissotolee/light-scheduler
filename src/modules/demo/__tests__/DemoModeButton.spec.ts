import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDemoStore } from '@/modules/demo/stores/demo'
import DemoModeButton from '@/modules/demo/components/DemoModeButton.vue'
import { startDemo } from '@/modules/demo/utils/demoSession'
import { getDemoScenario } from '@/modules/demo/scenarios'
import { en } from '@/shared/i18n/messages/en'

vi.mock('@/modules/demo/utils/demoSession', () => ({
  startDemo: vi.fn(),
}))

vi.mock('@/modules/demo/scenarios', () => ({
  getDemoScenario: vi.fn(),
}))

describe('DemoModeButton', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function mountButton(overrides: Partial<ReturnType<typeof useDemoStore>> = {}) {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    Object.assign(store, {
      status: 'idle',
      ...overrides,
    })
    return mount(DemoModeButton, { global: { plugins: [pinia] } })
  }

  it('renders start button with translated label', () => {
    const wrapper = mountButton()

    expect(wrapper.find('[data-test="demo-start-button"]').text()).toBe(en['demo.start'])
    expect(wrapper.find('[data-test="demo-start-button"]').attributes('aria-label')).toBe(en['demo.startAria'])
    expect(wrapper.find('[data-test="demo-start-button"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('[data-test="demo-start-button"]').attributes('disabled')).toBeUndefined()
  })

  it('shows aria-pressed true when demo is active', () => {
    const wrapper = mountButton({ status: 'running' })
    expect(wrapper.find('[data-test="demo-start-button"]').attributes('aria-pressed')).toBe('true')
  })

  it('calls startDemo when clicked', async () => {
    vi.mocked(startDemo).mockResolvedValue(true)
    vi.mocked(getDemoScenario).mockReturnValue({ id: 'scheduler-demo', steps: [] })

    const wrapper = mountButton()

    await wrapper.find('[data-test="demo-start-button"]').trigger('click')

    expect(getDemoScenario).toHaveBeenCalledWith('scheduler-demo')
    expect(startDemo).toHaveBeenCalledWith('scheduler-demo')
  })

  it('does nothing when scenario not found', async () => {
    vi.mocked(getDemoScenario).mockReturnValueOnce(undefined)
    vi.mocked(startDemo).mockResolvedValue(true)

    const wrapper = mountButton()

    await wrapper.find('[data-test="demo-start-button"]').trigger('click')

    expect(startDemo).not.toHaveBeenCalled()
  })

  it('disables button during start', async () => {
    let resolveStart: (value: boolean) => void
    const startPromise = new Promise<boolean>((resolve) => {
      resolveStart = resolve
    })
    vi.mocked(startDemo).mockReturnValue(startPromise)
    vi.mocked(getDemoScenario).mockReturnValue({ id: 'scheduler-demo', steps: [] })

    const wrapper = mountButton()
    const button = wrapper.find('[data-test="demo-start-button"]')

    const clickPromise = button.trigger('click')
    await Promise.resolve()
    await wrapper.vm.$nextTick()

    expect(button.attributes('disabled')).toBeDefined()

    resolveStart!(true)
    await clickPromise
    await wrapper.vm.$nextTick()

    expect(button.attributes('disabled')).toBeUndefined()
  })
})