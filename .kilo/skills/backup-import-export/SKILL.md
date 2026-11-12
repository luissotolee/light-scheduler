---
name: backup-import-export
description: Build, parse, compress, download, and restore the `.json.gz` workspace backup. Use when implementing or changing backup export/import, gzip compression/decompression, backup validation, archive store restore wiring, file size limits, or timestamped backup downloads.
---

# Backup Import / Export (`.json.gz`)

Read `workspace.md` first for the module map and where files belong.

## 1. Scope and module layout

The workspace backup is a single gzip-compressed JSON file (`backup-<timestamp>.json.gz`). It is the only full-workspace file format; there is no other import/export format.

- `src/shared/utils/archiveBackup.ts` — pure build, validation, gzip encode/decode, and file reading. No DOM, no store imports.
- `src/modules/archive/stores/archive.ts` — store orchestration: `exportBackup`, `prepareBackupImport`, `confirmBackupImport`, `cancelBackupImport`.
- `src/shared/utils/download.ts` — the browser side effect: `downloadBlob`, `timestampedName`.
- `src/modules/archive/views/ArchiveView.vue` — the Archive page UI and `data-test` hooks.

Import through the alias, never relative paths across folders:

```ts
import {
  BACKUP_EXTENSION,
  buildBackup,
  gzipJson,
  parseBackup,
  readBackupFile,
} from '@/shared/utils/archiveBackup'
import { downloadBlob, timestampedName } from '@/shared/utils/download'
```

Keep the public constants and types in `archiveBackup.ts`:

```ts
export const BACKUP_FORMAT = 'light-scheduler-backup'
export const BACKUP_VERSION = 1
export const BACKUP_MIME = 'application/gzip'
export const BACKUP_EXTENSION = 'json.gz'
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024
```

Parse results are discriminated unions carrying a `MessageKey`, never a localized string:

```ts
export type BackupParseResult =
  | { ok: true; data: BackupData }
  | { ok: false; error: MessageKey }
```

## 2. File shape

```ts
export interface BackupFile {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  exportedAt: string
  currentWeekKey?: WeekKey
  settings?: BackupSettings
  employees: BackupEmployee[]
  schedules: BackupSchedules
  dayOffs?: BackupDayOffs
  calendar: BackupCalendar
}
```

- `schedules` is keyed ISO year → ISO week → `emp_id` → `BackupShift[]`.
- `dayOffs` is keyed ISO year → ISO week → `emp_id` → `Weekday[]`.
- Empty weeks are omitted in both maps.
- `employees` carries `emp_id`, `name`, duty, contract, weekly hours, holidays, `active`, `startDate`, plus optional `endDate`, `email`, `phone`, and `comment`.
- `settings` carries the locale and scheduler settings when they are present.
- `calendar` carries the selected `country`/`region` and public-holiday/custom entries; entry internal ids are regenerated on parse. A missing section restores the exported empty default.
- `BackupData` is the domain-facing shape: `members`, `schedules` keyed by week key, `dayOffs` keyed by week key, optional `currentWeekKey`, optional `settings`, and `calendar`.

## 3. Building: `buildBackup`

```ts
export function buildBackup(
  members: readonly TeamMember[],
  schedules: Readonly<Record<WeekKey, Shift[]>>,
  dayOffs: Readonly<Record<WeekKey, DayOff[]>>,
  currentWeekKey: WeekKey,
  settingsOrNow: BackupSettings | Date = {},
  nowOrSettings: Date | BackupSettings = new Date(),
  calendar: CalendarData = createDefaultCalendarData(),
): BackupFile
```

`buildBackup` must:

- Filter out shifts and day offs whose `memberId` no longer exists.
- Skip weeks with no shifts and no day offs.
- Group by ISO year/week derived from the week key, using `isoDateToDate`/`getIsoWeek`.
- Store schedules under the member's `emp_id`, not the internal `id`.
- Sort shifts by weekday order, then start minute, then end minute.
- Sort day offs by weekday order and deduplicate repeated weekdays.
- Omit optional employee fields when they are empty/undefined.
- Include `settings` only when the locale or scheduler section is present.
- Return `format`, `version`, `exportedAt` (from `now.toISOString()`), and `currentWeekKey`.

## 4. Parsing: `parseBackup`

`parseBackup(value: unknown)` accepts untrusted JSON and must never throw. Return `{ ok: false, error }` for invalid input. It must:

- Check `format === BACKUP_FORMAT` and `version === BACKUP_VERSION`.
- Require `employees` to be an array and reject duplicate `emp_id` values.
- Validate every employee field (emp id, name, duty, contract, weekly hours, holidays, active, start/end date rules, optional string fields).
- Treat missing `schedules` and `dayOffs` as empty maps.
- Validate ISO year/week keys and reject unknown `emp_id` references in schedules or day offs.
- Treat a missing `settings` section as `undefined`; validate `locale` and `scheduler` independently when present.
- Treat `currentWeekKey` as optional, but validate it when present.
- Create fresh internal member `id`s and rebuild the schedule/day-off records around them.

