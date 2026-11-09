import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DemoStatus, DemoCursor, DemoRing, DemoScenario, DemoStep } from '@/modules/demo/types'
import { hasDemoRecoveryError, clearDemoRecoveryError, isDemoRecovered, clearDemoRecovered } from '@/modules/demo/utils/storageSnapshot'

export const useDemoStore = defineStore('demo', () => {
  const status = ref<DemoStatus>('idle')
  const scenarioId = ref<string | null>(null)
  const stepIndex = ref(0)
  const errorKey = ref<string | null>(null)
  const cursor = ref<DemoCursor>({ x: 0, y: 0, visible: false })
  const ring = ref<DemoRing>({ rect: null, visible: false })
  const showRestoredFlag = ref(false)

  const currentStep = ref<DemoStep | null>(null)
  const totalSteps = ref(0)

  function setScenario(scenario: DemoScenario): void {
    scenarioId.value = scenario.id
    totalSteps.value = scenario.steps.length
    stepIndex.value = 0
    currentStep.value = scenario.steps[0] ?? null
    errorKey.value = null
  }

  function setStep(index: number): void {
    stepIndex.value = index
  }

  function setCurrentStep(step: DemoStep | null): void {
    currentStep.value = step
  }

  function start(_scenarioId: string): void {
    status.value = 'running'
  }

  function stop(): void {
    status.value = 'idle'
    scenarioId.value = null
    stepIndex.value = 0
    currentStep.value = null
    totalSteps.value = 0
    cursor.value = { x: 0, y: 0, visible: false }
    ring.value = { rect: null, visible: false }
    errorKey.value = null
  }

  function pause(): void {
    if (status.value === 'running') status.value = 'paused'
  }

  function resume(): void {
    if (status.value === 'paused') status.value = 'running'
  }

  function setCursor(x: number, y: number, visible: boolean): void {
    cursor.value = { x, y, visible }
  }

  function setRing(rect: DOMRect | null, visible: boolean): void {
    ring.value = { rect, visible }
  }

  function reportError(key: string): void {
    errorKey.value = key
    status.value = 'error'
  }

  function clearError(): void {
    errorKey.value = null
    if (status.value === 'error') status.value = 'idle'
  }

  function showRestored(): void {
    showRestoredFlag.value = true
    setTimeout(() => {
      showRestoredFlag.value = false
    }, 3000)
  }

  function clearRestored(): void {
    showRestoredFlag.value = false
  }

  function checkRecovery(): void {
    if (hasDemoRecoveryError()) {
      reportError('demo.error.restore')
      clearDemoRecoveryError()
    } else if (isDemoRecovered()) {
      showRestored()
      clearDemoRecovered()
    }
  }

  return {
    status,
    scenarioId,
    stepIndex,
    errorKey,
    cursor,
    ring,
    showRestoredFlag,
    currentStep,
    totalSteps,
    setScenario,
    setStep,
    setCurrentStep,
    start,
    stop,
    pause,
    resume,
    setCursor,
    setRing,
    reportError,
    clearError,
    showRestored,
    clearRestored,
    checkRecovery,
  }
})