import { describe, expect, it } from 'vitest'
import { schedulerDemoScenario } from '@/modules/demo/scenarios/schedulerDemo'
import { demoScenarios, getDemoScenario, listDemoScenarios } from '@/modules/demo/scenarios'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'

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

  it('narration keys exist in both en and es catalogs', () => {
    schedulerDemoScenario.steps.forEach((step) => {
      expect(en[step.narrationKey as keyof typeof en]).toBeDefined()
      expect(es[step.narrationKey as keyof typeof es]).toBeDefined()
    })
  })

  it('uses known data-test targets', () => {
    const knownTargets = [
      'previous-week',
      'next-week',
      'weekday-tabs',
      'shift-grid',
      'employee-search',
      'add-employee',
      'total-shifts',
      'history-list',
      'export-employees',
      'upload-employees',
    ]

    schedulerDemoScenario.steps.forEach((step) => {
      if ('target' in step && step.target?.testId) {
        expect(knownTargets).toContain(step.target.testId)
      }
    })
  })

  it('uses known routes', () => {
    const knownRoutes = ['/scheduler', '/employees', '/summary', '/history', '/csv']
    schedulerDemoScenario.steps.forEach((step) => {
      if (step.action === 'navigate') {
        expect(knownRoutes).toContain(step.route)
      }
    })
  })
})

describe('demoScenarios registry', () => {
  it('registers scheduler-demo', () => {
    expect(demoScenarios['scheduler-demo']).toBeDefined()
    expect(getDemoScenario('scheduler-demo')).toBe(schedulerDemoScenario)
  })

  it('listDemoScenarios returns all scenarios', () => {
    const list = listDemoScenarios()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('scheduler-demo')
  })
})