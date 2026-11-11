---
name: guided-demo
description: Build and extend the in-app real-time guided demo (mock data, localStorage snapshot/restore, step scenarios, visual cursor/click indicators). Use when adding or changing demo scenarios, guided interaction steps, the demo overlay/player, or demo fixtures/selectors.
---

# Skill: guided-demo

## When to use

- Adding a new demo scenario or modifying an existing one
- Changing the step schema (`DemoStep`, `DemoScenario`, `DemoAction`)
- Modifying the demo overlay, cursor, ring, ripple, or narration card
- Changing the demo player engine (pause/resume/next/prev/stop logic)
- Adjusting snapshot/restore/recovery logic for localStorage
- Adding or changing `data-test` selectors used by demo steps
- Updating demo fixtures (`buildDemoWorkspace`)
- Adding i18n keys for demo narration or controls

## Architecture map

### Production in-app player (no Playwright)

```
src/modules/demo/
├── types.ts                    # DemoStep, DemoScenario, DemoAction, DemoTarget, DemoStatus, DemoCursor, DemoRing
├── fixtures/
│   └── demoWorkspace.ts        # buildDemoWorkspace(now?) → PersistedWorkspace
├── scenarios/
│   ├── index.ts                # demoScenarios registry, getDemoScenario, listDemoScenarios
│   ├── employeesDemo.ts        # employees-demo: search, add, edit, holidays, deactivate/reactivate, remove
│   ├── schedulerDemo.ts        # scheduler-demo: weeks, weekdays, shift CRUD, day off, weekly hours, restart
│   └── summaryDemo.ts          # summary-demo: week navigation, summary table, print, PDF
├── utils/
│   ├── storageSnapshot.ts      # captureAppStorage, restoreAppStorage, writeDemoBackup, readDemoBackup, clearDemoBackup, recoverInterruptedDemo
│   ├── dom.ts                  # waitForTarget, resolveTarget, getRectCenter, clickElement, pointerClickElement, pressKey, fillInput, prefersReducedMotion
│   └── demoSession.ts          # startDemo(scenarioId), stopDemo()
├── player/
│   └── engine.ts               # startEngine, stopEngine, pauseEngine, resumeEngine, nextStep, previousStep, executeStep
├── stores/
│   └── demo.ts                 # Pinia store: status, scenarioId, stepIndex, errorKey, cursor, ring, showRestoredFlag
├── components/
│   ├── DemoModeButton.vue      # Shell button that opens the scenario picker
│   ├── DemoPickerDialog.vue    # Modal with the Employees / Scheduler / Summary scenarios
│   ├── DemoBanner.vue          # Non-blocking banner shown during demo
│   └── DemoOverlay.vue         # Fixed overlay: cursor, ring, narration card, controls (Prev/Next/Pause/Resume/Exit)
├── overlay/
│   └── demo-overlay.css        # Shared CSS custom properties
└── __tests__/                  # All specs
```

### Integration points

- **`src/main.ts`** — Boot recovery: `recoverInterruptedDemo()` runs **before** `createApp`/store creation. Synchronous, storage-only. Valid backup → raw restore app keys, clear backup, set recovered flag. Invalid → no mutation, keep backup.
- **`src/App.vue`** — Hosts `DemoModeButton` (in `.app__controls`), `DemoBanner` (above `<RouterView>`), lazy `DemoOverlay` (fixed overlay).
- **`src/shared/stores/workspace.ts`** — Added `loadWorkspace(payload)` applying members/schedules/dayOffs/currentWeekKey in memory (null = defaults + `getWeekKey(new Date())`). Refactored `hydrate()` to reuse private `applyPersisted`. Watcher persists demo payload → on stop restore snapshot **LAST**.
- **`src/shared/stores/locale.ts`** — Exported `LOCALE_STORAGE_KEY` for snapshot/restore.
- **`src/shared/components/AppNav.vue`** — Added `:data-test="\`nav-${item.name}\`"` to nav links.
- **`src/modules/employees/views/EmployeesView.vue`** — Added `data-test="employee-search"` to search input.
- **`src/shared/fixtures/employees.ts`** — Moved from `src/modules/employees/fixtures/employees.ts`; demo imports from here to avoid coupling.

## Scenario & step schema

