import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { useDemoStore } from '@/modules/demo/stores/demo'
import DemoModeButton from '@/modules/demo/components/DemoModeButton.vue'
import { startDemo } from '@/modules/demo/utils/demoSession'
import { en } from '@/shared/i18n/messages/en'

vi.mock('@/modules/demo/utils/demoSession', () => ({
  startDemo: vi.fn(),
}))

enableAutoUnmount(afterEach)

function body(): DOMWrapper<HTMLElement> {
  return new DOMWrapper(document.body)
}

describe('DemoModeButton', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mountButton(overrides: Partial<ReturnType<typeof useDemoStore>> = {}) {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDemoStore()
    Object.assign(store, {
      status: 'idle',
      ...overrides,
    })
    return mount(DemoModeButton, {
      global: { plugins: [pinia, PrimeVue] },
      attachTo: document.body,
    })
  }

  it('renders start button with translated label', () => {
    const wrapper = mountButton()

    expect(wrapper.find('[data-test="demo-start-button"]').text()).toBe(en['demo.start'])
    expect(wrapper.find('[data-test="demo-start-button"]').attributes('aria-label')).toBe(
      en['demo.startAria'],
    )
    expect(wrapper.find('[data-test="demo-start-button"]').attributes('aria-pressed')).toBe(
      'false',
    )
    expect(wrapper.find('[data-test="demo-start-button"]').attributes('aria-expanded')).toBe(
      'false',
    )
    expect(wrapper.find('[data-test="demo-start-button"]').attributes('disabled')).toBeUndefined()
  })

  it('shows aria-pressed true when demo is active', () => {
    const wrapper = mountButton({ status: 'running' })
    expect(wrapper.find('[data-test="demo-start-button"]').attributes('aria-pressed')).toBe('true')
  })

  it('opens the picker with all demo options', async () => {
    const wrapper = mountButton()

    await wrapper.find('[data-test="demo-start-button"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[data-test="demo-start-button"]').attributes('aria-expanded')).toBe('true')
    expect(body().find('[data-test="demo-picker"]').exists()).toBe(true)
    expect(body().find('[data-test="demo-option-employees"]').text()).toContain(
      en['demo.picker.employees'],
    )
    expect(body().find('[data-test="demo-option-scheduler"]').text()).toContain(
      en['demo.picker.scheduler'],
    )
    expect(body().find('[data-test="demo-option-calendar"]').text()).toContain(
      en['demo.picker.calendar'],
    )
    expect(body().find('[data-test="demo-option-summary"]').text()).toContain(
      en['demo.picker.summary'],
    )
    expect(body().find('[data-test="demo-option-archive"]').exists()).toBe(false)
    expect(startDemo).not.toHaveBeenCalled()
  })

  it('starts the selected scenario when an option is clicked', async () => {
    vi.mocked(startDemo).mockResolvedValue(true)
    const wrapper = mountButton()

    await wrapper.find('[data-test="demo-start-button"]').trigger('click')
    await nextTick()

    body().find('[data-test="demo-option-employees"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await nextTick()

    expect(startDemo).toHaveBeenCalledWith('employees-demo')
  })

  it('starts the scheduler scenario from its option', async () => {
    vi.mocked(startDemo).mockResolvedValue(true)
    const wrapper = mountButton()

    await wrapper.find('[data-test="demo-start-button"]').trigger('click')
    await nextTick()

    body().find('[data-test="demo-option-scheduler"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await nextTick()

    expect(startDemo).toHaveBeenCalledWith('scheduler-demo')
  })

  it('starts the calendar scenario from its option', async () => {
    vi.mocked(startDemo).mockResolvedValue(true)
    const wrapper = mountButton()

    await wrapper.find('[data-test="demo-start-button"]').trigger('click')
    await nextTick()

    body().find('[data-test="demo-option-calendar"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await nextTick()

    expect(startDemo).toHaveBeenCalledWith('calendar-demo')
  })

  it('starts the summary scenario from its option', async () => {
    vi.mocked(startDemo).mockResolvedValue(true)
    const wrapper = mountButton()

    await wrapper.find('[data-test="demo-start-button"]').trigger('click')
    await nextTick()

    body().find('[data-test="demo-option-summary"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await nextTick()

    expect(startDemo).toHaveBeenCalledWith('summary-demo')
  })

  it('closes the picker without starting a demo when cancelled', async () => {
    const wrapper = mountButton()

    await wrapper.find('[data-test="demo-start-button"]').trigger('click')
    await nextTick()

    body().find('[data-test="demo-picker-cancel"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await nextTick()

    expect(startDemo).not.toHaveBeenCalled()
    expect(wrapper.find('[data-test="demo-start-button"]').attributes('aria-expanded')).toBe(
      'false',
    )
  })

  it('disables button during start', async () => {
    let resolveStart: (value: boolean) => void
    const startPromise = new Promise<boolean>((resolve) => {
      resolveStart = resolve
    })
    vi.mocked(startDemo).mockReturnValue(startPromise)

    const wrapper = mountButton()
    const button = wrapper.find('[data-test="demo-start-button"]')

    await button.trigger('click')
    await nextTick()
    body().find('[data-test="demo-option-scheduler"]').element.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await nextTick()

    expect(button.attributes('disabled')).toBeDefined()

    resolveStart!(true)
    await startPromise
    await nextTick()

    expect(wrapper.find('[data-test="demo-start-button"]').attributes('disabled')).toBeUndefined()
  })
})
