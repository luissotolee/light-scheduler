import { describe, expect, it, vi } from 'vitest'
import { MAX_CSV_BYTES, readCsvFile } from '@/shared/utils/csvFile'

describe('readCsvFile', () => {
  it('reads the text of a CSV file', async () => {
    const file = new File(['name,duty\r\nAda,manager'], 'employees.csv', {
      type: 'text/csv',
    })

    await expect(readCsvFile(file)).resolves.toEqual({
      ok: true,
      text: 'name,duty\r\nAda,manager',
    })
  })

  it('rejects files larger than the maximum size', async () => {
    const file = new File(['name'], 'employees.csv', { type: 'text/csv' })
    Object.defineProperty(file, 'size', { value: MAX_CSV_BYTES + 1 })

    await expect(readCsvFile(file)).resolves.toEqual({
      ok: false,
      error: 'csv.tooLarge',
    })
  })

  it('reports unreadable files when reading fails', async () => {
    const file = new File(['name'], 'employees.csv', { type: 'text/csv' })
    const text = vi.spyOn(file, 'text').mockRejectedValue(new Error('boom'))

    await expect(readCsvFile(file)).resolves.toEqual({
      ok: false,
      error: 'csv.unreadable',
    })
    expect(text).toHaveBeenCalled()
  })
})
