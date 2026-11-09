import type { DemoScenario } from '@/modules/demo/types'
import { schedulerDemoScenario } from './schedulerDemo'

export const demoScenarios: Record<string, DemoScenario> = {
  [schedulerDemoScenario.id]: schedulerDemoScenario,
}

export function getDemoScenario(id: string): DemoScenario | undefined {
  return demoScenarios[id]
}

export function listDemoScenarios(): DemoScenario[] {
  return Object.values(demoScenarios)
}