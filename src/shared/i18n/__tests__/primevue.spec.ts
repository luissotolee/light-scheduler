import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, reactive, watchEffect } from 'vue'
import type { PrimeVueConfiguration } from 'primevue/config'
import { primevueLocales } from '@/shared/i18n/primevue'
import { useLocaleStore } from '@/shared/stores/locale'

describe('primevueLocales', () => {
  it('keeps Monday as the first day and exposes English names', () => {
    const en = primevueLocales.en

    expect(en.firstDayOfWeek).toBe(1)
    expect(en.monthNames).toHaveLength(12)
    expect(en.dayNames?.[1]).toBe('Monday')
    expect(en.today).toBe('Today')
    expect(en.clear).toBe('Clear')
  })

  it('provides a complete Spanish locale', () => {
    const es = primevueLocales.es

    expect(es.firstDayOfWeek).toBe(1)
    expect(es.monthNames).toHaveLength(12)
    expect(es.monthNames?.[10]).toBe('noviembre')
    expect(es.dayNames?.[1]).toBe('lunes')
    expect(es.dayNamesShort).toEqual(['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'])
    expect(es.dayNamesMin).toEqual(['D', 'L', 'M', 'X', 'J', 'V', 'S'])
    expect(es.today).toBe('Hoy')
    expect(es.clear).toBe('Limpiar')
    expect(es.dateFormat).toBe('dd/mm/yy')
    expect(es.emptyMessage).toBe('No hay opciones disponibles')
    expect(es.emptyFilterMessage).toBe('No se encontraron resultados')
    expect(es.selectionMessage).toBe('{0} elementos seleccionados')
    expect(es.aria?.previous).toBe('Anterior')
    expect(es.aria?.next).toBe('Siguiente')
    expect(es.aria?.close).toBe('Cerrar')
  })
})

describe('PrimeVue locale sync', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('updates the reactive PrimeVue config when the locale changes', async () => {
    const config = reactive<PrimeVueConfiguration>({ locale: primevueLocales.en })
    const localeStore = useLocaleStore()
    const stop = watchEffect(() => {
      config.locale = primevueLocales[localeStore.locale]
    })

    expect(config.locale?.monthNames?.[10]).toBe('November')

    localeStore.setLocale('es')
    await nextTick()

    expect(config.locale).toStrictEqual(primevueLocales.es)
    expect(config.locale?.monthNames?.[10]).toBe('noviembre')
    stop()
  })
})