```ts
interface DemoTarget {
  testId: string
  within?: string
  index?: number
}

type DemoActionType =
  | 'spotlight'
  | 'navigate'
  | 'click'
  | 'pointerClick'
  | 'press'
  | 'fill'
  | 'wait'

interface DemoStepBase {
  id: string
  narrationKey: string      // i18n key (demo.scenario.*)
  action: DemoActionType
  durationMs?: number       // legacy, prefer pauseMs
  pauseMs?: number          // auto-advance delay after step
  waitFor?: string          // data-test to wait for (for 'wait' action)
}

interface DemoStepSpotlight   extends DemoStepBase { action: 'spotlight';   target: DemoTarget }
interface DemoStepNavigate    extends DemoStepBase { action: 'navigate';    route: string }
interface DemoStepClick       extends DemoStepBase { action: 'click';       target: DemoTarget }
interface DemoStepPointerClick extends DemoStepBase { action: 'pointerClick'; target: DemoTarget }
interface DemoStepPress       extends DemoStepBase { action: 'press';       target: DemoTarget; key: string }
interface DemoStepFill        extends DemoStepBase { action: 'fill';        target: DemoTarget; value: string }
interface DemoStepWait        extends DemoStepBase { action: 'wait' }

type DemoStep =
  | DemoStepSpotlight
  | DemoStepNavigate
  | DemoStepClick
  | DemoStepPointerClick
  | DemoStepPress
  | DemoStepFill
  | DemoStepWait

interface DemoScenario {
  id: string
  steps: DemoStep[]
}
```

- Pure data, no functions. Stable `id` per step. `narrationKey` **must** exist in both `en.ts` and `es.ts`.
- Targets resolve **only** via `data-test` (+ optional `within` scope, `index` for nth match). Never use CSS selectors, Vue refs, or text content.
- `pauseMs` controls auto-advance. On control interaction (Prev/Next/Pause/Resume/Exit) the player pauses automatically.

## Authoring steps

1. **Add route** (if new page) → ensure target elements have stable `data-test` attributes.
2. **Add `data-test`** to the owning component (prefer the component file, not the view).
3. **Choose action** — `spotlight` for narration, `click`/`pointerClick` for interactions, `navigate` for route changes, `press`/`fill` for inputs, `wait` for async conditions.
4. **Add narration key** to **both** `src/shared/i18n/messages/en.ts` and `es.ts` under `demo.scenario.*`.
5. **Set timing** — `pauseMs` (default ~1500ms). Use `waitFor` on `wait` steps for async UI.
6. **Register** in `src/modules/demo/scenarios/index.ts` (or new scenario file).
7. **Write tests** — unique step `id`s, narration keys exist in both catalogs, known `data-test` targets/routes.

### Example: Add a step to highlight the backup download button

```ts
// In a scenario file (Archive is not one of the v1 scenarios yet)
{
  id: 'backup-export-highlight',
  action: 'spotlight',
  target: { testId: 'export-backup' },
  narrationKey: 'demo.scenario.backup.exportDetail',
  pauseMs: 2000,
}
```

```ts
// In en.ts
'demo.scenario.backup.exportDetail':
  'Click here to download a compressed backup of every employee, shift, day off, and setting.'
// In es.ts
'demo.scenario.backup.exportDetail':
  'Haz clic aquí para descargar una copia comprimida de todos los empleados, turnos, días libres y ajustes.'
```

```ts
// In ArchiveView.vue (already has data-test="export-backup")
<button data-test="export-backup" ...>
```

The workspace backup is the `.json.gz` file produced by the archive module.

## Target resolution & `data-test` contract

- **Only** `data-test` attributes are used. Format: `data-test="kebab-case-name"`.
- `within` narrows scope to a parent `data-test` (e.g., `{ testId: 'inner', within: 'container' }`).
- `index` selects nth match (0-based) when multiple elements share the same `data-test`.
- Never rename existing `data-test` IDs without updating specs and scenario steps.
- Add new `data-test` hooks in the **owning component** (not the view) for stability.

## Supported actions

| Action         | Purpose                                  | Notes |
|----------------|------------------------------------------|-------|
| `spotlight`    | Show ring + narration, no interaction    | Ring pulses, cursor moves to center |
| `navigate`     | Router push + wait for ready             | Uses `router.push`, `router.isReady()` |
| `click`        | Native `element.click()`                 | Preferred for buttons, links, tabs |
| `pointerClick` | Pointer down/up/click sequence           | Use only if native click insufficient (e.g., PrimeVue overlays) |
| `press`        | Dispatch `keydown` with `key`            | For keyboard navigation (Enter, ArrowDown, etc.) |
| `fill`         | Set `value` on input/textarea + events   | Native setter for v-model; dispatches `input` + `change` |
| `wait`         | Wait for `waitFor` target to appear      | Use for async renders (dialogs, lists) |

**All actions** call `waitForTarget` first (timeout 5s → `demo.error.target`). On timeout, player pauses with translated error.

