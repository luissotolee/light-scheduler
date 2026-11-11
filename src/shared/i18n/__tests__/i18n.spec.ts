import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useI18n, translate } from '@/shared/i18n'
import { en } from '@/shared/i18n/messages/en'
import type { MessageKey } from '@/shared/i18n/messages/en'
import { es } from '@/shared/i18n/messages/es'
import { useLocaleStore } from '@/shared/stores/locale'

describe('translate', () => {
  it('returns the catalog value for a key', () => {
    expect(translate(en, 'nav.home')).toBe('Home')
    expect(translate(es, 'nav.home')).toBe('Inicio')
  })

  it('interpolates named parameters', () => {
    expect(translate(en, 'employees.count', { active: 3, total: 5 })).toBe('Active Employees: 3/5')
    expect(translate(es, 'archive.rowError', { row: 2, message: 'Fila inválida' })).toBe(
      'Fila 2: Fila inválida',
    )
  })

  it('keeps unknown placeholders intact', () => {
    expect(translate(en, 'employees.count')).toBe('Active Employees: {active}/{total}')
  })

  it('falls back to the English catalog and then the raw key', () => {
    expect(translate({}, 'nav.home')).toBe(en['nav.home'])
    expect(translate({}, 'missing.key' as MessageKey)).toBe('missing.key')
  })
})

describe('useI18n', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts in English and follows the locale store live', () => {
    const { t, locale } = useI18n()
    const store = useLocaleStore()

    expect(locale.value).toBe('en')
    expect(t('nav.home')).toBe(en['nav.home'])

    store.setLocale('es')

    expect(locale.value).toBe('es')
    expect(t('nav.home')).toBe(es['nav.home'])
  })

  it('switches through setLocale from the composable', () => {
    const { t, setLocale } = useI18n()

    setLocale('es')

    expect(t('employees.add')).toBe(es['employees.add'])
  })

  it('selects singular and plural messages with tc', () => {
    const { tc } = useI18n()

    expect(tc('archive.importedOne', 'archive.importedMany', 1, { count: 1 })).toBe('Imported 1 employee')
    expect(tc('archive.importedOne', 'archive.importedMany', 2, { count: 2 })).toBe(
      'Imported 2 employees',
    )
  })

  it('supports the two-form plural contract for 0, 1, and 2 in both locales', () => {
    const { tc, setLocale } = useI18n()

    expect(tc('archive.importedOne', 'archive.importedMany', 0, { count: 0 })).toBe('Imported 0 employees')
    expect(tc('archive.importedOne', 'archive.importedMany', 1, { count: 1 })).toBe('Imported 1 employee')
    expect(tc('archive.importedOne', 'archive.importedMany', 2, { count: 2 })).toBe('Imported 2 employees')

    setLocale('es')

    expect(tc('archive.importedOne', 'archive.importedMany', 0, { count: 0 })).toBe(
      'Se importaron 0 empleados',
    )
    expect(tc('archive.importedOne', 'archive.importedMany', 1, { count: 1 })).toBe('Se importó 1 empleado')
    expect(tc('archive.importedOne', 'archive.importedMany', 2, { count: 2 })).toBe(
      'Se importaron 2 empleados',
    )
  })

  it('exposes the available locales', () => {
    expect(useI18n().availableLocales).toEqual(['en', 'es'])
  })

  it('keeps the Spanish catalog key-for-key in sync with English', () => {
    expect(Object.keys(es)).toEqual(Object.keys(en))
  })
})
