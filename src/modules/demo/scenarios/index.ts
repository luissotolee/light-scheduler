import type { DemoScenario } from '@/modules/demo/types'
import { calendarDemoScenario } from './calendarDemo'
import { employeesDemoScenario } from './employeesDemo'
import { schedulerDemoScenario } from './schedulerDemo'
import { summaryDemoScenario } from './summaryDemo'

export const demoScenarios: Record<string, DemoScenario> = {
  [employeesDemoScenario.id]: employeesDemoScenario,
  [schedulerDemoScenario.id]: schedulerDemoScenario,
  [calendarDemoScenario.id]: calendarDemoScenario,
  [summaryDemoScenario.id]: summaryDemoScenario,
}

export function getDemoScenario(id: string): DemoScenario | undefined {
  return demoScenarios[id]
}

export function listDemoScenarios(): DemoScenario[] {
  return Object.values(demoScenarios)
}
