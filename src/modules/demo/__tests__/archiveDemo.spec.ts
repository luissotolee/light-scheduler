import { describe, expect, it } from 'vitest'
import { archiveDemoScenario } from '@/modules/demo/scenarios/archiveDemo'
import { en } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'

const knownTargets = ['export-backup', 'upload-backup']

describe('archiveDemo scenario', () => {
  it('has correct id', () => {
    expect(archiveDemoScenario.id).toBe('archive-demo')
  })

  it('has unique step ids', () => {
    const ids = archiveDemoScenario.steps.map((step) => step.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all steps have required fields', () => {
    archiveDemoScenario.steps.forEach((step) => {
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
    archiveDemoScenario.steps.forEach((step) => {
      expect(en[step.narrationKey as keyof typeof en]).toBeDefined()
      expect(es[step.narrationKey as keyof typeof es]).toBeDefined()
    })
  })

  it('uses known data-test targets and routes', () => {
    archiveDemoScenario.steps.forEach((step) => {
      if ('target' in step && step.target?.testId) {
        expect(knownTargets).toContain(step.target.testId)
      }
      if (step.action === 'navigate') {
        expect(step.route).toBe('/archive')
      }
    })
  })
})
