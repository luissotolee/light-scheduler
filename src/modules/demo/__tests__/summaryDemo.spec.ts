import { describe, expect, it } from 'vitest'
import { summaryDemoScenario } from '@/modules/demo/scenarios/summaryDemo'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'

const knownTargets = [
  'summary-week-label',
  'summary-previous-week',
  'summary-next-week',
  'summary-this-week',
  'week-1',
  'summary-table',
  'summary-vacation',
  'summary-details-emp-mock-01',
  'details-duty',
  'close-details',
  'print-summary',
  'save-summary-pdf',
]

describe('summaryDemo scenario', () => {
  it('has correct id', () => {
    expect(summaryDemoScenario.id).toBe('summary-demo')
  })

  it('has unique step ids', () => {
    const ids = summaryDemoScenario.steps.map((step) => step.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all steps have required fields', () => {
    summaryDemoScenario.steps.forEach((step) => {
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
    })
  })

  it('narration keys exist in both en and es catalogs', () => {
    summaryDemoScenario.steps.forEach((step) => {
      expect(en[step.narrationKey as keyof typeof en]).toBeDefined()
      expect(es[step.narrationKey as keyof typeof es]).toBeDefined()
    })
  })

  it('uses known data-test targets and routes', () => {
    summaryDemoScenario.steps.forEach((step) => {
      if ('target' in step && step.target?.testId) {
        expect(knownTargets).toContain(step.target.testId)
      }
      if (step.action === 'navigate') {
        expect(step.route).toBe('/summary')
      }
    })
  })
})
