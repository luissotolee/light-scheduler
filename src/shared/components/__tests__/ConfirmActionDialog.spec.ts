import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmActionDialog from '@/shared/components/ConfirmActionDialog.vue'

enableAutoUnmount(afterEach)

function dialogBody(): DOMWrapper<HTMLElement> {
  return new DOMWrapper(document.body)
}

describe('ConfirmActionDialog', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function mountDialog() {
    const wrapper = mount(ConfirmActionDialog, {
      props: {
        visible: true,
        header: 'Remove employee',
        message: 'Remove Ada? This cannot be undone.',
        confirmLabel: 'Remove',
        severity: 'danger',
      },
      global: { plugins: [PrimeVue] },
    })
    await nextTick()
    return wrapper
  }

  it('renders the header, message, and confirm label', async () => {
    await mountDialog()

    expect(dialogBody().text()).toContain('Remove employee')
    expect(dialogBody().find('[data-test="confirm-message"]').text()).toBe(
      'Remove Ada? This cannot be undone.',
    )
    expect(dialogBody().find('[data-test="confirm-accept"]').text()).toBe('Remove')
  })

  it('emits confirm when the confirm button is clicked', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('[data-test="confirm-accept"]').trigger('click')

    expect(wrapper.emitted('confirm')).toEqual([[]])
  })

  it('emits update:visible false when cancelled', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('[data-test="confirm-cancel"]').trigger('click')

    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })
})
