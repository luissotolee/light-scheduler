import { describe, expect, it } from 'vitest'
import { calendarDemoScenario } from '@/modules/demo/scenarios/calendarDemo'
import { demoScenarios } from '@/modules/demo/scenarios'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'

const knownTargets = [
  'calendar-country',
  'calendar-region',
  'calendar-year',
  'calendar-fetch',
  'calendar-public-holiday-count',
  'calendar-month-label',
  'calendar-previous-month',
  'calendar-next-month',
  'calendar-month-grid',
  'calendar-cell',
  'calendar-clear-fetched',
  'calendar-add-entry',
  'calendar-entry-form',
  'calendar-entry-date',
  'calendar-entry-name',
  'calendar-entry-kind',
  'calendar-entry-save',
  'calendar-entry-list',
  'calendar-entry-edit',
  'calendar-entry-remove',
  'confirm-message',
  'confirm-accept',
]

describe('calendarDemo scenario', () => {
  it('has correct id', () => {
    expect(calendarDemoScenario.id).toBe('calendar-demo')
  })

  it('is registered', () => {
    expect(demoScenarios['calendar-demo']).toBe(calendarDemoScenario)
  })

  it('has steps', () => {
    expect(calendarDemoScenario.steps.length).toBeGreaterThan(0)
  })

  it('all steps have required fields', () => {
    calendarDemoScenario.steps.forEach((step) => {
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
      if (step.action === 'fill') {
        expect('value' in step).toBe(true)
      }
    })
  })

  it('has unique step ids', () => {
    const ids = calendarDemoScenario.steps.map((step) => step.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('narration keys exist in both en and es catalogs', () => {
    calendarDemoScenario.steps.forEach((step) => {
      expect(en[step.narrationKey as keyof typeof en]).toBeDefined()
      expect(es[step.narrationKey as keyof typeof es]).toBeDefined()
    })
  })

  it('uses known data-test targets', () => {
    calendarDemoScenario.steps.forEach((step) => {
      if ('target' in step && step.target?.testId) {
        expect(knownTargets).toContain(step.target.testId)
      }
      if (step.action === 'wait') {
        expect(knownTargets).toContain(step.waitFor)
      }
    })
  })

  it('navigates to the calendar route', () => {
    calendarDemoScenario.steps.forEach((step) => {
      if (step.action === 'navigate') {
        expect(step.route).toBe('/calendar')
      }
    })
  })

  it('gives every click at least 1.5 seconds before advancing', () => {
    calendarDemoScenario.steps.forEach((step) => {
      if (step.action === 'click' || step.action === 'pointerClick') {
        expect(step.pauseMs ?? step.durationMs ?? 1500).toBeGreaterThanOrEqual(1500)
      }
    })
  })
})
