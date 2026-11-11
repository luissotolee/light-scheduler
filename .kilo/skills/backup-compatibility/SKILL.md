---
name: backup-compatibility
description: Keep `.json.gz` backup restore and browser-persisted workspace/user settings backward compatible. Use when adding or changing employee fields, schedule structures, stored settings, backup build/parse logic, schema versions, or restore flows.
---

# Backup & Persisted-Data Compatibility

Read `workspace.md` first for the module map and where files belong.

## 1. The contract

Backups are long-lived user files. A backup exported by **any previous release** must restore on the **current** release, and data written to `localStorage` must survive schema changes the same way.

Every change must preserve all five properties:

1. An older backup (without the new field) restores successfully.
2. Missing data gets the documented default, not an error.
3. Unknown data from a newer backup is ignored, not rejected.
4. Re-exporting writes the complete current shape (including the new field).
5. Restoring a partial settings section never resets preferences the file does not contain.

### Where the contract lives

| Concern | File | Version constant | Storage |
| ------- | ---- | ---------------- | ------- |
| Backup file | `src/shared/utils/archiveBackup.ts` | `BACKUP_VERSION` | `.json.gz` |
| Persisted workspace | `src/shared/utils/persistence.ts` | `WORKSPACE_SCHEMA_VERSION` | `light-scheduler.workspace` |
| User settings | `src/shared/utils/userSettings.ts` | `USER_SETTINGS_SCHEMA_VERSION` | `light-scheduler.user-settings` (+ legacy keys) |
| Scheduler settings defaults | `src/shared/utils/schedulerSettings.ts` | — | `DEFAULT_SCHEDULER_SETTINGS` |

Restore wiring is in `src/modules/archive/stores/archive.ts` (`confirmBackupImport`, `applyBackupSettings`).

## 2. Golden rule: read tolerant, write complete

Adding a field is a three-part change:

1. **Export a default constant** next to the type or parser. Never inline a magic default in the parser.
2. **Parse tolerantly.** `undefined` (missing) → default. A present but wrong-typed value → validation error.
3. **Build completely.** The exporter always writes the field for current data, even when it equals the default.

```ts
export const DEFAULT_EMPLOYEE_FLAGS: EmployeeFlags = {
  notifications: true,
}

function parseEmployeeFlags(value: unknown): EmployeeFlags | null {
  if (value === undefined) return { ...DEFAULT_EMPLOYEE_FLAGS }
  if (!isRecord(value)) return null

  const notifications = value.notifications
  if (notifications !== undefined && typeof notifications !== 'boolean') return null

  return { notifications: notifications ?? DEFAULT_EMPLOYEE_FLAGS.notifications }
}
```

Then the builder includes the field:

```ts
function toBackupEmployee(member: TeamMember): BackupEmployee {
  return {
    /* ...existing fields... */
    flags: member.flags ?? DEFAULT_EMPLOYEE_FLAGS,
  }
}
```

Do **not** do this — it breaks every older backup:

```ts
// WRONG: absence is not invalid
if (typeof value.flags !== 'object') return { ok: false, error: 'archive.invalidBackup' }
```

### Falsy values

Distinguish “absent” from a valid falsy value. `false`, `0`, `''`, and `[]` are real values; only `undefined` means missing. Use `=== undefined`, not truthiness, and `Object.prototype.hasOwnProperty` when presence itself matters.

## 3. Unknown fields are ignored

Validate only known keys and never reject a record for extra properties. This keeps a newer backup readable by an older parser. `parseBackupSettings` is the model: it reads `locale` and `scheduler` and ignores everything else.

Do not spread unvalidated parsed objects into domain state; build the domain object explicitly from known, validated fields.

## 4. Additive vs breaking changes

Prefer additive changes. They keep the version constant unchanged.

| Change | Version bump | Required parser behavior |
| ------ | ------------ | ------------------------ |
| New optional employee field | No | missing → default; present → validate |
| New employee field with a default for all historical records | No | missing → default; present → validate |
| New backup section (e.g. another record map) | No | missing → empty/default section |
| New setting key with a default | No | missing → default; do not reset other keys |
| New persisted workspace field | No | missing → default; present → validate |
| Rename, remove, or change the type/meaning of a field | **Yes** | bump the version and migrate |
| Make a previously optional field required | **Yes** | bump the version and migrate |

For a breaking change:

- Bump the relevant version constant.
- Keep accepting every supported older version in the parser (as `parsePersistedWorkspace` does for `version === 1` → `version === 2`).
- Migrate the old shape into the current shape, filling defaults, then return current data.
- Add a legacy-fixture test per supported old version.

`parseBackup` currently accepts exactly `BACKUP_VERSION`. If you must bump it, change that check to accept the supported older versions and run migrations instead of returning `archive.unsupportedVersion` for them.

## 5. Restore must not reset unrelated settings

Settings are a partial patch, not a full replacement:

- A missing `settings` section means “leave preferences unchanged”; `applyBackupSettings` returns early.
- Apply only the keys present in the file. `applyBackupSettings` currently applies `locale` and `scheduler` independently — keep that pattern for new keys.
- When adding a key inside `scheduler`, merge it with `DEFAULT_SCHEDULER_SETTINGS`/current state before validation, so a backup written before the key existed still restores.
- Similar rule for `localStorage`: read legacy keys when the current section/key is absent, and clear a legacy key only after the new value is written successfully.

## 6. Required tests

Every additive change adds at least these tests beside the owning util (`src/shared/utils/__tests__/archiveBackup.spec.ts`, `persistence.spec.ts`, `userSettings.spec.ts`) and, when restore wiring changes, `src/modules/archive/__tests__/ArchiveView.spec.ts`:

1. **Legacy restore** — a fixture matching the previous release (no new field) parses successfully and gets the default.
2. **Unknown field** — an extra field does not fail parsing.
3. **Complete re-export** — building from current data writes the new field.
4. **Round-trip** — `buildBackup` → `parseBackup` preserves the new value.
5. **Partial settings** — a backup without the settings section leaves current preferences untouched; a settings section with one key applies that key only.

Use the existing fixture helpers (`employeeRecord`, `backupRecord`) and construct the older shape by omitting the new field; do not duplicate the whole backup by hand. Assert the default explicitly so the expectation survives refactors.

```ts
it('restores a legacy employee without flags using the default', () => {
  const legacy = backupRecord({
    employees: [employeeRecord()], // employeeRecord predates the field
  })

  const result = parseBackup(legacy)

  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.data.members[0]?.flags).toEqual(DEFAULT_EMPLOYEE_FLAGS)
  }
})

it('re-exports flags for current data', () => {
  const backup = buildBackup([member], {}, {}, '2026-11-02')
  expect(backup.employees[0]?.flags).toEqual(DEFAULT_EMPLOYEE_FLAGS)
})
```

## 7. Checklist

- [ ] Default value is an exported constant, not an inline literal.
- [ ] Parser maps `undefined` → default; wrong types still fail.
- [ ] Falsy values are not mistaken for missing.
- [ ] Unknown fields are ignored rather than rejected.
- [ ] Builder always writes the new field for current data.
- [ ] Version constant unchanged for additive changes; breaking changes bump it **and** add a migration.
- [ ] Missing or partial settings never reset unrelated preferences.
- [ ] Legacy-fixture, unknown-field, re-export, round-trip, and partial-settings tests added.
- [ ] `workspace.md` module map updated when a new util/store is introduced.
