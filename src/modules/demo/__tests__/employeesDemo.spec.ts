import { describe, expect, it } from 'vitest'
import { employeesDemoScenario } from '@/modules/demo/scenarios/employeesDemo'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'

const knownTargets = [
  'employee-search',
  'sort-name',
  'sort-duty',
  'add-employee',
  'employee-table',
  'hide-inactive',
  'employee-form',
  'employee-name-input',
  'employee-phone-input',
  'employee-email-input',
  'employee-duty-select',
  'employee-contract-group',
  'employee-hours-input',
  'employee-start-date',
  'employee-comment-input',
  'submit',
  'details-emp-mock-02',
  'details-duty',
  'details-comment',
  'close-details',
  'holidays-emp-mock-02',
  'week-20',
  'next-year',
  'save-holidays',
  'edit-emp-mock-03',
  'deactivate-emp-mock-02',
  'reactivate-emp-mock-02',
  'remove-emp-mock-02',
  'confirm-message',
  'confirm-accept',
]

describe('employeesDemo scenario', () => {
  it('has correct id', () => {
    expect(employeesDemoScenario.id).toBe('employees-demo')
  })

  it('has unique step ids', () => {
    const ids = employeesDemoScenario.steps.map((step) => step.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all steps have required fields', () => {
    employeesDemoScenario.steps.forEach((step) => {
      expect(step.id).toBeTruthy()
      expect(step.action).toBeTruthy()
      expect(step.narrationKey).toBeTruthy()
      if (step.action !== 'navigate' && step.action !== 'wait') {
        expect(step.target).toBeDefined()
        expect(step.target?.testId).toBeTruthy()
      }
      if (step.action === 'navigate') {
        expect(step.route).toBeTruthy()
      }
      if (step.action === 'press') {
        expect('key' in step).toBe(true)
      }
      if (step.action === 'fill') {
        expect('value' in step).toBe(true)
      }
    })
  })

  it('narration keys exist in both en and es catalogs', () => {
    employeesDemoScenario.steps.forEach((step) => {
      expect(en[step.narrationKey as keyof typeof en]).toBeDefined()
      expect(es[step.narrationKey as keyof typeof es]).toBeDefined()
    })
  })

  it('uses known data-test targets and routes', () => {
    employeesDemoScenario.steps.forEach((step) => {
      if ('target' in step && step.target?.testId) {
        expect(knownTargets).toContain(step.target.testId)
      }
      if (step.action === 'navigate') {
        expect(step.route).toBe('/employees')
      }
    })
  })

  it('covers the full employee lifecycle', () => {
    const actions = employeesDemoScenario.steps.map((step) => step.action)
    const targets = employeesDemoScenario.steps
      .filter((step) => 'target' in step && step.target)
      .map((step) => (step as { target: { testId: string } }).target.testId)

    expect(actions).toContain('fill')
    expect(actions).toContain('click')
    expect(targets).toContain('employee-search')
    expect(targets).toContain('sort-duty')
    expect(targets).toContain('sort-name')
    expect(targets).toContain('add-employee')
    expect(targets).toContain('hide-inactive')
    expect(targets).toContain('employee-comment-input')
    expect(targets).toContain('details-comment')
    expect(targets).toContain('edit-emp-mock-03')
    expect(targets).toContain('deactivate-emp-mock-02')
    expect(targets).toContain('reactivate-emp-mock-02')
    expect(targets).toContain('remove-emp-mock-02')
  })
})
