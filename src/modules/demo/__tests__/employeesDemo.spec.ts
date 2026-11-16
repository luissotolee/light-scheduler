import { describe, expect, it } from 'vitest'
import { filterScenarioForViewport } from '@/modules/demo/player/engine'
import {
  employeesDemoScenario,
  employeesDemoScenarios,
} from '@/modules/demo/scenarios/employeesDemo'
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
  'employee-hours-period-group',
  'employee-hours-period-month-label',
  'employee-hours-input',
  'employee-start-date',
  'employee-comment-input',
  'submit',
  'details-emp-mock-02',
  'details-duty',
  'details-comment',
  'close-details',
  'holidays-emp-mock-02',
  'sick-emp-mock-02',
  'employee-sickness',
  'sick-add-range',
  'sick-save',
  'week-20',
  'next-year',
  'save-holidays',
  'export-holidays',
  'export-year-current',
  'export-year-next',
  'confirm-holiday-export',
  'cancel-holiday-export',
  'edit-emp-mock-02',
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

  it('only uses known viewport filters', () => {
    employeesDemoScenario.steps.forEach((step) => {
      if (step.viewport) {
        expect(['phone', 'desktop']).toContain(step.viewport)
      }
    })
  })

  it('uses the manage dialog flow on phones', () => {
    const phoneSteps = filterScenarioForViewport(employeesDemoScenario, true).steps
    const desktopSteps = filterScenarioForViewport(employeesDemoScenario, false).steps

    expect(phoneSteps.find((step) => step.id === 'employees-manage-details')).toBeDefined()
    expect(phoneSteps.find((step) => step.id === 'employees-manage-open')).toBeDefined()
    expect(desktopSteps.some((step) => step.id === 'employees-manage-details')).toBe(false)
    expect(desktopSteps.some((step) => step.id === 'employees-manage-open')).toBe(false)
    expect(desktopSteps.find((step) => step.id === 'employees-details-open')).toBeDefined()
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
    expect(targets).toContain('export-holidays')
    expect(targets).toContain('confirm-holiday-export')
    expect(targets).toContain('employee-comment-input')
    expect(targets).toContain('details-comment')
    expect(targets).toContain('edit-emp-mock-02')
    expect(targets).toContain('deactivate-emp-mock-02')
    expect(targets).toContain('reactivate-emp-mock-02')
    expect(targets).toContain('remove-emp-mock-02')
  })
})

describe('employees demo journeys', () => {
  it('exposes the full demo plus focused journeys', () => {
    expect(employeesDemoScenarios.map((scenario) => scenario.id)).toEqual([
      'employees-demo',
      'employees-add-demo',
      'employees-edit-demo',
      'employees-holidays-demo',
      'employees-sick-demo',
      'employees-active-demo',
    ])
  })

  it('reuses full-demo steps with translated metadata', () => {
    const fullStepIds = new Set(employeesDemoScenario.steps.map((step) => step.id))
    const focusedOnlyStepIds = new Set(['employees-manage-close'])

    employeesDemoScenarios.forEach((scenario) => {
      expect(scenario.module).toBe('employees')
      expect(en[scenario.titleKey as keyof typeof en]).toBeDefined()
      expect(es[scenario.titleKey as keyof typeof es]).toBeDefined()
      expect(en[scenario.descriptionKey as keyof typeof en]).toBeDefined()
      expect(es[scenario.descriptionKey as keyof typeof es]).toBeDefined()

      const ids = scenario.steps.map((step) => step.id)
      expect(new Set(ids).size).toBe(ids.length)
      ids.forEach((id) => {
        expect(fullStepIds.has(id) || focusedOnlyStepIds.has(id)).toBe(true)
      })

      scenario.steps.forEach((step) => {
        expect(en[step.narrationKey as keyof typeof en]).toBeDefined()
        expect(es[step.narrationKey as keyof typeof es]).toBeDefined()
        if ('target' in step && step.target?.testId) {
          expect(knownTargets).toContain(step.target.testId)
        }
        if (step.action === 'navigate') {
          expect(step.route).toBe('/employees')
        }
      })
    })
  })

  it('keeps phone action journeys usable by opening the manage dialog first', () => {
    const focusedIds = [
      'employees-edit-demo',
      'employees-holidays-demo',
      'employees-sick-demo',
      'employees-active-demo',
    ]
    const focused = employeesDemoScenarios.filter((scenario) =>
      focusedIds.includes(scenario.id),
    )

    focused.forEach((scenario) => {
      const phoneSteps = filterScenarioForViewport(scenario, true).steps
      expect(phoneSteps.some((step) => step.id === 'employees-actions-manage-open')).toBe(true)
    })
  })
})
