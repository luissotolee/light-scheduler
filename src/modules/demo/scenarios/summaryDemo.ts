import type { DemoScenario } from '@/modules/demo/types'

export const summaryDemoScenario: DemoScenario = {
  id: 'summary-demo',
  steps: [
    {
      id: 'summary-intro',
      action: 'navigate',
      route: '/summary',
      narrationKey: 'demo.scenario.summary.intro',
      pauseMs: 2200,
    },
    {
      id: 'summary-week',
      action: 'spotlight',
      target: { testId: 'summary-week-label' },
      narrationKey: 'demo.scenario.summary.week',
      pauseMs: 1800,
    },
    {
      id: 'summary-previous-week',
      action: 'click',
      target: { testId: 'summary-previous-week' },
      narrationKey: 'demo.scenario.summary.weekPrevious',
      pauseMs: 1400,
    },
    {
      id: 'summary-next-week',
      action: 'click',
      target: { testId: 'summary-next-week' },
      narrationKey: 'demo.scenario.summary.weekNext',
      pauseMs: 1400,
    },
    {
      id: 'summary-this-week',
      action: 'click',
      target: { testId: 'summary-this-week' },
      narrationKey: 'demo.scenario.summary.thisWeek',
      pauseMs: 1400,
    },
    {
      id: 'summary-table',
      action: 'spotlight',
      target: { testId: 'summary-table' },
      narrationKey: 'demo.scenario.summary.table',
      pauseMs: 2400,
    },
    {
      id: 'summary-print',
      action: 'spotlight',
      target: { testId: 'print-summary' },
      narrationKey: 'demo.scenario.summary.print',
      pauseMs: 1800,
    },
    {
      id: 'summary-pdf',
      action: 'spotlight',
      target: { testId: 'save-summary-pdf' },
      narrationKey: 'demo.scenario.summary.pdf',
      pauseMs: 1800,
    },
    {
      id: 'summary-finish',
      action: 'spotlight',
      target: { testId: 'summary-table' },
      narrationKey: 'demo.scenario.summary.finish',
      pauseMs: 2200,
    },
  ],
}
