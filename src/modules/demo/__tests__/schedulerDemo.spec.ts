import { describe, expect, it } from 'vitest'
import { filterScenarioForViewport } from '@/modules/demo/player/engine'
import {
  schedulerDemoScenario,
  schedulerDemoScenarios,
} from '@/modules/demo/scenarios/schedulerDemo'
import {
  demoScenarioGroups,
  demoScenarios,
  getDemoScenario,
  listDemoScenarios,
} from '@/modules/demo/scenarios'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'

const knownTargets = [
  'previous-week',
  'next-week',
  'scheduler-week-label',
  'week-1',
  'weekday-tab-tuesday',
  'weekday-tab-sunday',
  'weekday-tab-thursday',
  'shift-row-emp-mock-03',
  'shift-row-emp-mock-04',
  'weekday-calendar-marker-tuesday',
  'scheduler-day-entries',
  'shift-grid',
  'shift-grid-scroller',
  'shift-track',
  'shift-bar',
  'resize-end',
  'shift-row-emp-mock-05',
  'shift-row-name-toggle',
  'day-off-count',
  'weekly-hours',
  'weekly-hours-metric-diff',
  'weekly-hours-metric-month-current',
  'weekly-hours-row-emp-mock-03-month-holiday',
  'scheduler-settings',
  'scheduler-settings-form',
  'settings-start',
  'settings-end',
  'settings-start-info',
  'settings-next-day',
  'settings-rate-15',
  'settings-headcount-info',
  'settings-show-headcount',
  'settings-save',
  'hour-headcount',
  'restart-week',
  'confirm-message',
  'confirm-accept',
]

describe('schedulerDemo scenario', () => {
  it('has correct id', () => {
    expect(schedulerDemoScenario.id).toBe('scheduler-demo')
  })

  it('has steps', () => {
    expect(schedulerDemoScenario.steps.length).toBeGreaterThan(0)
  })

  it('all steps have required fields', () => {
    schedulerDemoScenario.steps.forEach((step) => {
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

  it('has unique step ids', () => {
    const ids = schedulerDemoScenario.steps.map((step) => step.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('narration keys exist in both en and es catalogs', () => {
    schedulerDemoScenario.steps.forEach((step) => {
      expect(en[step.narrationKey as keyof typeof en]).toBeDefined()
      expect(es[step.narrationKey as keyof typeof es]).toBeDefined()
    })
  })

  it('uses known data-test targets', () => {
    schedulerDemoScenario.steps.forEach((step) => {
      if ('target' in step && step.target?.testId) {
        expect(knownTargets).toContain(step.target.testId)
      }
      if (step.action === 'wait') {
        expect(knownTargets).toContain(step.waitFor)
      }
    })
  })

  it('uses known routes', () => {
    const knownRoutes = ['/scheduler', '/employees', '/summary']
    schedulerDemoScenario.steps.forEach((step) => {
      if (step.action === 'navigate') {
        expect(knownRoutes).toContain(step.route)
      }
    })
  })

  it('uses touch steps on phones and keyboard steps on desktop', () => {
    const phoneSteps = filterScenarioForViewport(schedulerDemoScenario, true).steps
    const desktopSteps = filterScenarioForViewport(schedulerDemoScenario, false).steps

    expect(phoneSteps.find((step) => step.id === 'scheduler-phone-pan')).toBeDefined()
    expect(phoneSteps.find((step) => step.id === 'scheduler-create-shift-phone')?.action).toBe(
      'pointerClick',
    )
    expect(phoneSteps.some((step) => step.id === 'scheduler-create-shift')).toBe(false)
    expect(desktopSteps.some((step) => step.id === 'scheduler-phone-pan')).toBe(false)
    expect(desktopSteps.some((step) => step.id === 'scheduler-create-shift-phone')).toBe(false)
    expect(desktopSteps.find((step) => step.id === 'scheduler-create-shift')?.action).toBe('press')
  })

  it('gives every click in every scenario at least 1.5 seconds before advancing', () => {
    listDemoScenarios().forEach((scenario) => {
      scenario.steps.forEach((step) => {
        if (step.action === 'click' || step.action === 'pointerClick') {
          expect(step.pauseMs ?? step.durationMs ?? 1500).toBeGreaterThanOrEqual(1500)
        }
      })
    })
  })
})

describe('scheduler demo journeys', () => {
  it('exposes the full demo plus focused journeys', () => {
    expect(schedulerDemoScenarios.map((scenario) => scenario.id)).toEqual([
      'scheduler-demo',
      'scheduler-navigation-demo',
      'scheduler-shifts-demo',
      'scheduler-time-off-demo',
      'scheduler-hours-demo',
      'scheduler-settings-demo',
      'scheduler-clear-demo',
    ])
  })

  it('reuses full-demo steps with translated metadata', () => {
    const fullStepIds = new Set(schedulerDemoScenario.steps.map((step) => step.id))

    schedulerDemoScenarios.forEach((scenario) => {
      expect(scenario.module).toBe('scheduler')
      expect(en[scenario.titleKey as keyof typeof en]).toBeDefined()
      expect(es[scenario.titleKey as keyof typeof es]).toBeDefined()
      expect(en[scenario.descriptionKey as keyof typeof en]).toBeDefined()
      expect(es[scenario.descriptionKey as keyof typeof es]).toBeDefined()

      const ids = scenario.steps.map((step) => step.id)
      expect(new Set(ids).size).toBe(ids.length)
      ids.forEach((id) => expect(fullStepIds).toContain(id))

      scenario.steps.forEach((step) => {
        expect(en[step.narrationKey as keyof typeof en]).toBeDefined()
        expect(es[step.narrationKey as keyof typeof es]).toBeDefined()
        if ('target' in step && step.target?.testId) {
          expect(knownTargets).toContain(step.target.testId)
        }
        if (step.action === 'wait') {
          expect(knownTargets).toContain(step.waitFor)
        }
        if (step.action === 'navigate') {
          expect(step.route).toBe('/scheduler')
        }
      })
    })
  })
})

describe('demoScenarios registry', () => {
  it('registers all demo scenarios', () => {
    expect(demoScenarios['employees-demo']).toBeDefined()
    expect(demoScenarios['scheduler-demo']).toBeDefined()
    expect(demoScenarios['calendar-demo']).toBeDefined()
    expect(demoScenarios['summary-demo']).toBeDefined()
    expect(demoScenarios['scheduler-navigation-demo']).toBeDefined()
    expect(demoScenarios['employees-holidays-demo']).toBeDefined()
    expect(demoScenarios['calendar-custom-demo']).toBeDefined()
    expect(demoScenarios['summary-print-demo']).toBeDefined()
    expect(getDemoScenario('scheduler-demo')).toBe(schedulerDemoScenario)
  })

  it('listDemoScenarios returns every grouped scenario in order', () => {
    const list = listDemoScenarios()
    const expectedIds = demoScenarioGroups.flatMap((group) =>
      group.scenarios.map((scenario) => scenario.id),
    )

    expect(list.map((scenario) => scenario.id)).toEqual(expectedIds)
    expect(list).toHaveLength(expectedIds.length)
  })
})
