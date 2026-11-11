import type { DemoScenario } from '@/modules/demo/types'
import { archiveDemoScenario } from './archiveDemo'
import { employeesDemoScenario } from './employeesDemo'
import { schedulerDemoScenario } from './schedulerDemo'
import { summaryDemoScenario } from './summaryDemo'

export const demoScenarios: Record<string, DemoScenario> = {
  [employeesDemoScenario.id]: employeesDemoScenario,
  [schedulerDemoScenario.id]: schedulerDemoScenario,
  [summaryDemoScenario.id]: summaryDemoScenario,
  [archiveDemoScenario.id]: archiveDemoScenario,
}

export function getDemoScenario(id: string): DemoScenario | undefined {
  return demoScenarios[id]
}

export function listDemoScenarios(): DemoScenario[] {
  return Object.values(demoScenarios)
}
