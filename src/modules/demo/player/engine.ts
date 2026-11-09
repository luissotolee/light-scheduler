import type { DemoStep, DemoScenario, DemoStatus } from '@/modules/demo/types'
import { waitForTarget, getRectCenter, clickElement, pointerClickElement, pressKey, fillInput, scrollIntoView, prefersReducedMotion } from '@/modules/demo/utils/dom'
import { useDemoStore } from '@/modules/demo/stores/demo'

interface PlayerState {
  abortController: AbortController | null
  scenario: DemoScenario | null
  stepIndex: number
  status: DemoStatus
  pauseResolve: (() => void) | null
  pausedPromise: Promise<void> | null
  runToken: number
  reducedMotion: boolean
}

const state: PlayerState = {
  abortController: null,
  scenario: null,
  stepIndex: 0,
  status: 'idle',
  pauseResolve: null,
  pausedPromise: null,
  runToken: 0,
  reducedMotion: false,
}

function createPauseGate(): Promise<void> {
  state.pausedPromise = new Promise<void>((resolve) => {
    state.pauseResolve = resolve
  })
  return state.pausedPromise
}

function resolvePauseGate(): void {
  if (state.pauseResolve) {
    state.pauseResolve()
    state.pauseResolve = null
    state.pausedPromise = null
  }
}

function clearPauseGate(): void {
  state.pauseResolve = null
  state.pausedPromise = null
}

export function getPlayerStatus(): DemoStatus {
  return state.status
}

export function getCurrentStep(): DemoStep | null {
  if (!state.scenario) return null
  return state.scenario.steps[state.stepIndex] ?? null
}

export function getStepIndex(): number {
  return state.stepIndex
}

export function getTotalSteps(): number {
  return state.scenario?.steps.length ?? 0
}

export function setScenario(scenario: DemoScenario): void {
  state.scenario = scenario
  state.stepIndex = 0
}

export async function startEngine(scenario: DemoScenario, onComplete?: () => void): Promise<void> {
  const demoStore = useDemoStore()

  if (state.status === 'running' || state.status === 'paused') return

  state.scenario = scenario
  state.stepIndex = 0
  state.status = 'running'
  state.reducedMotion = prefersReducedMotion()
  state.abortController = new AbortController()
  state.runToken++

  demoStore.setScenario(scenario)
  demoStore.start(scenario.id)
  demoStore.setStep(0)
  demoStore.setCurrentStep(scenario.steps[0] ?? null)

  const outcome = await runSteps(state.runToken)
  if (outcome === 'completed') {
    await finishDemo()
    onComplete?.()
  }
}

export async function stopEngine(): Promise<void> {
  state.abortController?.abort()
  state.abortController = null
  state.status = 'idle'
  state.scenario = null
  state.stepIndex = 0
  clearPauseGate()
  state.runToken++

  const demoStore = useDemoStore()
  demoStore.stop()
}

export async function pauseEngine(): Promise<void> {
  if (state.status === 'running') {
    state.status = 'paused'
    createPauseGate()

    const demoStore = useDemoStore()
    demoStore.pause()
  }
}

export async function resumeEngine(): Promise<void> {
  if (state.status === 'paused') {
    state.status = 'running'
    resolvePauseGate()

    const demoStore = useDemoStore()
    demoStore.resume()
  }
}

export async function nextStep(): Promise<void> {
  if (!state.scenario) return

  state.runToken++
  if (state.stepIndex < state.scenario.steps.length - 1) {
    state.stepIndex++
    const demoStore = useDemoStore()
    demoStore.setStep(state.stepIndex)
    demoStore.setCurrentStep(state.scenario.steps[state.stepIndex])
    resetStepVisuals()
  } else {
    await finishDemo()
  }
}

export async function previousStep(): Promise<void> {
  if (!state.scenario) return

  state.runToken++
  if (state.stepIndex > 0) {
    state.stepIndex--
    const demoStore = useDemoStore()
    demoStore.setStep(state.stepIndex)
    demoStore.setCurrentStep(state.scenario.steps[state.stepIndex])
    resetStepVisuals()
  }
}

