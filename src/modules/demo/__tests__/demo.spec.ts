import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDemoStore } from '@/modules/demo/stores/demo'
import type { DemoScenario } from '@/modules/demo/types'

describe('demo store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts in idle state', () => {
    const store = useDemoStore()
    expect(store.status).toBe('idle')
    expect(store.scenarioId).toBeNull()
    expect(store.stepIndex).toBe(0)
    expect(store.errorKey).toBeNull()
    expect(store.cursor.visible).toBe(false)
    expect(store.ring.visible).toBe(false)
    expect(store.showRestoredFlag).toBe(false)
  })

  it('sets scenario', () => {
    const store = useDemoStore()
    const scenario: DemoScenario = {
      id: 'test',
      steps: [
        { id: '1', action: 'spotlight', target: { testId: 'test' }, narrationKey: 'demo.test' },
        { id: '2', action: 'navigate', route: '/test', narrationKey: 'demo.test2' },
      ],
    }

    store.setScenario(scenario)

    expect(store.scenarioId).toBe('test')
    expect(store.totalSteps).toBe(2)
    expect(store.stepIndex).toBe(0)
    expect(store.currentStep?.id).toBe('1')
  })

  it('sets step index', () => {
    const store = useDemoStore()
    const scenario: DemoScenario = {
      id: 'test',
      steps: [
        { id: '1', action: 'spotlight', target: { testId: 'test' }, narrationKey: 'demo.test' },
        { id: '2', action: 'navigate', route: '/test', narrationKey: 'demo.test2' },
      ],
    }
    store.setScenario(scenario)

    store.setStep(1)

    expect(store.stepIndex).toBe(1)
  })

  it('starts demo', () => {
    const store = useDemoStore()
    store.start('test-scenario')
    expect(store.status).toBe('running')
  })

  it('stops demo and resets state', () => {
    const store = useDemoStore()
    const scenario: DemoScenario = {
      id: 'test',
      steps: [
        { id: '1', action: 'spotlight', target: { testId: 'test' }, narrationKey: 'demo.test' },
      ],
    }
    store.setScenario(scenario)
    store.start('test')
    store.setCursor(100, 100, true)
    store.setRing({ x: 0, y: 0, width: 100, height: 100, top: 0, left: 0, right: 100, bottom: 100, toJSON: () => {} } as DOMRect, true)
    store.reportError('demo.error.target')

    store.stop()

    expect(store.status).toBe('idle')
    expect(store.scenarioId).toBeNull()
    expect(store.stepIndex).toBe(0)
    expect(store.currentStep).toBeNull()
    expect(store.totalSteps).toBe(0)
    expect(store.cursor.visible).toBe(false)
    expect(store.ring.visible).toBe(false)
    expect(store.errorKey).toBeNull()
  })

  it('pauses and resumes', () => {
    const store = useDemoStore()
    store.start('test')

    store.pause()
    expect(store.status).toBe('paused')

    store.resume()
    expect(store.status).toBe('running')
  })

  it('sets cursor position', () => {
    const store = useDemoStore()
    store.setCursor(150, 200, true)
    expect(store.cursor).toEqual({ x: 150, y: 200, visible: true })

    store.setCursor(0, 0, false)
    expect(store.cursor).toEqual({ x: 0, y: 0, visible: false })
  })

  it('sets ring', () => {
    const store = useDemoStore()
    const rect = { x: 0, y: 0, width: 100, height: 50, top: 0, left: 0, right: 100, bottom: 50, toJSON: () => {} } as DOMRect
    store.setRing(rect, true)
    expect(store.ring.rect).toStrictEqual(rect)
    expect(store.ring.visible).toBe(true)

    store.setRing(null, false)
    expect(store.ring.rect).toBeNull()
    expect(store.ring.visible).toBe(false)
  })

  it('reports and clears error', () => {
    const store = useDemoStore()
    store.reportError('demo.error.target')
    expect(store.errorKey).toBe('demo.error.target')
    expect(store.status).toBe('error')

    store.clearError()
    expect(store.errorKey).toBeNull()
    expect(store.status).toBe('idle')
  })

  it('shows restored flag temporarily', () => {
    const store = useDemoStore()
    vi.useFakeTimers()
    store.showRestored()
    expect(store.showRestoredFlag).toBe(true)
    vi.advanceTimersByTime(3000)
    expect(store.showRestoredFlag).toBe(false)
    vi.useRealTimers()
  })
})