Schema evolution rules (defaults for missing fields, unknown fields, versioning, migrations, legacy fixtures) live in the `backup-compatibility` skill. Read it before changing the file shape.

## 5. Compression and file reading

Use the browser-native streams; do not add a compression dependency.

```ts
export async function gzipJson(value: unknown): Promise<Blob>
export async function gunzipJson(file: Blob): Promise<unknown>
export async function readBackupFile(file: Blob): Promise<BackupFileReadResult>
```

- `gzipJson` serializes with `JSON.stringify`, compresses with `CompressionStream('gzip')`, and returns a Blob with `BACKUP_MIME`.
- `gunzipJson` decompresses with `DecompressionStream('gzip')` and returns parsed JSON.
- `readBackupFile` enforces `MAX_BACKUP_BYTES` before reading and returns `archive.backupTooLarge` when exceeded.
- If `DecompressionStream` is unavailable, return `archive.compressionUnsupported`.
- Any decompression or JSON error becomes `archive.invalidBackup`.

## 6. Downloading

Export is build → compress → download:

```ts
const backup = buildBackup(
  workspaceStore.members,
  workspaceStore.schedules,
  workspaceStore.dayOffs,
  workspaceStore.currentWeekKey,
  {
    locale: useLocaleStore().locale,
    scheduler: { ...useSchedulerSettingsStore().settings },
  },
)
const blob = await gzipJson(backup)
downloadBlob(timestampedName('backup', BACKUP_EXTENSION), blob)
```

`timestampedName` lives in `download.ts` and accepts a plain extension string:

```ts
export function timestampedName(base: string, ext: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${base}-${stamp}.${ext}`
}
```

Output: `backup-2026-11-05T20-57-00-000Z.json.gz`. Report success/error through `MessageKey` codes (`archive.backupExported`, `archive.compressionUnsupported`, etc.), translated at the view boundary.

## 7. Restore flow

`ArchiveView` uses a two-step flow so restoring is never accidental:

1. `prepareBackupImport(file)` calls `readBackupFile` then `parseBackup`. On failure it sets the error status and returns `false`; on success it stores `backupImportData` and shows the confirmation dialog.
2. `confirmBackupImport()` replaces members, schedules, and day offs through the workspace store, restores `currentWeekKey` (or the first imported week as a fallback), then applies settings.
3. `cancelBackupImport()` clears the pending data and the dialog.

- Restore replaces the whole workspace, so it always requires confirmation.
- Apply only settings present in the file. A missing or partial `settings` section must not reset unrelated preferences (see `backup-compatibility`).
- Never mutate the workspace until the user confirms.

## 8. Tests

Co-located specs:

- `src/shared/utils/__tests__/archiveBackup.spec.ts` — grouping/sorting/filtering, optional fields, valid parse, invalid format/version, duplicate emp ids, unknown emp ids, invalid weeks/shifts/dates, missing `schedules`/`dayOffs`/`settings`, settings parsing, gzip round-trip, size limit, unreadable input.
- `src/modules/archive/__tests__/archive.spec.ts` — export disabled without data, timestamped download name, compressed payload, prepare/confirm/cancel restore, workspace replacement, settings application.
- `src/modules/archive/__tests__/ArchiveView.spec.ts` — export/restore buttons, file picker, success/error status, confirmation dialog.

jsdom lacks `URL.createObjectURL`/`revokeObjectURL`; stub them, and use fake timers for deterministic filenames:

```ts
vi.stubGlobal('URL', {
  ...URL,
  createObjectURL: vi.fn(() => 'blob:test'),
  revokeObjectURL: vi.fn(),
})

vi.useFakeTimers()
vi.setSystemTime(new Date('2026-11-05T20:57:00Z'))
expect(timestampedName('backup', BACKUP_EXTENSION)).toBe('backup-2026-11-05T20-57-00-000Z.json.gz')
```

Use `Blob.arrayBuffer()`, `gzipJson`, and `readBackupFile` to exercise the real compression path rather than mocking it. Assert user-visible messages through the i18n catalog, not hardcoded English.

## 9. Checklist

- [ ] Backup remains a single `.json.gz` file with `BACKUP_FORMAT`, `BACKUP_VERSION`, and `exportedAt`.
- [ ] Build filters unknown members, omits empty weeks, and sorts deterministically.
- [ ] Parse never throws and returns a `MessageKey` on every failure path.
- [ ] Missing optional sections (`schedules`, `dayOffs`, `settings`, `currentWeekKey`, `calendar`) are tolerated.
- [ ] Compression uses native streams and enforces `MAX_BACKUP_BYTES`.
- [ ] Download uses `downloadBlob` + `timestampedName('backup', BACKUP_EXTENSION)`.
- [ ] Restore is confirmation-gated, replaces the workspace, and applies only present settings.
- [ ] Specs cover build, parse, gzip round-trip, restore, and UI states.
- [ ] Backward-compatibility rules and legacy-fixture tests from `backup-compatibility` are applied to any shape change.
