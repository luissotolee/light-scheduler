import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  captureAppStorage,
  restoreAppStorage,
  writeDemoBackup,
  readDemoBackup,
  clearDemoBackup,
  recoverInterruptedDemo,
  type AppStorageSnapshot,
  DEMO_BACKUP_KEY,
  DEMO_RECOVERED_KEY,
  DEMO_RECOVERY_ERROR_KEY,
} from '@/modules/demo/utils/storageSnapshot'
import { readStorageValue, writeStorageValue } from '@/shared/utils/storage'

describe('storageSnapshot', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
  })

  describe('captureAppStorage', () => {
    it('captures only app-owned keys with prefix', () => {
      localStorage.setItem('light-scheduler.workspace', '{"data": "test"}')
      localStorage.setItem('light-scheduler.locale', 'en')
      localStorage.setItem('light-scheduler.demo.backup', 'should-not-capture')
      localStorage.setItem('other-app.key', 'should-not-capture')

      const snapshot = captureAppStorage()

      expect(snapshot.version).toBe(1)
      expect(snapshot.entries['light-scheduler.workspace']).toBe('{"data": "test"}')
      expect(snapshot.entries['light-scheduler.locale']).toBe('en')
      expect(snapshot.entries['light-scheduler.demo.backup']).toBeUndefined()
      expect(snapshot.entries['other-app.key']).toBeUndefined()
    })

    it('handles empty localStorage', () => {
      const snapshot = captureAppStorage()
      expect(snapshot.entries).toEqual({})
      expect(snapshot.version).toBe(1)
    })
  })

  describe('restoreAppStorage', () => {
    it('restores keys from snapshot', () => {
      const snapshot: AppStorageSnapshot = {
        version: 1,
        createdAt: Date.now(),
        entries: {
          'light-scheduler.workspace': '{"data": "restored"}',
          'light-scheduler.locale': 'es',
        },
      }

      restoreAppStorage(snapshot)

      expect(localStorage.getItem('light-scheduler.workspace')).toBe('{"data": "restored"}')
      expect(localStorage.getItem('light-scheduler.locale')).toBe('es')
    })

    it('removes keys not in snapshot', () => {
      localStorage.setItem('light-scheduler.workspace', 'old')
      localStorage.setItem('light-scheduler.locale', 'old')
      localStorage.setItem('light-scheduler.other', 'should-be-removed')

      const snapshot: AppStorageSnapshot = {
        version: 1,
        createdAt: Date.now(),
        entries: {
          'light-scheduler.workspace': 'new',
          'light-scheduler.locale': 'new',
        },
      }

      restoreAppStorage(snapshot)

      expect(localStorage.getItem('light-scheduler.workspace')).toBe('new')
      expect(localStorage.getItem('light-scheduler.locale')).toBe('new')
      expect(localStorage.getItem('light-scheduler.other')).toBeNull()
    })

    it('removes keys with null value in snapshot', () => {
      localStorage.setItem('light-scheduler.workspace', 'old')
      localStorage.setItem('light-scheduler.locale', 'old')

      const snapshot: AppStorageSnapshot = {
        version: 1,
        createdAt: Date.now(),
        entries: {
          'light-scheduler.workspace': 'new',
          'light-scheduler.locale': null,
        },
      }

      restoreAppStorage(snapshot)

      expect(localStorage.getItem('light-scheduler.workspace')).toBe('new')
      expect(localStorage.getItem('light-scheduler.locale')).toBeNull()
    })
  })

  describe('writeDemoBackup / readDemoBackup / clearDemoBackup', () => {
    it('writes and reads backup', () => {
      const snapshot: AppStorageSnapshot = {
        version: 1,
        createdAt: Date.now(),
        entries: { 'light-scheduler.workspace': 'test' },
      }

      expect(writeDemoBackup(snapshot)).toBe(true)
      expect(readDemoBackup()).toEqual(snapshot)
    })

    it('returns null when no backup exists', () => {
      expect(readDemoBackup()).toBeNull()
    })

    it('clears backup', () => {
      const snapshot: AppStorageSnapshot = {
        version: 1,
        createdAt: Date.now(),
        entries: { 'light-scheduler.workspace': 'test' },
      }
      writeDemoBackup(snapshot)
      clearDemoBackup()
      expect(readDemoBackup()).toBeNull()
    })
  })

  describe('recoverInterruptedDemo', () => {
    it('returns none when no recovered flag and no backup', () => {
      expect(recoverInterruptedDemo()).toBe('none')
    })

    it('returns none when recovered flag is set', () => {
      writeStorageValue(DEMO_RECOVERED_KEY, 'true')
      expect(recoverInterruptedDemo()).toBe('none')
      expect(readStorageValue(DEMO_RECOVERED_KEY)).toBeNull()
    })

    it('restores from backup and sets recovered flag', () => {
      localStorage.setItem('light-scheduler.workspace', 'original')
      const snapshot: AppStorageSnapshot = {
        version: 1,
        createdAt: Date.now(),
        entries: { 'light-scheduler.workspace': 'from-backup' },
      }
      writeDemoBackup(snapshot)

      expect(recoverInterruptedDemo()).toBe('restored')
      expect(localStorage.getItem('light-scheduler.workspace')).toBe('from-backup')
      expect(readStorageValue(DEMO_BACKUP_KEY)).toBeNull()
      expect(readStorageValue(DEMO_RECOVERED_KEY)).toBe('true')
    })

    it('returns error and sets recovery error key when restore throws', () => {
      const snapshot: AppStorageSnapshot = {
        version: 1,
        createdAt: Date.now(),
        entries: { 'light-scheduler.workspace': 'from-backup' },
      }
      writeDemoBackup(snapshot)

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
        if (key === DEMO_RECOVERY_ERROR_KEY) {
          setItemSpy.mockRestore()
          localStorage.setItem(key, value)
          setItemSpy.mockImplementation(() => { throw new Error('Storage error') })
          return
        }
        throw new Error('Storage error')
      })

      const result = recoverInterruptedDemo()
      setItemSpy.mockRestore()

      expect(result).toBe('error')
      expect(localStorage.getItem(DEMO_RECOVERY_ERROR_KEY)).toBe('true')
      expect(readDemoBackup()).not.toBeNull()
    })
  })
})