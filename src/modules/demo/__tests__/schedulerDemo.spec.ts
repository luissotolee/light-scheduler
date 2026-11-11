import { describe, expect, it } from 'vitest'
import { schedulerDemoScenario } from '@/modules/demo/scenarios/schedulerDemo'
import { demoScenarios, getDemoScenario, listDemoScenarios } from '@/modules/demo/scenarios'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'

const knownTargets = [
  'previous-week',
  'next-week',
  'scheduler-week-label',
  'week-1',
  'weekday-tab-tuesday',
  'shift-grid',
  'shift-track',
  'shift-bar',
  'resize-end',
  'shift-row-emp-mock-05',
  'shift-row-name-toggle',
  'day-off-count',
  'weekly-hours',
  'scheduler-settings',
  'scheduler-settings-form',
  'settings-start-info',
  'settings-rate-15',
  'settings-headcount-info',
  'settings-save',
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

describe('demoScenarios registry', () => {
  it('registers all demo scenarios', () => {
    expect(demoScenarios['employees-demo']).toBeDefined()
    expect(demoScenarios['scheduler-demo']).toBeDefined()
    expect(demoScenarios['summary-demo']).toBeDefined()
    expect(demoScenarios['archive-demo']).toBeDefined()
    expect(getDemoScenario('scheduler-demo')).toBe(schedulerDemoScenario)
  })

  it('listDemoScenarios returns all scenarios', () => {
    const list = listDemoScenarios()
    expect(list).toHaveLength(4)
    expect(list.map((scenario) => scenario.id)).toEqual([
      'employees-demo',
      'scheduler-demo',
      'summary-demo',
      'archive-demo',
    ])
  })
})
