import type { DemoModuleId, DemoScenarioDefinition } from '@/modules/demo/types'
import { calendarDemoScenarios } from './calendarDemo'
import { employeesDemoScenarios } from './employeesDemo'
import { schedulerDemoScenarios } from './schedulerDemo'
import { summaryDemoScenarios } from './summaryDemo'

export interface DemoScenarioGroup {
  module: DemoModuleId
  scenarios: DemoScenarioDefinition[]
}

export const demoScenarioGroups: DemoScenarioGroup[] = [
  { module: 'scheduler', scenarios: schedulerDemoScenarios },
  { module: 'summary', scenarios: summaryDemoScenarios },
  { module: 'calendar', scenarios: calendarDemoScenarios },
  { module: 'employees', scenarios: employeesDemoScenarios },
]

const allDemoScenarios = demoScenarioGroups.flatMap((group) => group.scenarios)

export const demoScenarios: Record<string, DemoScenarioDefinition> = Object.fromEntries(
  allDemoScenarios.map((scenario) => [scenario.id, scenario]),
)

export function getDemoScenario(id: string): DemoScenarioDefinition | undefined {
  return demoScenarios[id]
}

export function listDemoScenarios(): DemoScenarioDefinition[] {
  return allDemoScenarios
}
