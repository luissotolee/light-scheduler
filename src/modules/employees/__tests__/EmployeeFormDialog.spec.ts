import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMWrapper, enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import EmployeeFormDialog from '@/modules/employees/components/EmployeeFormDialog.vue'
import { fillInput } from '@/modules/demo/utils/dom'
import { isoDateToDate, todayIsoDate } from '@/shared/utils/calendar'
import type { TeamMember } from '@/types'

enableAutoUnmount(afterEach)

const ada: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
  name: 'Ada',
  duty: 'manager',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [{ year: 2026, week: 10 }],
  email: 'ada@example.com',
  phone: '+1 555 010 0000',
  active: true,
  startDate: '2025-01-15',
}

function dialogBody(): DOMWrapper<HTMLElement> {
  return new DOMWrapper(document.body)
}

describe('EmployeeFormDialog', () => {
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
          email: '',
          startDate: todayIsoDate(),
        },
      ],
    ])
  })

  it('submits a new employee with empty optional contact fields', async () => {
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
          phone: '',
          email: '',
          startDate: todayIsoDate(),
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
          startDate: ada.startDate,
        },
      ],
    ])
  })

  it('emits empty optional fields when they are cleared on edit', async () => {
    const wrapper = await mountDialog(true, ada)

    await dialogBody().find('#employee-phone').setValue('')
    await dialogBody().find('#employee-email').setValue('   ')
    await nextTick()
    await dialogBody().find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          name: 'Ada',
          duty: 'manager',
          contract: 'fulltime',
          weeklyHours: 40,
          holidays: ada.holidays,
          phone: '',
          email: '',
          startDate: ada.startDate,
        },
      ],
    ])
  })

  it('renders required field markers and format placeholders', async () => {
    await mountDialog()

    const body = dialogBody()
    expect(body.find('label[for="employee-name"]').text()).toBe('Name *')
    expect(body.find('label[for="employee-duty"]').text()).toBe('Duty *')
    expect(body.find('label[for="employee-hours"]').text()).toBe('Weekly hours *')
    expect(body.find('legend').text()).toBe('Contract *')
    expect(body.find('label[for="employee-phone"]').text()).toBe('Phone')
    expect(body.find('label[for="employee-email"]').text()).toBe('Email')
    expect(body.text()).not.toContain('(optional)')

    expect(body.find('#employee-name').attributes('placeholder')).toBe('e.g. Jane Doe')
    expect(body.find('#employee-phone').attributes('placeholder')).toBe(
      'e.g. 612 345 678 or +34 612 345 678',
    )
    expect(body.find('#employee-email').attributes('placeholder')).toBe('e.g. jane@example.com')
    expect(body.find('#employee-hours').attributes('placeholder')).toBe('e.g. 40')
  })

  it('marks required controls for assistive technology', async () => {
    const wrapper = await mountDialog()
    const body = dialogBody()

    expect(body.find('#employee-name').attributes('required')).toBeDefined()
    expect(body.find('#employee-name').attributes('aria-required')).toBe('true')
    expect(body.find('#employee-hours').attributes('required')).toBeDefined()

    const select = wrapper.findComponent(Select)
    expect(select.attributes('required')).toBeDefined()
    expect(select.attributes('aria-required')).toBe('true')

    const hours = wrapper.findComponent(InputNumber)
    expect(hours.attributes('aria-required')).toBe('true')
    expect(body.find('#employee-hours').attributes('placeholder')).toBe('e.g. 40')

    expect(body.find('[role="radiogroup"]').attributes('aria-required')).toBe('true')
    expect(
      wrapper
        .findAllComponents(RadioButton)
        .every((radio) => radio.attributes('required') !== undefined),
    ).toBe(true)

    await wrapper.findAllComponents(Select)[0].vm.$emit('update:modelValue', 'chef')
    await wrapper.findAllComponents(RadioButton)[0].vm.$emit('update:modelValue', 'contractor')
    await nextTick()
    await dialogBody().find('form').trigger('submit')
    await nextTick()

    expect(wrapper.findComponent(Select).attributes('aria-invalid')).toBe('true')
    expect(wrapper.findComponent(Select).attributes('aria-describedby')).toBe(
      'employee-duty-error',
    )

    const radiogroup = dialogBody().find('[role="radiogroup"]')
    expect(radiogroup.attributes('aria-invalid')).toBe('true')
    expect(radiogroup.attributes('aria-describedby')).toBe('employee-contract-error')
  })

  it('shows a holidays error and does not submit when the member has too many holiday weeks', async () => {
    const member: TeamMember = {
      ...ada,
      holidays: Array.from({ length: 7 }, (_, index) => ({ year: 2026, week: index + 1 })),
    }
    const wrapper = await mountDialog(true, member)

    await dialogBody().find('form').trigger('submit')

    expect(dialogBody().find('[data-test="holidays-error"]').text()).toBe(
      'At most 6 holiday weeks are allowed',
    )
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('shows no validation errors and an enabled save button when opened', async () => {
    await mountDialog()

    const body = dialogBody()
    expect(body.find('[data-test="name-error"]').exists()).toBe(false)
    expect(body.find('[data-test="hours-error"]').exists()).toBe(false)
    expect(body.find('[data-test="phone-error"]').exists()).toBe(false)
    expect(body.find('[data-test="email-error"]').exists()).toBe(false)
    expect(body.find('[data-test="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('shows validation errors and emits nothing when an empty form is submitted', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('form').trigger('submit')

    expect(dialogBody().find('[data-test="name-error"]').text()).toBe('Name is required')
    expect(dialogBody().find('[data-test="hours-error"]').text()).toBe(
      'Weekly hours must be a number greater than 0 and at most 168',
    )
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('updates errors live after a failed submit', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('form').trigger('submit')
    expect(dialogBody().find('[data-test="name-error"]').exists()).toBe(true)
    expect(dialogBody().find('[data-test="hours-error"]').exists()).toBe(true)

    await dialogBody().find('#employee-name').setValue('Ada')
    expect(dialogBody().find('[data-test="name-error"]').exists()).toBe(false)
    expect(dialogBody().find('[data-test="hours-error"]').exists()).toBe(true)

    await wrapper.findComponent(InputNumber).vm.$emit('update:modelValue', 40)
    await nextTick()
    expect(dialogBody().find('[data-test="hours-error"]').exists()).toBe(false)

    await dialogBody().find('#employee-phone').setValue('123')
    expect(dialogBody().find('[data-test="phone-error"]').text()).toBe('Phone is invalid')

    await dialogBody().find('#employee-phone').setValue('612 345 678')
    expect(dialogBody().find('[data-test="phone-error"]').exists()).toBe(false)

    await dialogBody().find('#employee-email').setValue('not-an-email')
    expect(dialogBody().find('[data-test="email-error"]').text()).toBe('Email is invalid')

    await dialogBody().find('#employee-email').setValue('')
    expect(dialogBody().find('[data-test="email-error"]').exists()).toBe(false)
  })

  it('accepts Spanish phone formats and rejects invalid lengths after submit', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('#employee-name').setValue('Ada')
    await wrapper.findComponent(InputNumber).vm.$emit('update:modelValue', 40)
    await nextTick()
    await dialogBody().find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toHaveLength(1)

    for (const phone of ['612 345 678', '+34 612 345 678', '+1 612 345 678']) {
      await dialogBody().find('#employee-phone').setValue(phone)
      await dialogBody().find('form').trigger('submit')
      expect(dialogBody().find('[data-test="phone-error"]').exists()).toBe(false)
    }
    expect(wrapper.emitted('submit')).toHaveLength(4)

    for (const phone of ['61234567', '6123456789']) {
      await dialogBody().find('#employee-phone').setValue(phone)
      await dialogBody().find('form').trigger('submit')
      expect(dialogBody().find('[data-test="phone-error"]').text()).toBe('Phone is invalid')
    }
    expect(wrapper.emitted('submit')).toHaveLength(4)
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

  it('seeds the start date picker from the edited member', async () => {
    const wrapper = await mountDialog(true, ada)

    const picker = wrapper.findComponent(DatePicker)
    expect(picker.exists()).toBe(true)
    expect(picker.props('dateFormat')).toBe('yy-mm-dd')
    expect(dialogBody().find('#employee-start-date').exists()).toBe(true)

    const model = picker.props('modelValue') as Date
    expect(model.getFullYear()).toBe(2025)
    expect(model.getMonth()).toBe(0)
    expect(model.getDate()).toBe(15)
  })

  it('submits the ISO start date selected in the date picker', async () => {
    const wrapper = await mountDialog()

    await dialogBody().find('#employee-name').setValue('Ada')
    await wrapper.findComponent(InputNumber).vm.$emit('update:modelValue', 40)
    await wrapper
      .findComponent(DatePicker)
      .vm.$emit('update:modelValue', isoDateToDate('2026-12-01'))
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
          phone: '',
          email: '',
          startDate: '2026-12-01',
        },
      ],
    ])
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

  it('accepts values through the demo data-test targets', async () => {
    const wrapper = await mountDialog()

    expect(dialogBody().find('[data-test="employee-duty-select"]').exists()).toBe(true)
    expect(dialogBody().find('[data-test="employee-contract-group"]').exists()).toBe(true)
    expect(dialogBody().find('[data-test="employee-start-date"]').exists()).toBe(true)

    fillInput(
      dialogBody().find('[data-test="employee-name-input"]').element as HTMLElement,
      'Nora Ejemplo',
    )
    fillInput(
      dialogBody().find('[data-test="employee-phone-input"]').element as HTMLElement,
      '+34 600 123 456',
    )
    fillInput(
      dialogBody().find('[data-test="employee-email-input"]').element as HTMLElement,
      'nora.ejemplo@example.com',
    )
    fillInput(
      dialogBody().find('[data-test="employee-hours-input"]').element as HTMLElement,
      '32',
    )
    await nextTick()
    await dialogBody().find('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      name: 'Nora Ejemplo',
      phone: '+34 600 123 456',
      email: 'nora.ejemplo@example.com',
      weeklyHours: 32,
    })
  })
})
