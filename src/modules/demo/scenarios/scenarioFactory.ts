import type { DemoScenarioDefinition, DemoStep } from '@/modules/demo/types'

interface DemoSubScenarioConfig {
  id: string
  titleKey: string
  descriptionKey: string
  steps: Array<string | DemoStep>
}

export function createSubScenario(
  source: DemoScenarioDefinition,
  config: DemoSubScenarioConfig,
): DemoScenarioDefinition {
  const stepsById = new Map(source.steps.map((step) => [step.id, step]))

  return {
    id: config.id,
    module: source.module,
    titleKey: config.titleKey,
    descriptionKey: config.descriptionKey,
    steps: config.steps.map((entry) => {
      if (typeof entry !== 'string') return entry

      const step = stepsById.get(entry)
      if (!step) {
        throw new Error(`Unknown demo step "${entry}" in scenario "${source.id}"`)
      }
      return step
    }),
  }
}
