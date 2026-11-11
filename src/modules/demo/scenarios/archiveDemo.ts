import type { DemoScenario } from '@/modules/demo/types'

export const archiveDemoScenario: DemoScenario = {
  id: 'archive-demo',
  steps: [
    {
      id: 'archive-intro',
      action: 'navigate',
      route: '/archive',
      narrationKey: 'demo.scenario.archive.intro',
      pauseMs: 2200,
    },
    {
      id: 'archive-export',
      action: 'spotlight',
      target: { testId: 'export-backup' },
      narrationKey: 'demo.scenario.archive.export',
      pauseMs: 2200,
    },
    {
      id: 'archive-import',
      action: 'spotlight',
      target: { testId: 'upload-backup' },
      narrationKey: 'demo.scenario.archive.import',
      pauseMs: 2200,
    },
    {
      id: 'archive-finish',
      action: 'spotlight',
      target: { testId: 'export-backup' },
      narrationKey: 'demo.scenario.archive.finish',
      pauseMs: 2200,
    },
  ],
}
