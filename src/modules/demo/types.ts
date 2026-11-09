export interface DemoTarget {
  testId: string
  within?: string
  index?: number
}

export type DemoActionType =
  | 'spotlight'
  | 'navigate'
  | 'click'
  | 'pointerClick'
  | 'press'
  | 'fill'
  | 'wait'

export interface DemoStepBase {
  id: string
  narrationKey: string
  action: DemoActionType
  durationMs?: number
  pauseMs?: number
  waitFor?: string
}

export interface DemoStepSpotlight extends DemoStepBase {
  action: 'spotlight'
  target: DemoTarget
}

export interface DemoStepNavigate extends DemoStepBase {
  action: 'navigate'
  route: string
}

export interface DemoStepClick extends DemoStepBase {
  action: 'click'
  target: DemoTarget
}

export interface DemoStepPointerClick extends DemoStepBase {
  action: 'pointerClick'
  target: DemoTarget
}

export interface DemoStepPress extends DemoStepBase {
  action: 'press'
  target: DemoTarget
  key: string
}

export interface DemoStepFill extends DemoStepBase {
  action: 'fill'
  target: DemoTarget
  value: string
}

export interface DemoStepWait extends DemoStepBase {
  action: 'wait'
}

export type DemoStep =
  | DemoStepSpotlight
  | DemoStepNavigate
  | DemoStepClick
  | DemoStepPointerClick
  | DemoStepPress
  | DemoStepFill
  | DemoStepWait

export interface DemoScenario {
  id: string
  steps: DemoStep[]
}

export type DemoStatus = 'idle' | 'running' | 'paused' | 'finishing' | 'error'

export interface DemoCursor {
  x: number
  y: number
  visible: boolean
}

export interface DemoRing {
  rect: DOMRect | null
  visible: boolean
}