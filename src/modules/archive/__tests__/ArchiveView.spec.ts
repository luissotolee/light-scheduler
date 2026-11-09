import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import PrimeVue from 'primevue/config'
import ArchiveView from '@/modules/archive/views/ArchiveView.vue'
import { useLocaleStore } from '@/shared/stores/locale'
import { useWorkspaceStore } from '@/shared/stores/workspace'
import { buildBackup, gzipJson } from '@/shared/utils/archiveBackup'
import type { TeamMember } from '@/types'

const ada: TeamMember = {
  id: 'member-1',
  empId: 'EMP-0001',
  name: 'Ada',
  duty: 'manager',
  contract: 'fulltime',
  weeklyHours: 40,
  holidays: [],
  email: 'ada@example.com',
  active: true,
  startDate: '2025-01-15',
}

describe('ArchiveView', () => {
  let pinia: ReturnType<typeof createPinia>
  let blobs: Blob[]
  let downloadName: string

  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
    pinia = createPinia()
    setActivePinia(pinia)
    blobs = []
    downloadName = ''
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((blob: Blob) => {
        blobs.push(blob)
        return 'blob:test'
      }),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloadName = this.download
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function mountView() {
    return mount(ArchiveView, {
      global: { plugins: [pinia, PrimeVue], stubs: { teleport: true } },
    })
  }

  async function upload(wrapper: ReturnType<typeof mountView>, file: File): Promise<void> {
    const input = wrapper.find('[data-test="backup-file"]')
    Object.defineProperty(input.element, 'files', {
      value: [file],
      configurable: true,
    })
    await input.trigger('change')
    await flushPromises()
  }

  async function makeBackupFile(): Promise<File> {
    const backup = buildBackup(
      [ada],
      {
        '2026-11-02': [
          {
            id: 'shift-1',
            memberId: 'member-1',
            weekday: 'monday',
            startMinute: 540,
            endMinute: 1020,
          },
        ],
      },
      {
        '2026-11-02': [{ memberId: 'member-1', weekday: 'tuesday' }],
      },
      '2026-11-02',
    )

    return new File([await gzipJson(backup)], 'backup.json.gz', {
      type: 'application/gzip',
    })
  }

  function seedWorkspace(): ReturnType<typeof useWorkspaceStore> {
    const workspace = useWorkspaceStore()
    workspace.setCurrentWeekKey('2026-11-02')
    workspace.setMembers([ada])
    workspace.setShiftsForWeek('2026-11-02', [
      { id: 'old', memberId: 'member-1', weekday: 'friday', startMinute: 540, endMinute: 600 },
    ])
    workspace.setDayOffsForWeek('2026-11-02', [{ memberId: 'member-1', weekday: 'wednesday' }])
    return workspace
  }

  it('disables the backup export while the workspace is empty', () => {
    const wrapper = mountView()

    expect(wrapper.find('[data-test="export-backup"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-test="upload-backup"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.text()).toContain('Download a compressed backup')
    expect(wrapper.find('[data-test="status"]').exists()).toBe(false)
  })

  it('opens the backup file picker from the restore button', async () => {
    const wrapper = mountView()
    const input = wrapper.find('[data-test="backup-file"]')
    const click = vi.spyOn(input.element as HTMLInputElement, 'click')

    await wrapper.find('[data-test="upload-backup"]').trigger('click')

    expect(click).toHaveBeenCalledOnce()
  })

  it('exports a backup and shows a success status', async () => {
    seedWorkspace()
    const wrapper = mountView()

    expect(wrapper.find('[data-test="export-backup"]').attributes('disabled')).toBeUndefined()

    await wrapper.find('[data-test="export-backup"]').trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="status"]').exists()).toBe(true)
    })

    expect(wrapper.find('[data-test="status"]').text()).toBe('Backup downloaded')
    expect(downloadName).toMatch(/^backup-.*\.json\.gz$/)
    expect(blobs).toHaveLength(1)
  })

  it('restores a backup after confirmation and replaces workspace data', async () => {
    const workspace = seedWorkspace()
    const wrapper = mountView()

    await upload(wrapper, await makeBackupFile())
    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="confirm-message"]').exists()).toBe(true)
    })

    expect(wrapper.find('[data-test="confirm-message"]').text()).toContain(
      'This replaces all employees, shifts, and days off',
    )

    await wrapper.find('[data-test="confirm-accept"]').trigger('click')

    expect(wrapper.find('[data-test="status"]').text()).toBe('Backup restored')
    expect(workspace.members).toHaveLength(1)
    expect(workspace.members[0]).toMatchObject({ empId: 'EMP-0001', name: 'Ada' })
    expect(workspace.schedules['2026-11-02']).toHaveLength(1)
    expect(workspace.schedules['2026-11-02'][0]).toMatchObject({
      memberId: workspace.members[0].id,
      weekday: 'monday',
      startMinute: 540,
      endMinute: 1020,
    })
    expect(workspace.dayOffs).toEqual({
      '2026-11-02': [{ memberId: workspace.members[0].id, weekday: 'tuesday' }],
    })
  })

  it('cancels a backup restore without changing data', async () => {
    const workspace = seedWorkspace()
    const wrapper = mountView()

    await upload(wrapper, await makeBackupFile())
    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="confirm-cancel"]').exists()).toBe(true)
    })
    await wrapper.find('[data-test="confirm-cancel"]').trigger('click')

    expect(workspace.schedules['2026-11-02']).toEqual([
      { id: 'old', memberId: 'member-1', weekday: 'friday', startMinute: 540, endMinute: 600 },
    ])
    expect(workspace.dayOffs).toEqual({
      '2026-11-02': [{ memberId: 'member-1', weekday: 'wednesday' }],
    })
  })

  it('surfaces an invalid backup error', async () => {
    const wrapper = mountView()
    const file = new File([new Uint8Array([1, 2, 3])], 'backup.json.gz', {
      type: 'application/gzip',
    })

    await upload(wrapper, file)
    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="status"]').exists()).toBe(true)
    })

    expect(wrapper.find('[data-test="status"]').text()).toBe(
      'This file is not a valid Light Scheduler backup',
    )
  })

  it('renders Spanish copy and statuses live', async () => {
    seedWorkspace()
    const wrapper = mountView()

    useLocaleStore().setLocale('es')
    await nextTick()

    expect(wrapper.text()).toContain('Descargar copia')
    expect(wrapper.text()).toContain('Restaurar copia')

    await wrapper.find('[data-test="export-backup"]').trigger('click')
    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="status"]').exists()).toBe(true)
    })

    expect(wrapper.find('[data-test="status"]').text()).toBe('Copia de seguridad descargada')
  })

  it('rejects files larger than 25 MB', async () => {
    const wrapper = mountView()
    const file = await makeBackupFile()
    Object.defineProperty(file, 'size', { value: 25 * 1024 * 1024 + 1 })

    await upload(wrapper, file)
    await vi.waitFor(() => {
      expect(wrapper.find('[data-test="status"]').exists()).toBe(true)
    })

    expect(wrapper.find('[data-test="status"]').text()).toBe('Backup file is too large (max 25 MB)')
  })
})