async function waitWhilePaused(signal: AbortSignal): Promise<void> {
  while (state.status === 'paused' && !signal.aborted) {
    try {
      await state.pausedPromise
    } catch {
      return
    }
  }
}

async function runSteps(token: number): Promise<'completed' | 'stopped'> {
  const demoStore = useDemoStore()
  const { signal } = state.abortController!

  while (
    state.scenario &&
    state.stepIndex < state.scenario.steps.length &&
    token === state.runToken
  ) {
    if (signal.aborted) break

    await waitWhilePaused(signal)
    if (signal.aborted || token !== state.runToken) break
    if (state.status !== 'running') break

    const step = state.scenario.steps[state.stepIndex]
    demoStore.setStep(state.stepIndex)
    demoStore.setCurrentStep(step)

    try {
      await executeStep(step, signal)
    } catch {
      demoStore.reportError('demo.error.target')
      state.status = 'error'
      break
    }

    if (signal.aborted || token !== state.runToken) break

    await waitWhilePaused(signal)
    if (signal.aborted || token !== state.runToken) break
    if (state.status !== 'running') break

    const pauseMs = step.pauseMs ?? step.durationMs ?? 1500
    if (!state.reducedMotion && pauseMs > 0) {
      try {
        await sleep(pauseMs, signal)
      } catch {
        break
      }
    }

    if (signal.aborted || token !== state.runToken) break

    await waitWhilePaused(signal)
    if (signal.aborted || token !== state.runToken) break
    if (state.status !== 'running') break

    state.stepIndex++
  }

  if (
    state.status === 'running' &&
    token === state.runToken &&
    state.scenario &&
    state.stepIndex >= state.scenario.steps.length
  ) {
    return 'completed'
  }

  return 'stopped'
}

function resetStepVisuals(): void {
  const demoStore = useDemoStore()
  demoStore.setCursor(0, 0, false)
  demoStore.setRing(null, false)
  demoStore.hideClick()
  demoStore.setNarrationAnchor(null)
}

async function executeStep(step: DemoStep, signal: AbortSignal): Promise<void> {
  const demoStore = useDemoStore()
  resetStepVisuals()

  switch (step.action) {
    case 'navigate': {
      const { router } = await import('@/router')
      await router.push(step.route)
      await router.isReady()
      break
    }

    case 'spotlight':
    case 'click':
    case 'pointerClick':
    case 'press':
    case 'fill': {
      const target = await waitForTarget(step.target.testId, {
        within: step.target.within,
        index: step.target.index,
        timeoutMs: 5000,
      })

      if (!target.element) {
        throw new Error(`Target not found: ${step.target.testId}`)
      }

      scrollIntoView(target.element)

      const center = getRectCenter(target.rect!)
      demoStore.setNarrationAnchor(target.rect!)
      demoStore.setCursor(center.x, center.y, true)
      demoStore.setRing(target.rect!, true)

      if (step.action === 'spotlight') {
        if (!state.reducedMotion) {
          await sleep(800, signal)
        }
        demoStore.setRing(null, false)
      } else {
        demoStore.showClick(center.x, center.y)
        if (step.action === 'click') {
          clickElement(target.element)
        } else if (step.action === 'pointerClick') {
          pointerClickElement(target.element)
        } else if (step.action === 'press') {
          pressKey(target.element, step.key)
        } else if (step.action === 'fill') {
          fillInput(target.element, step.value)
        }
        if (!state.reducedMotion) {
          await sleep(300, signal)
        }
        demoStore.setRing(null, false)
      }
      break
    }

    case 'wait': {
      if (step.waitFor) {
        const target = await waitForTarget(step.waitFor, { timeoutMs: 5000 })
        if (target.rect) {
          demoStore.setNarrationAnchor(target.rect)
          demoStore.setRing(target.rect, true)
          if (!state.reducedMotion) {
            await sleep(800, signal)
          }
          demoStore.setRing(null, false)
        }
      }
      break
    }
  }
}

async function finishDemo(): Promise<void> {
  state.status = 'finishing'
  resetStepVisuals()
  await stopEngine()
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timeout)
      reject(new Error('Aborted'))
    })
  })
}