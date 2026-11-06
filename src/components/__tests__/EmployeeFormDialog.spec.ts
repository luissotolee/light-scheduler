import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import InputNumber from 'primevue/inputnumber'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import EmployeeFormDialog from '@/components/EmployeeFormDialog.vue'
import type { TeamMember } from '@/types'

enableAutoUnmount(afterEach)

const ada: TeamMember = {
  id: 'member-1',
  name: 'Ada',
  duty: 'manager',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [{ year: 2026, week: 10 }],
  email: 'ada@example.com',
  phone: '+1 555 010 0000',
}

function dialogBody(): DOMWrapper<HTMLElement> {
  return new DOMWrapper(document.body)
}

describe('EmployeeFormDialog', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function mountDialog(visible = true, member: TeamMember | null = null) {
    const wrapper = mount(EmployeeFormDialog, {
      props: { visible, member },
      global: { plugins: [PrimeVue] },
    })
    await nextTick()
    return wrapper
  }

  it('submits a new employee with defaults', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('#employee-name').setValue('  Ada  ')
    await dialogBody().find('#employee-phone').setValue(' +1 555 010 0000 ')
    await wrapper.findComponent(InputNumber).vm.$emit('update:modelValue', 40)
    await nextTick()
    await dialogBody().find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          name: 'Ada',
          duty: 'employee',
          contract: 'fulltime',
          weeklyHours: 40,
          holidays: [],
          phone: '+1 555 010 0000',
        },
      ],
    ])
  })

  it('submits a new employee without a phone and omits the phone key', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('#employee-name').setValue('Ada')
    await wrapper.findComponent(InputNumber).vm.$emit('update:modelValue', 40)
    await nextTick()
    await dialogBody().find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          name: 'Ada',
          duty: 'employee',
          contract: 'fulltime',
          weeklyHours: 40,
          holidays: [],
        },
      ],
    ])
  })

  it('seeds the form from an edited member and submits every field', async () => {
    const wrapper = await mountDialog(true, ada)

    expect((dialogBody().find('#employee-name').element as HTMLInputElement).value).toBe('Ada')
    expect((dialogBody().find('#employee-email').element as HTMLInputElement).value).toBe(
      'ada@example.com',
    )
    expect((dialogBody().find('#employee-phone').element as HTMLInputElement).value).toBe(
      '+1 555 010 0000',
    )

    await wrapper.findAllComponents(Select)[0].vm.$emit('update:modelValue', 'assistant')
    await wrapper.findAllComponents(RadioButton)[2].vm.$emit('update:modelValue', 'weekends')
    await dialogBody().find('#employee-email').setValue(' new@example.com ')
    await wrapper.findComponent(InputNumber).vm.$emit('update:modelValue', 24)
    await nextTick()
    await dialogBody().find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          name: 'Ada',
          duty: 'assistant',
          contract: 'weekends',
          weeklyHours: 24,
          holidays: ada.holidays,
          phone: '+1 555 010 0000',
          email: 'new@example.com',
        },
      ],
    ])
  })

  it('disables submit until name and weekly hours are valid, and phone/email are valid when set', async () => {
    const wrapper = await mountDialog()

    expect(dialogBody().find('[data-test="submit"]').attributes('disabled')).toBeDefined()

    await dialogBody().find('#employee-name').setValue('Ada')
    expect(dialogBody().find('[data-test="submit"]').attributes('disabled')).toBeDefined()

    await wrapper.findComponent(InputNumber).vm.$emit('update:modelValue', 0)
    await nextTick()
    expect(dialogBody().find('[data-test="submit"]').attributes('disabled')).toBeDefined()

    await wrapper.findComponent(InputNumber).vm.$emit('update:modelValue', 40)
    await nextTick()
    expect(dialogBody().find('[data-test="submit"]').attributes('disabled')).toBeUndefined()

    await dialogBody().find('#employee-phone').setValue('123')
    expect(dialogBody().find('[data-test="submit"]').attributes('disabled')).toBeDefined()

    await dialogBody().find('#employee-phone').setValue('+1 555 010 0000')
    expect(dialogBody().find('[data-test="submit"]').attributes('disabled')).toBeUndefined()

    await dialogBody().find('#employee-phone').setValue('')
    expect(dialogBody().find('[data-test="submit"]').attributes('disabled')).toBeUndefined()

    await dialogBody().find('#employee-email').setValue('not-an-email')
    expect(dialogBody().find('[data-test="submit"]').attributes('disabled')).toBeDefined()

    await dialogBody().find('#employee-email').setValue('ada@example.com')
    expect(dialogBody().find('[data-test="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('shows phone and email validation errors only for invalid values', async () => {
    await mountDialog()

    expect(dialogBody().find('[data-test="phone-error"]').exists()).toBe(false)
    expect(dialogBody().find('[data-test="email-error"]').exists()).toBe(false)

    await dialogBody().find('#employee-phone').setValue('123')
    expect(dialogBody().find('[data-test="phone-error"]').text()).toBe('Phone is invalid')

    await dialogBody().find('#employee-phone').setValue('+1 555 010 0000')
    expect(dialogBody().find('[data-test="phone-error"]').exists()).toBe(false)

    await dialogBody().find('#employee-phone').setValue('')
    expect(dialogBody().find('[data-test="phone-error"]').exists()).toBe(false)

    await dialogBody().find('#employee-email').setValue('not-an-email')
    expect(dialogBody().find('[data-test="email-error"]').text()).toBe('Email is invalid')

    await dialogBody().find('#employee-email').setValue('')
    expect(dialogBody().find('[data-test="email-error"]').exists()).toBe(false)
  })

  it('renders contract options as a three-choice radio group', async () => {
    const wrapper = await mountDialog(true, ada)

    const radios = wrapper.findAllComponents(RadioButton)
    expect(radios).toHaveLength(3)
    expect(radios.map((radio) => radio.props('value'))).toEqual([
      'fulltime',
      'part_time',
      'weekends',
    ])
    expect(radios.every((radio) => radio.props('modelValue') === 'fulltime')).toBe(true)
    expect(wrapper.findAllComponents(Select)).toHaveLength(1)
  })

  it('does not submit invalid input even when the form is submitted directly', async () => {
    const wrapper = await mountDialog(true, ada)

    await dialogBody().find('#employee-name').setValue('   ')
    await wrapper.findComponent(InputNumber).vm.$emit('update:modelValue', 40)
    await nextTick()
    await dialogBody().find('form').trigger('submit')

    await dialogBody().find('#employee-name').setValue('Ada')
    await dialogBody().find('#employee-phone').setValue('123')
    await dialogBody().find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('emits update:visible false when cancelled', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('[data-test="cancel"]').trigger('click')

    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })

  it('resets the form from the member when opened', async () => {
    const wrapper = await mountDialog(false, null)

    await wrapper.setProps({ visible: true, member: ada })

    expect((dialogBody().find('#employee-name').element as HTMLInputElement).value).toBe('Ada')
    expect((dialogBody().find('#employee-phone').element as HTMLInputElement).value).toBe(
      '+1 555 010 0000',
    )
    expect(wrapper.findAllComponents(Select)[0].props('modelValue')).toBe('manager')
    expect(
      wrapper
        .findAllComponents(RadioButton)
        .every((radio) => radio.props('modelValue') === 'fulltime'),
    ).toBe(true)
  })
})
