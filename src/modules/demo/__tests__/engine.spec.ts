import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDemoStore } from '@/modules/demo/stores/demo'
import {
  startEngine,
  stopEngine,
  pauseEngine,
  resumeEngine,
  nextStep,
  previousStep,
  getPlayerStatus,
  getStepIndex,
  setScenario,
} from '@/modules/demo/player/engine'
import type { DemoScenario } from '@/modules/demo/types'

vi.mock('@/modules/demo/utils/dom', () => ({
  waitForTarget: vi.fn().mockResolvedValue({ element: document.createElement('div'), rect: { x: 0, y: 0, width: 100, height: 50, top: 0, left: 0, right: 100, bottom: 50, toJSON: () => {} } as DOMRect }),
  resolveTarget: vi.fn().mockReturnValue({ element: document.createElement('div'), rect: { x: 0, y: 0, width: 100, height: 50, top: 0, left: 0, right: 100, bottom: 50, toJSON: () => {} } as DOMRect }),
  getRectCenter: vi.fn().mockReturnValue({ x: 50, y: 25 }),
  scrollIntoView: vi.fn(),
  scrollToTop: vi.fn(),
  clickElement: vi.fn(),
  pointerClickElement: vi.fn(),
  pressKey: vi.fn(),
  fillInput: vi.fn(),
  prefersReducedMotion: vi.fn().mockReturnValue(true), // Use reduced motion for faster tests
  isPhoneViewport: vi.fn().mockReturnValue(false),
}))