**PrimeVue notes**: Prefer `click` on the root element (`data-test` on wrapper). For `InputText`, `Dropdown`, etc., `fill` works via native value setter. Avoid `pointerClick` unless verified stable.

## Narration & i18n rules

- **Every** user-facing string → both `en.ts` and `es.ts` in the same change.
- Keys under `demo.*` namespace: `demo.start`, `demo.exit`, `demo.progress`, `demo.scenario.scheduler.intro`, etc.
- Use interpolation: `t('demo.progress', { current: 1, total: 5 })` → `"Step 1 of 5"`.
- Never hardcode strings in components, stores, utils, or scenario files.
- `aria-label` values must also be translated (`demo.startAria`, `demo.exitAria`, etc.).

## Data/mocking & safety

- `buildDemoWorkspace(now?)` → `PersistedWorkspace` valid for `parsePersistedWorkspace`:
  - Uses `getWeekKey`/`addWeeks` for relative dates (current/prev/next week).
  - Shifts: `0 <= startMinute < endMinute <= 1500`, valid weekdays.
  - Active members only for schedules; includes sample day off.
  - Reuses `MOCK_EMPLOYEES` from `src/shared/fixtures/employees.ts` (stable IDs).
- **Snapshot** captures only `light-scheduler.*` keys, **excludes** `light-scheduler.demo.*`.
- `loadWorkspace(payload)` rehydrates workspace in-memory **without reading storage**.
- **Never start demo without writable backup** (`demo.error.storage`).
- **Restore snapshot LAST** (after locale/workspace/UI stores reset) because workspace watcher persists demo payload.

## Accessibility & visuals

- `aria-live="polite"` on narration card and restored toast.
- `role="status"` on narration card and banner.
- **Escape key** exits demo.
- Focus moves to **Exit button** on overlay open; restores on close.
- `aria-hidden="true"` on cursor, ring, ripple (decorative).
- **Reduced motion**: `prefers-reduced-motion: reduce` → instant transitions, no cursor/ring animations, no ripple.
- Overlay is non-blocking (`pointer-events: none` except controls/narration card).

## Verification

Run all before finishing:

```bash
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
```

### Test coverage areas

- `storageSnapshot.spec.ts` — capture/restore/backup/recover logic, malformed backup handling.
- `demoWorkspace.spec.ts` — `buildDemoWorkspace` passes `parsePersistedWorkspace`, valid shifts, relative weeks.
- `demoSession.spec.ts` — snapshot capture, workspace load, UI store resets, navigation, restore on stop.
- `demo.spec.ts` — store actions (start/stop/pause/resume, cursor/ring, error, restored flag).
- `engine.spec.ts` — step execution, auto-advance, pause/resume, next/prev, target timeout, reduced motion.
- `dom.spec.ts` — target resolution, waitForTarget, click/pointerClick/press/fill (including nested inputs), reduced motion.
- `DemoModeButton.spec.ts` — picker opens, each option starts its scenario, cancel does not start.
- `DemoPickerDialog.spec.ts` (covered via `DemoModeButton.spec.ts`) — three translated options.
- `employeesDemo.spec.ts` / `schedulerDemo.spec.ts` / `summaryDemo.spec.ts` — unique step IDs, narration keys in both catalogs, known targets/routes.
- `DemoOverlay.spec.ts` — conditional render, narration translation, progress, controls, keyboard Exit, restored toast, a11y attrs.

### Manual verification

1. **Start demo** → runs through all steps with cursor/ring/ripple + narration.
2. **Pause/Resume/Prev/Next/Exit** → work at any step.
3. **Exit mid-demo** → data restored, restored toast shown.
4. **Reload page mid-demo** → next load restores from backup (recovered flag).
5. **Switch locale (en/es)** → all narration/controls translated.
6. **Reduced motion enabled** → no animations, instant steps.
7. **Keyboard only** → Tab to controls, Escape to exit.

## Pitfalls

- **Store hydrates once** → `loadWorkspace` required for in-memory rehydration without storage read.
- **Watcher writes** → raw restore snapshot **must be last** in `stopDemo`.
- **Don't snapshot demo keys** → `light-scheduler.demo.*` excluded; never touch unrelated storage keys.
- **Stale dates** → `buildDemoWorkspace` uses relative `addWeeks`, not hardcoded week keys.
- **PrimeVue wrapped inputs** → `fill` uses native value setter + `input`/`change` events; test with actual components.
- **Selector drift** → `data-test` IDs are the contract; add in owning component, update scenarios/tests together.
- **`main.ts` coverage exclusion** — boot recovery is minimal, synchronous, storage-only; keep it that way.