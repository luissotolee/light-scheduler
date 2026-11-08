---
name: csv-import-export
description: Read and write plain CSV files in the browser. Use when implementing CSV upload/import, export/download, or round-trip file features (team-members list, schedule data): RFC 4180 quoting/escaping, UTF-8 BOM handling, delimiter inference, typed validation of uploaded data, timestamped filenames, and safe download via Blob + object URL.
---

# CSV Import / Export

Read `workspace.md` first for the module map and where files belong.

## 1. Purpose and module layout

Keep the concerns separate:

- `src/shared/utils/csv.ts` — pure parsing and serialization. No DOM, no file input, no downloads.
- `src/shared/utils/download.ts` — the only browser side effect: Blob, object URL, temporary anchor.

Import through the alias, never relative paths across folders:

```ts
import { parseCsv, toCsv } from '@/shared/utils/csv'
import { downloadTextFile, timestampedName } from '@/shared/utils/download'
```

Both files are included by `vite.config.ts` coverage and must have unit tests.

## 2. Parsing: `parseCsv`

Return a discriminated union and never throw on malformed input:

```ts
export type CsvParseResult =
  | { ok: true; headers: string[]; rows: string[][] }
  | { ok: false; error: string }
```

Use an RFC 4180 state machine:

- Strip a leading UTF-8 BOM: `text.replace(/^\uFEFF/, '')`.
- Quote fields containing the delimiter, quotes, or newlines; escape embedded quotes by doubling them (`""`).
- Treat `\n` as the record terminator and skip `\r`.
- Push the final field/record when the input does not end with a newline.
- Drop fully empty trailing rows (blank lines are skipped).
- Infer the delimiter: default `,`; if the first line has no `,` but has `;` or `\t`, use that.

```ts
export function inferDelimiter(text: string): string {
  const firstLine = text.split('\n', 1)[0] ?? ''
  if (firstLine.includes(',')) return ','
  if (firstLine.includes(';')) return ';'
  if (firstLine.includes('\t')) return '\t'
  return ','
}

export function parseCsv(input: string): CsvParseResult {
  const text = input.replace(/^\uFEFF/, '')
  if (!text.trim()) return { ok: false, error: 'CSV file is empty' }

  const delimiter = inferDelimiter(text)
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      record.push(field)
      field = ''
    } else if (char === '\n') {
      record.push(field)
      records.push(record)
      record = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (inQuotes) return { ok: false, error: 'Unterminated quoted field' }

  if (field.length > 0 || record.length > 0) {
    record.push(field)
    records.push(record)
  }

  const nonEmpty = records.filter((row) => row.some((cell) => cell.trim() !== ''))
  if (nonEmpty.length === 0) return { ok: false, error: 'CSV file is empty' }

  const [headers, ...rows] = nonEmpty
  return { ok: true, headers, rows }
}
```

Document and test these edge cases:

- Empty file → `{ ok: false, error: ... }`.
- Quoted newlines inside a field are preserved.
- An empty last field (trailing delimiter) is preserved.
- Single-column files parse into one-cell rows.
- Blank lines are skipped.

## 3. Domain validation (separate concern)

Structural parsing is not domain validation. Map `string[][]` to typed domain objects with row-numbered errors. The shared `RowError` and `Validated<T>` types live in `src/types.ts`; the employee validator lives in `src/shared/utils/employee.ts`:

```ts
import type { EmployeeCsvRecord, Validated } from '@/types'

export function validateEmployees(
  headers: string[],
  rows: string[][],
): Validated<EmployeeCsvRecord> {
  // Reject unexpected headers, then validate each row against
  // name/duty/contract/weeklyHours/holidays/email/phone/active/startDate/endDate,
  // pushing a `{ row, message }` error per failed cell.
  // Full implementation: src/shared/utils/employee.ts.
}
```

Show row-numbered errors to the user; do not silently drop bad rows.

## 4. Serialization: `toCsv`

Serialization must round-trip with `parseCsv`:

```ts
export function toCsv(headers: string[], rows: (string | number | boolean)[][]): string {
  const esc = (cell: string | number | boolean): string => {
    const s = String(cell)
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
}
```

Join records with `\r\n` (RFC 4180). Quote only when necessary.

## 5. Download: `downloadTextFile`

Keep the side effect in `src/shared/utils/download.ts`:

```ts
export function downloadTextFile(filename: string, text: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
```

Prepend `\uFEFF` to CSV export text so Excel opens UTF-8 correctly:

```ts
downloadTextFile(timestampedName('team-members', 'csv'), '\uFEFF' + toCsv(headers, rows))
```

## 6. Timestamped filenames

```ts
export function timestampedName(base: string, ext: 'csv'): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `${base}-${stamp}.${ext}`
}
```

Example output: `team-members-2026-11-05T20-57-00-000Z.csv` (the millisecond segment comes from `toISOString()`). Filenames contain no `:`, `.`, or path separators.

## 7. Large files

An in-memory parse is acceptable at team/schedule scale. Before reading a selected file, enforce a clear size guard:

```ts
const MAX_CSV_BYTES = 5 * 1024 * 1024

if (file.size > MAX_CSV_BYTES) {
  return { ok: false, error: 'CSV file is too large (max 5 MB)' }
}
```

True streaming (`File.stream()` or a Web Worker) is out of scope for v1; note it in the issue/PR rather than partially implementing it.

## 8. Testing file I/O in jsdom

jsdom lacks `URL.createObjectURL` / `revokeObjectURL`. Stub them in the spec:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:test'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
```

Use fake timers for deterministic names:

```ts
vi.useFakeTimers()
vi.setSystemTime(new Date('2026-11-05T20:57:00Z'))
expect(timestampedName('team-members', 'csv')).toBe('team-members-2026-11-05T20-57-00-000Z.csv')
```

Required tests:

- `toCsv` → `parseCsv` round-trip.
- BOM stripping.
- Quoted comma and newline fields.
- Escaped quotes (`""`).
- Delimiter inference for `;`.
- Empty file returns `{ ok: false }`.
- Download: spy on `HTMLAnchorElement.prototype.click`, assert `downloadTextFile` clicked the anchor and called `URL.revokeObjectURL`.

```ts
const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
downloadTextFile('team-members.csv', 'name\nAda\n')
expect(click).toHaveBeenCalledOnce()
expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
```
