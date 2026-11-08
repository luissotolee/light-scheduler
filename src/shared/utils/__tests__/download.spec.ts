import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadTextFile, timestampedName } from '@/shared/utils/download'

describe('timestampedName', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('builds a filesystem-safe timestamped filename', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T20:57:00Z'))

    expect(timestampedName('team-members', 'csv')).toBe(
      'team-members-2026-11-05T20-57-00-000Z.csv',
    )
  })
})

describe('downloadTextFile', () => {
  const blobs: Blob[] = []
  const createObjectURL = vi.fn((blob: Blob) => {
    blobs.push(blob)
    return 'blob:test'
  })
  const revokeObjectURL = vi.fn()
  let downloadName = ''
  let clickSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    blobs.length = 0
    downloadName = ''
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadName = this.download
      })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('creates a blob, clicks a temporary anchor, and revokes the URL', async () => {
    downloadTextFile('team-members.csv', 'name\nAda\n')

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(downloadName).toBe('team-members.csv')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')
    expect(document.querySelector('a[download]')).toBeNull()

    const blob = blobs[0]
    expect(blob.type).toBe('text/csv;charset=utf-8')
    expect(await blob.text()).toBe('name\nAda\n')
  })

  it('honours a custom mime type', async () => {
    downloadTextFile('notes.txt', 'hello', 'text/plain')

    const blob = blobs[0]
    expect(blob.type).toBe('text/plain')
    expect(await blob.text()).toBe('hello')
  })
})
