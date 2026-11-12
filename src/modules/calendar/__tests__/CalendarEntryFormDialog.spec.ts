import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import CalendarEntryFormDialog from '@/modules/calendar/components/CalendarEntryFormDialog.vue'
import { en } from '@/shared/i18n/messages/en'
import type { CalendarEntry } from '@/types'

const entry: CalendarEntry = {
  id: 'entry-1',
  date: '2026-11-03',
  name: 'Team day',
  kind: 'custom_event',
}

async function mountDialog(props: {
  visible?: boolean
  entry?: CalendarEntry | null
  defaultDate?: string
  error?: string
}) {
  const wrapper = mount(CalendarEntryFormDialog, {
    props: {
      visible: props.visible ?? true,
      entry: props.entry ?? null,
      defaultDate: props.defaultDate,
      error: props.error,
    },
    global: {
      plugins: [createPinia(), PrimeVue],
      stubs: { teleport: true },
    },
  })
  await nextTick()
  return wrapper
}

describe('CalendarEntryFormDialog', () => {
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

  it('adds a custom event with the default date', async () => {
    const wrapper = await mountDialog({ defaultDate: '2026-11-03' })

    await wrapper.find('[data-test="calendar-entry-name"]').setValue('Company anniversary')
    await wrapper.find('[data-test="calendar-entry-form"]').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [{ date: '2026-11-03', name: 'Company anniversary', kind: 'custom_event' }],
    ])
  })

  it('prefills the form when editing an entry', async () => {
    const wrapper = await mountDialog({ entry })

    expect(
      (wrapper.find('[data-test="calendar-entry-name"]').element as HTMLInputElement).value,
    ).toBe('Team day')
  })

  it('shows a validation error and does not submit an empty name', async () => {
    const wrapper = await mountDialog({ defaultDate: '2026-11-03' })

    await wrapper.find('[data-test="calendar-entry-form"]').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.find('[data-test="calendar-entry-name-error"]').text()).toBe(
      en['errors.requiredName'],
    )
  })

  it('shows the server error passed by the parent', async () => {
    const wrapper = await mountDialog({
      defaultDate: '2026-11-03',
      error: en['errors.duplicateCalendarEntry'],
    })

    expect(wrapper.find('[data-test="calendar-entry-error"]').text()).toBe(
      en['errors.duplicateCalendarEntry'],
    )
  })

  it('closes without submitting when cancelled', async () => {
    const wrapper = await mountDialog({ defaultDate: '2026-11-03' })

    await wrapper.find('[data-test="calendar-entry-cancel"]').trigger('click')

    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })
})