vi.mock('@/router', () => ({
  router: {
    push: vi.fn().mockResolvedValue(undefined),
    isReady: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('demo engine', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await stopEngine()
    vi.resetModules()
  })

  const createScenario = (): DemoScenario => ({
    id: 'test',
    steps: [
      { id: '1', action: 'spotlight', target: { testId: 'test-1' }, narrationKey: 'demo.test1', pauseMs: 10 },
      { id: '2', action: 'navigate', route: '/test', narrationKey: 'demo.test2', pauseMs: 10 },
      { id: '3', action: 'click', target: { testId: 'test-2' }, narrationKey: 'demo.test3', pauseMs: 10 },
    ],
  })

  it('sets up scenario correctly', () => {
    const scenario = createScenario()
    setScenario(scenario)

    expect(getPlayerStatus()).toBe('idle')
    expect(getStepIndex()).toBe(0)
  })

  it('starts engine and sets status to running', async () => {
    const scenario = createScenario()
    setScenario(scenario)

    const startPromise = startEngine(scenario)

    // Status should be running synchronously
    expect(getPlayerStatus()).toBe('running')
    const store = useDemoStore()
    expect(store.status).toBe('running')
    expect(store.scenarioId).toBe('test')
    expect(store.totalSteps).toBe(3)
    expect(store.currentStep?.id).toBe('1')

    await stopEngine()
    await startPromise
  })

  it('scrolls to the top when the demo starts', async () => {
    const { scrollToTop } = await import('@/modules/demo/utils/dom')

    const scenario = createScenario()
    const startPromise = startEngine(scenario)

    expect(scrollToTop).toHaveBeenCalled()

    await stopEngine()
    await startPromise
  })

  it('measures the target after scrolling it into view', async () => {
    const { getRectCenter, waitForTarget } = await import('@/modules/demo/utils/dom')
    const freshRect = {
      x: 10,
      y: 320,
      width: 100,
      height: 40,
      top: 320,
      left: 10,
      right: 110,
      bottom: 360,
      toJSON: () => ({}),
    } as DOMRect
    const element = document.createElement('div')
    element.getBoundingClientRect = () => freshRect
    vi.mocked(waitForTarget).mockResolvedValueOnce({ element, rect: freshRect })
    vi.mocked(getRectCenter).mockReturnValueOnce({ x: 60, y: 340 })

    const scenario: DemoScenario = {
      id: 'test',
      steps: [
        { id: '1', action: 'spotlight', target: { testId: 'test-1' }, narrationKey: 'demo.test1', pauseMs: 0 },
      ],
    }

    const store = useDemoStore()
    const anchorSpy = vi.spyOn(store, 'setNarrationAnchor')
    const cursorSpy = vi.spyOn(store, 'setCursor')

    await startEngine(scenario)

    expect(anchorSpy).toHaveBeenCalledWith(freshRect)
    expect(cursorSpy).toHaveBeenCalledWith(60, 340, true)
  })

  it('excludes phone-only steps from a desktop run', async () => {
    const { isPhoneViewport } = await import('@/modules/demo/utils/dom')
    vi.mocked(isPhoneViewport).mockReturnValue(false)

    const scenario: DemoScenario = {
      id: 'test',
      steps: [
        { id: 'desktop-step', action: 'spotlight', target: { testId: 'desktop' }, narrationKey: 'demo.test1', pauseMs: 10 },
        { id: 'phone-step', viewport: 'phone', action: 'spotlight', target: { testId: 'phone' }, narrationKey: 'demo.test2', pauseMs: 10 },
      ],
    }

    const store = useDemoStore()
    const startPromise = startEngine(scenario)

    expect(store.totalSteps).toBe(1)
    expect(store.currentStep?.id).toBe('desktop-step')

    await stopEngine()
    await startPromise
  })

  it('excludes desktop-only steps from a phone run', async () => {
    const { isPhoneViewport } = await import('@/modules/demo/utils/dom')
    vi.mocked(isPhoneViewport).mockReturnValue(true)

    const scenario: DemoScenario = {
      id: 'test',
      steps: [
        { id: 'desktop-step', viewport: 'desktop', action: 'spotlight', target: { testId: 'desktop' }, narrationKey: 'demo.test1', pauseMs: 10 },
        { id: 'phone-step', viewport: 'phone', action: 'spotlight', target: { testId: 'phone' }, narrationKey: 'demo.test2', pauseMs: 10 },
      ],
    }

    const store = useDemoStore()
    const startPromise = startEngine(scenario)

    expect(store.totalSteps).toBe(1)
    expect(store.currentStep?.id).toBe('phone-step')

    await stopEngine()
    await startPromise
  })

  it('stops engine', async () => {
    const scenario = createScenario()
    setScenario(scenario)

    const startPromise = startEngine(scenario)

    await stopEngine()
    expect(getPlayerStatus()).toBe('idle')
    const store = useDemoStore()
    expect(store.status).toBe('idle')
    expect(store.scenarioId).toBeNull()

    await startPromise
  })

  it('pauses and resumes engine', async () => {
    const scenario = createScenario()
    setScenario(scenario)

    const startPromise = startEngine(scenario)

    expect(getPlayerStatus()).toBe('running')

    await pauseEngine()
    expect(getPlayerStatus()).toBe('paused')
    const store = useDemoStore()
    expect(store.status).toBe('paused')

    await resumeEngine()
    expect(getPlayerStatus()).toBe('running')
    expect(store.status).toBe('running')

    await stopEngine()
    await startPromise
  })

  it('advances to next step', async () => {
    const scenario = createScenario()
    setScenario(scenario)

    const startPromise = startEngine(scenario)

    expect(getStepIndex()).toBe(0)

    await nextStep()

    expect(getStepIndex()).toBe(1)
    const store = useDemoStore()
    expect(store.stepIndex).toBe(1)
    expect(store.currentStep?.id).toBe('2')

    await stopEngine()
    await startPromise
  })

  it('goes to previous step', async () => {
    const scenario = createScenario()
    setScenario(scenario)

    const startPromise = startEngine(scenario)

    await nextStep()
    expect(getStepIndex()).toBe(1)

    await previousStep()

    expect(getStepIndex()).toBe(0)
    const store = useDemoStore()
    expect(store.stepIndex).toBe(0)
    expect(store.currentStep?.id).toBe('1')

    await stopEngine()
    await startPromise
  })

  it('reports error when target not found', async () => {
    const { waitForTarget } = await import('@/modules/demo/utils/dom')
    vi.mocked(waitForTarget).mockResolvedValueOnce({ element: null, rect: null })

    const scenario: DemoScenario = {
      id: 'test',
      steps: [
        { id: '1', action: 'click', target: { testId: 'missing' }, narrationKey: 'demo.test1', pauseMs: 10 },
      ],
    }
    setScenario(scenario)

    const store = useDemoStore()
    const startPromise = startEngine(scenario)

    // Give time for the engine to process the step
    await new Promise((r) => setTimeout(r, 50))

    expect(store.errorKey).toBe('demo.error.target')
    expect(getPlayerStatus()).toBe('error')
    expect(store.status).toBe('error')

    await stopEngine()
    await startPromise
  })

  it('finishes after last step and calls onComplete', async () => {
    const scenario: DemoScenario = {
      id: 'test',
      steps: [
        { id: '1', action: 'spotlight', target: { testId: 'test-1' }, narrationKey: 'demo.test1', pauseMs: 10 },
      ],
    }
    setScenario(scenario)

    const onComplete = vi.fn()
    const store = useDemoStore()
    const startPromise = startEngine(scenario, onComplete)

    // Wait for engine to complete (using reduced motion for instant completion)
    await startPromise

    expect(getPlayerStatus()).toBe('idle')
    expect(store.status).toBe('idle')
    expect(onComplete).toHaveBeenCalled()
  })

  it('does not call onComplete when stopped before completion', async () => {
    const scenario = createScenario()
    setScenario(scenario)

    const onComplete = vi.fn()
    const startPromise = startEngine(scenario, onComplete)

    await stopEngine()
    await startPromise

    expect(onComplete).not.toHaveBeenCalled()
  })

  it('resumeEngine does not duplicate runSteps loop', async () => {
    const scenario = createScenario()
    setScenario(scenario)

    const startPromise = startEngine(scenario)

    await pauseEngine()
    expect(getPlayerStatus()).toBe('paused')

    // Resume should not start a new runSteps loop
    await resumeEngine()
    expect(getPlayerStatus()).toBe('running')

    // Verify we can still interact normally
    await nextStep()
    expect(getStepIndex()).toBe(1)

    await stopEngine()
    await startPromise
  })
})